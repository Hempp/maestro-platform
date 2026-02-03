/**
 * TUTOR API
 * Generates helpful responses for both sandbox work and project guidance
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { TutorMessage, SandboxState } from '@/types';

// Lazy initialization to avoid build-time errors
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

const SOCRATIC_SYSTEM_PROMPT = `You are a Socratic AI tutor for Phazur, an AI workflow mastery platform.

CORE RULES:
1. NEVER give direct answers or solutions
2. ALWAYS respond with guiding questions
3. Acknowledge what the learner has done correctly
4. Point them toward the answer through questions
5. Keep responses SHORT (2-4 sentences max)
6. Be encouraging but not patronizing
7. If they're frustrated, empathize briefly then refocus

You can see their workflow sandbox in real-time. Use this to make observations like:
- "I see you've added an OpenAI node. What do you think it needs to work?"
- "Your workflow has 3 nodes connected. What data flows between them?"

When they make errors, don't say "that's wrong." Instead ask:
- "What happens when this runs? Walk me through it."
- "What would you expect this to output?"

You are teaching them to THINK like an AI engineer, not just complete tasks.`;

const PROJECT_MENTOR_PROMPT = `You are a helpful AI project mentor for Phazur, an AI skills learning platform.

Your role is to help learners complete their portfolio projects. You should:

1. **Guide, don't dictate** - Help them think through problems rather than giving complete solutions
2. **Be practical** - Focus on actionable steps they can take right now
3. **Personalize** - Adapt guidance to their specific situation, goals, and industry
4. **Build confidence** - Celebrate progress and help them see their work as portfolio-worthy
5. **Be concise** - Keep responses focused and digestible (3-5 paragraphs max)
6. **Provide examples** - When helpful, give concrete examples they can adapt
7. **Check understanding** - End with a question or next step

You are helping them build REAL portfolio pieces, not just complete exercises. Their work should be something they're proud to show employers or use in their actual work.

Remember: These are meaningful projects that will demonstrate their AI skills. Help them create something genuinely useful.`;

interface ProjectChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is a project-based request (new format)
    if (body.context && body.moduleTitle) {
      return handleProjectChat(body);
    }

    // Original sandbox-based tutor logic
    const {
      message,
      sandboxState,
      akuId,
      conversationHistory = [],
    }: {
      message: string;
      sandboxState?: SandboxState;
      akuId?: string;
      conversationHistory?: TutorMessage[];
    } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build context about the sandbox
    const sandboxContext = sandboxState
      ? buildSandboxContext(sandboxState)
      : 'No sandbox state provided.';

    // Build conversation for OpenAI
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: SOCRATIC_SYSTEM_PROMPT },
      { role: 'system', content: `Current sandbox state: ${sandboxContext}${akuId ? ` Current AKU: ${akuId}` : ''}` },
      ...conversationHistory.map(msg => ({
        role: msg.role === 'tutor' ? 'assistant' as const : 'user' as const,
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 200,
      temperature: 0.7,
    });

    const tutorResponse = response.choices[0].message.content ||
      "What part would you like to explore together?";

    return NextResponse.json({ response: tutorResponse });
  } catch (error) {
    console.error('Tutor API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to generate response', details: errorMessage },
      { status: 500 }
    );
  }
}

// Handle project-based chat requests
async function handleProjectChat(body: {
  message: string;
  context: string;
  moduleTitle: string;
  projectTitle: string;
  history?: ProjectChatMessage[];
}) {
  const { message, context, moduleTitle, projectTitle, history = [] } = body;

  if (!message) {
    return NextResponse.json(
      { error: 'Message is required' },
      { status: 400 }
    );
  }

  // Build conversation for OpenAI
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: PROJECT_MENTOR_PROMPT },
    {
      role: 'system',
      content: `Current module: ${moduleTitle}\nProject: ${projectTitle}\n\nProject guidance context:\n${context}`
    },
    ...history.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: message },
  ];

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const tutorResponse = response.choices[0].message.content ||
      "Let's continue working on your project. What would you like to focus on?";

    return NextResponse.json({ response: tutorResponse });
  } catch (error) {
    console.error('Project chat error:', error);

    // Return a helpful fallback response
    return NextResponse.json({
      response: `I understand you're working on **${projectTitle}**. Let me help you break this down into steps. What specific part of the project would you like to tackle first?`
    });
  }
}

function buildSandboxContext(state: SandboxState): string {
  if (state.workflow.length === 0) {
    return 'The sandbox is empty. No nodes added yet.';
  }

  const nodes = state.workflow.map(n => `${n.type}:${n.service}`).join(' → ');
  const hasErrors = state.executionLog.some(e => e.event === 'error');
  const lastError = state.executionLog.find(e => e.event === 'error')?.error;

  let context = `Workflow: ${nodes}. Status: ${state.status}.`;
  if (hasErrors && lastError) {
    context += ` Last error: ${lastError}`;
  }

  return context;
}
