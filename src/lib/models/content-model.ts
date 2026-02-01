/**
 * CONTENT MODEL
 * Manages Atomic Knowledge Units (AKUs) - 2-minute learning concepts
 * AKUs are reorderable, adaptable, and tied to business KPIs
 */

import type {
  AtomicKnowledgeUnit,
  AKUCategory,
  SandboxChallenge,
  VerificationCriteria,
  BusinessTier,
} from '@/types';

// ═══════════════════════════════════════════════════════════════════════════
// CONTENT MODEL SERVICE
// ═══════════════════════════════════════════════════════════════════════════

export class ContentModelService {
  private akuRegistry: Map<string, AtomicKnowledgeUnit> = new Map();
  private categoryIndex: Map<AKUCategory, string[]> = new Map();
  private tierPaths: Map<BusinessTier, string[]> = new Map();

  constructor() {
    this.initializeRegistry();
  }

  /**
   * Initialize AKU registry with curriculum
   */
  private initializeRegistry(): void {
    // Initialize category indexes
    const categories: AKUCategory[] = [
      'prompt_engineering',
      'rag_pipeline',
      'agent_orchestration',
      'api_integration',
      'fine_tuning',
    ];
    categories.forEach(cat => this.categoryIndex.set(cat, []));

    // Initialize tier learning paths
    this.tierPaths.set('student', [
      'pe-001', 'pe-002', 'pe-003', // Prompt basics
      'api-001', 'api-002', // API basics
      'rag-001', // RAG intro
      'portfolio-capstone',
    ]);

    this.tierPaths.set('employee', [
      'pe-001', 'pe-002',
      'api-001', 'api-002', 'api-003',
      'rag-001', 'rag-002',
      'agent-001',
      'custom-gpt-capstone',
    ]);

    this.tierPaths.set('owner', [
      'pe-001', 'pe-002', 'pe-003',
      'api-001', 'api-002', 'api-003',
      'rag-001', 'rag-002', 'rag-003',
      'agent-001', 'agent-002', 'agent-003',
      'operations-capstone',
    ]);

    // Register core AKUs
    this.registerCoreAKUs();
  }

