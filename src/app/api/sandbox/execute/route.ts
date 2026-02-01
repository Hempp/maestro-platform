/**
 * WORKFLOW EXECUTION ENGINE
 * Executes workflow nodes in sequence
 * Supports: OpenAI, HTTP Request, Display Output
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Lazy OpenAI initialization
let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'output' | 'logic';
  service: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  connections: string[];
}

interface ExecutionContext {
  variables: Record<string, unknown>;
  outputs: Record<string, unknown>;
  logs: ExecutionLog[];
}

interface ExecutionLog {
  nodeId: string;
  event: 'start' | 'success' | 'error' | 'skip';
  message: string;
  timestamp: string;
  data?: unknown;
}

interface ExecutionResult {
  success: boolean;
  outputs: Record<string, unknown>;
  logs: ExecutionLog[];
  finalOutput?: unknown;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// NODE EXECUTORS
// ═══════════════════════════════════════════════════════════════════════════

async function executeTrigger(
  node: WorkflowNode,
  ctx: ExecutionContext
): Promise<unknown> {
  if (node.service === 'manual') {
    const inputData = node.config.inputData || {
      triggered: true,
      timestamp: new Date().toISOString(),
      message: 'Workflow started'
    };
    ctx.logs.push({
      nodeId: node.id,
      event: 'success',
      message: 'Manual trigger activated',
      timestamp: new Date().toISOString(),
      data: inputData,
    });
    return inputData;
  }

  if (node.service === 'webhook') {
    const webhookData = node.config.testData || { webhook: true, payload: {} };
    ctx.logs.push({
      nodeId: node.id,
      event: 'success',
      message: 'Webhook trigger simulated',
      timestamp: new Date().toISOString(),
      data: webhookData,
    });
    return webhookData;
  }

  return { triggered: true };
}

async function executeOpenAI(
  node: WorkflowNode,
  ctx: ExecutionContext,
  input: unknown
): Promise<unknown> {
  const prompt = node.config.prompt as string || 'Say hello and introduce yourself briefly.';
  const model = node.config.model as string || 'gpt-4o-mini';
  const systemPrompt = node.config.systemPrompt as string || 'You are a helpful assistant.';

  // Replace {{input}} placeholder with actual input
  let processedPrompt = prompt;
  if (typeof input === 'object' && input !== null) {
    processedPrompt = processedPrompt.replace('{{input}}', JSON.stringify(input));
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      processedPrompt = processedPrompt.replace(`{{${key}}}`, String(value));
    }
  }

  ctx.logs.push({
    nodeId: node.id,
    event: 'start',
    message: `Calling OpenAI ${model}...`,
    timestamp: new Date().toISOString(),
  });

  try {
    const response = await getOpenAI().chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: processedPrompt },
      ],
      max_tokens: (node.config.maxTokens as number) || 500,
      temperature: (node.config.temperature as number) || 0.7,
    });

    const result = response.choices[0].message.content || '';

    ctx.logs.push({
      nodeId: node.id,
      event: 'success',
      message: 'OpenAI response received',
      timestamp: new Date().toISOString(),
      data: { preview: result.substring(0, 100) + (result.length > 100 ? '...' : '') },
    });

    return {
      response: result,
      model,
      tokens: response.usage?.total_tokens
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'OpenAI call failed';
    ctx.logs.push({
      nodeId: node.id,
      event: 'error',
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
    throw new Error(errorMessage);
  }
}

async function executeHTTPRequest(
  node: WorkflowNode,
  ctx: ExecutionContext,
  input: unknown
): Promise<unknown> {
  const url = node.config.url as string;
  const method = (node.config.method as string) || 'GET';
  const headers = (node.config.headers as Record<string, string>) || {};

  if (!url) {
    // Use a demo API if no URL configured
    const demoUrl = 'https://jsonplaceholder.typicode.com/posts/1';
    ctx.logs.push({
      nodeId: node.id,
      event: 'start',
      message: `No URL configured, using demo: GET ${demoUrl}`,
      timestamp: new Date().toISOString(),
    });

    const response = await fetch(demoUrl);
    const data = await response.json();

    ctx.logs.push({
      nodeId: node.id,
      event: 'success',
      message: `Demo HTTP ${response.status} received`,
      timestamp: new Date().toISOString(),
    });

    return { status: response.status, data };
  }

  ctx.logs.push({
    nodeId: node.id,
    event: 'start',
    message: `${method} ${url}`,
    timestamp: new Date().toISOString(),
  });

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
    };

    if (method !== 'GET' && input) {
      fetchOptions.body = JSON.stringify(input);
    }

    const response = await fetch(url, fetchOptions);
    const data = await response.json().catch(() => response.text());

    ctx.logs.push({
      nodeId: node.id,
      event: 'success',
      message: `HTTP ${response.status} received`,
      timestamp: new Date().toISOString(),
      data: { status: response.status },
    });

    return { status: response.status, data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'HTTP request failed';
    ctx.logs.push({
      nodeId: node.id,
      event: 'error',
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
    throw new Error(errorMessage);
  }
}

async function executeCodeBlock(
  node: WorkflowNode,
  ctx: ExecutionContext,
  input: unknown
): Promise<unknown> {
  // Safe code block - only supports predefined transformations
  const transform = node.config.transform as string || 'passthrough';

  ctx.logs.push({
    nodeId: node.id,
    event: 'start',
    message: `Applying transform: ${transform}`,
    timestamp: new Date().toISOString(),
  });

  let result: unknown = input;

  switch (transform) {
    case 'passthrough':
      result = input;
      break;
    case 'stringify':
      result = JSON.stringify(input, null, 2);
      break;
    case 'extract-response':
      if (typeof input === 'object' && input !== null) {
        result = (input as Record<string, unknown>).response || input;
      }
      break;
    case 'uppercase':
      if (typeof input === 'string') {
        result = input.toUpperCase();
      } else if (typeof input === 'object' && input !== null) {
        const obj = input as Record<string, unknown>;
        if (typeof obj.response === 'string') {
          result = { ...obj, response: obj.response.toUpperCase() };
        }
      }
      break;
    case 'lowercase':
      if (typeof input === 'string') {
        result = input.toLowerCase();
      }
      break;
    default:
      result = input;
  }

  ctx.logs.push({
    nodeId: node.id,
    event: 'success',
    message: 'Transform applied',
    timestamp: new Date().toISOString(),
  });

  return result;
}

async function executeIfElse(
  node: WorkflowNode,
  ctx: ExecutionContext,
  input: unknown
): Promise<{ result: unknown; branch: 'true' | 'false' }> {
  const condition = node.config.condition as string || 'hasResponse';

  ctx.logs.push({
    nodeId: node.id,
    event: 'start',
    message: `Evaluating condition: ${condition}`,
    timestamp: new Date().toISOString(),
  });

  let result = false;

  // Safe condition evaluation
  if (typeof input === 'object' && input !== null) {
    const obj = input as Record<string, unknown>;
    switch (condition) {
      case 'hasResponse':
        result = Boolean(obj.response);
        break;
      case 'hasData':
        result = Boolean(obj.data);
        break;
      case 'isSuccess':
        result = obj.status === 200 || obj.success === true;
        break;
      case 'true':
        result = true;
        break;
      case 'false':
        result = false;
        break;
      default:
        result = Boolean(obj[condition]);
    }
  }

  ctx.logs.push({
    nodeId: node.id,
    event: 'success',
    message: `Condition evaluated to: ${result}`,
    timestamp: new Date().toISOString(),
  });

  return { result: input, branch: result ? 'true' : 'false' };
}

async function executeOutput(
  node: WorkflowNode,
  ctx: ExecutionContext,
  input: unknown
): Promise<unknown> {
  ctx.logs.push({
    nodeId: node.id,
    event: 'success',
    message: 'Output captured',
    timestamp: new Date().toISOString(),
    data: input,
  });

  // Extract response text if available
  if (typeof input === 'object' && input !== null) {
    const obj = input as Record<string, unknown>;
    if (obj.response) {
      return obj.response;
    }
    if (obj.data) {
      return obj.data;
    }
  }

  return input;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXECUTOR
// ═══════════════════════════════════════════════════════════════════════════

async function executeNode(
  node: WorkflowNode,
  ctx: ExecutionContext,
  input: unknown
): Promise<unknown> {
  switch (node.type) {
    case 'trigger':
      return executeTrigger(node, ctx);

    case 'action':
      switch (node.service) {
        case 'openai':
          return executeOpenAI(node, ctx, input);
        case 'http':
          return executeHTTPRequest(node, ctx, input);
        case 'code':
          return executeCodeBlock(node, ctx, input);
        default:
          ctx.logs.push({
            nodeId: node.id,
            event: 'success',
            message: `Action ${node.service} simulated`,
            timestamp: new Date().toISOString(),
          });
          return input;
      }

    case 'logic':
      if (node.service === 'if-else') {
        return executeIfElse(node, ctx, input);
      }
      return input;

    case 'output':
      return executeOutput(node, ctx, input);

    default:
      return input;
  }
}

async function executeWorkflow(nodes: WorkflowNode[]): Promise<ExecutionResult> {
  const ctx: ExecutionContext = {
    variables: {},
    outputs: {},
    logs: [],
  };

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const triggerNode = nodes.find(n => n.type === 'trigger');

  if (!triggerNode) {
    return {
      success: false,
      outputs: {},
      logs: [{
        nodeId: 'system',
        event: 'error',
        message: 'No trigger node found',
        timestamp: new Date().toISOString(),
      }],
      error: 'No trigger node found',
    };
  }

  const executed = new Set<string>();
  let finalOutput: unknown = null;

  async function executeChain(nodeId: string, input: unknown): Promise<void> {
    if (executed.has(nodeId)) return;

    const node = nodeMap.get(nodeId);
    if (!node) return;

    executed.add(nodeId);

    const output = await executeNode(node, ctx, input);
    ctx.outputs[nodeId] = output;

    if (node.type === 'output') {
      finalOutput = output;
    }

    // Handle If/Else branching
    if (node.service === 'if-else' && typeof output === 'object' && output !== null) {
      const ifOutput = output as { result: unknown; branch: string };
      if (node.connections.length > 0) {
        await executeChain(node.connections[0], ifOutput.result);
      }
      return;
    }

    for (const nextId of node.connections) {
      await executeChain(nextId, output);
    }
  }

  try {
    await executeChain(triggerNode.id, null);

    return {
      success: true,
      outputs: ctx.outputs,
      logs: ctx.logs,
      finalOutput,
    };
  } catch (error) {
    return {
      success: false,
      outputs: ctx.outputs,
      logs: ctx.logs,
      error: error instanceof Error ? error.message : 'Workflow execution failed',
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// API HANDLER
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const { workflow } = await request.json() as { workflow: WorkflowNode[] };

    if (!workflow || !Array.isArray(workflow)) {
      return NextResponse.json(
        { success: false, error: 'Invalid workflow' },
        { status: 400 }
      );
    }

    if (workflow.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Workflow is empty' },
        { status: 400 }
      );
    }

    const result = await executeWorkflow(workflow);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Workflow execution error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed',
        logs: [],
      },
      { status: 500 }
    );
  }
}
