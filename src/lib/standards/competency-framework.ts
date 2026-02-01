/**
 * COMPETENCY FRAMEWORK
 * Industry-aligned skill standards for AI workflow mastery
 * Mapped to: O*NET, LinkedIn Skills, AWS/Google AI certifications
 */

export interface Competency {
  id: string;
  name: string;
  description: string;
  industryAlignment: string[];
  proficiencyLevels: ProficiencyLevel[];
  assessmentCriteria: AssessmentCriterion[];
}

export interface ProficiencyLevel {
  level: 1 | 2 | 3 | 4 | 5;
  name: string;
  description: string;
  indicators: string[];
}

export interface AssessmentCriterion {
  criterion: string;
  weight: number;
  rubric: {
    excellent: string;
    proficient: string;
    developing: string;
    beginning: string;
  };
}

export interface LearningOutcome {
  id: string;
  akuId: string;
  outcome: string;
  bloomsLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  measurableCriteria: string[];
  competencyMapping: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// INDUSTRY-ALIGNED COMPETENCIES
// ═══════════════════════════════════════════════════════════════════════════

export const COMPETENCY_FRAMEWORK: Competency[] = [
  {
    id: 'prompt-engineering',
    name: 'Prompt Engineering',
    description: 'Design, optimize, and iterate on prompts for large language models',
    industryAlignment: [
      'O*NET: 15-2051.00 Data Scientists',
      'LinkedIn: Prompt Engineering',
      'Google AI: Generative AI Skills',
    ],
    proficiencyLevels: [
      {
        level: 1,
        name: 'Foundational',
        description: 'Understands basic prompt structure',
        indicators: [
          'Can write simple prompts with clear instructions',
          'Understands the role of context in prompts',
        ],
      },
      {
        level: 2,
        name: 'Developing',
        description: 'Applies structured prompt techniques',
        indicators: [
          'Uses Context-Task-Format-Constraints framework',
          'Can iterate on prompts based on output quality',
        ],
      },
      {
        level: 3,
        name: 'Proficient',
        description: 'Implements advanced prompting strategies',
        indicators: [
          'Applies Chain of Thought prompting effectively',
          'Uses few-shot learning with appropriate examples',
          'Handles edge cases in prompt design',
        ],
      },
      {
        level: 4,
        name: 'Advanced',
        description: 'Optimizes prompts for production systems',
        indicators: [
          'Designs prompts for reliability and consistency',
          'Implements prompt versioning and testing',
          'Reduces token usage while maintaining quality',
        ],
      },
      {
        level: 5,
        name: 'Expert',
        description: 'Architects prompt systems at scale',
        indicators: [
          'Designs meta-prompts and prompt chains',
          'Implements automated prompt optimization',
          'Trains others in prompt engineering best practices',
        ],
      },
    ],
    assessmentCriteria: [
      {
        criterion: 'Prompt Structure',
        weight: 25,
        rubric: {
          excellent: 'Prompt includes all four components (Context, Task, Format, Constraints) with precise specificity',
          proficient: 'Prompt includes all components with adequate detail',
          developing: 'Prompt includes most components but lacks specificity',
          beginning: 'Prompt is vague or missing key components',
        },
      },
      {
        criterion: 'Output Quality',
        weight: 35,
        rubric: {
          excellent: 'Output consistently meets requirements with minimal iteration',
          proficient: 'Output meets requirements after 1-2 iterations',
          developing: 'Output partially meets requirements after multiple iterations',
          beginning: 'Output does not meet requirements',
        },
      },
      {
        criterion: 'Efficiency',
        weight: 20,
        rubric: {
          excellent: 'Achieves results with optimal token usage and minimal API calls',
          proficient: 'Achieves results with reasonable efficiency',
          developing: 'Achieves results but with unnecessary verbosity',
          beginning: 'Inefficient prompt design requiring excessive resources',
        },
      },
      {
        criterion: 'Adaptability',
        weight: 20,
        rubric: {
          excellent: 'Prompt handles edge cases and variations gracefully',
          proficient: 'Prompt handles common variations',
          developing: 'Prompt works for standard cases only',
          beginning: 'Prompt is brittle and fails with minor variations',
        },
      },
    ],
  },
  {
    id: 'api-integration',
    name: 'AI API Integration',
    description: 'Connect and orchestrate AI services through APIs',
    industryAlignment: [
      'O*NET: 15-1252.00 Software Developers',
      'LinkedIn: API Development',
      'AWS: Machine Learning Specialty',
    ],
    proficiencyLevels: [
      {
        level: 1,
        name: 'Foundational',
        description: 'Makes basic API calls',
        indicators: [
          'Can make HTTP requests to AI APIs',
          'Understands authentication basics',
        ],
      },
      {
        level: 2,
        name: 'Developing',
        description: 'Handles API responses and errors',
        indicators: [
          'Parses JSON responses correctly',
          'Implements basic error handling',
        ],
      },
      {
        level: 3,
        name: 'Proficient',
        description: 'Builds robust API integrations',
        indicators: [
          'Implements retry logic and rate limiting',
          'Handles streaming responses',
          'Manages API keys securely',
        ],
      },
      {
        level: 4,
        name: 'Advanced',
        description: 'Orchestrates multiple AI services',
        indicators: [
          'Chains multiple API calls efficiently',
          'Implements caching strategies',
          'Monitors API usage and costs',
        ],
      },
      {
        level: 5,
        name: 'Expert',
        description: 'Architects AI service infrastructure',
        indicators: [
          'Designs fault-tolerant AI pipelines',
          'Implements load balancing across providers',
          'Optimizes for latency and cost at scale',
        ],
      },
    ],
    assessmentCriteria: [
      {
        criterion: 'API Call Correctness',
        weight: 30,
        rubric: {
          excellent: 'API calls are correctly structured with proper headers, authentication, and parameters',
          proficient: 'API calls work correctly with minor issues',
          developing: 'API calls work but have structural problems',
          beginning: 'API calls fail or are incorrectly formed',
        },
      },
      {
        criterion: 'Error Handling',
        weight: 25,
        rubric: {
          excellent: 'Comprehensive error handling with graceful degradation',
          proficient: 'Handles common errors appropriately',
          developing: 'Basic error handling present',
          beginning: 'No error handling or crashes on errors',
        },
      },
      {
        criterion: 'Security',
        weight: 25,
        rubric: {
          excellent: 'API keys secured, no exposure in code or logs',
          proficient: 'API keys handled appropriately',
          developing: 'Some security concerns present',
          beginning: 'API keys exposed or insecurely handled',
        },
      },
      {
        criterion: 'Performance',
        weight: 20,
        rubric: {
          excellent: 'Optimized for speed with appropriate caching and batching',
          proficient: 'Reasonable performance characteristics',
          developing: 'Works but with performance issues',
          beginning: 'Significant performance problems',
        },
      },
    ],
  },
  {
    id: 'rag-pipeline',
    name: 'RAG Pipeline Development',
    description: 'Build Retrieval-Augmented Generation systems',
    industryAlignment: [
      'O*NET: 15-2051.00 Data Scientists',
      'LinkedIn: Vector Databases',
      'Google AI: Applied AI Engineering',
    ],
    proficiencyLevels: [
      {
        level: 1,
        name: 'Foundational',
        description: 'Understands RAG concepts',
        indicators: [
          'Can explain retrieval vs generation',
          'Understands embeddings basics',
        ],
      },
      {
        level: 2,
        name: 'Developing',
        description: 'Implements basic RAG',
        indicators: [
          'Creates document embeddings',
          'Performs similarity search',
        ],
      },
      {
        level: 3,
        name: 'Proficient',
        description: 'Builds functional RAG systems',
        indicators: [
          'Implements chunking strategies',
          'Handles different document types',
          'Optimizes retrieval relevance',
        ],
      },
      {
        level: 4,
        name: 'Advanced',
        description: 'Optimizes RAG for production',
        indicators: [
          'Implements hybrid search (semantic + keyword)',
          'Handles large document collections',
          'Evaluates and improves retrieval quality',
        ],
      },
      {
        level: 5,
        name: 'Expert',
        description: 'Architects enterprise RAG systems',
        indicators: [
          'Designs multi-modal RAG pipelines',
          'Implements knowledge graph integration',
          'Scales to millions of documents',
        ],
      },
    ],
    assessmentCriteria: [
      {
        criterion: 'Retrieval Quality',
        weight: 35,
        rubric: {
          excellent: 'Retrieves highly relevant documents consistently',
          proficient: 'Retrieves relevant documents most of the time',
          developing: 'Retrieval works but misses relevant content',
          beginning: 'Poor retrieval quality',
        },
      },
      {
        criterion: 'Generation Quality',
        weight: 30,
        rubric: {
          excellent: 'Generated responses are accurate, grounded, and well-cited',
          proficient: 'Generated responses are accurate and relevant',
          developing: 'Generated responses sometimes hallucinate or drift',
          beginning: 'Generated responses are unreliable',
        },
      },
      {
        criterion: 'System Design',
        weight: 20,
        rubric: {
          excellent: 'Clean architecture with appropriate chunking and indexing',
          proficient: 'Functional system design',
          developing: 'Basic design with some issues',
          beginning: 'Poor system design',
        },
      },
      {
        criterion: 'Scalability',
        weight: 15,
        rubric: {
          excellent: 'Handles growth efficiently with proper indexing',
          proficient: 'Can handle moderate scale',
          developing: 'Works for small datasets only',
          beginning: 'Does not scale',
        },
      },
    ],
  },
  {
    id: 'agent-orchestration',
    name: 'AI Agent Orchestration',
    description: 'Design and deploy autonomous AI agents',
    industryAlignment: [
      'O*NET: 15-2051.00 Data Scientists',
      'LinkedIn: AI Engineering',
      'AWS: AI/ML Solutions Architect',
    ],
    proficiencyLevels: [
      {
        level: 1,
        name: 'Foundational',
        description: 'Understands agent concepts',
        indicators: [
          'Can explain agent vs chatbot differences',
          'Understands tool use basics',
        ],
      },
      {
        level: 2,
        name: 'Developing',
        description: 'Creates simple agents',
        indicators: [
          'Implements single-tool agents',
          'Handles basic agent loops',
        ],
      },
      {
        level: 3,
        name: 'Proficient',
        description: 'Builds multi-tool agents',
        indicators: [
          'Orchestrates multiple tools effectively',
          'Implements planning and reflection',
          'Handles agent failures gracefully',
        ],
      },
      {
        level: 4,
        name: 'Advanced',
        description: 'Designs agent systems',
        indicators: [
          'Implements multi-agent collaboration',
          'Designs agent memory systems',
          'Monitors and evaluates agent performance',
        ],
      },
      {
        level: 5,
        name: 'Expert',
        description: 'Architects autonomous systems',
        indicators: [
          'Designs self-improving agent systems',
          'Implements human-in-the-loop workflows',
          'Builds production-grade agent infrastructure',
        ],
      },
    ],
    assessmentCriteria: [
      {
        criterion: 'Goal Achievement',
        weight: 35,
        rubric: {
          excellent: 'Agent consistently achieves goals with minimal steps',
          proficient: 'Agent achieves goals reliably',
          developing: 'Agent achieves goals with significant guidance',
          beginning: 'Agent fails to achieve goals',
        },
      },
      {
        criterion: 'Tool Selection',
        weight: 25,
        rubric: {
          excellent: 'Agent selects optimal tools for each task',
          proficient: 'Agent selects appropriate tools',
          developing: 'Agent sometimes selects wrong tools',
          beginning: 'Agent cannot select tools appropriately',
        },
      },
      {
        criterion: 'Error Recovery',
        weight: 20,
        rubric: {
          excellent: 'Agent recovers from errors and adapts strategy',
          proficient: 'Agent handles common errors',
          developing: 'Agent struggles with error recovery',
          beginning: 'Agent fails on any error',
        },
      },
      {
        criterion: 'Efficiency',
        weight: 20,
        rubric: {
          excellent: 'Minimal unnecessary steps or token usage',
          proficient: 'Reasonable efficiency',
          developing: 'Some unnecessary loops or calls',
          beginning: 'Highly inefficient execution',
        },
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// LEARNING OUTCOMES (Bloom's Taxonomy Aligned)
// ═══════════════════════════════════════════════════════════════════════════

export const LEARNING_OUTCOMES: LearningOutcome[] = [
  // Prompt Engineering AKUs
  {
    id: 'lo-pe-001-1',
    akuId: 'pe-001',
    outcome: 'Identify the four components of an effective prompt (Context, Task, Format, Constraints)',
    bloomsLevel: 'remember',
    measurableCriteria: [
      'Lists all four components correctly',
      'Defines each component in own words',
    ],
    competencyMapping: ['prompt-engineering'],
  },
  {
    id: 'lo-pe-001-2',
    akuId: 'pe-001',
    outcome: 'Restructure vague requests into structured prompts',
    bloomsLevel: 'apply',
    measurableCriteria: [
      'Transforms unstructured input into CTFC format',
      'Adds appropriate constraints based on context',
      'Specifies output format clearly',
    ],
    competencyMapping: ['prompt-engineering'],
  },
  {
    id: 'lo-pe-002-1',
    akuId: 'pe-002',
    outcome: 'Explain how Chain of Thought prompting improves accuracy',
    bloomsLevel: 'understand',
    measurableCriteria: [
      'Describes the mechanism of step-by-step reasoning',
      'Identifies scenarios where CoT is most effective',
    ],
    competencyMapping: ['prompt-engineering'],
  },
  {
    id: 'lo-pe-002-2',
    akuId: 'pe-002',
    outcome: 'Create CoT prompts that guide AI through multi-step reasoning',
    bloomsLevel: 'create',
    measurableCriteria: [
      'Includes explicit reasoning steps in prompt',
      'Output shows visible reasoning chain',
      'Reasoning leads to correct conclusion',
    ],
    competencyMapping: ['prompt-engineering'],
  },
  // API Integration AKUs
  {
    id: 'lo-api-001-1',
    akuId: 'api-001',
    outcome: 'Execute a successful API call to an AI service',
    bloomsLevel: 'apply',
    measurableCriteria: [
      'API call returns 200 status',
      'Response is correctly parsed',
      'Authentication is properly configured',
    ],
    competencyMapping: ['api-integration'],
  },
  {
    id: 'lo-api-001-2',
    akuId: 'api-001',
    outcome: 'Display AI-generated content in a user interface',
    bloomsLevel: 'apply',
    measurableCriteria: [
      'Response is rendered to user',
      'Loading states are handled',
      'Errors are communicated clearly',
    ],
    competencyMapping: ['api-integration'],
  },
  // RAG AKUs
  {
    id: 'lo-rag-001-1',
    akuId: 'rag-001',
    outcome: 'Explain the three stages of RAG (Embed, Store, Retrieve+Generate)',
    bloomsLevel: 'understand',
    measurableCriteria: [
      'Describes embedding process correctly',
      'Explains vector storage purpose',
      'Articulates retrieval-generation connection',
    ],
    competencyMapping: ['rag-pipeline'],
  },
  {
    id: 'lo-rag-001-2',
    akuId: 'rag-001',
    outcome: 'Build a functional RAG pipeline that answers questions from documents',
    bloomsLevel: 'create',
    measurableCriteria: [
      'Documents are successfully embedded',
      'Relevant chunks are retrieved',
      'Generated answer references source material',
    ],
    competencyMapping: ['rag-pipeline'],
  },
  // Agent AKUs
  {
    id: 'lo-agent-001-1',
    akuId: 'agent-001',
    outcome: 'Differentiate between agents and traditional chatbots',
    bloomsLevel: 'analyze',
    measurableCriteria: [
      'Identifies key differences (autonomy, tools, planning)',
      'Explains when to use each approach',
    ],
    competencyMapping: ['agent-orchestration'],
  },
  {
    id: 'lo-agent-001-2',
    akuId: 'agent-001',
    outcome: 'Create an agent that uses tools to complete a research task',
    bloomsLevel: 'create',
    measurableCriteria: [
      'Agent has defined tools available',
      'Agent selects appropriate tools',
      'Task is completed autonomously',
    ],
    competencyMapping: ['agent-orchestration'],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// CERTIFICATION REQUIREMENTS
// ═══════════════════════════════════════════════════════════════════════════

export interface CertificationRequirement {
  certificationId: string;
  name: string;
  description: string;
  requiredCompetencies: {
    competencyId: string;
    minimumLevel: 1 | 2 | 3 | 4 | 5;
  }[];
  requiredAKUs: string[];
  minimumStruggleScore: number; // Maximum allowed (lower is better)
  capstoneProject: {
    description: string;
    rubric: AssessmentCriterion[];
  };
}

export const CERTIFICATION_REQUIREMENTS: CertificationRequirement[] = [
  {
    certificationId: 'ai-workflow-associate',
    name: 'AI Workflow Associate',
    description: 'Entry-level certification for AI workflow fundamentals',
    requiredCompetencies: [
      { competencyId: 'prompt-engineering', minimumLevel: 2 },
      { competencyId: 'api-integration', minimumLevel: 2 },
    ],
    requiredAKUs: ['pe-001', 'pe-002', 'api-001'],
    minimumStruggleScore: 60,
    capstoneProject: {
      description: 'Build an AI-powered tool that solves a real problem',
      rubric: [
        {
          criterion: 'Functionality',
          weight: 40,
          rubric: {
            excellent: 'Tool works flawlessly and handles edge cases',
            proficient: 'Tool works as intended',
            developing: 'Tool works with some issues',
            beginning: 'Tool does not function correctly',
          },
        },
        {
          criterion: 'Prompt Quality',
          weight: 30,
          rubric: {
            excellent: 'Prompts are optimized and well-documented',
            proficient: 'Prompts are effective',
            developing: 'Prompts work but need refinement',
            beginning: 'Prompts are ineffective',
          },
        },
        {
          criterion: 'Documentation',
          weight: 30,
          rubric: {
            excellent: 'Clear README, usage instructions, and examples',
            proficient: 'Adequate documentation',
            developing: 'Minimal documentation',
            beginning: 'No documentation',
          },
        },
      ],
    },
  },
  {
    certificationId: 'ai-workflow-professional',
    name: 'AI Workflow Professional',
    description: 'Professional certification for production AI workflows',
    requiredCompetencies: [
      { competencyId: 'prompt-engineering', minimumLevel: 3 },
      { competencyId: 'api-integration', minimumLevel: 3 },
      { competencyId: 'rag-pipeline', minimumLevel: 3 },
    ],
    requiredAKUs: ['pe-001', 'pe-002', 'api-001', 'rag-001', 'custom-gpt-001'],
    minimumStruggleScore: 40,
    capstoneProject: {
      description: 'Build a Custom GPT with RAG for enterprise use',
      rubric: [
        {
          criterion: 'RAG Implementation',
          weight: 35,
          rubric: {
            excellent: 'Retrieval is highly accurate with proper chunking',
            proficient: 'Retrieval works well',
            developing: 'Basic retrieval implemented',
            beginning: 'RAG not functional',
          },
        },
        {
          criterion: 'User Experience',
          weight: 25,
          rubric: {
            excellent: 'Intuitive interface with excellent error handling',
            proficient: 'Good user experience',
            developing: 'Usable but needs polish',
            beginning: 'Poor user experience',
          },
        },
        {
          criterion: 'Production Readiness',
          weight: 25,
          rubric: {
            excellent: 'Handles errors, scales well, properly secured',
            proficient: 'Ready for limited production use',
            developing: 'Works in development only',
            beginning: 'Not production ready',
          },
        },
        {
          criterion: 'Documentation',
          weight: 15,
          rubric: {
            excellent: 'Comprehensive docs with deployment guide',
            proficient: 'Good documentation',
            developing: 'Basic documentation',
            beginning: 'No documentation',
          },
        },
      ],
    },
  },
  {
    certificationId: 'ai-workflow-expert',
    name: 'AI Workflow Expert',
    description: 'Expert certification for AI systems architecture',
    requiredCompetencies: [
      { competencyId: 'prompt-engineering', minimumLevel: 4 },
      { competencyId: 'api-integration', minimumLevel: 4 },
      { competencyId: 'rag-pipeline', minimumLevel: 4 },
      { competencyId: 'agent-orchestration', minimumLevel: 4 },
    ],
    requiredAKUs: ['pe-001', 'pe-002', 'api-001', 'rag-001', 'custom-gpt-001', 'agent-001', 'ops-001'],
    minimumStruggleScore: 25,
    capstoneProject: {
      description: 'Build an AI Operations Chain that automates a business process',
      rubric: [
        {
          criterion: 'Agent Design',
          weight: 30,
          rubric: {
            excellent: 'Agents are well-designed with clear responsibilities',
            proficient: 'Agents work together effectively',
            developing: 'Basic multi-agent implementation',
            beginning: 'Agents do not coordinate',
          },
        },
        {
          criterion: 'End-to-End Automation',
          weight: 30,
          rubric: {
            excellent: 'Full process automated with minimal human intervention',
            proficient: 'Most of process automated',
            developing: 'Partial automation',
            beginning: 'Not automated',
          },
        },
        {
          criterion: 'Reliability',
          weight: 25,
          rubric: {
            excellent: 'Handles failures gracefully with monitoring',
            proficient: 'Reliable in normal conditions',
            developing: 'Works but fragile',
            beginning: 'Unreliable',
          },
        },
        {
          criterion: 'Business Impact',
          weight: 15,
          rubric: {
            excellent: 'Clear ROI with measurable time/cost savings',
            proficient: 'Demonstrates business value',
            developing: 'Some business value',
            beginning: 'No clear business value',
          },
        },
      ],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export function getCompetencyById(id: string): Competency | undefined {
  return COMPETENCY_FRAMEWORK.find(c => c.id === id);
}

export function getLearningOutcomesForAKU(akuId: string): LearningOutcome[] {
  return LEARNING_OUTCOMES.filter(lo => lo.akuId === akuId);
}

export function getCertificationRequirements(certId: string): CertificationRequirement | undefined {
  return CERTIFICATION_REQUIREMENTS.find(c => c.certificationId === certId);
}

export function assessCompetencyLevel(
  scores: { criterionId: string; score: number }[],
  competency: Competency
): number {
  let totalWeight = 0;
  let weightedScore = 0;

  for (const criterion of competency.assessmentCriteria) {
    const score = scores.find(s => s.criterionId === criterion.criterion);
    if (score) {
      weightedScore += score.score * criterion.weight;
      totalWeight += criterion.weight;
    }
  }

  const averageScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

  // Map 0-100 score to 1-5 proficiency level
  if (averageScore >= 90) return 5;
  if (averageScore >= 75) return 4;
  if (averageScore >= 60) return 3;
  if (averageScore >= 40) return 2;
  return 1;
}
