/**
 * INSTANT AI UTILITY API
 * Immediate value hook - functional AI tool in first 5 minutes
 * Demonstrates ROI before any commitment
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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

interface InstantCommand {
  command: string;
  prompt: string;
  demoData?: string;
}

// Pre-configured AI commands for instant value
const INSTANT_COMMANDS: Record<string, InstantCommand> = {
  'ai-summarize-inbox': {
    command: 'ai-summarize-inbox',
    prompt: `You are an email summarization assistant. Summarize the following emails into a brief, actionable list.
    For each email: show sender, one-line summary, and priority (High/Medium/Low).
    Be concise and professional.`,
    demoData: `
    Email 1:
    From: boss@company.com
    Subject: Q1 Report Due Friday
    Need the quarterly metrics by EOD Friday. Include revenue, churn, and NPS scores.

    Email 2:
    From: hr@company.com
    Subject: Benefits Enrollment Reminder
    Open enrollment ends next week. Please review your selections.

    Email 3:
    From: client@bigcorp.com
    Subject: Re: Project Timeline
    We need to push the launch by 2 weeks. Can we discuss alternatives?

    Email 4:
    From: newsletter@techsite.com
    Subject: This Week in AI
    Latest AI news and updates...

    Email 5:
    From: team@company.com
    Subject: Team Lunch Tomorrow
    Voting on restaurant for tomorrow's team lunch.
    `,
  },

  'ai-meeting-notes': {
    command: 'ai-meeting-notes',
    prompt: `You are a meeting notes assistant. Transform this meeting transcript into structured notes with:
    - Key decisions made
    - Action items (with owners if mentioned)
    - Next steps
    Keep it concise and actionable.`,
    demoData: `
    [Meeting Transcript - Product Sync]

    Sarah: So the new feature is almost done, right?

    Mike: Yeah, we're about 80% there. Just need to finish the API integration.

    Sarah: What's the timeline looking like?

    Mike: I think we can ship by Thursday if QA goes smoothly.

    Sarah: Great. John, can you start the marketing assets?

    John: Sure, I'll draft the announcement today and share it tomorrow.

    Sarah: Perfect. Let's aim for a soft launch on Friday then. Mike, make sure to update the docs too.

    Mike: Will do. I'll coordinate with the support team as well.

    Sarah: Any blockers we should be aware of?

    Mike: Just waiting on the third-party API key. Should have it by tomorrow.
    `,
  },

  'ai-audit-workflow': {
    command: 'ai-audit-workflow',
    prompt: `You are a business process analyst. Analyze this workflow description and provide:
    - Inefficiencies identified
    - Automation opportunities (with estimated time savings)
    - Quick wins (can be done this week)
    - AI integration points
    Be specific and actionable.`,
    demoData: `
    Current Workflow: Customer Onboarding

    1. Customer fills out web form
    2. Sales rep manually copies data into CRM
    3. Sales rep sends welcome email (copy-paste template)
    4. Sales rep creates project folder in Drive
    5. Sales rep schedules kickoff call (back-and-forth emails)
    6. After call, sales rep writes summary and shares with team
    7. Sales rep creates tasks in project management tool
    8. Customer gets invoice sent manually

    Time taken: ~2 hours per customer
    Volume: ~20 new customers per week
    `,
  },

  'ai-portfolio-starter': {
    command: 'ai-portfolio-starter',
    prompt: `You are a portfolio design assistant. Generate a portfolio outline for someone entering the AI/tech field. Include:
    - Suggested sections
    - Key projects to showcase
    - Skills to highlight
    - Personal brand elements
    Make it modern and tech-focused.`,
    demoData: `
    Background: Recent graduate / career changer
    Target role: AI/ML Engineer or Automation Specialist
    Skills: Python, basic ML, workflow automation
    Projects so far: 1 course project, 1 personal chatbot
    `,
  },

  'ai-competitor-scan': {
    command: 'ai-competitor-scan',
    prompt: `You are a competitive intelligence analyst. Based on this business description, provide:
    - Likely competitors (based on typical industry patterns)
    - Key differentiators to develop
    - Market positioning suggestions
    - Quick competitive research tasks
    Be strategic and actionable.`,
    demoData: `
    Business: AI-powered learning platform
    Target market: Working professionals (25-45)
    Core offering: Hands-on AI workflow training with blockchain certificates
    Price point: Mid-tier ($300-500)
    Differentiator: Socratic teaching method, no video lectures
    `,
  },
};

export async function POST(request: NextRequest) {
  try {
    const { command, customData } = await request.json();

    if (!command) {
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      );
    }

    const commandConfig = INSTANT_COMMANDS[command];

    if (!commandConfig) {
      return NextResponse.json(
        {
          error: `Unknown command: ${command}`,
          available: Object.keys(INSTANT_COMMANDS),
        },
        { status: 400 }
      );
    }

    // Use custom data if provided, otherwise use demo data
    const inputData = customData || commandConfig.demoData;

    const startTime = Date.now();

    // Call OpenAI for instant results
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: commandConfig.prompt },
        { role: 'user', content: inputData },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const result = response.choices[0].message.content || 'No output generated';
    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      command,
      result,
      meta: {
        processingTimeMs: processingTime,
        model: 'gpt-4o-mini',
        usedDemoData: !customData,
        tokens: response.usage?.total_tokens || 0,
      },
      nextSteps: [
        'This was a demo with sample data',
        'In the full platform, connect your actual email/calendar',
        'Complete the learning path to build your own AI workflows',
      ],
      cta: {
        message: 'See how this works? Now learn to build your own.',
        action: 'Continue to Learning Path',
      },
    });
  } catch (error) {
    console.error('Instant AI error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to execute AI command', details: errorMessage },
      { status: 500 }
    );
  }
}

// GET: List available commands
export async function GET() {
  return NextResponse.json({
    commands: Object.entries(INSTANT_COMMANDS).map(([key, config]) => ({
      command: key,
      description: getCommandDescription(key),
    })),
    usage: 'POST with { "command": "ai-summarize-inbox" } to execute',
  });
}

function getCommandDescription(command: string): string {
  const descriptions: Record<string, string> = {
    'ai-summarize-inbox': 'Summarize emails into actionable items with priority',
    'ai-meeting-notes': 'Transform meeting transcripts into structured notes',
    'ai-audit-workflow': 'Analyze a workflow and identify automation opportunities',
    'ai-portfolio-starter': 'Generate a portfolio outline for tech careers',
    'ai-competitor-scan': 'Quick competitive intelligence analysis',
  };
  return descriptions[command] || 'AI-powered utility';
}
