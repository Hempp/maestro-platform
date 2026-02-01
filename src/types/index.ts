/**
 * MAESTRO-X TYPE DEFINITIONS
 * Core type system for the AI Workflow Mastery Platform
 */

// ═══════════════════════════════════════════════════════════════════════════
// BUSINESS TIERS
// ═══════════════════════════════════════════════════════════════════════════

export type BusinessTier = 'student' | 'employee' | 'owner';

export interface TierObjective {
  tier: BusinessTier;
  primaryKPI: string;
  deliverable: string;
  description: string;
}

export const TIER_OBJECTIVES: Record<BusinessTier, TierObjective> = {
  student: {
    tier: 'student',
    primaryKPI: 'job_readiness',
    deliverable: 'AI-Enhanced Portfolio',
    description: 'Proof you can do the work of a junior dev/marketer',
  },
  employee: {
    tier: 'employee',
    primaryKPI: 'efficiency',
    deliverable: 'Custom GPT for Internal Documentation',
    description: 'Automating your specific 9-5 tasks',
  },
  owner: {
    tier: 'owner',
    primaryKPI: 'scalability',
    deliverable: 'AI Operations Manual',
    description: 'Replacing manual labor with automated AI chains',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// LEARNER MODEL (Interaction DNA)
// ═══════════════════════════════════════════════════════════════════════════

export interface InteractionDNA {
  typingSpeed: number; // WPM average
  pausePatterns: PausePattern[];
  promptComplexity: PromptComplexityScore;
  preferredLearningStyle: 'visual' | 'textual' | 'hands-on';
  struggleAreas: string[];
  masteredConcepts: string[];
}

export interface PausePattern {
  location: 'before_api_config' | 'during_data_mapping' | 'at_deployment' | 'other';
  averageDuration: number; // seconds
  frequency: number;
}

export interface PromptComplexityScore {
  averageTokenCount: number;
  variableUsage: number; // 0-1
  conditionalLogic: number; // 0-1
  chainOfThought: number; // 0-1
}

export interface LearnerModel {
  id: string;
  walletAddress?: string;
  tier: BusinessTier;
  interactionDNA: InteractionDNA;
  currentPath: string;
  completedAKUs: string[];
  activeProject?: string;
  struggleScore: number; // 0-100 (lower = less help needed)
  createdAt: Date;
  updatedAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTENT MODEL (Atomic Knowledge Units)
// ═══════════════════════════════════════════════════════════════════════════

export type AKUCategory =
  | 'prompt_engineering'
  | 'rag_pipeline'
  | 'agent_orchestration'
  | 'api_integration'
  | 'fine_tuning';

export interface AtomicKnowledgeUnit {
  id: string;
  category: AKUCategory;
  title: string;
  duration: number; // Target: ~2 minutes
  prerequisiteAKUs: string[];
  businessKPI: string;

  // Content
  concept: string;
  visualAid?: string; // URL or component reference
  sandboxChallenge: SandboxChallenge;

  // Adaptation hints
  alternativeFormats: {
    visual?: string; // Zapier-style diagram
    textual?: string; // Code-heavy explanation
    handsOn?: string; // Direct sandbox prompt
  };

  // Verification
  verificationCriteria: VerificationCriteria;
}

export interface SandboxChallenge {
  prompt: string;
  starterWorkflow?: WorkflowNode[];
  expectedOutputSchema: Record<string, unknown>;
  hints: string[];
  maxHints: number;
}

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'output';
  service: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  connections: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// ADAPTATION MODEL
// ═══════════════════════════════════════════════════════════════════════════

export interface AdaptationDecision {
  learnerId: string;
  akuId: string;
  timestamp: Date;

  // Input signals
  signals: {
    recentStruggleAreas: string[];
    currentPausePattern?: PausePattern;
    hintsUsed: number;
    timeOnTask: number;
  };

  // Output
  action: AdaptationAction;
  reasoning: string;
}

export type AdaptationAction =
  | { type: 'continue'; nextAKU: string }
  | { type: 'simplify'; alternativeFormat: 'visual' | 'textual' | 'hands-on' }
  | { type: 'reinforce'; prerequisiteAKU: string }
  | { type: 'hint'; hintIndex: number }
  | { type: 'tutor_intervention'; message: string };

// ═══════════════════════════════════════════════════════════════════════════
// VERIFICATION & SBT MINTING
// ═══════════════════════════════════════════════════════════════════════════

export interface VerificationCriteria {
  outputValidation: OutputValidation[];
  executionRequirements: ExecutionRequirement[];
  kpiThreshold?: number;
}

export interface OutputValidation {
  field: string;
  type: 'exists' | 'matches' | 'contains' | 'type_check';
  expected: unknown;
}

export interface ExecutionRequirement {
  type: 'api_called' | 'workflow_deployed' | 'response_received' | 'latency_under';
  target: string;
  value?: number;
}

export interface VerificationResult {
  passed: boolean;
  akuId: string;
  learnerId: string;
  timestamp: Date;

  // Detailed results
  outputValidations: { field: string; passed: boolean; actual: unknown }[];
  executionResults: { requirement: string; passed: boolean }[];

  // SBT metadata
  struggleScore: number;
  hintsUsed: number;
  timeToComplete: number; // seconds
  workflowSnapshot: string; // IPFS hash or encoded workflow
}

export interface SBTMetadata {
  name: string;
  description: string;
  image: string; // IPFS URI

  // Custom attributes
  attributes: {
    trait_type: string;
    value: string | number;
  }[];

  // Maestro-X specific
  maestro: {
    masteryPath: string;
    akusCompleted: string[];
    struggleScore: number;
    deploymentTimestamp: number;
    workflowHash: string;
    verificationSignature: string;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SANDBOX & REAL-TIME COMMUNICATION
// ═══════════════════════════════════════════════════════════════════════════

export interface SandboxState {
  learnerId: string;
  sessionId: string;
  workflow: WorkflowNode[];
  executionLog: ExecutionLogEntry[];
  status: 'idle' | 'building' | 'executing' | 'verifying' | 'complete';
}

export interface ExecutionLogEntry {
  timestamp: Date;
  nodeId: string;
  event: 'start' | 'success' | 'error' | 'skip';
  data?: unknown;
  error?: string;
}

export interface TutorMessage {
  id: string;
  role: 'tutor' | 'system';
  content: string;
  observation?: string; // What the tutor "sees" in the sandbox
  suggestedAction?: string;
  timestamp: Date;
}
