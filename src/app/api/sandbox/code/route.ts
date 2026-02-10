/**
 * CODE SANDBOX API
 * Safe code execution simulator for learning
 * Parses code patterns and runs AI/console commands
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

interface ExecutionResult {
  success: boolean;
  output: string[];
  error?: string;
  executionTime: number;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { code, userId } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, output: [], error: 'No code provided' },
        { status: 400 }
      );
    }

    const output: string[] = [];

    // Extract console.log statements
    const logPattern = /console\.log\s*\(\s*["'`]([^"'`]*)["'`]\s*(?:,\s*([^)]+))?\s*\)/g;
    let match;

    while ((match = logPattern.exec(code)) !== null) {
      const message = match[1];
      const extra = match[2]?.trim();

      if (extra) {
        output.push(`> ${message} ${extra}`);
      } else {
        output.push(`> ${message}`);
      }
    }

    // Handle phazur.ai() calls
    const aiPattern = /(?:await\s+)?phazur\.ai\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g;
    const aiCalls: string[] = [];

    while ((match = aiPattern.exec(code)) !== null) {
      aiCalls.push(match[1]);
    }

    // Run AI calls
    for (const prompt of aiCalls) {
      try {
        const response = await getOpenAI().chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a helpful AI assistant. Respond concisely.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 150,
          temperature: 0.7,
        });

        const result = response.choices[0].message.content || 'No response';
        output.push(`> AI Response: ${result}`);
      } catch (error) {
        output.push(`> AI Error: ${error instanceof Error ? error.message : 'Failed to get response'}`);
      }
    }

    // Handle phazur.fetch() calls (simulated)
    const fetchPattern = /(?:await\s+)?phazur\.fetch\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g;
    while ((match = fetchPattern.exec(code)) !== null) {
      const url = match[1];
      output.push(`> Fetching: ${url}`);
      output.push(`> Response: { status: 200, data: "Simulated response" }`);
    }

    // Handle phazur.analyze() calls
    const analyzePattern = /(?:await\s+)?phazur\.analyze\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g;
    while ((match = analyzePattern.exec(code)) !== null) {
      const data = match[1];
      output.push(`> Analyzing: "${data.substring(0, 50)}..."`);
      output.push(`> Analysis: Sentiment: Positive, Keywords: [AI, automation, efficiency]`);
    }

    // Add completion message
    output.push('');
    output.push('✓ Completed successfully');

    const executionTime = Date.now() - startTime;

    // TODO: Save to database when user is authenticated
    // Sandbox session logging will be implemented with proper type handling
    void userId; // Acknowledge userId for future use

    const result: ExecutionResult = {
      success: true,
      output,
      executionTime,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Sandbox error:', error);
    return NextResponse.json(
      {
        success: false,
        output: [],
        error: error instanceof Error ? error.message : 'Failed',
        executionTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
