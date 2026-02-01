/**
 * SOCRATIC TUTOR API
 * Generates Socratic responses that guide without giving answers
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

const SOCRATIC_SYSTEM_PROMPT = `You are a Socratic AI tutor for Maestro, an AI workflow mastery platform.

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      sandboxState,
      akuId,
      conversationHistory,
    }: {
      message: string;
      sandboxState: SandboxState;
      akuId: string;
      conversationHistory: TutorMessage[];
    } = body;

    // Build context about the sandbox
    const sandboxContext = buildSandboxContext(sandboxState);

    // Build conversation for OpenAI
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: SOCRATIC_SYSTEM_PROMPT },
      { role: 'system', content: `Current sandbox state: ${sandboxContext}` },
      ...conversationHistory.map(msg => ({
        role: msg.role === 'tutor' ? 'assistant' as const : 'user' as const,
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 200,
      temperature: 0.7,
    });

    const tutorResponse = response.choices[0].message.content ||
      "What part would you like to explore together?";

    return NextResponse.json({ response: tutorResponse });
  } catch (error) {
    console.error('Tutor API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
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