  /**
   * Register core curriculum AKUs
   */
  private registerCoreAKUs(): void {
    // ─────────────────────────────────────────────────────────────────────
    // PROMPT ENGINEERING TRACK
    // ─────────────────────────────────────────────────────────────────────

    this.registerAKU({
      id: 'pe-001',
      category: 'prompt_engineering',
      title: 'The Anatomy of an Effective Prompt',
      duration: 120,
      prerequisiteAKUs: [],
      businessKPI: 'response_quality',
      concept: `
        Every prompt has four components: Context, Task, Format, and Constraints.
        Without structure, AI outputs are unpredictable.
        Your first skill: decompose any request into these four parts.
      `,
      sandboxChallenge: {
        prompt: 'Rewrite this vague request as a structured prompt: "Help me with my emails"',
        expectedOutputSchema: {
          context: { type: 'string', minLength: 20 },
          task: { type: 'string', minLength: 10 },
          format: { type: 'string' },
          constraints: { type: 'array' },
        },
        hints: [
          'What role should the AI assume?',
          'What specific email task? Writing? Responding? Organizing?',
          'What format should the output take?',
        ],
        maxHints: 2,
      },
      alternativeFormats: {
        visual: 'prompt-anatomy-diagram',
        textual: 'prompt-anatomy-detailed',
        handsOn: 'Build a prompt live in the sandbox',
      },
      verificationCriteria: {
        outputValidation: [
          { field: 'context', type: 'exists', expected: true },
          { field: 'task', type: 'exists', expected: true },
          { field: 'format', type: 'exists', expected: true },
        ],
        executionRequirements: [],
      },
    });

    this.registerAKU({
      id: 'pe-002',
      category: 'prompt_engineering',
      title: 'Chain of Thought: Making AI Show Its Work',
      duration: 120,
      prerequisiteAKUs: ['pe-001'],
      businessKPI: 'accuracy_improvement',
      concept: `
        When AI explains its reasoning, accuracy jumps 20-40%.
        Chain of Thought (CoT) prompting forces step-by-step logic.
        Key phrase: "Let's think through this step by step."
      `,
      sandboxChallenge: {
        prompt: 'Create a CoT prompt that helps analyze whether a business idea is viable',
        expectedOutputSchema: {
          steps: { type: 'array', minItems: 3 },
          reasoning_required: { type: 'boolean', value: true },
        },
        hints: [
          'What steps would an investor take to evaluate a business?',
          'How can you force the AI to show each step?',
        ],
        maxHints: 2,
      },
      alternativeFormats: {
        visual: 'cot-flowchart',
        textual: 'cot-research-paper',
        handsOn: 'Compare outputs with and without CoT',
      },
      verificationCriteria: {
        outputValidation: [
          { field: 'steps', type: 'exists', expected: true },
          { field: 'steps.length', type: 'type_check', expected: 'number' },
        ],
        executionRequirements: [],
      },
    });

    this.registerAKU({
      id: 'pe-003',
      category: 'prompt_engineering',
      title: 'Few-Shot Learning: Teaching by Example',
      duration: 120,
      prerequisiteAKUs: ['pe-002'],
      businessKPI: 'consistency',
      concept: `
        AI learns patterns from examples faster than instructions.
        2-3 examples of input→output pairs establish format and tone.
        This is "few-shot" learning - teaching through demonstration.
      `,
      sandboxChallenge: {
        prompt: 'Create a few-shot prompt that classifies customer feedback as Positive, Negative, or Neutral',
        expectedOutputSchema: {
          examples: { type: 'array', minItems: 2 },
          classification_output: { type: 'string' },
        },
        hints: [
          'Show 2-3 examples of feedback with their correct labels',
          'Make the pattern obvious so the AI can generalize',
        ],
        maxHints: 2,
      },
      alternativeFormats: {
        visual: 'few-shot-examples-gallery',
        textual: 'few-shot-theory',
        handsOn: 'Build a classifier in the sandbox',
      },
      verificationCriteria: {
        outputValidation: [
          { field: 'examples', type: 'exists', expected: true },
        ],
        executionRequirements: [],
      },
    });

    // ─────────────────────────────────────────────────────────────────────
    // API INTEGRATION TRACK
    // ─────────────────────────────────────────────────────────────────────

    this.registerAKU({
      id: 'api-001',
      category: 'api_integration',
      title: 'Your First API Call: The Hello World of AI',
      duration: 120,
      prerequisiteAKUs: [],
      businessKPI: 'integration_capability',
      concept: `
        APIs are how software talks to AI. One HTTP request, one response.
        You need: endpoint URL, API key, and a prompt.
        Today you'll make your first real API call to OpenAI.
      `,
      sandboxChallenge: {
        prompt: 'Make an API call to OpenAI that returns a one-sentence business tagline',
        starterWorkflow: [
          {
            id: 'trigger',
            type: 'trigger',
            service: 'manual',
            config: {},
            position: { x: 100, y: 100 },
            connections: ['openai-call'],
          },
          {
            id: 'openai-call',
            type: 'action',
            service: 'openai',
            config: {
              model: 'gpt-4',
              prompt: '', // User fills this
            },
            position: { x: 300, y: 100 },
            connections: ['output'],
          },
          {
            id: 'output',
            type: 'output',
            service: 'display',
            config: {},
            position: { x: 500, y: 100 },
            connections: [],
          },
        ],
        expectedOutputSchema: {
          response: { type: 'string', minLength: 10 },
          status: { type: 'number', value: 200 },
        },
        hints: [
          'Check the API key configuration',
          'The prompt should be specific about what you want',
        ],
        maxHints: 3,
      },
      alternativeFormats: {
        visual: 'api-flow-diagram',
        textual: 'api-curl-examples',
        handsOn: 'Live API sandbox',
      },
      verificationCriteria: {
        outputValidation: [
          { field: 'response', type: 'exists', expected: true },
          { field: 'status', type: 'matches', expected: 200 },
        ],
        executionRequirements: [
          { type: 'api_called', target: 'openai' },
          { type: 'response_received', target: 'openai' },
        ],
      },
    });

    // ─────────────────────────────────────────────────────────────────────
    // RAG PIPELINE TRACK
    // ─────────────────────────────────────────────────────────────────────

    this.registerAKU({
      id: 'rag-001',
      category: 'rag_pipeline',
      title: 'RAG Fundamentals: Teaching AI Your Documents',
      duration: 120,
      prerequisiteAKUs: ['api-001'],
      businessKPI: 'knowledge_retrieval',
      concept: `
        RAG = Retrieval Augmented Generation.
        Instead of hoping AI knows your data, you feed it relevant context.
        Three steps: Embed documents → Store in vector DB → Retrieve + Generate.
      `,
      sandboxChallenge: {
        prompt: 'Build a simple RAG pipeline that answers questions about a company FAQ',
        expectedOutputSchema: {
          embedding_created: { type: 'boolean', value: true },
          retrieval_works: { type: 'boolean', value: true },
          answer_generated: { type: 'boolean', value: true },
        },
        hints: [
          'First, chunk your documents into smaller pieces',
          'Use embeddings to convert text to vectors',
          'Query the vector store before generating',
        ],
        maxHints: 3,
      },
      alternativeFormats: {
        visual: 'rag-architecture-diagram',
        textual: 'rag-technical-deep-dive',
        handsOn: 'Build RAG step by step',
      },
      verificationCriteria: {
        outputValidation: [
          { field: 'embedding_created', type: 'matches', expected: true },
          { field: 'retrieval_works', type: 'matches', expected: true },
        ],
        executionRequirements: [
          { type: 'api_called', target: 'embeddings' },
          { type: 'api_called', target: 'vector_store' },
        ],
      },
    });

    // ─────────────────────────────────────────────────────────────────────
    // AGENT ORCHESTRATION TRACK
    // ─────────────────────────────────────────────────────────────────────

    this.registerAKU({
      id: 'agent-001',
      category: 'agent_orchestration',
      title: 'Agents 101: AI That Takes Action',
      duration: 120,
      prerequisiteAKUs: ['pe-002', 'api-001'],
      businessKPI: 'automation_capability',
      concept: `
        Agents are AI + Tools. They don't just answer—they DO.
        An agent has: a goal, available tools, and decision-making logic.
        Today you'll build an agent that researches and summarizes.
      `,
      sandboxChallenge: {
        prompt: 'Create an agent that can search the web and summarize findings',
        expectedOutputSchema: {
          agent_created: { type: 'boolean', value: true },
          tools_configured: { type: 'array', minItems: 1 },
          task_completed: { type: 'boolean', value: true },
        },
        hints: [
          'Define what tools the agent can use',
          'Give the agent a clear goal',
          'Let it decide the steps',
        ],
        maxHints: 3,
      },
      alternativeFormats: {
        visual: 'agent-loop-diagram',
        textual: 'agent-patterns-guide',
        handsOn: 'Build agent in sandbox',
      },
      verificationCriteria: {
        outputValidation: [
          { field: 'agent_created', type: 'matches', expected: true },
          { field: 'tools_configured', type: 'exists', expected: true },
        ],
        executionRequirements: [
          { type: 'workflow_deployed', target: 'agent' },
        ],
      },
    });
  }

