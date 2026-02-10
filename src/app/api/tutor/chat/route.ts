/**
 * TUTOR CHAT API (Firebase)
 * AI-powered tutor for milestone-based learning
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { getMilestone, getMilestones } from '@/lib/curriculum/milestones';
import Anthropic from '@anthropic-ai/sdk';
import { rateLimit, RATE_LIMITS } from '@/lib/security';

// Lazy-init Anthropic client
let anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface MilestoneStatus {
  number: number;
  status: 'locked' | 'active' | 'submitted' | 'approved' | 'needs_revision';
}

interface MilestoneDoc {
  milestoneNumber: number;
  status: string;
  submissionContent?: unknown;
  feedback?: string;
}

export async function POST(request: NextRequest) {
  // Rate limit AI endpoints
  const rateLimitResponse = rateLimit(request, RATE_LIMITS.ai);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    // Verify session and get user
    const decodedClaims = await auth.verifySessionCookie(session, true);
    const userId = decodedClaims.uid;

    const body = await request.json();
    const { message, path } = body as { message: string; path: 'owner' | 'employee' | 'student' };

    if (!message || !path) {
      return NextResponse.json({ error: 'Message and path are required' }, { status: 400 });
    }

    // Get or create conversation
    const conversationQuery = await db
      .collection('tutorConversations')
      .where('userId', '==', userId)
      .where('path', '==', path)
      .limit(1)
      .get();

    let conversationId: string;
    let conversationData: {
      messages: ChatMessage[];
      currentMilestone: number;
    };

    if (conversationQuery.empty) {
      // Initialize the path for this user - create all 10 milestones
      const batch = db.batch();

      for (let i = 1; i <= 10; i++) {
        const milestoneRef = db.collection('userMilestones').doc();
        batch.set(milestoneRef, {
          userId,
          path,
          milestoneNumber: i,
          status: i === 1 ? 'active' : 'locked',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }

      // Create conversation record
      const convRef = db.collection('tutorConversations').doc();
      batch.set(convRef, {
        userId,
        path,
        messages: [],
        currentMilestone: 1,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      await batch.commit();

      conversationId = convRef.id;
      conversationData = {
        messages: [],
        currentMilestone: 1,
      };
    } else {
      const doc = conversationQuery.docs[0];
      conversationId = doc.id;
      const data = doc.data();
      conversationData = {
        messages: (data.messages as ChatMessage[]) || [],
        currentMilestone: data.currentMilestone || 1,
      };
    }

    // Get user's milestone progress
    const milestonesQuery = await db
      .collection('userMilestones')
      .where('userId', '==', userId)
      .where('path', '==', path)
      .orderBy('milestoneNumber')
      .get();

    const milestones: MilestoneDoc[] = milestonesQuery.docs.map(doc => doc.data() as MilestoneDoc);

    const milestoneStatuses: MilestoneStatus[] = milestones.map(m => ({
      number: m.milestoneNumber,
      status: (m.status || 'locked') as MilestoneStatus['status'],
    }));

    const currentMilestoneNum = conversationData.currentMilestone;
    const currentMilestone = getMilestone(path, currentMilestoneNum);
    const allMilestones = getMilestones(path);

    // Get user profile for personalization
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const userName = userData?.fullName || decodedClaims.email?.split('@')[0] || 'there';

    // Build conversation history
    const messages: ChatMessage[] = [...conversationData.messages];
    messages.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });

    // Build system prompt
    const systemPrompt = buildSystemPrompt({
      path,
      userName,
      currentMilestone: currentMilestoneNum,
      milestoneStatuses,
      allMilestones,
      currentMilestoneData: currentMilestone,
      previousSubmissions: milestones.filter(m => m.submissionContent),
    });

    // Call Claude
    const client = getAnthropic();
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: messages.slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const assistantMessage =
      response.content[0].type === 'text' ? response.content[0].text : 'I encountered an issue. Please try again.';

    // Add assistant response to history
    messages.push({
      role: 'assistant',
      content: assistantMessage,
      timestamp: new Date().toISOString(),
    });

    // Check if this looks like a submission (AI can indicate this)
    const isSubmission =
      message.toLowerCase().includes('submit') ||
      message.toLowerCase().includes("i'm done") ||
      message.toLowerCase().includes('here is my') ||
      message.toLowerCase().includes("here's my");

    // Update conversation
    await db.collection('tutorConversations').doc(conversationId).update({
      messages,
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({
      message: assistantMessage,
      currentMilestone: currentMilestoneNum,
      milestoneStatuses,
      isSubmission,
    });
  } catch (error) {
    console.error('Tutor chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function buildSystemPrompt({
  path,
  userName,
  currentMilestone,
  milestoneStatuses,
  allMilestones,
  currentMilestoneData,
  previousSubmissions,
}: {
  path: string;
  userName: string;
  currentMilestone: number;
  milestoneStatuses: MilestoneStatus[];
  allMilestones: ReturnType<typeof getMilestones>;
  currentMilestoneData: ReturnType<typeof getMilestone>;
  previousSubmissions: Array<{ milestoneNumber: number; submissionContent?: unknown; feedback?: string }>;
}) {
  const pathName = path.charAt(0).toUpperCase() + path.slice(1);
  const approvedCount = milestoneStatuses.filter((m) => m.status === 'approved').length;

  const milestoneSummary = allMilestones
    .map((m) => {
      const status = milestoneStatuses.find((s) => s.number === m.number)?.status || 'locked';
      const emoji = status === 'approved' ? '✓' : status === 'active' ? '→' : '○';
      return `${emoji} ${m.number}. ${m.title}`;
    })
    .join('\n');

  return `You are the Phazur ${pathName} Path tutor. You guide learners through building real-world AI systems/projects.

## Your Identity
- Direct, practical, expert senior engineer
- You've built dozens of AI systems
- No fluff, no hand-holding, but genuinely helpful
- Celebrate real progress, push back on shortcuts

## Current Student
- Name: ${userName}
- Path: ${pathName}
- Current Milestone: ${currentMilestone}/10
- Completed: ${approvedCount}/10

## Milestone Progress
${milestoneSummary}

## Current Milestone: ${currentMilestoneData?.title || 'Unknown'}
Goal: ${currentMilestoneData?.goal || ''}

Completion Criteria:
${currentMilestoneData?.completionCriteria.map((c) => `- ${c}`).join('\n') || 'N/A'}

${
  currentMilestone === 1 && approvedCount === 0
    ? `## First Interaction
Since this is their first message, welcome them and introduce the first milestone:
${currentMilestoneData?.chatbotPrompt || ''}`
    : ''
}

## Your Role
1. Guide them through the current milestone
2. Answer questions about implementation
3. Review their submissions and provide feedback
4. Keep them focused and motivated
5. Be direct about what works and what doesn't

## Reviewing Submissions
When they share work for the current milestone:
1. Check against the completion criteria
2. Be specific about what works and what needs improvement
3. If it meets criteria, congratulate them and say: "Milestone ${currentMilestone} complete! Moving to the next milestone."
4. If it needs work, explain exactly what's missing

## Milestone 10 - Certification Submission
When the user is on milestone 10 and submits their final work:
1. Review their complete journey and final submission
2. If everything looks good, congratulate them enthusiastically
3. Tell them: "You've completed all 10 milestones! You're ready for certification."
4. Instruct them to click the "Submit for Certification" button to proceed to payment
5. Explain that after payment, they'll receive their official Phazur credential as a Soulbound Token (SBT)

## Important
- Stay focused on the current milestone
- Don't let them skip ahead
- Reference their previous work when relevant
- Keep responses concise but helpful (aim for 150-300 words usually)
- Use markdown formatting for clarity

${
  previousSubmissions.length > 0
    ? `## Previous Submissions
${previousSubmissions.map((s) => `Milestone ${s.milestoneNumber}: ${JSON.stringify(s.submissionContent).slice(0, 200)}...`).join('\n')}`
    : ''
}`;
}

// Endpoint to submit a milestone
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    // Verify session and get user
    const decodedClaims = await auth.verifySessionCookie(session, true);
    const userId = decodedClaims.uid;

    const body = await request.json();
    const { path, milestoneNumber, submission } = body as {
      path: 'owner' | 'employee' | 'student';
      milestoneNumber: number;
      submission: unknown;
    };

    // Find the milestone document
    const milestoneQuery = await db
      .collection('userMilestones')
      .where('userId', '==', userId)
      .where('path', '==', path)
      .where('milestoneNumber', '==', milestoneNumber)
      .limit(1)
      .get();

    if (milestoneQuery.empty) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    // Update milestone status
    await milestoneQuery.docs[0].ref.update({
      status: 'submitted',
      submissionContent: submission,
      submittedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Milestone submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
