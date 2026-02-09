/**
 * NEXUS-PRIME Agent Orchestration System
 * Core type definitions for multi-agent architecture
 */

// ============================================================================
// AGENT CORE TYPES
// ============================================================================

export type AgentStatus = 'idle' | 'active' | 'processing' | 'waiting' | 'completed' | 'error' | 'terminated';

export type AgentRole =
  | 'orchestrator'    // Coordinates other agents
  | 'executor'        // Performs specific tasks
  | 'analyzer'        // Analyzes data/content
  | 'researcher'      // Gathers information
  | 'writer'          // Generates content
  | 'reviewer'        // Reviews/validates work
  | 'specialist';     // Domain-specific expert

export type AgentCapability =
  | 'web_search'
  | 'code_execution'
  | 'file_operations'
  | 'api_calls'
  | 'database_queries'
  | 'llm_inference'
  | 'image_analysis'
  | 'data_transformation'
  | 'email_operations'
  | 'scheduling'
  | 'memory_access'
  | 'tool_use';

export interface AgentIdentity {
  id: string;
  name: string;
  codename: string;          // e.g., "FORGE-X", "SENTINEL"
  version: string;
  role: AgentRole;
  tier: 'foundation' | 'specialist' | 'elite';
}

export interface AgentConfig {
  identity: AgentIdentity;
  capabilities: AgentCapability[];
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  model: 'gpt-4o' | 'gpt-4o-mini' | 'claude-3-5-sonnet' | 'claude-3-opus';
  tools: AgentTool[];
  memoryEnabled: boolean;
  maxConcurrentTasks: number;
  timeout: number;           // milliseconds
  retryPolicy: RetryPolicy;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
  backoffMultiplier: number;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  handler: string;           // Reference to handler function
}

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  enum?: string[];
  default?: unknown;
}

// ============================================================================
// AGENT STATE & CONTEXT
// ============================================================================

export interface AgentState {
  agentId: string;
  status: AgentStatus;
  currentTask: AgentTask | null;
  taskHistory: TaskResult[];
  memory: AgentMemory;
  metrics: AgentMetrics;
  lastActiveAt: Date;
  createdAt: Date;
}

export interface AgentMemory {
  shortTerm: MemoryItem[];      // Current session context
  longTerm: MemoryItem[];       // Persistent knowledge
  workingMemory: Record<string, unknown>; // Task-specific data
}

export interface MemoryItem {
  id: string;
  type: 'fact' | 'observation' | 'decision' | 'result' | 'error';
  content: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
  ttl?: number;                 // Time-to-live in seconds
}

