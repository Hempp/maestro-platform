/**
 * NEXUS-PRIME Orchestrator
 * Central coordinating agent that manages task distribution and agent communication
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import {
  AgentConfig,
  AgentTask,
  TaskResult,
  AgentMessage,
  AgentTeam,
  ExecutionContext,
  ExecutionResult,
  Workflow,
  WorkflowStep,
  TaskPriority,
  TaskStatus,
  AgentCapability,
  LogEntry,
  TaskError,
} from './types';
import { agentRegistry, FOUNDATION_AGENTS } from './registry';

// ============================================================================
// ORCHESTRATOR STATE
// ============================================================================

interface OrchestratorState {
  activeWorkflows: Map<string, WorkflowExecution>;
  taskQueue: AgentTask[];
  messageQueue: AgentMessage[];
  agentStates: Map<string, AgentExecutionState>;
  metrics: OrchestratorMetrics;
}

interface WorkflowExecution {
  workflowId: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  currentStep: string;
  context: ExecutionContext;
  results: Map<string, TaskResult>;
  startedAt: Date;
  completedAt?: Date;
}

interface AgentExecutionState {
  agentId: string;
  status: 'idle' | 'busy' | 'error';
  currentTask: string | null;
  taskCount: number;
  lastActiveAt: Date;
}

interface OrchestratorMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageLatencyMs: number;
  tokensUsed: number;
  costUsd: number;
}

// ============================================================================
// ORCHESTRATOR CLASS
// ============================================================================

export class Orchestrator {
  private state: OrchestratorState;
  private anthropic: Anthropic | null = null;
  private openai: OpenAI | null = null;
  private logs: LogEntry[] = [];

  constructor() {
    this.state = {
      activeWorkflows: new Map(),
      taskQueue: [],
      messageQueue: [],
      agentStates: new Map(),
      metrics: {
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        averageLatencyMs: 0,
        tokensUsed: 0,
        costUsd: 0,
      },
    };

    // Initialize AI clients if keys available
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  // ============================================================================
  // TASK EXECUTION
  // ============================================================================

  async executeTask(task: AgentTask, context: ExecutionContext): Promise<TaskResult> {
    const startTime = Date.now();
    this.log('info', `Starting task: ${task.name}`, { taskId: task.id });

    try {
      // Find best agent for this task
      const agent = this.selectAgentForTask(task);
      if (!agent) {
        throw new Error(`No suitable agent found for task: ${task.name}`);
      }

      this.log('info', `Assigned task to agent: ${agent.identity.codename}`, {
        taskId: task.id,
        agentId: agent.identity.id,
      });

      // Update agent state
      this.updateAgentState(agent.identity.id, 'busy', task.id);

      // Execute with the selected agent
      const result = await this.runAgentTask(agent, task, context);

      // Update metrics
      const duration = Date.now() - startTime;
      this.updateMetrics(result, duration);

      // Update agent state
      this.updateAgentState(agent.identity.id, 'idle', null);

      this.log('info', `Task completed: ${task.name}`, {
        taskId: task.id,
        status: result.status,
        durationMs: duration,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log('error', `Task failed: ${task.name}`, {
        taskId: task.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        taskId: task.id,
        agentId: 'orchestrator',
        status: 'failed',
        output: null,
        confidence: 0,
        reasoning: error instanceof Error ? error.message : 'Unknown error',
        metrics: {
          durationMs: duration,
          tokensUsed: 0,
          costUsd: 0,
          retries: 0,
        },
        errors: [
          {
            code: 'EXECUTION_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
            severity: 'error',
            recoverable: false,
            timestamp: new Date(),
          },
        ],
        createdAt: new Date(),
      };
    }
  }

  private async runAgentTask(
    agent: AgentConfig,
    task: AgentTask,
    context: ExecutionContext
  ): Promise<TaskResult> {
    const startTime = Date.now();

    // Build the prompt for the agent
    const prompt = this.buildAgentPrompt(agent, task, context);

    // Execute based on model type
    let output: string;
    let tokensUsed = 0;

    if (agent.model.startsWith('claude')) {
      if (!this.anthropic) {
        throw new Error('Anthropic client not initialized');
      }

      const response = await this.anthropic.messages.create({
        model: agent.model === 'claude-3-5-sonnet' ? 'claude-sonnet-4-20250514' : 'claude-opus-4-20250514',
        max_tokens: agent.maxTokens,
        temperature: agent.temperature,
        system: agent.systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      });

      output = response.content[0].type === 'text' ? response.content[0].text : '';
      tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
    } else {
      if (!this.openai) {
        throw new Error('OpenAI client not initialized');
      }

      const response = await this.openai.chat.completions.create({
        model: agent.model === 'gpt-4o' ? 'gpt-4o' : 'gpt-4o-mini',
        max_tokens: agent.maxTokens,
        temperature: agent.temperature,
        messages: [
          { role: 'system', content: agent.systemPrompt },
          { role: 'user', content: prompt },
        ],
      });

      output = response.choices[0].message.content || '';
      tokensUsed = response.usage?.total_tokens || 0;
    }

    // Calculate cost (approximate)
    const costPerToken = agent.model.startsWith('claude') ? 0.000003 : 0.00001;
    const costUsd = tokensUsed * costPerToken;

    const duration = Date.now() - startTime;

    return {
      taskId: task.id,
      agentId: agent.identity.id,
      status: 'success',
      output: this.parseAgentOutput(output, task.expectedOutput.type),
      confidence: 0.9,
      reasoning: `Task completed by ${agent.identity.codename}`,
      metrics: {
        durationMs: duration,
        tokensUsed,
        costUsd,
        retries: 0,
      },
      createdAt: new Date(),
    };
  }

  private buildAgentPrompt(
    agent: AgentConfig,
    task: AgentTask,
    context: ExecutionContext
  ): string {
    return `# Task: ${task.name}

## Description
${task.description}

## Instructions
${task.input.instructions}

## Context
${JSON.stringify(task.input.context, null, 2)}

## Input Data
${JSON.stringify(task.input.data, null, 2)}

## Expected Output Format
Type: ${task.expectedOutput.type}
${task.expectedOutput.schema ? `Schema: ${JSON.stringify(task.expectedOutput.schema, null, 2)}` : ''}

## Constraints
- Max tokens: ${task.constraints.maxTokens || 'unlimited'}
- Quality threshold: ${task.constraints.qualityThreshold || 0.8}

Please complete this task and provide your output in the specified format.`;
  }

  private parseAgentOutput(output: string, type: string): unknown {
    if (type === 'json') {
      try {
        // Extract JSON from output (handle markdown code blocks)
        const jsonMatch = output.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, output];
        return JSON.parse(jsonMatch[1] || output);
      } catch {
        return { raw: output };
      }
    }
    return output;
  }

  // ============================================================================
  // AGENT SELECTION
  // ============================================================================

  private selectAgentForTask(task: AgentTask): AgentConfig | undefined {
    const requiredCapabilities = task.constraints.requiredCapabilities || [];

    // Check if specific agents are required
    if (task.constraints.mustUseAgents?.length) {
      const agent = agentRegistry.getAgent(task.constraints.mustUseAgents[0]);
      if (agent) return agent;
    }

    // Find agent by capability match
    return agentRegistry.findAgentForTask(
      requiredCapabilities,
      this.inferRoleFromTaskType(task.type)
    );
  }

  private inferRoleFromTaskType(type: string): 'orchestrator' | 'executor' | 'analyzer' | 'researcher' | 'writer' | 'reviewer' | 'specialist' {
    const roleMap: Record<string, 'orchestrator' | 'executor' | 'analyzer' | 'researcher' | 'writer' | 'reviewer' | 'specialist'> = {
      research: 'researcher',
      analysis: 'analyzer',
      generation: 'executor',
      review: 'reviewer',
      transformation: 'executor',
      decision: 'analyzer',
      orchestration: 'orchestrator',
      integration: 'specialist',
      notification: 'executor',
    };
    return roleMap[type] || 'executor';
  }

  // ============================================================================
  // TEAM ORCHESTRATION
  // ============================================================================

  async executeWithTeam(
    teamId: string,
    tasks: AgentTask[],
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const team = agentRegistry.getTeam(teamId);
    if (!team) {
      throw new Error(`Team not found: ${teamId}`);
    }

    this.log('info', `Starting team execution: ${team.codename}`, {
      teamId,
      taskCount: tasks.length,
    });

    const results: TaskResult[] = [];
    const errors: TaskError[] = [];
    const startTime = Date.now();

    switch (team.pattern) {
      case 'orchestrator':
        // Central coordinator manages all tasks
        for (const task of tasks) {
          const result = await this.executeTask(task, context);
          results.push(result);
          if (result.status === 'failed') {
            errors.push(...(result.errors || []));
          }
        }
        break;

      case 'pipeline':
        // Sequential processing - output of one becomes input of next
        let previousOutput: unknown = null;
        for (const task of tasks) {
          if (previousOutput) {
            task.input.data = previousOutput;
          }
          const result = await this.executeTask(task, context);
          results.push(result);
          if (result.status === 'failed') {
            errors.push(...(result.errors || []));
            break; // Stop pipeline on failure
          }
          previousOutput = result.output;
        }
        break;

      case 'swarm':
        // Parallel processing
        const parallelResults = await Promise.all(
          tasks.map(task => this.executeTask(task, context))
        );
        results.push(...parallelResults);
        parallelResults.forEach(r => {
          if (r.status === 'failed') {
            errors.push(...(r.errors || []));
          }
        });
        break;

      case 'collaborative':
        // All agents work together on each task
        for (const task of tasks) {
          // Get input from multiple agents and synthesize
          const memberResults = await Promise.all(
            team.members.map(async member => {
              const memberTask = { ...task, id: `${task.id}-${member.agentId}` };
              return this.executeTask(memberTask, context);
            })
          );

          // Synthesize results
          const synthesizedResult = await this.synthesizeResults(memberResults, task, context);
          results.push(synthesizedResult);
        }
        break;

      default:
        // Default to orchestrator pattern
        for (const task of tasks) {
          const result = await this.executeTask(task, context);
          results.push(result);
        }
    }

    const duration = Date.now() - startTime;
    const success = errors.length === 0;

    return {
      success,
      output: results,
      logs: this.logs,
      metrics: {
        totalDurationMs: duration,
        agentDurationMs: {},
        tokensUsed: results.reduce((sum, r) => sum + r.metrics.tokensUsed, 0),
        costUsd: results.reduce((sum, r) => sum + r.metrics.costUsd, 0),
        stepsCompleted: results.filter(r => r.status === 'success').length,
        stepsTotal: tasks.length,
      },
      artifacts: [],
      errors,
    };
  }

  private async synthesizeResults(
    results: TaskResult[],
    originalTask: AgentTask,
    context: ExecutionContext
  ): Promise<TaskResult> {
    // Use the orchestrator agent to synthesize
    const synthesisTask: AgentTask = {
      id: `synthesis-${originalTask.id}`,
      name: 'Synthesize Results',
      description: 'Combine and synthesize multiple agent outputs into a unified result',
      type: 'analysis',
      priority: originalTask.priority,
      status: 'pending',
      input: {
        data: results.map(r => r.output),
        context: originalTask.input.context,
        instructions: `You have received outputs from ${results.length} agents working on the same task.

Original task: ${originalTask.name}
${originalTask.description}

Please synthesize these outputs into a single, comprehensive response that:
1. Combines the best insights from each agent
2. Resolves any contradictions
3. Provides a unified, coherent answer`,
      },
      expectedOutput: originalTask.expectedOutput,
      constraints: originalTask.constraints,
      dependencies: [],
      createdAt: new Date(),
    };

    return this.executeTask(synthesisTask, context);
  }

  // ============================================================================
  // WORKFLOW EXECUTION
  // ============================================================================

  async executeWorkflow(
    workflow: Workflow,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const workflowId = workflow.id;
    this.log('info', `Starting workflow: ${workflow.name}`, { workflowId });

    const execution: WorkflowExecution = {
      workflowId,
      status: 'running',
      currentStep: workflow.steps[0]?.id || '',
      context,
      results: new Map(),
      startedAt: new Date(),
    };

    this.state.activeWorkflows.set(workflowId, execution);

    const errors: TaskError[] = [];
    const startTime = Date.now();

    try {
      // Execute steps in order, respecting dependencies
      const completedSteps = new Set<string>();
      const pendingSteps = [...workflow.steps];

      while (pendingSteps.length > 0) {
        // Find steps that can be executed (all dependencies met)
        const readySteps = pendingSteps.filter(step => {
          const stepInputs = step.inputs || [];
          return stepInputs.every(input => {
            if (input.source === 'previous_step') {
              return completedSteps.has(input.sourceRef);
            }
            return true;
          });
        });

        if (readySteps.length === 0 && pendingSteps.length > 0) {
          throw new Error('Workflow deadlock: no steps can be executed');
        }

        // Execute ready steps (parallel if swarm pattern)
        for (const step of readySteps) {
          execution.currentStep = step.id;
          const result = await this.executeWorkflowStep(step, context, execution);
          execution.results.set(step.id, result);

          if (result.status === 'failed') {
            errors.push(...(result.errors || []));
            if (workflow.errorHandling.onError === 'fail') {
              throw new Error(`Step failed: ${step.name}`);
            }
          }

          completedSteps.add(step.id);
          const idx = pendingSteps.findIndex(s => s.id === step.id);
          pendingSteps.splice(idx, 1);
        }
      }

      execution.status = errors.length > 0 ? 'failed' : 'completed';
      execution.completedAt = new Date();

    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date();
      errors.push({
        code: 'WORKFLOW_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        severity: 'critical',
        recoverable: false,
        timestamp: new Date(),
      });
    }

    const duration = Date.now() - startTime;
    const results = Array.from(execution.results.values());

    return {
      success: execution.status === 'completed',
      output: results,
      logs: this.logs,
      metrics: {
        totalDurationMs: duration,
        agentDurationMs: {},
        tokensUsed: results.reduce((sum, r) => sum + r.metrics.tokensUsed, 0),
        costUsd: results.reduce((sum, r) => sum + r.metrics.costUsd, 0),
        stepsCompleted: results.filter(r => r.status === 'success').length,
        stepsTotal: workflow.steps.length,
      },
      artifacts: [],
      errors,
    };
  }

  private async executeWorkflowStep(
    step: WorkflowStep,
    context: ExecutionContext,
    execution: WorkflowExecution
  ): Promise<TaskResult> {
    this.log('info', `Executing workflow step: ${step.name}`, { stepId: step.id });

    // Build step context from previous results
    const stepContext = { ...context };
    for (const input of step.inputs) {
      if (input.source === 'previous_step') {
        const prevResult = execution.results.get(input.sourceRef);
        if (prevResult) {
          stepContext.variables[input.name] = prevResult.output;
        }
      }
    }

    if (step.config.task) {
      return this.executeTask(step.config.task, stepContext);
    }

    // Handle special step types
    if (step.type === 'decision') {
      return this.handleDecisionStep(step, stepContext);
    }

    if (step.type === 'parallel' && step.config.parallelSteps) {
      const parallelTasks = step.config.parallelSteps.map(stepId => {
        const subStep = execution.results.get(stepId);
        return subStep;
      });
      // Already executed in parallel
    }

    return {
      taskId: step.id,
      agentId: 'orchestrator',
      status: 'success',
      output: stepContext.variables,
      confidence: 1,
      metrics: { durationMs: 0, tokensUsed: 0, costUsd: 0, retries: 0 },
      createdAt: new Date(),
    };
  }

  private async handleDecisionStep(
    step: WorkflowStep,
    context: ExecutionContext
  ): Promise<TaskResult> {
    // Use orchestrator to make decision
    const decisionTask: AgentTask = {
      id: `decision-${step.id}`,
      name: 'Make Decision',
      description: step.config.task?.description || 'Make a routing decision',
      type: 'decision',
      priority: 'high',
      status: 'pending',
      input: {
        data: context.variables,
        context: {},
        instructions: 'Analyze the data and determine the best path forward.',
      },
      expectedOutput: { type: 'json' },
      constraints: {},
      dependencies: [],
      createdAt: new Date(),
    };

    return this.executeTask(decisionTask, context);
  }

  // ============================================================================
  // MESSAGING
  // ============================================================================

  sendMessage(message: AgentMessage): void {
    this.state.messageQueue.push(message);
    this.log('debug', `Message sent: ${message.type}`, {
      from: message.from,
      to: message.to,
      subject: message.subject,
    });
  }

  getMessages(agentId: string): AgentMessage[] {
    return this.state.messageQueue.filter(
      m => m.to === agentId || (Array.isArray(m.to) && m.to.includes(agentId)) || m.to === 'broadcast'
    );
  }

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  private updateAgentState(agentId: string, status: 'idle' | 'busy' | 'error', taskId: string | null): void {
    const state = this.state.agentStates.get(agentId) || {
      agentId,
      status: 'idle',
      currentTask: null,
      taskCount: 0,
      lastActiveAt: new Date(),
    };

    state.status = status;
    state.currentTask = taskId;
    state.lastActiveAt = new Date();
    if (taskId) state.taskCount++;

    this.state.agentStates.set(agentId, state);
  }

  private updateMetrics(result: TaskResult, duration: number): void {
    this.state.metrics.totalTasks++;
    if (result.status === 'success') {
      this.state.metrics.completedTasks++;
    } else {
      this.state.metrics.failedTasks++;
    }

    // Rolling average for latency
    const prevTotal = this.state.metrics.averageLatencyMs * (this.state.metrics.totalTasks - 1);
    this.state.metrics.averageLatencyMs = (prevTotal + duration) / this.state.metrics.totalTasks;

    this.state.metrics.tokensUsed += result.metrics.tokensUsed;
    this.state.metrics.costUsd += result.metrics.costUsd;
  }

  // ============================================================================
  // LOGGING
  // ============================================================================

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
    };
    this.logs.push(entry);

    // Also console log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${level.toUpperCase()}] ${message}`, data || '');
    }
  }

  // ============================================================================
  // PUBLIC GETTERS
  // ============================================================================

  getMetrics(): OrchestratorMetrics {
    return { ...this.state.metrics };
  }

  getAgentStates(): Map<string, AgentExecutionState> {
    return new Map(this.state.agentStates);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

// Singleton instance
export const orchestrator = new Orchestrator();

// ============================================================================
// QUICK EXECUTION HELPERS
// ============================================================================

export async function quickTask(
  taskName: string,
  instructions: string,
  data?: unknown,
  capabilities?: AgentCapability[]
): Promise<TaskResult> {
  const task: AgentTask = {
    id: uuidv4(),
    name: taskName,
    description: instructions,
    type: 'generation',
    priority: 'normal',
    status: 'pending',
    input: {
      data: data || {},
      context: {},
      instructions,
    },
    expectedOutput: { type: 'text' },
    constraints: {
      requiredCapabilities: capabilities || ['llm_inference'],
    },
    dependencies: [],
    createdAt: new Date(),
  };

  const context: ExecutionContext = {
    sessionId: uuidv4(),
    variables: {},
    secrets: {},
    environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
    traceId: uuidv4(),
    startTime: new Date(),
    timeout: 120000,
  };

  return orchestrator.executeTask(task, context);
}

export async function deployTeam(
  teamId: string,
  tasks: { name: string; instructions: string; data?: unknown }[]
): Promise<ExecutionResult> {
  const agentTasks: AgentTask[] = tasks.map((t, i) => ({
    id: uuidv4(),
    name: t.name,
    description: t.instructions,
    type: 'generation' as const,
    priority: 'normal' as const,
    status: 'pending' as const,
    input: {
      data: t.data || {},
      context: {},
      instructions: t.instructions,
    },
    expectedOutput: { type: 'text' as const },
    constraints: {},
    dependencies: [],
    createdAt: new Date(),
  }));

  const context: ExecutionContext = {
    sessionId: uuidv4(),
    variables: {},
    secrets: {},
    environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
    traceId: uuidv4(),
    startTime: new Date(),
    timeout: 300000,
  };

  return orchestrator.executeWithTeam(teamId, agentTasks, context);
}

// Helper to generate UUIDs without external dependency
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
