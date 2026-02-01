/**
 * PHAZUR TYPE DEFINITIONS
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
  type: 'trigger' | 'action' | 'condition' | 'logic' | 'output';
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

  // Phazur specific
  phazur: {
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
  finalOutput?: unknown;
}

export interface ExecutionLogEntry {
  timestamp: Date;
  nodeId: string;
  event: 'start' | 'success' | 'error' | 'skip';
  message?: string;
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

// ═══════════════════════════════════════════════════════════════════════════
// HYBRID SUPPORT SYSTEM
// AI handles routine, escalates complex to human advisors within 2 hours
// ═══════════════════════════════════════════════════════════════════════════

export type SupportTicketStatus = 'pending' | 'ai_handling' | 'escalated' | 'human_assigned' | 'resolved';
export type SupportPriority = 'low' | 'medium' | 'high' | 'critical';

export interface SupportTicket {
  id: string;
  learnerId: string;
  subject: string;
  description: string;
  category: 'technical' | 'content' | 'billing' | 'career' | 'other';
  status: SupportTicketStatus;
  priority: SupportPriority;
  aiAttempts: number;
  escalatedAt?: Date;
  humanAdvisorId?: string;
  estimatedResponseTime?: Date; // Within 2 hours for escalated
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportEscalationTrigger {
  type: 'repeated_question' | 'sentiment_negative' | 'complexity_high' | 'explicit_request' | 'stuck_too_long';
  threshold: number;
  description: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// BEGINNER FOUNDATION MODE
// Explains 'why' behind every concept, not just steps
// ═══════════════════════════════════════════════════════════════════════════

export type LearningMode = 'foundation' | 'standard' | 'advanced';

export interface FoundationContent {
  akuId: string;
  whyItMatters: string; // Real-world relevance
  conceptOrigin: string; // Where this concept comes from
  commonMisconceptions: string[];
  realWorldExample: string;
  prerequisiteKnowledge: string[];
  businessImpact: string; // How this affects your career/business
}

export interface AKUWithFoundation extends AtomicKnowledgeUnit {
  foundation?: FoundationContent;
}

// ═══════════════════════════════════════════════════════════════════════════
// OFFICIAL CERTIFICATE HIERARCHY
// Soulbound Tokens (SBTs) on Polygon blockchain
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Main Path Certificates - Earned upon Capstone completion
 */
export type CertificatePath = 'student' | 'employee' | 'owner';

export interface OfficialCertificate {
  path: CertificatePath;
  name: string;
  designation: string;
  focus: string;
  outcome: string;
}

export const OFFICIAL_CERTIFICATES: Record<CertificatePath, OfficialCertificate> = {
  student: {
    path: 'student',
    name: 'Certified AI Associate',
    designation: 'Proof of Readiness',
    focus: 'Core AI literacy, terminal command proficiency, and front-end implementation using Claude Code.',
    outcome: 'Verifies to employers that you can work as a junior developer or AI-enabled marketer.',
  },
  employee: {
    path: 'employee',
    name: 'Workflow Efficiency Lead',
    designation: 'Proof of ROI',
    focus: 'Automation of manual 9-to-5 tasks, custom GPT integration for internal documentation, and API-driven data processing.',
    outcome: 'Verifies that you can demonstrably save a company 10+ hours per week through automation.',
  },
  owner: {
    path: 'owner',
    name: 'AI Operations Master',
    designation: 'Proof of Scalability',
    focus: 'End-to-end business automation, deployment of autonomous agent chains for sales and marketing, and AI-driven organizational strategy.',
    outcome: 'Verifies your ability to replace high-cost manual labor with automated AI systems.',
  },
};

/**
 * Micro-Credentials (Skill Badges) - Earned for mastering specific tools
 */
export type MicroCredentialId = 'claude_code_commander' | 'api_integrator_pro' | 'agentic_orchestrator';

export interface MicroCredential {
  id: MicroCredentialId;
  name: string;
  description: string;
  requirements: string[];
  iconEmoji: string;
}

export const MICRO_CREDENTIALS: Record<MicroCredentialId, MicroCredential> = {
  claude_code_commander: {
    id: 'claude_code_commander',
    name: 'Claude Code Commander',
    description: 'Deep terminal-based refactoring mastery',
    requirements: [
      'Complete 5 terminal-based refactoring challenges',
      'Demonstrate proficiency in Claude Code CLI',
      'Build a complete project using terminal workflows',
    ],
    iconEmoji: '⌨️',
  },
  api_integrator_pro: {
    id: 'api_integrator_pro',
    name: 'API Integrator Pro',
    description: 'Building custom plugins for Gemini or OpenAI',
    requirements: [
      'Build 3 custom API integrations',
      'Create a working plugin for an AI platform',
      'Demonstrate error handling and rate limiting',
    ],
    iconEmoji: '🔌',
  },
  agentic_orchestrator: {
    id: 'agentic_orchestrator',
    name: 'Agentic Orchestrator',
    description: 'Managing multi-agent systems that communicate',
    requirements: [
      'Deploy a multi-agent workflow',
      'Demonstrate agent-to-agent communication',
      'Build an autonomous task delegation system',
    ],
    iconEmoji: '🤖',
  },
};

