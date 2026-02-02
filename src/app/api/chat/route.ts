/**
 * PHAZUR CHAT API
 * AI-powered conversational coaching with session persistence
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Lazy initialization
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

const PHAZUR_SYSTEM_PROMPT = `You are Phazur, an AI coach for the Phazur platform - an AI workflow mastery program.

PERSONALITY:
- Warm, encouraging, but not patronizing
- Uses Socratic method - guide with questions, don't just give answers
- Practical and results-focused
- Celebrates small wins

CORE COACHING PRINCIPLES:
1. Acknowledge what the user has done/shared
2. Ask clarifying questions to understand their context
3. Guide them toward insights rather than giving direct answers
4. Keep responses concise (3-5 sentences typically)
5. Always end with a question or clear next step

CONTEXT:
- Students pay $49 (after capstone) → Certified AI Associate
- Employees pay $199 (after capstone) → Workflow Efficiency Lead
- Owners pay $499 (after capstone) → AI Operations Master

The platform teaches:
- Terminal/CLI proficiency
- AI-powered development with Claude Code
- API integrations and automations
- Multi-agent orchestration

When discussing terminal commands, you can suggest they switch to the Terminal tab.
When discussing code, you can suggest they try it in the Sandbox tab.

Be conversational and human. Don't be robotic.`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      conversationHistory = [],
      sessionId,
      tier,
      currentStep,
    }: {
      message: string;
      conversationHistory: ChatMessage[];
      sessionId?: string;
      tier?: string;
      currentStep?: number;
    } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'sk-YOUR_OPENAI_API_KEY' || apiKey.includes('YOUR')) {
      // Return a helpful fallback response when API key is not configured
      const fallbackResponses = [
        "I'm currently in demo mode. To enable full AI coaching, configure your OpenAI API key.",
        "What would you like to learn about today?",
      ];
      return NextResponse.json({
        content: fallbackResponses,
        suggestions: [
          "Tell me about the Student path",
          "What skills will I learn?",
          "How does the certification work?",
        ],
        sessionId,
        demo: true,
      });
    }

    // Build context based on tier
    let tierContext = '';
    if (tier === 'student') {
      tierContext = 'User is on the Student path - focused on building a portfolio and landing their first tech job.';
    } else if (tier === 'employee') {
      tierContext = 'User is on the Employee path - focused on workplace efficiency and automation.';
    } else if (tier === 'owner') {
      tierContext = 'User is on the Owner path - focused on scaling business operations with AI agents.';
    }

    // Build messages for OpenAI
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: PHAZUR_SYSTEM_PROMPT },
    ];

    if (tierContext) {
      messages.push({ role: 'system', content: tierContext });
    }

    // Add conversation history
    conversationHistory.forEach((msg) => {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    });

    // Add current message
    messages.push({ role: 'user', content: message });

    // Generate response
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 500,
      temperature: 0.8,
    });

    const assistantMessage = completion.choices[0].message.content ||
      "I'm here to help! What would you like to explore?";

    // Parse response into paragraphs for multi-bubble display
    const paragraphs = assistantMessage
      .split('\n\n')
      .filter((p) => p.trim())
      .map((p) => p.trim());

    // Generate contextual suggestions based on the response
    const suggestions = generateSuggestions(assistantMessage, tier, currentStep);

    // Save to database if user is authenticated
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user && sessionId) {
      // Update chat session - cast to bypass strict typing
      const sessionData = {
        id: sessionId,
        user_id: user.id,
        session_type: 'learning' as const,
        messages: [...conversationHistory, { role: 'user', content: message }, { role: 'assistant', content: assistantMessage }],
        current_step: (currentStep || 0) + 1,
        updated_at: new Date().toISOString(),
      };
      await supabase
        .from('chat_sessions')
        .upsert(sessionData as never);
    }

    return NextResponse.json({
      content: paragraphs,
      suggestions,
      sessionId,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to generate response', details: errorMessage },
      { status: 500 }
    );
  }
}

function generateSuggestions(
  response: string,
  tier?: string,
  step?: number
): string[] {
  const responseLower = response.toLowerCase();

  // Context-aware suggestions
  if (responseLower.includes('terminal') || responseLower.includes('command')) {
    return [
      'Show me how',
      'Open Terminal',
      'What commands should I learn first?',
    ];
  }

  if (responseLower.includes('code') || responseLower.includes('sandbox')) {
    return [
      'Open Sandbox',
      'Show me an example',
      'What should I build first?',
    ];
  }

  if (responseLower.includes('fafsa') || responseLower.includes('scholarship')) {
    return [
      "Let's try FAFSA now",
      'I want to wait for now',
      'Can you send me the link?',
      'How long does it take?',
    ];
  }

  // Tier-specific suggestions
  if (tier === 'student') {
    return [
      'What should I learn first?',
      "Tell me about the portfolio project",
      'How do I use the Terminal?',
    ];
  }

  if (tier === 'employee') {
    return [
      'Show me automation examples',
      'What can I automate first?',
      'How do I build a GPT?',
    ];
  }

  if (tier === 'owner') {
    return [
      'Show me agent examples',
      'What should I automate first?',
      'How do agents work together?',
    ];
  }

  // Default suggestions
  return [
    'Tell me more',
    'What should I do next?',
    'Can you give an example?',
  ];
}
