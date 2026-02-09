/**
 * NEXUS-PRIME Agent API
 * Endpoints for agent orchestration, team deployment, and skill execution
 */

import { NextRequest, NextResponse } from 'next/server';
import { agentRegistry } from '@/lib/agents/registry';
import { orchestrator, quickTask, deployTeam } from '@/lib/agents/orchestrator';
import { AgentTask, ExecutionContext, AgentCapability } from '@/lib/agents/types';

// GET: List agents, teams, or skills
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'agents';
  const id = searchParams.get('id');
  const category = searchParams.get('category');
  const capability = searchParams.get('capability');

  try {
    switch (type) {
      case 'agents': {
        if (id) {
          const agent = agentRegistry.getAgent(id);
          if (!agent) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
          }
          return NextResponse.json({ agent });
        }

        let agents = agentRegistry.getAllAgents();

        if (capability) {
          agents = agentRegistry.getAgentsByCapability(capability as AgentCapability);
        }

        return NextResponse.json({
          agents: agents.map(a => ({
            id: a.identity.id,
            name: a.identity.name,
            codename: a.identity.codename,
            role: a.identity.role,
            tier: a.identity.tier,
            capabilities: a.capabilities,
            model: a.model,
          })),
          total: agents.length,
        });
      }

      case 'teams': {
        if (id) {
          const team = agentRegistry.getTeam(id);
          if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
          }
          return NextResponse.json({ team });
        }

        const teams = agentRegistry.getAllTeams();
        return NextResponse.json({
          teams: teams.map(t => ({
            id: t.id,
            name: t.name,
            codename: t.codename,
            pattern: t.pattern,
            description: t.description,
            memberCount: t.members.length,
            capabilities: t.capabilities,
          })),
          total: teams.length,
        });
      }

      case 'skills': {
        if (id) {
          const skill = agentRegistry.getSkill(id);
          if (!skill) {
            return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
          }
          return NextResponse.json({ skill });
        }

        let skills = agentRegistry.getAllSkills();

        if (category) {
          skills = agentRegistry.getSkillsByCategory(category as any);
        }

        return NextResponse.json({
          skills: skills.map(s => ({
            id: s.id,
            name: s.name,
            codename: s.codename,
            description: s.description,
            category: s.category,
            pricing: s.pricing,
            metrics: s.metrics,
            tags: s.tags,
          })),
          total: skills.length,
        });
      }

      case 'metrics': {
        const metrics = orchestrator.getMetrics();
        const agentStates = Array.from(orchestrator.getAgentStates().values());
        return NextResponse.json({
          orchestrator: metrics,
          agents: agentStates,
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid type. Use: agents, teams, skills, metrics' }, { status: 400 });
    }
  } catch (error) {
    console.error('Agent API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST: Execute tasks, deploy teams, or run skills
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'execute_task': {
        const { name, instructions, data, capabilities } = params;

        if (!name || !instructions) {
          return NextResponse.json(
            { error: 'Missing required fields: name, instructions' },
            { status: 400 }
          );
        }

        const result = await quickTask(
          name,
          instructions,
          data,
          capabilities as AgentCapability[]
        );

        return NextResponse.json({
          success: result.status === 'success',
          result: {
            taskId: result.taskId,
            status: result.status,
            output: result.output,
            confidence: result.confidence,
            reasoning: result.reasoning,
            metrics: result.metrics,
          },
        });
      }

      case 'deploy_team': {
        const { teamId, tasks } = params;

        if (!teamId || !tasks || !Array.isArray(tasks)) {
          return NextResponse.json(
            { error: 'Missing required fields: teamId, tasks (array)' },
            { status: 400 }
          );
        }

        // Validate team exists
        const team = agentRegistry.getTeam(teamId);
        if (!team) {
          return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        const result = await deployTeam(teamId, tasks);

        return NextResponse.json({
          success: result.success,
          team: team.codename,
          pattern: team.pattern,
          output: result.output,
          metrics: result.metrics,
          errors: result.errors,
        });
      }

      case 'execute_skill': {
        const { skillId, input } = params;

        if (!skillId || !input) {
          return NextResponse.json(
            { error: 'Missing required fields: skillId, input' },
            { status: 400 }
          );
        }

        const skill = agentRegistry.getSkill(skillId);
        if (!skill) {
          return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
        }

        // Execute skill as a task
        const result = await quickTask(
          skill.name,
          `Execute skill: ${skill.name}\n\nDescription: ${skill.description}\n\nInput: ${JSON.stringify(input)}`,
          input,
          skill.capabilities
        );

        // Update skill metrics
        skill.metrics.totalUses++;
        if (result.status === 'success') {
          skill.metrics.successRate =
            (skill.metrics.successRate * (skill.metrics.totalUses - 1) + 1) / skill.metrics.totalUses;
        }

        return NextResponse.json({
          success: result.status === 'success',
          skill: skill.codename,
          output: result.output,
          metrics: result.metrics,
        });
      }

      case 'find_agent': {
        const { capabilities, role } = params;

        if (!capabilities) {
          return NextResponse.json(
            { error: 'Missing required field: capabilities' },
            { status: 400 }
          );
        }

        const agent = agentRegistry.findAgentForTask(capabilities, role);

        if (!agent) {
          return NextResponse.json(
            { error: 'No suitable agent found', capabilities, role },
            { status: 404 }
          );
        }

        return NextResponse.json({
          agent: {
            id: agent.identity.id,
            name: agent.identity.name,
            codename: agent.identity.codename,
            role: agent.identity.role,
            tier: agent.identity.tier,
            capabilities: agent.capabilities,
          },
        });
      }

      case 'find_team': {
        const { capabilities, pattern } = params;

        if (!capabilities) {
          return NextResponse.json(
            { error: 'Missing required field: capabilities' },
            { status: 400 }
          );
        }

        const team = agentRegistry.findTeamForWorkflow(capabilities, pattern);

        if (!team) {
          return NextResponse.json(
            { error: 'No suitable team found', capabilities, pattern },
            { status: 404 }
          );
        }

        return NextResponse.json({
          team: {
            id: team.id,
            name: team.name,
            codename: team.codename,
            pattern: team.pattern,
            description: team.description,
            members: team.members,
          },
        });
      }

      default:
        return NextResponse.json(
          {
            error: 'Invalid action',
            validActions: ['execute_task', 'deploy_team', 'execute_skill', 'find_agent', 'find_team']
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Agent API error:', error);
    return NextResponse.json(
      { error: 'Failed to execute action', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
