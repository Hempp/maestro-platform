/**
 * HYBRID SUPPORT SYSTEM API
 * AI handles routine queries, escalates complex to human advisors within 2 hours
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { SupportTicket, SupportPriority, SupportTicketStatus } from '@/types';

// Lazy OpenAI initialization
let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

// Escalation triggers - when AI should hand off to human
const ESCALATION_TRIGGERS = {
  maxAIAttempts: 3,
  sentimentThreshold: -0.5, // Negative sentiment score
  complexityKeywords: ['refund', 'cancel', 'legal', 'discrimination', 'harassment', 'urgent help'],
  stuckDuration: 30 * 60 * 1000, // 30 minutes without resolution
};

// In-memory ticket store (in production: database)
const tickets: Map<string, SupportTicket> = new Map();

interface CreateTicketRequest {
  learnerId: string;
  subject: string;
  description: string;
  category: SupportTicket['category'];
}

interface TicketResponse {
  ticket: SupportTicket;
  aiResponse?: string;
  escalated: boolean;
  estimatedHumanResponse?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<TicketResponse | { error: string }>> {
  try {
    const body = await request.json() as CreateTicketRequest;
    const { learnerId, subject, description, category } = body;

    // Create ticket
    const ticket: SupportTicket = {
      id: crypto.randomUUID(),
      learnerId,
      subject,
      description,
      category,
      status: 'ai_handling',
      priority: determinePriority(subject, description),
      aiAttempts: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Check if immediate escalation is needed
    const needsImmediateEscalation = checkImmediateEscalation(subject, description);

    if (needsImmediateEscalation) {
      ticket.status = 'escalated';
      ticket.escalatedAt = new Date();
      ticket.estimatedResponseTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

      tickets.set(ticket.id, ticket);

      return NextResponse.json({
        ticket,
        escalated: true,
        estimatedHumanResponse: 'A human advisor will contact you within 2 hours.',
      });
    }

    // Try AI response first
    const aiResponse = await generateAIResponse(ticket);

    tickets.set(ticket.id, ticket);

    return NextResponse.json({
      ticket,
      aiResponse,
      escalated: false,
    });
  } catch (error) {
    console.error('Support ticket error:', error);
    return NextResponse.json(
      { error: 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}

// Get ticket status or escalate
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const { ticketId, action, message } = await request.json();

    const ticket = tickets.get(ticketId);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (action === 'escalate') {
      ticket.status = 'escalated';
      ticket.escalatedAt = new Date();
      ticket.estimatedResponseTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
      ticket.updatedAt = new Date();

      tickets.set(ticketId, ticket);

      return NextResponse.json({
        ticket,
        message: 'Your request has been escalated to a human advisor. Expected response within 2 hours.',
      });
    }

    if (action === 'follow_up' && message) {
      ticket.aiAttempts += 1;
      ticket.updatedAt = new Date();

      // Check if we should escalate after multiple attempts
      if (ticket.aiAttempts >= ESCALATION_TRIGGERS.maxAIAttempts) {
        ticket.status = 'escalated';
        ticket.escalatedAt = new Date();
        ticket.estimatedResponseTime = new Date(Date.now() + 2 * 60 * 60 * 1000);

        tickets.set(ticketId, ticket);

        return NextResponse.json({
          ticket,
          escalated: true,
          message: "I've connected you with a human advisor for more personalized help. They'll respond within 2 hours.",
        });
      }

      // Try another AI response
      const aiResponse = await generateAIResponse(ticket, message);
      tickets.set(ticketId, ticket);

      return NextResponse.json({
        ticket,
        aiResponse,
        escalated: false,
      });
    }

    if (action === 'resolve') {
      ticket.status = 'resolved';
      ticket.resolution = message || 'Resolved by user';
      ticket.updatedAt = new Date();

      tickets.set(ticketId, ticket);

      return NextResponse.json({ ticket, message: 'Ticket resolved. Thank you!' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Support update error:', error);
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
}

function determinePriority(subject: string, description: string): SupportPriority {
  const text = `${subject} ${description}`.toLowerCase();

  if (text.includes('urgent') || text.includes('emergency') || text.includes("can't access")) {
    return 'critical';
  }
  if (text.includes('payment') || text.includes('certificate') || text.includes('deadline')) {
    return 'high';
  }
  if (text.includes('confused') || text.includes('stuck') || text.includes('help')) {
    return 'medium';
  }
  return 'low';
}

function checkImmediateEscalation(subject: string, description: string): boolean {
  const text = `${subject} ${description}`.toLowerCase();

  return ESCALATION_TRIGGERS.complexityKeywords.some(keyword =>
    text.includes(keyword.toLowerCase())
  );
}

async function generateAIResponse(ticket: SupportTicket, followUp?: string): Promise<string> {
  const systemPrompt = `You are a helpful support assistant for Phazur, an AI workflow learning platform.

Your role:
1. Answer questions about the platform, courses, and features
2. Help troubleshoot technical issues
3. Guide learners who are stuck on challenges
4. Be empathetic and encouraging

Important guidelines:
- Keep responses concise but helpful
- If you can't fully solve the issue, acknowledge it and offer to escalate
- For billing, refunds, or account issues, always suggest escalation
- End with a question to confirm resolution or offer further help

Current ticket:
Category: ${ticket.category}
Subject: ${ticket.subject}
Description: ${ticket.description}
${followUp ? `\nFollow-up question: ${followUp}` : ''}`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: followUp || ticket.description },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0].message.content || 'I apologize, but I was unable to generate a response. Let me connect you with a human advisor.';
  } catch {
    return 'I apologize for the technical difficulty. Let me connect you with a human advisor who can assist you directly.';
  }
}