export type CertificationLevel = 'associate' | 'professional' | 'expert';

export interface BlockchainCertificate {
  tokenId: string;
  contractAddress: string;
  chain: 'polygon' | 'ethereum' | 'base';
  holderAddress: string;

  // Certificate details
  certificationName: string;
  level: CertificationLevel;
  issueDate: Date;
  expiryDate?: Date; // Some certs may expire

  // Competency breakdown
  competencies: {
    name: string;
    level: number; // 1-5
    verifiedAt: Date;
  }[];

  // Anti-gaming metrics
  struggleScore: number;
  totalLearningTime: number; // hours
  akusCompleted: number;

  // Verification
  ipfsMetadataHash: string;
  transactionHash: string;
  phazurSignature: string;

  // Employer verification
  verificationUrl: string;
  qrCode: string;
}

export interface EmployerVerificationResult {
  valid: boolean;
  certificate?: BlockchainCertificate;
  verifiedAt: Date;
  verificationMethod: 'on_chain' | 'api' | 'qr_code';
  warning?: string; // e.g., "Certificate expired"
}

// ═══════════════════════════════════════════════════════════════════════════
// ADAPTIVE PACING ENGINE
// Adjusts workload for students working 40+ hrs/week
// ═══════════════════════════════════════════════════════════════════════════

export type WorkSchedule = 'full_time_student' | 'part_time_worker' | 'full_time_worker' | 'overtime_worker';

export interface LearnerSchedule {
  learnerId: string;
  workHoursPerWeek: number;
  preferredLearningDays: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
  preferredLearningTimes: { start: string; end: string }[]; // e.g., "19:00" - "21:00"
  timezone: string;
  workSchedule: WorkSchedule;

  // Adaptive settings
  maxDailyLearningMinutes: number;
  breakReminders: boolean;
  weekendIntensive: boolean; // Allow longer sessions on weekends
}

export interface PacingRecommendation {
  learnerId: string;
  suggestedDailyMinutes: number;
  suggestedAKUsPerWeek: number;
  estimatedCompletionDate: Date;
  burnoutRisk: 'low' | 'medium' | 'high';
  recommendations: string[];

  // Weekly plan
  weeklyPlan: {
    day: string;
    akuIds: string[];
    estimatedMinutes: number;
  }[];
}

// ═══════════════════════════════════════════════════════════════════════════
// WEEKLY HUMAN MENTOR CHECK-INS
// Scheduled 1:1 calls to prevent dropout
// ═══════════════════════════════════════════════════════════════════════════

export type MentorSpecialty = 'career' | 'technical' | 'business' | 'general';
export type CheckInStatus = 'scheduled' | 'completed' | 'missed' | 'rescheduled' | 'cancelled';

export interface Mentor {
  id: string;
  name: string;
  title: string;
  specialty: MentorSpecialty[];
  bio: string;
  avatarUrl: string;
  calendlyUrl: string;
  maxWeeklySlots: number;
  timezone: string;
  languages: string[];
}

export interface MentorCheckIn {
  id: string;
  learnerId: string;
  mentorId: string;
  scheduledAt: Date;
  duration: number; // minutes, typically 15-30
  status: CheckInStatus;

  // Pre-call info
  learnerGoals: string[];
  currentChallenges: string[];
  progressSinceLastCall: {
    akusCompleted: number;
    struggleAreas: string[];
    wins: string[];
  };

  // Post-call
  notes?: string;
  actionItems?: string[];
  nextCheckInSuggested?: Date;
  dropoutRisk?: 'low' | 'medium' | 'high';
}

export interface MentorMatchCriteria {
  learnerTier: BusinessTier;
  learnerGoals: string[];
  preferredLanguage: string;
  timezone: string;
  specialtyNeeded?: MentorSpecialty;
}

// ═══════════════════════════════════════════════════════════════════════════
// PROGRESS TRANSPARENCY DASHBOARD
// Track your learning journey in real-time
// ═══════════════════════════════════════════════════════════════════════════

export interface ProgressDashboard {
  learnerId: string;

  // Overview
  totalLearningTime: number; // hours
  currentStreak: number; // days
  longestStreak: number;

  // Completion stats
  akusCompleted: number;
  akusTotal: number;
  competenciesEarned: number;
  certificatesEarned: number;

  // Performance
  averageStruggleScore: number;
  hintsUsedTotal: number;
  verificationAttempts: number;
  firstTrySuccessRate: number; // percentage

  // Time analysis
  averageTimePerAKU: number; // minutes
  fastestAKU: { id: string; title: string; time: number };
  slowestAKU: { id: string; title: string; time: number };

  // Weekly activity
  weeklyActivity: {
    date: string;
    minutesLearned: number;
    akusCompleted: number;
  }[];

  // Competency radar
  competencyLevels: {
    category: AKUCategory;
    currentLevel: number; // 1-5
    targetLevel: number;
  }[];

  // Milestones
  milestones: {
    name: string;
    description: string;
    achievedAt?: Date;
    progress: number; // 0-100
  }[];

  // Predictions
  estimatedCertificationDate?: Date;
  predictedFinalStruggleScore?: number;
}
