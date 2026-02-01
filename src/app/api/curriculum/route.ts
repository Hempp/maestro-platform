/**
 * CURRICULUM API
 * Returns AKUs for a given business tier
 * Supports Foundation Mode: explains 'why' behind every concept
 */

import { NextRequest, NextResponse } from 'next/server';
import type { AtomicKnowledgeUnit, BusinessTier, FoundationContent, LearningMode } from '@/types';

// Foundation content for each AKU - explains the 'why' behind concepts
const FOUNDATION_CONTENT: Record<string, FoundationContent> = {
  'pe-001': {
    akuId: 'pe-001',
    whyItMatters: `Unstructured prompts waste 60% of AI's potential. The difference between "help me with emails" and a structured prompt is the difference between a confused intern and a senior assistant who knows exactly what you need.`,
    conceptOrigin: `This framework comes from how humans communicate with experts. When you visit a doctor, you provide context (symptoms), task (what you need), format (prescription vs. advice), and constraints (allergies). AI works the same way.`,
    commonMisconceptions: [
      'AI understands what I mean without details',
      'Longer prompts are always better',
      'The AI will ask for clarification if confused',
    ],
    realWorldExample: `A marketing team reduced email response time by 70% after learning this. Before: "Write me a response." After: "You are a customer support rep for [company]. Respond to this complaint email. Be apologetic but firm. Keep it under 100 words."`,
    prerequisiteKnowledge: ['Basic understanding of what AI/ChatGPT does'],
    businessImpact: 'Structured prompts directly correlate with output quality. Companies report 40% fewer revision cycles after training employees on prompt structure.',
  },
  'pe-002': {
    akuId: 'pe-002',
    whyItMatters: `AI often "jumps to conclusions" with wrong answers. Chain of Thought forces it to show its work—just like how teachers require students to show math steps. This catches errors and improves accuracy by 20-40%.`,
    conceptOrigin: `Researchers at Google discovered this in 2022. They found that simply adding "Let's think step by step" to prompts dramatically improved accuracy on complex reasoning tasks. It works because it mimics human problem-solving.`,
    commonMisconceptions: [
      'CoT makes responses slower and wastes tokens',
      'Only useful for math problems',
      "I can't verify if AI's reasoning is correct",
    ],
    realWorldExample: `A financial analyst was getting wrong investment calculations. After implementing CoT: "Analyze this stock. Step 1: Calculate P/E ratio. Step 2: Compare to industry average..." accuracy went from 65% to 94%.`,
    prerequisiteKnowledge: ['Basic prompt structure (pe-001)', 'Understanding that AI can make logical errors'],
    businessImpact: 'Critical for any task requiring reasoning—financial analysis, legal review, strategic planning. CoT creates an audit trail for AI decisions.',
  },
  'api-001': {
    akuId: 'api-001',
    whyItMatters: `ChatGPT is a toy. APIs are the power tools. Every AI product you use—from Notion AI to custom chatbots—is built on API calls. This skill separates AI users from AI builders.`,
    conceptOrigin: `APIs (Application Programming Interfaces) have existed since the 1960s. They're how software components communicate. OpenAI's API launched in 2020, democratizing access to powerful AI models for developers.`,
    commonMisconceptions: [
      'APIs require coding skills',
      "It's too expensive for individual use",
      'The ChatGPT interface is just as good',
    ],
    realWorldExample: `A small business owner built a customer support bot using API calls in a weekend. It handles 200 queries/day at $15/month—replacing a $2,000/month chat service. No coding required with workflow tools.`,
    prerequisiteKnowledge: ['What prompts are (pe-001)', 'Basic understanding of how websites send/receive data'],
    businessImpact: 'API skills are the gateway to automation. Every AI workflow starts with an API call. This is the foundation for all advanced AI applications.',
  },
  'rag-001': {
    akuId: 'rag-001',
    whyItMatters: `AI doesn't know YOUR data—your company docs, policies, customer history. RAG fixes this by feeding AI relevant context from your own documents. It's like giving AI an open-book test with YOUR book.`,
    conceptOrigin: `RAG was developed by Facebook AI Research in 2020. They combined retrieval systems (like search engines) with generation models. It solved the "hallucination problem" where AI made up facts.`,
    commonMisconceptions: [
      'I need to fine-tune a model for my data',
      'RAG is only for large enterprises',
      'It requires a massive amount of data to work',
    ],
    realWorldExample: `A law firm implemented RAG with 500 case files. Lawyers can now ask "What precedents exist for [case type]?" and get answers citing specific documents with page numbers. Research time dropped 80%.`,
    prerequisiteKnowledge: ['API calls (api-001)', 'Understanding of documents and search'],
    businessImpact: "RAG enables 'enterprise AI'—AI that knows your business. It's the bridge between generic AI and AI that works for YOUR specific needs.",
  },
  'custom-gpt-001': {
    akuId: 'custom-gpt-001',
    whyItMatters: `A Custom GPT is YOUR AI assistant—trained on YOUR documents, answering YOUR questions. It's the difference between a generic assistant and one who has read every company document.`,
    conceptOrigin: `OpenAI introduced Custom GPTs in 2023, but the concept is older. It combines system prompts (defining personality/role) with RAG (document knowledge) into a packaged product anyone can use.`,
    commonMisconceptions: [
      'Building a Custom GPT requires coding',
      "It's the same as just uploading docs to ChatGPT",
      'My company data will be used to train OpenAI',
    ],
    realWorldExample: `An HR team built a "Policy Bot" in 2 hours. Employees ask questions like "What's our parental leave policy?" and get accurate answers citing the exact policy document. HR ticket volume dropped 60%.`,
    prerequisiteKnowledge: ['RAG fundamentals (rag-001)', 'Prompt engineering basics (pe-001)'],
    businessImpact: 'This is your capstone deliverable. A working Custom GPT proves you can create AI tools that provide real business value. Employers specifically look for this skill.',
  },
  'agent-001': {
    akuId: 'agent-001',
    whyItMatters: `Regular AI just answers questions. Agents TAKE ACTION. They can browse the web, write files, send emails, update databases. This is the leap from AI that talks to AI that works.`,
    conceptOrigin: `AI agents emerged from research into "tool use" in 2023. OpenAI, Google, and Anthropic all released agent-capable models. The concept draws from robotics and autonomous systems.`,
    commonMisconceptions: [
      'Agents are too risky—they might do something wrong',
      "They're only for coding tasks",
      'Building agents requires AI expertise',
    ],
    realWorldExample: `A real estate agent built an AI agent that searches listings, compiles comparables, and drafts market analysis reports. What took 4 hours now takes 10 minutes of review.`,
    prerequisiteKnowledge: ['API integration (api-001)', 'Understanding of workflows and tools'],
    businessImpact: 'Agents are the future of work automation. Companies that master agents replace manual processes at 10x the speed of traditional automation.',
  },
  'ops-001': {
    akuId: 'ops-001',
    whyItMatters: `One agent is powerful. Multiple agents working together are transformational. An operations chain automates entire business processes—from trigger to completion—without human intervention.`,
    conceptOrigin: `Operations chains draw from DevOps and workflow automation. The AI layer adds intelligence—chains can make decisions, handle exceptions, and improve over time.`,
    commonMisconceptions: [
      'This is too complex for small businesses',
      'Chains are fragile and break easily',
      'Humans become unnecessary',
    ],
    realWorldExample: `An e-commerce owner built an ops chain: Order received → Inventory checked → Supplier notified → Customer updated → Review requested. 200 orders/day processed with 0 human touches.`,
    prerequisiteKnowledge: ['Agent building (agent-001)', 'Understanding of business processes'],
    businessImpact: 'This is your capstone: an AI Operations Manual. It documents how AI runs your business operations, making your business scalable and transferable.',
  },
};

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
  const mode = (searchParams.get('mode') as LearningMode) || 'standard';

  if (!tier || !CURRICULUM[tier]) {
    return NextResponse.json(
      { error: 'Invalid tier. Must be: student, employee, or owner' },
      { status: 400 }
    );
  }

  // In foundation mode, enrich AKUs with 'why' explanations
  const akus = CURRICULUM[tier].map(aku => {
    if (mode === 'foundation' || mode === 'standard') {
      const foundation = FOUNDATION_CONTENT[aku.id];
      if (foundation) {
        return {
          ...aku,
          foundation,
          // Enhance concept with 'why it matters' in foundation mode
          concept: mode === 'foundation'
            ? `**Why This Matters:**\n${foundation.whyItMatters}\n\n**The Concept:**\n${aku.concept}\n\n**Real-World Example:**\n${foundation.realWorldExample}`
            : aku.concept,
        };
      }
    }
    return aku;
  });

  return NextResponse.json({
    tier,
    mode,
    akus,
    total: akus.length,
    foundationAvailable: Object.keys(FOUNDATION_CONTENT).length,
  });
}
