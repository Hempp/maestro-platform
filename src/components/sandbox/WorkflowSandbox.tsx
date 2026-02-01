'use client';

/**
 * WORKFLOW SANDBOX
 * Visual workflow builder for AI integrations
 * Inspired by n8n/Make.com but simplified for learning
 */

import { useState, useCallback } from 'react';
import type { SandboxState, WorkflowNode, SandboxChallenge } from '@/types';

interface WorkflowSandboxProps {
  state: SandboxState;
  onChange: (state: SandboxState) => void;
  challenge: SandboxChallenge;
}

// Available node types for the sandbox
const NODE_PALETTE = [
  { type: 'trigger', service: 'manual', label: 'Manual Trigger', icon: '▶️' },
  { type: 'trigger', service: 'webhook', label: 'Webhook', icon: '🔗' },
  { type: 'action', service: 'openai', label: 'OpenAI', icon: '🤖' },
  { type: 'action', service: 'http', label: 'HTTP Request', icon: '🌐' },
  { type: 'action', service: 'code', label: 'Code Block', icon: '📝' },
  { type: 'logic', service: 'if-else', label: 'If/Else', icon: '🔀' },
  { type: 'output', service: 'display', label: 'Display Output', icon: '📤' },
] as const;

export function WorkflowSandbox({
  state,
  onChange,
  challenge,
}: WorkflowSandboxProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Add a node to the workflow
  const addNode = useCallback((nodeType: typeof NODE_PALETTE[number]) => {
    const newNode: WorkflowNode = {
      id: crypto.randomUUID(),
      type: nodeType.type as WorkflowNode['type'],
      service: nodeType.service,
      config: {},
      position: {
        x: 100 + state.workflow.length * 200,
        y: 200,
      },
      connections: [],
    };

    onChange({
      ...state,
      workflow: [...state.workflow, newNode],
      status: 'building',
    });
  }, [state, onChange]);

  // Update node configuration
  const updateNodeConfig = useCallback((nodeId: string, config: Record<string, unknown>) => {
    onChange({
      ...state,
      workflow: state.workflow.map(node =>
        node.id === nodeId ? { ...node, config: { ...node.config, ...config } } : node
      ),
    });
  }, [state, onChange]);

  // Connect two nodes
  const connectNodes = useCallback((fromId: string, toId: string) => {
    onChange({
      ...state,
      workflow: state.workflow.map(node =>
        node.id === fromId
          ? { ...node, connections: [...node.connections, toId] }
          : node
      ),
    });
  }, [state, onChange]);

  // Execute the workflow
  const executeWorkflow = useCallback(async () => {
    onChange({ ...state, status: 'executing', executionLog: [] });

    try {
      const response = await fetch('/api/sandbox/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow: state.workflow,
        }),
      });

      const result = await response.json();

      // Map API logs to sandbox execution log format
      const executionLog = (result.logs || []).map((log: {
        nodeId: string;
        event: string;
        message: string;
        timestamp: string;
        data?: unknown;
      }) => ({
        timestamp: new Date(log.timestamp),
        nodeId: log.nodeId,
        event: log.event as 'start' | 'success' | 'error' | 'skip',
        message: log.message,
        data: log.data,
      }));

      onChange({
        ...state,
        executionLog,
        status: result.success ? 'complete' : 'building',
        finalOutput: result.finalOutput,
      });
    } catch (error) {
      onChange({
        ...state,
        executionLog: [{
          timestamp: new Date(),
          nodeId: 'system',
          event: 'error',
          error: error instanceof Error ? error.message : 'Execution failed',
        }],
        status: 'building',
      });
    }
  }, [state, onChange]);

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Toolbar */}
      <div className="h-12 border-b border-slate-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-300">Workflow Sandbox</span>
          <span className="text-xs text-slate-500">
            {state.workflow.length} nodes
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChange({ ...state, workflow: [], executionLog: [], status: 'idle' })}
            className="px-3 py-1.5 text-slate-400 hover:text-white transition text-sm"
          >
            Clear
          </button>
          <button
            onClick={executeWorkflow}
            disabled={state.workflow.length === 0 || state.status === 'executing'}
            className="px-4 py-1.5 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-500 transition disabled:opacity-50"
          >
            {state.status === 'executing' ? 'Running...' : 'Run Workflow'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Node Palette */}
        <div className="w-48 border-r border-slate-800 p-3 space-y-2">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-3">
            Add Nodes
          </div>
          {NODE_PALETTE.map((node, i) => (
            <button
              key={i}
              onClick={() => addNode(node)}
              className="w-full flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-left transition"
            >
              <span>{node.icon}</span>
              <span className="text-sm text-slate-300">{node.label}</span>
            </button>
          ))}
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-auto bg-slate-950 bg-[radial-gradient(circle,#1e293b_1px,transparent_1px)] bg-[length:20px_20px]">
          {state.workflow.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-slate-600 text-lg mb-2">
                  Drag nodes here to build your workflow
                </div>
                <div className="text-slate-700 text-sm">
                  Or click a node type from the palette
                </div>
              </div>
            </div>
          ) : (
            state.workflow.map((node) => (
              <WorkflowNodeComponent
                key={node.id}
                node={node}
                isSelected={selectedNode === node.id}
                onClick={() => setSelectedNode(node.id)}
                onConfigChange={(config) => updateNodeConfig(node.id, config)}
                executionStatus={getNodeExecutionStatus(node.id, state.executionLog)}
              />
            ))
          )}

          {/* Connection lines would go here */}
          <svg className="absolute inset-0 pointer-events-none">
            {state.workflow.map(node =>
              node.connections.map(targetId => {
                const target = state.workflow.find(n => n.id === targetId);
                if (!target) return null;
                return (
                  <line
                    key={`${node.id}-${targetId}`}
                    x1={node.position.x + 120}
                    y1={node.position.y + 40}
                    x2={target.position.x}
                    y2={target.position.y + 40}
                    stroke="#3b82f6"
                    strokeWidth="2"
                    markerEnd="url(#arrow)"
                  />
                );
              })
            )}
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="10"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
              </marker>
            </defs>
          </svg>
        </div>

        {/* Node Config Panel */}
        {selectedNode && (
          <NodeConfigPanel
            node={state.workflow.find(n => n.id === selectedNode)!}
            onConfigChange={(config) => updateNodeConfig(selectedNode, config)}
            onClose={() => setSelectedNode(null)}
            onDelete={() => {
              onChange({
                ...state,
                workflow: state.workflow.filter(n => n.id !== selectedNode),
              });
              setSelectedNode(null);
            }}
          />
        )}
      </div>

      {/* Execution Log */}
      {state.executionLog.length > 0 && (
        <div className="h-32 border-t border-slate-800 overflow-auto p-3 bg-slate-900">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">
            Execution Log
          </div>
          {state.executionLog.map((entry, i) => (
            <div
              key={i}
              className={`text-xs font-mono mb-1 ${
                entry.event === 'error' ? 'text-red-400' :
                entry.event === 'success' ? 'text-emerald-400' :
                entry.event === 'start' ? 'text-amber-400' :
                'text-slate-400'
              }`}
            >
              [{entry.event.toUpperCase()}] {entry.nodeId}
              {entry.message && `: ${entry.message}`}
              {entry.error && `: ${entry.error}`}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Individual workflow node component
function WorkflowNodeComponent({
  node,
  isSelected,
  onClick,
  onConfigChange,
  executionStatus,
}: {
  node: WorkflowNode;
  isSelected: boolean;
  onClick: () => void;
  onConfigChange: (config: Record<string, unknown>) => void;
  executionStatus?: 'pending' | 'running' | 'success' | 'error';
}) {
  const nodeColors: Record<string, string> = {
    trigger: 'border-purple-500 bg-purple-500/10',
    action: 'border-blue-500 bg-blue-500/10',
    condition: 'border-amber-500 bg-amber-500/10',
    logic: 'border-amber-500 bg-amber-500/10',
    output: 'border-emerald-500 bg-emerald-500/10',
  };

  const statusColors = {
    pending: '',
    running: 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950',
    success: 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950',
    error: 'ring-2 ring-red-400 ring-offset-2 ring-offset-slate-950',
  };

  return (
    <div
      className={`absolute w-40 rounded-lg border-2 cursor-pointer transition-all ${
        nodeColors[node.type]
      } ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950' : ''} ${
        executionStatus ? statusColors[executionStatus] : ''
      }`}
      style={{
        left: node.position.x,
        top: node.position.y,
      }}
      onClick={onClick}
    >
      <div className="p-3">
        <div className="text-xs text-slate-500 uppercase">{node.type}</div>
        <div className="text-sm text-white font-medium">{node.service}</div>
      </div>
      {/* Input handle */}
      <div className="absolute -left-2 top-1/2 w-4 h-4 bg-slate-700 border-2 border-slate-500 rounded-full transform -translate-y-1/2" />
      {/* Output handle */}
      <div className="absolute -right-2 top-1/2 w-4 h-4 bg-slate-700 border-2 border-slate-500 rounded-full transform -translate-y-1/2" />
    </div>
  );
}

// Node configuration panel
function NodeConfigPanel({
  node,
  onConfigChange,
  onClose,
  onDelete,
}: {
  node: WorkflowNode;
  onConfigChange: (config: Record<string, unknown>) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="w-72 border-l border-slate-800 bg-slate-900 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white">Configure Node</h3>
        <button onClick={onClose} className="text-slate-500 hover:text-white">
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-slate-500 uppercase">Service</label>
          <div className="text-sm text-white">{node.service}</div>
        </div>

        {node.service === 'openai' && (
          <>
            <div>
              <label className="text-xs text-slate-500 uppercase block mb-1">
                Model
              </label>
              <select
                value={(node.config.model as string) || 'gpt-4'}
                onChange={(e) => onConfigChange({ model: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white"
              >
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase block mb-1">
                Prompt
              </label>
              <textarea
                value={(node.config.prompt as string) || ''}
                onChange={(e) => onConfigChange({ prompt: e.target.value })}
                placeholder="Enter your prompt..."
                className="w-full h-32 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white resize-none"
              />
            </div>
          </>
        )}

        {node.service === 'http' && (
          <>
            <div>
              <label className="text-xs text-slate-500 uppercase block mb-1">
                URL
              </label>
              <input
                type="url"
                value={(node.config.url as string) || ''}
                onChange={(e) => onConfigChange({ url: e.target.value })}
                placeholder="https://api.example.com"
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase block mb-1">
                Method
              </label>
              <select
                value={(node.config.method as string) || 'GET'}
                onChange={(e) => onConfigChange({ method: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </>
        )}

        <button
          onClick={onDelete}
          className="w-full px-3 py-2 bg-red-600/20 text-red-400 rounded text-sm hover:bg-red-600/30 transition"
        >
          Delete Node
        </button>
      </div>
    </div>
  );
}

// Helper to get node execution status
function getNodeExecutionStatus(
  nodeId: string,
  log: SandboxState['executionLog']
): 'pending' | 'running' | 'success' | 'error' | undefined {
  const entry = [...log].reverse().find(e => e.nodeId === nodeId);
  if (!entry) return undefined;

  switch (entry.event) {
    case 'start': return 'running';
    case 'success': return 'success';
    case 'error': return 'error';
    default: return 'pending';
  }
}