export interface AgentMetrics {
  tasksCompleted: number;
  tasksSucceeded: number;
  tasksFailed: number;
  averageLatencyMs: number;
  tokensUsed: number;
  costUsd: number;
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export type TaskPriority = 'critical' | 'high' | 'normal' | 'low' | 'background';
export type TaskStatus = 'pending' | 'queued' | 'assigned' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export interface AgentTask {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  input: TaskInput;
  expectedOutput: OutputSchema;
  constraints: TaskConstraints;
  assignedAgent?: string;
  parentTaskId?: string;       // For subtask tracking
  subtasks?: AgentTask[];
  dependencies: string[];      // Task IDs that must complete first
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  deadline?: Date;
}

export type TaskType =
  | 'research'
  | 'analysis'
  | 'generation'
  | 'review'
  | 'transformation'
  | 'decision'
  | 'orchestration'
  | 'integration'
  | 'notification';

export interface TaskInput {
  data: unknown;
  context: Record<string, unknown>;
  instructions: string;
  examples?: Example[];
}

export interface Example {
  input: unknown;
  output: unknown;
  explanation?: string;
}

export interface OutputSchema {
  type: 'text' | 'json' | 'code' | 'file' | 'action';
  schema?: Record<string, unknown>;  // JSON Schema if type is 'json'
  format?: string;
  validation?: ValidationRule[];
}

export interface ValidationRule {
  field: string;
  rule: 'required' | 'type' | 'pattern' | 'range' | 'custom';
  value: unknown;
  message: string;
}

export interface TaskConstraints {
  maxDuration?: number;        // milliseconds
  maxTokens?: number;
  maxCost?: number;           // USD
  requiredCapabilities?: AgentCapability[];
  mustUseAgents?: string[];   // Specific agent IDs
  excludeAgents?: string[];
  qualityThreshold?: number;  // 0-1
}

export interface TaskResult {
  taskId: string;
  agentId: string;
  status: 'success' | 'partial' | 'failed';
  output: unknown;
  confidence: number;         // 0-1
  reasoning?: string;
  metrics: {
    durationMs: number;
    tokensUsed: number;
    costUsd: number;
    retries: number;
  };
  artifacts?: Artifact[];
  errors?: TaskError[];
  createdAt: Date;
}

export interface Artifact {
  id: string;
  type: 'file' | 'code' | 'data' | 'report' | 'image';
  name: string;
  content: string | Buffer;
  mimeType: string;
  metadata: Record<string, unknown>;
}

export interface TaskError {
  code: string;
  message: string;
  severity: 'warning' | 'error' | 'critical';
  recoverable: boolean;
  timestamp: Date;
}

// ============================================================================
// INTER-AGENT COMMUNICATION
// ============================================================================

export type MessageType =
  | 'task_assignment'
  | 'task_update'
  | 'task_completion'
  | 'request'
  | 'response'
  | 'broadcast'
  | 'handoff'
  | 'escalation'
  | 'heartbeat'
  | 'error';

export interface AgentMessage {
  id: string;
  type: MessageType;
  from: string;               // Agent ID
  to: string | string[];      // Agent ID(s) or 'broadcast'
  subject: string;
  payload: unknown;
  metadata: MessageMetadata;
  timestamp: Date;
  expiresAt?: Date;
  requiresResponse: boolean;
  responseDeadline?: Date;
}

export interface MessageMetadata {
  correlationId: string;      // For tracking message chains
  sessionId: string;
  priority: TaskPriority;
  encrypted: boolean;
  retryCount: number;
}

export interface Conversation {
  id: string;
  participants: string[];
  messages: AgentMessage[];
  context: Record<string, unknown>;
  startedAt: Date;
  lastMessageAt: Date;
  status: 'active' | 'concluded' | 'abandoned';
}

// ============================================================================
// AGENT TEAMS & ORCHESTRATION
// ============================================================================

export type TeamPattern =
  | 'orchestrator'     // Central coordinator managing workers
  | 'pipeline'         // Sequential processing chain
  | 'swarm'            // Parallel processing with aggregation
  | 'hierarchical'     // Multi-level delegation
  | 'collaborative';   // Peer-to-peer collaboration

export interface AgentTeam {
  id: string;
  name: string;
  codename: string;
  pattern: TeamPattern;
  description: string;
  lead: string;               // Orchestrator agent ID
  members: TeamMember[];
  capabilities: AgentCapability[];
  workflows: Workflow[];
  config: TeamConfig;
  metrics: TeamMetrics;
  createdAt: Date;
}

export interface TeamMember {
  agentId: string;
  role: AgentRole;
  responsibilities: string[];
  canDelegate: boolean;
  maxWorkload: number;        // Max concurrent tasks
}

export interface TeamConfig {
  maxConcurrentWorkflows: number;
  defaultTimeout: number;
  escalationPolicy: EscalationPolicy;
  loadBalancing: 'round_robin' | 'least_loaded' | 'capability_match' | 'priority';
  communicationProtocol: 'sync' | 'async' | 'hybrid';
}

export interface EscalationPolicy {
  timeoutMs: number;
  escalateTo: string;         // Agent or team ID
  maxEscalations: number;
  notifyOnEscalation: string[];
}

export interface TeamMetrics {
  workflowsCompleted: number;
  workflowsSucceeded: number;
  workflowsFailed: number;
  averageLatencyMs: number;
  totalTokensUsed: number;
  totalCostUsd: number;
  memberUtilization: Record<string, number>; // agentId -> utilization %
}

// ============================================================================
// WORKFLOW DEFINITIONS
// ============================================================================

export interface Workflow {
  id: string;
  name: string;
  description: string;
  version: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  errorHandling: ErrorHandlingConfig;
  timeout: number;
  retryPolicy: RetryPolicy;
  metadata: Record<string, unknown>;
}

export interface WorkflowTrigger {
  type: 'manual' | 'webhook' | 'schedule' | 'event' | 'condition';
  config: Record<string, unknown>;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'task' | 'decision' | 'parallel' | 'loop' | 'wait' | 'human_review';
  agentId?: string;
  teamId?: string;
  config: StepConfig;
  inputs: StepInput[];
  outputs: StepOutput[];
  conditions?: StepCondition[];
  onSuccess: string[];        // Next step IDs
  onFailure: string[];        // Failure handling step IDs
  timeout?: number;
}

export interface StepConfig {
  task?: AgentTask;
  parallelSteps?: string[];
  loopCondition?: string;
  waitDuration?: number;
  reviewInstructions?: string;
}

export interface StepInput {
  name: string;
  source: 'workflow_input' | 'previous_step' | 'constant' | 'variable';
  sourceRef: string;
  transform?: string;         // JSONPath or transform expression
}

export interface StepOutput {
  name: string;
  path: string;               // JSONPath to extract from result
  storeAs: string;            // Variable name for workflow context
}

export interface StepCondition {
  expression: string;         // Condition expression
  targetStep: string;
}

export interface ErrorHandlingConfig {
  onError: 'fail' | 'retry' | 'skip' | 'fallback';
  fallbackStep?: string;
  maxRetries: number;
  notifyOnError: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

// ============================================================================
// SKILL DEFINITIONS
// ============================================================================

export interface Skill {
  id: string;
  name: string;
  codename: string;
  description: string;
  version: string;
  category: SkillCategory;
  capabilities: AgentCapability[];
  requiredTools: string[];
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  examples: Example[];
  pricing?: SkillPricing;
  metrics: SkillMetrics;
  createdBy: string;
  isPublic: boolean;
  tags: string[];
}

export type SkillCategory =
  | 'research'
  | 'writing'
  | 'coding'
  | 'analysis'
  | 'automation'
  | 'communication'
  | 'data_processing'
  | 'integration'
  | 'creative';

export interface SkillPricing {
  type: 'free' | 'per_use' | 'subscription';
  pricePerUse?: number;       // USD
  subscriptionPriceMonthly?: number;
  revenueShare?: number;      // Percentage to skill creator
}

export interface SkillMetrics {
  totalUses: number;
  successRate: number;
  averageLatencyMs: number;
  averageRating: number;
  reviewCount: number;
}

// ============================================================================
// EXECUTION CONTEXT
// ============================================================================

export interface ExecutionContext {
  sessionId: string;
  userId?: string;
  teamId?: string;
  workflowId?: string;
  variables: Record<string, unknown>;
  secrets: Record<string, string>;
  environment: 'development' | 'staging' | 'production';
  traceId: string;
  parentSpanId?: string;
  startTime: Date;
  timeout: number;
}

export interface ExecutionResult {
  success: boolean;
  output: unknown;
  logs: LogEntry[];
  metrics: ExecutionMetrics;
  artifacts: Artifact[];
  errors: TaskError[];
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: Record<string, unknown>;
  agentId?: string;
  timestamp: Date;
}

export interface ExecutionMetrics {
  totalDurationMs: number;
  agentDurationMs: Record<string, number>;
  tokensUsed: number;
  costUsd: number;
  stepsCompleted: number;
  stepsTotal: number;
}
