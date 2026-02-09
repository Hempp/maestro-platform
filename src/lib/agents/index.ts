/**
 * NEXUS-PRIME Agent System
 * Main export file for the agent orchestration system
 */

// Types
export * from './types';

// Registry
export {
  FOUNDATION_AGENTS,
  SPECIALIST_AGENTS,
  AGENT_TEAMS,
  SKILL_CATALOG,
  AgentRegistry,
  agentRegistry,
} from './registry';

// Orchestrator
export {
  Orchestrator,
  orchestrator,
  quickTask,
  deployTeam,
} from './orchestrator';