  /**
   * Register a single AKU
   */
  private registerAKU(aku: AtomicKnowledgeUnit): void {
    this.akuRegistry.set(aku.id, aku);

    // Update category index
    const categoryAKUs = this.categoryIndex.get(aku.category) || [];
    categoryAKUs.push(aku.id);
    this.categoryIndex.set(aku.category, categoryAKUs);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PUBLIC METHODS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get an AKU by ID
   */
  getAKU(id: string): AtomicKnowledgeUnit | undefined {
    return this.akuRegistry.get(id);
  }

  /**
   * Get all AKUs in a category
   */
  getAKUsByCategory(category: AKUCategory): AtomicKnowledgeUnit[] {
    const ids = this.categoryIndex.get(category) || [];
    return ids.map(id => this.akuRegistry.get(id)!).filter(Boolean);
  }

  /**
   * Get learning path for a business tier
   */
  getLearningPath(tier: BusinessTier): AtomicKnowledgeUnit[] {
    const ids = this.tierPaths.get(tier) || [];
    return ids.map(id => this.akuRegistry.get(id)!).filter(Boolean);
  }

  /**
   * Get next AKU based on completed AKUs and tier
   */
  getNextAKU(
    completedAKUs: string[],
    tier: BusinessTier
  ): AtomicKnowledgeUnit | null {
    const path = this.tierPaths.get(tier) || [];

    for (const akuId of path) {
      if (!completedAKUs.includes(akuId)) {
        const aku = this.akuRegistry.get(akuId);
        if (aku) {
          // Check prerequisites
          const prereqsMet = aku.prerequisiteAKUs.every(
            prereq => completedAKUs.includes(prereq)
          );
          if (prereqsMet) {
            return aku;
          }
        }
      }
    }

    return null;
  }

  /**
   * Get alternative format for an AKU
   */
  getAlternativeFormat(
    akuId: string,
    format: 'visual' | 'textual' | 'hands-on'
  ): string | undefined {
    const aku = this.akuRegistry.get(akuId);
    if (!aku) return undefined;

    const formatKey = format === 'hands-on' ? 'handsOn' : format;
    return aku.alternativeFormats[formatKey];
  }

  /**
   * Get total AKU count
   */
  getTotalAKUCount(): number {
    return this.akuRegistry.size;
  }

  /**
   * Get progress percentage for a learner
   */
  getProgressPercentage(completedAKUs: string[], tier: BusinessTier): number {
    const path = this.tierPaths.get(tier) || [];
    if (path.length === 0) return 0;

    const completed = completedAKUs.filter(id => path.includes(id)).length;
    return Math.round((completed / path.length) * 100);
  }
}

export const contentModel = new ContentModelService();
