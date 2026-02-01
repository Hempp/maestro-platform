/**
 * CURRICULUM API
 * Returns AKUs for a given business tier
 */

import { NextRequest, NextResponse } from 'next/server';
import type { AtomicKnowledgeUnit, BusinessTier } from '@/types';

// Simplified AKU data for the API
// In production, this would come from a database
const CURRICULUM: Record<BusinessTier, AtomicKnowledgeUnit[]> = {
  student: [
    {
      id: 'pe-001',
      category: 'prompt_engineering',
      title: 'The Anatomy of an Effective Prompt',
      duration: 120,
      prerequisiteAKUs: [],
      businessKPI: 'response_quality',
      concept: `Every prompt has four components: Context, Task, Format, and Constraints.
Without structure, AI outputs are unpredictable.
Your first skill: decompose any request into these four parts.`,
      sandboxChallenge: {
        prompt: 'Rewrite this vague request as a structured prompt: "Help me with my emails"',
        expectedOutputSchema: {
          context: { type: 'string', minLength: 20 },
          task: { type: 'string', minLength: 10 },
          format: { type: 'string' },
        },
        hints: [
          'What role should the AI assume?',
          'What specific email task? Writing? Responding? Organizing?',
          'What format should the output take?',
        ],
        maxHints: 3,
      },
      alternativeFormats: {},
      verificationCriteria: {
        outputValidation: [
          { field: 'context', type: 'exists', expected: true },
          { field: 'task', type: 'exists', expected: true },
        ],
        executionRequirements: [],
      },
    },
    {
      id: 'pe-002',
      category: 'prompt_engineering',
      title: 'Chain of Thought Prompting',
      duration: 120,
      prerequisiteAKUs: ['pe-001'],
      businessKPI: 'accuracy',
      concept: `When AI explains its reasoning, accuracy jumps 20-40%.
Chain of Thought (CoT) prompting forces step-by-step logic.
Key phrase: "Let's think through this step by step."`,
      sandboxChallenge: {
        prompt: 'Create a CoT prompt that helps analyze whether a business idea is viable',
        expectedOutputSchema: {
          steps: { type: 'array', minItems: 3 },
        },
        hints: [
          'What steps would an investor take to evaluate a business?',
          'How can you force the AI to show each step?',
        ],
        maxHints: 2,
      },
      alternativeFormats: {},
      verificationCriteria: {
        outputValidation: [
          { field: 'steps', type: 'exists', expected: true },
        ],
        executionRequirements: [],
      },
    },
    {
      id: 'api-001',
      category: 'api_integration',
      title: 'Your First API Call',
      duration: 120,
      prerequisiteAKUs: ['pe-001'],
      businessKPI: 'integration',
      concept: `APIs are how software talks to AI. One HTTP request, one response.
You need: endpoint URL, API key, and a prompt.
Today you'll make your first real API call.`,
      sandboxChallenge: {
        prompt: 'Build a workflow that calls OpenAI and displays the response',
        starterWorkflow: [
          {
            id: 'trigger',
            type: 'trigger',
            service: 'manual',
            config: {},
            position: { x: 100, y: 200 },
            connections: [],
          },
        ],
        expectedOutputSchema: {
          response: { type: 'string' },
        },
        hints: [
          'Add an OpenAI node after the trigger',
          'Configure the prompt in the OpenAI node',
          'Connect to a Display Output node',
        ],
        maxHints: 3,
      },
      alternativeFormats: {},
      verificationCriteria: {
        outputValidation: [
          { field: 'response', type: 'exists', expected: true },
        ],
        executionRequirements: [
          { type: 'api_called', target: 'openai' },
        ],
      },
    },
  ],
  employee: [
    {
      id: 'pe-001',
      category: 'prompt_engineering',
      title: 'The Anatomy of an Effective Prompt',
      duration: 120,
      prerequisiteAKUs: [],
      businessKPI: 'response_quality',
      concept: `Every prompt has four components: Context, Task, Format, and Constraints.
Without structure, AI outputs are unpredictable.
Your first skill: decompose any request into these four parts.`,
      sandboxChallenge: {
        prompt: 'Rewrite this vague request as a structured prompt: "Help me with my emails"',
        expectedOutputSchema: {
          context: { type: 'string', minLength: 20 },
          task: { type: 'string', minLength: 10 },
          format: { type: 'string' },
        },
        hints: [
          'What role should the AI assume?',
          'What specific email task? Writing? Responding? Organizing?',
          'What format should the output take?',
        ],
        maxHints: 3,
      },
      alternativeFormats: {},
      verificationCriteria: {
        outputValidation: [
          { field: 'context', type: 'exists', expected: true },
          { field: 'task', type: 'exists', expected: true },
        ],
        executionRequirements: [],
      },
    },
    {
      id: 'rag-001',
      category: 'rag_pipeline',
      title: 'RAG Fundamentals',
      duration: 120,
      prerequisiteAKUs: ['pe-001'],
      businessKPI: 'knowledge_retrieval',
      concept: `RAG = Retrieval Augmented Generation.
Instead of hoping AI knows your data, you feed it relevant context.
Three steps: Embed documents → Store in vector DB → Retrieve + Generate.`,
      sandboxChallenge: {
        prompt: 'Build a simple RAG pipeline that answers questions about company data',
        expectedOutputSchema: {
          embedding_created: { type: 'boolean' },
          answer_generated: { type: 'boolean' },
        },
        hints: [
          'First, add a document loader node',
          'Create embeddings from the document',
          'Query with a question and generate an answer',
        ],
        maxHints: 3,
      },
      alternativeFormats: {},
      verificationCriteria: {
        outputValidation: [
          { field: 'answer_generated', type: 'matches', expected: true },
        ],
        executionRequirements: [],
      },
    },
    {
      id: 'custom-gpt-001',
      category: 'agent_orchestration',
      title: 'Building Your Custom GPT',
      duration: 180,
      prerequisiteAKUs: ['rag-001'],
      businessKPI: 'automation',
      concept: `A Custom GPT combines your documents with AI capabilities.
It becomes an expert on YOUR data—company policies, procedures, FAQs.
This is the capstone: a GPT that knows your internal documentation.`,
      sandboxChallenge: {
        prompt: 'Create a Custom GPT for internal documentation that can answer employee questions',
        expectedOutputSchema: {
          gpt_created: { type: 'boolean' },
          test_query_passed: { type: 'boolean' },
        },
        hints: [
          'Start with your document collection',
          'Create a system prompt that defines the GPT\'s role',
          'Test with a sample employee question',
        ],
        maxHints: 3,
      },
      alternativeFormats: {},
      verificationCriteria: {
        outputValidation: [
          { field: 'gpt_created', type: 'matches', expected: true },
          { field: 'test_query_passed', type: 'matches', expected: true },
        ],
        executionRequirements: [
          { type: 'workflow_deployed', target: 'custom-gpt' },
        ],
      },
    },
  ],
  owner: [
    {
      id: 'pe-001',
      category: 'prompt_engineering',
      title: 'The Anatomy of an Effective Prompt',
      duration: 120,
      prerequisiteAKUs: [],
      businessKPI: 'response_quality',
      concept: `Every prompt has four components: Context, Task, Format, and Constraints.
Without structure, AI outputs are unpredictable.
Your first skill: decompose any request into these four parts.`,
      sandboxChallenge: {
        prompt: 'Rewrite this vague request as a structured prompt: "Help me with my emails"',
        expectedOutputSchema: {},
        hints: [
          'What role should the AI assume?',
          'What specific email task?',
          'What format should the output take?',
        ],
        maxHints: 3,
      },
      alternativeFormats: {},
      verificationCriteria: {
        outputValidation: [],
        executionRequirements: [],
      },
    },
    {
      id: 'agent-001',
      category: 'agent_orchestration',
      title: 'Agents: AI That Takes Action',
      duration: 120,
      prerequisiteAKUs: ['pe-001'],
      businessKPI: 'automation',
      concept: `Agents are AI + Tools. They don't just answer—they DO.
An agent has: a goal, available tools, and decision-making logic.
Today you'll build an agent that researches and acts.`,
      sandboxChallenge: {
        prompt: 'Create an agent that can search, analyze, and report findings',
        expectedOutputSchema: {
          agent_created: { type: 'boolean' },
        },
        hints: [
          'Define what tools the agent can use',
          'Give the agent a clear goal',
          'Let it decide the steps',
        ],
        maxHints: 3,
      },
      alternativeFormats: {},
      verificationCriteria: {
        outputValidation: [
          { field: 'agent_created', type: 'matches', expected: true },
        ],
        executionRequirements: [],
      },
    },
    {
      id: 'ops-001',
      category: 'agent_orchestration',
      title: 'AI Operations Chain',
      duration: 180,
      prerequisiteAKUs: ['agent-001'],
      businessKPI: 'scalability',
      concept: `An Operations Chain automates business processes end-to-end.
Multiple agents work together: one gathers data, one analyzes, one acts.
This is the capstone: replacing manual labor with AI chains.`,
      sandboxChallenge: {
        prompt: 'Build an operations chain that handles a complete business process',
        expectedOutputSchema: {
          chain_created: { type: 'boolean' },
          end_to_end_test: { type: 'boolean' },
        },
        hints: [
          'Map out the manual process first',
          'Identify which steps AI can handle',
          'Connect agents in a chain with handoffs',
        ],
        maxHints: 3,
      },
      alternativeFormats: {},
      verificationCriteria: {
        outputValidation: [
          { field: 'chain_created', type: 'matches', expected: true },
        ],
        executionRequirements: [
          { type: 'workflow_deployed', target: 'ops-chain' },
        ],
      },
    },
  ],
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tier = searchParams.get('tier') as BusinessTier;

  if (!tier || !CURRICULUM[tier]) {
    return NextResponse.json(
      { error: 'Invalid tier. Must be: student, employee, or owner' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    tier,
    akus: CURRICULUM[tier],
    total: CURRICULUM[tier].length,
  });
}
