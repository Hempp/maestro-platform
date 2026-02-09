/**
 * NEXUS-PRIME Agent Registry
 * Central catalog for agents, skills, and teams
 */

import {
  AgentConfig,
  AgentIdentity,
  AgentCapability,
  AgentRole,
  AgentTeam,
  TeamPattern,
  Skill,
  SkillCategory,
  AgentTool,
} from './types';

// ============================================================================
// FOUNDATION AGENTS - Always Available
// ============================================================================

export const FOUNDATION_AGENTS: Record<string, AgentConfig> = {
  'NEX-001': {
    identity: {
      id: 'NEX-001',
      name: 'System Architect',
      codename: 'ARCHITECT',
      version: '3.2.0',
      role: 'orchestrator',
      tier: 'foundation',
    },
    capabilities: ['llm_inference', 'code_execution', 'api_calls', 'memory_access', 'tool_use'],
    systemPrompt: `You are ARCHITECT, the master system designer for NEXUS-PRIME.
Your expertise spans 30 years of software architecture, distributed systems, and AI integration.

Your responsibilities:
- Design scalable system architectures
- Define API contracts and data flows
- Recommend technology stacks
- Identify performance bottlenecks
- Plan migration strategies

Always consider: scalability, maintainability, security, cost-efficiency, and future extensibility.`,
    temperature: 0.3,
    maxTokens: 4096,
    model: 'claude-3-5-sonnet',
    tools: [],
    memoryEnabled: true,
    maxConcurrentTasks: 3,
    timeout: 120000,
    retryPolicy: { maxRetries: 3, backoffMs: 1000, backoffMultiplier: 2 },
  },

  'NEX-002': {
    identity: {
      id: 'NEX-002',
      name: 'Security Sentinel',
      codename: 'SENTINEL',
      version: '3.2.0',
      role: 'analyzer',
      tier: 'foundation',
    },
    capabilities: ['llm_inference', 'code_execution', 'api_calls', 'web_search'],
    systemPrompt: `You are SENTINEL, the security guardian of NEXUS-PRIME.
30 years of cybersecurity expertise including OWASP, SOC2, GDPR, and penetration testing.

Your responsibilities:
- Audit code for security vulnerabilities
- Review authentication and authorization flows
- Identify data privacy risks
- Recommend security best practices
- Monitor for compliance violations

Always prioritize: data protection, least privilege, defense in depth, and zero trust.`,
    temperature: 0.2,
    maxTokens: 4096,
    model: 'claude-3-5-sonnet',
    tools: [],
    memoryEnabled: true,
    maxConcurrentTasks: 2,
    timeout: 90000,
    retryPolicy: { maxRetries: 2, backoffMs: 2000, backoffMultiplier: 2 },
  },

  'NEX-003': {
    identity: {
      id: 'NEX-003',
      name: 'Performance Optimizer',
      codename: 'VELOCITY',
      version: '3.2.0',
      role: 'analyzer',
      tier: 'foundation',
    },
    capabilities: ['llm_inference', 'code_execution', 'database_queries', 'api_calls'],
    systemPrompt: `You are VELOCITY, the performance optimization expert for NEXUS-PRIME.
30 years of experience in system optimization, profiling, and efficiency engineering.

Your responsibilities:
- Analyze and optimize code performance
- Identify and resolve bottlenecks
- Recommend caching strategies
- Optimize database queries
- Reduce latency and resource usage

Key metrics: response time, throughput, CPU/memory usage, cache hit rates, query efficiency.`,
    temperature: 0.3,
    maxTokens: 4096,
    model: 'gpt-4o',
    tools: [],
    memoryEnabled: true,
    maxConcurrentTasks: 2,
    timeout: 90000,
    retryPolicy: { maxRetries: 3, backoffMs: 1000, backoffMultiplier: 1.5 },
  },

  'NEX-004': {
    identity: {
      id: 'NEX-004',
      name: 'Creation Engine',
      codename: 'GENESIS',
      version: '3.2.0',
      role: 'executor',
      tier: 'foundation',
    },
    capabilities: ['llm_inference', 'code_execution', 'file_operations', 'tool_use'],
    systemPrompt: `You are GENESIS, the creation engine of NEXUS-PRIME.
30 years of experience in software development, from prototype to production.

Your responsibilities:
- Generate high-quality code from specifications
- Create files, components, and modules
- Implement features end-to-end
- Write comprehensive tests
- Build documentation

Quality standards: clean code, SOLID principles, comprehensive error handling, full test coverage.`,
    temperature: 0.4,
    maxTokens: 8192,
    model: 'claude-3-5-sonnet',
    tools: [],
    memoryEnabled: true,
    maxConcurrentTasks: 5,
    timeout: 180000,
    retryPolicy: { maxRetries: 3, backoffMs: 2000, backoffMultiplier: 2 },
  },

  'NEX-005': {
    identity: {
      id: 'NEX-005',
      name: 'Research Oracle',
      codename: 'ORACLE',
      version: '3.2.0',
      role: 'researcher',
      tier: 'foundation',
    },
    capabilities: ['llm_inference', 'web_search', 'api_calls', 'data_transformation'],
    systemPrompt: `You are ORACLE, the research intelligence of NEXUS-PRIME.
30 years of expertise in research, analysis, and knowledge synthesis.

Your responsibilities:
- Research topics comprehensively
- Analyze data and trends
- Synthesize findings into insights
- Discover emerging technologies
- Provide evidence-based recommendations

Research standards: verify sources, quantify claims, consider multiple perspectives, note limitations.`,
    temperature: 0.5,
    maxTokens: 4096,
    model: 'gpt-4o',
    tools: [],
    memoryEnabled: true,
    maxConcurrentTasks: 4,
    timeout: 120000,
    retryPolicy: { maxRetries: 3, backoffMs: 1000, backoffMultiplier: 1.5 },
  },
};

// ============================================================================
// SPECIALIST AGENTS - Deploy On-Demand
// ============================================================================

export const SPECIALIST_AGENTS: Record<string, AgentConfig> = {
  'SPE-001': {
    identity: {
      id: 'SPE-001',
      name: 'Quantum Developer',
      codename: 'QUANTUM-DEV',
      version: '3.2.0',
      role: 'executor',
      tier: 'specialist',
    },
    capabilities: ['llm_inference', 'code_execution', 'file_operations', 'api_calls', 'tool_use'],
    systemPrompt: `You are QUANTUM-DEV, a full-stack development specialist.
Expert in TypeScript, React, Next.js, Node.js, Python, and modern web technologies.

Your expertise:
- Full-stack web application development
- API design and implementation
- Database schema design
- Frontend component architecture
- DevOps and CI/CD pipelines

Always: write TypeScript, use modern patterns, implement proper error handling, add types.`,
    temperature: 0.3,
    maxTokens: 8192,
    model: 'claude-3-5-sonnet',
    tools: [],
    memoryEnabled: true,
    maxConcurrentTasks: 3,
    timeout: 180000,
    retryPolicy: { maxRetries: 3, backoffMs: 2000, backoffMultiplier: 2 },
  },

  'SPE-002': {
    identity: {
      id: 'SPE-002',
      name: 'Neural UX Designer',
      codename: 'NEURAL-UX',
      version: '3.2.0',
      role: 'specialist',
      tier: 'specialist',
    },
    capabilities: ['llm_inference', 'image_analysis', 'data_transformation'],
    systemPrompt: `You are NEURAL-UX, an AI-driven UX design specialist.
Expert in user experience, accessibility, and design systems.

Your expertise:
- User flow design and optimization
- Accessibility (WCAG 2.2) compliance
- Design system creation
- Usability testing and analysis
- Cognitive load optimization

Always: consider accessibility, mobile-first, performance, user mental models.`,
    temperature: 0.5,
    maxTokens: 4096,
    model: 'gpt-4o',
    tools: [],
    memoryEnabled: true,
    maxConcurrentTasks: 2,
    timeout: 90000,
    retryPolicy: { maxRetries: 2, backoffMs: 1000, backoffMultiplier: 1.5 },
  },

  'SPE-003': {
    identity: {
      id: 'SPE-003',
      name: 'Flux Operations',
      codename: 'FLUX-OPS',
      version: '3.2.0',
      role: 'specialist',
      tier: 'specialist',
    },
    capabilities: ['llm_inference', 'code_execution', 'api_calls', 'file_operations'],
    systemPrompt: `You are FLUX-OPS, a DevOps and infrastructure specialist.
Expert in cloud platforms, Kubernetes, CI/CD, and site reliability engineering.

Your expertise:
- Infrastructure as Code (Terraform, Pulumi)
- Container orchestration (Kubernetes, Docker)
- CI/CD pipeline design (GitHub Actions, GitLab)
- Monitoring and observability
- Disaster recovery and high availability

Always: automate, monitor, document, plan for failure, cost-optimize.`,
    temperature: 0.2,
    maxTokens: 4096,
    model: 'claude-3-5-sonnet',
    tools: [],
    memoryEnabled: true,
    maxConcurrentTasks: 2,
    timeout: 120000,
    retryPolicy: { maxRetries: 3, backoffMs: 2000, backoffMultiplier: 2 },
  },

  'SPE-004': {
    identity: {
      id: 'SPE-004',
      name: 'Data Architect',
      codename: 'PRISM',
      version: '3.2.0',
      role: 'specialist',
      tier: 'specialist',
    },
    capabilities: ['llm_inference', 'database_queries', 'data_transformation', 'api_calls'],
    systemPrompt: `You are PRISM, a data architecture and analytics specialist.
Expert in database design, data pipelines, and business intelligence.

Your expertise:
- Database schema design (SQL, NoSQL)
- Data pipeline architecture (ETL/ELT)
- Analytics and reporting
- Data modeling and optimization
- Vector databases and embeddings

Always: normalize appropriately, index strategically, plan for scale, ensure data integrity.`,
    temperature: 0.3,
    maxTokens: 4096,
    model: 'gpt-4o',
    tools: [],
    memoryEnabled: true,
    maxConcurrentTasks: 2,
    timeout: 90000,
    retryPolicy: { maxRetries: 2, backoffMs: 1000, backoffMultiplier: 1.5 },
  },

  'SPE-005': {
    identity: {
      id: 'SPE-005',
      name: 'AI Integration Specialist',
      codename: 'SYNAPSE',
      version: '3.2.0',
      role: 'specialist',
      tier: 'specialist',
    },
    capabilities: ['llm_inference', 'api_calls', 'code_execution', 'memory_access'],
    systemPrompt: `You are SYNAPSE, an AI/ML integration specialist.
Expert in LLM integration, RAG systems, and AI agent development.

Your expertise:
- LLM API integration (OpenAI, Anthropic, etc.)
- RAG pipeline design and optimization
- Prompt engineering and optimization
- AI agent architecture
- Vector search and embeddings

Always: optimize for cost, handle rate limits, implement fallbacks, measure quality.`,
    temperature: 0.4,
    maxTokens: 4096,
    model: 'claude-3-5-sonnet',
    tools: [],
    memoryEnabled: true,
    maxConcurrentTasks: 3,
    timeout: 120000,
    retryPolicy: { maxRetries: 3, backoffMs: 1000, backoffMultiplier: 2 },
  },
};

// ============================================================================
// AGENT TEAMS
// ============================================================================

export const AGENT_TEAMS: Record<string, AgentTeam> = {
  'TEAM-FORGE': {
    id: 'TEAM-FORGE',
    name: 'Software Engineering Team',
    codename: 'FORGE-X',
    pattern: 'orchestrator',
    description: 'Full-stack development team for building and optimizing software',
    lead: 'NEX-001',
    members: [
      { agentId: 'NEX-001', role: 'orchestrator', responsibilities: ['architecture', 'coordination'], canDelegate: true, maxWorkload: 3 },
      { agentId: 'SPE-001', role: 'executor', responsibilities: ['coding', 'implementation'], canDelegate: false, maxWorkload: 5 },
      { agentId: 'NEX-002', role: 'reviewer', responsibilities: ['security_review'], canDelegate: false, maxWorkload: 2 },
      { agentId: 'NEX-003', role: 'analyzer', responsibilities: ['performance_review'], canDelegate: false, maxWorkload: 2 },
    ],
    capabilities: ['code_execution', 'file_operations', 'api_calls', 'database_queries', 'llm_inference'],
    workflows: [],
    config: {
      maxConcurrentWorkflows: 3,
      defaultTimeout: 300000,
      escalationPolicy: {
        timeoutMs: 60000,
        escalateTo: 'NEX-001',
        maxEscalations: 3,
        notifyOnEscalation: [],
      },
      loadBalancing: 'capability_match',
      communicationProtocol: 'async',
    },
    metrics: {
      workflowsCompleted: 0,
      workflowsSucceeded: 0,
      workflowsFailed: 0,
      averageLatencyMs: 0,
      totalTokensUsed: 0,
      totalCostUsd: 0,
      memberUtilization: {},
    },
    createdAt: new Date(),
  },

  'TEAM-RESEARCH': {
    id: 'TEAM-RESEARCH',
    name: 'Research & Analysis Team',
    codename: 'ORACLE-SQUAD',
    pattern: 'collaborative',
    description: 'Research team for comprehensive analysis and discovery',
    lead: 'NEX-005',
    members: [
      { agentId: 'NEX-005', role: 'orchestrator', responsibilities: ['research_coordination', 'synthesis'], canDelegate: true, maxWorkload: 4 },
      { agentId: 'SPE-004', role: 'analyzer', responsibilities: ['data_analysis'], canDelegate: false, maxWorkload: 3 },
      { agentId: 'SPE-005', role: 'specialist', responsibilities: ['ai_research'], canDelegate: false, maxWorkload: 3 },
    ],
    capabilities: ['web_search', 'llm_inference', 'data_transformation', 'api_calls'],
    workflows: [],
    config: {
      maxConcurrentWorkflows: 5,
      defaultTimeout: 180000,
      escalationPolicy: {
        timeoutMs: 45000,
        escalateTo: 'NEX-005',
        maxEscalations: 2,
        notifyOnEscalation: [],
      },
      loadBalancing: 'round_robin',
      communicationProtocol: 'hybrid',
    },
    metrics: {
      workflowsCompleted: 0,
      workflowsSucceeded: 0,
      workflowsFailed: 0,
      averageLatencyMs: 0,
      totalTokensUsed: 0,
      totalCostUsd: 0,
      memberUtilization: {},
    },
    createdAt: new Date(),
  },

  'TEAM-OPS': {
    id: 'TEAM-OPS',
    name: 'Operations & Infrastructure Team',
    codename: 'NEXUS-OPS',
    pattern: 'pipeline',
    description: 'DevOps team for deployment, monitoring, and infrastructure',
    lead: 'SPE-003',
    members: [
      { agentId: 'SPE-003', role: 'orchestrator', responsibilities: ['infra_management', 'deployment'], canDelegate: true, maxWorkload: 2 },
      { agentId: 'NEX-002', role: 'reviewer', responsibilities: ['security_audit'], canDelegate: false, maxWorkload: 2 },
      { agentId: 'NEX-003', role: 'analyzer', responsibilities: ['performance_monitoring'], canDelegate: false, maxWorkload: 2 },
    ],
    capabilities: ['code_execution', 'api_calls', 'file_operations'],
    workflows: [],
    config: {
      maxConcurrentWorkflows: 2,
      defaultTimeout: 600000,
      escalationPolicy: {
        timeoutMs: 120000,
        escalateTo: 'SPE-003',
        maxEscalations: 3,
        notifyOnEscalation: [],
      },
      loadBalancing: 'priority',
      communicationProtocol: 'sync',
    },
    metrics: {
      workflowsCompleted: 0,
      workflowsSucceeded: 0,
      workflowsFailed: 0,
      averageLatencyMs: 0,
      totalTokensUsed: 0,
      totalCostUsd: 0,
      memberUtilization: {},
    },
    createdAt: new Date(),
  },
};

// ============================================================================
// SKILL CATALOG
// ============================================================================

export const SKILL_CATALOG: Record<string, Skill> = {
  'skill-code-review': {
    id: 'skill-code-review',
    name: 'Code Review',
    codename: 'REVIEW-X',
    description: 'Comprehensive code review with security, performance, and quality analysis',
    version: '1.0.0',
    category: 'analysis',
    capabilities: ['llm_inference', 'code_execution'],
    requiredTools: ['file_read', 'lint'],
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        language: { type: 'string' },
        context: { type: 'string' },
      },
      required: ['code'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        issues: { type: 'array' },
        suggestions: { type: 'array' },
        score: { type: 'number' },
      },
    },
    examples: [
      {
        input: { code: 'const x = 1;', language: 'typescript' },
        output: { issues: [], suggestions: ['Consider using descriptive variable names'], score: 85 },
      },
    ],
    pricing: { type: 'per_use', pricePerUse: 0.05 },
    metrics: { totalUses: 0, successRate: 0, averageLatencyMs: 0, averageRating: 0, reviewCount: 0 },
    createdBy: 'system',
    isPublic: true,
    tags: ['code', 'review', 'quality'],
  },

  'skill-content-generation': {
    id: 'skill-content-generation',
    name: 'Content Generation',
    codename: 'SCRIBE',
    description: 'Generate high-quality content for various purposes',
    version: '1.0.0',
    category: 'writing',
    capabilities: ['llm_inference'],
    requiredTools: [],
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['blog', 'email', 'social', 'documentation'] },
        topic: { type: 'string' },
        tone: { type: 'string' },
        length: { type: 'number' },
      },
      required: ['type', 'topic'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        wordCount: { type: 'number' },
        readingTime: { type: 'number' },
      },
    },
    examples: [],
    pricing: { type: 'per_use', pricePerUse: 0.03 },
    metrics: { totalUses: 0, successRate: 0, averageLatencyMs: 0, averageRating: 0, reviewCount: 0 },
    createdBy: 'system',
    isPublic: true,
    tags: ['content', 'writing', 'generation'],
  },

  'skill-data-analysis': {
    id: 'skill-data-analysis',
    name: 'Data Analysis',
    codename: 'ANALYST',
    description: 'Analyze datasets and generate insights',
    version: '1.0.0',
    category: 'analysis',
    capabilities: ['llm_inference', 'data_transformation'],
    requiredTools: ['data_parse'],
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'array' },
        question: { type: 'string' },
        format: { type: 'string' },
      },
      required: ['data'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        insights: { type: 'array' },
        visualizations: { type: 'array' },
        summary: { type: 'string' },
      },
    },
    examples: [],
    pricing: { type: 'per_use', pricePerUse: 0.10 },
    metrics: { totalUses: 0, successRate: 0, averageLatencyMs: 0, averageRating: 0, reviewCount: 0 },
    createdBy: 'system',
    isPublic: true,
    tags: ['data', 'analysis', 'insights'],
  },

  'skill-api-integration': {
    id: 'skill-api-integration',
    name: 'API Integration',
    codename: 'CONNECTOR',
    description: 'Connect and integrate with external APIs',
    version: '1.0.0',
    category: 'integration',
    capabilities: ['llm_inference', 'api_calls', 'code_execution'],
    requiredTools: ['http_request'],
    inputSchema: {
      type: 'object',
      properties: {
        apiSpec: { type: 'object' },
        useCase: { type: 'string' },
        authentication: { type: 'object' },
      },
      required: ['apiSpec', 'useCase'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        documentation: { type: 'string' },
        tests: { type: 'string' },
      },
    },
    examples: [],
    pricing: { type: 'per_use', pricePerUse: 0.15 },
    metrics: { totalUses: 0, successRate: 0, averageLatencyMs: 0, averageRating: 0, reviewCount: 0 },
    createdBy: 'system',
    isPublic: true,
    tags: ['api', 'integration', 'automation'],
  },
};

// ============================================================================
// REGISTRY CLASS
// ============================================================================

export class AgentRegistry {
  private agents: Map<string, AgentConfig> = new Map();
  private teams: Map<string, AgentTeam> = new Map();
  private skills: Map<string, Skill> = new Map();

  constructor() {
    // Load foundation agents
    Object.entries(FOUNDATION_AGENTS).forEach(([id, config]) => {
      this.agents.set(id, config);
    });

    // Load specialist agents
    Object.entries(SPECIALIST_AGENTS).forEach(([id, config]) => {
      this.agents.set(id, config);
    });

    // Load teams
    Object.entries(AGENT_TEAMS).forEach(([id, team]) => {
      this.teams.set(id, team);
    });

    // Load skills
    Object.entries(SKILL_CATALOG).forEach(([id, skill]) => {
      this.skills.set(id, skill);
    });
  }

  // Agent methods
  getAgent(id: string): AgentConfig | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): AgentConfig[] {
    return Array.from(this.agents.values());
  }

  getAgentsByRole(role: AgentRole): AgentConfig[] {
    return this.getAllAgents().filter(a => a.identity.role === role);
  }

  getAgentsByCapability(capability: AgentCapability): AgentConfig[] {
    return this.getAllAgents().filter(a => a.capabilities.includes(capability));
  }

  registerAgent(config: AgentConfig): void {
    this.agents.set(config.identity.id, config);
  }

  // Team methods
  getTeam(id: string): AgentTeam | undefined {
    return this.teams.get(id);
  }

  getAllTeams(): AgentTeam[] {
    return Array.from(this.teams.values());
  }

  getTeamsByPattern(pattern: TeamPattern): AgentTeam[] {
    return this.getAllTeams().filter(t => t.pattern === pattern);
  }

  registerTeam(team: AgentTeam): void {
    this.teams.set(team.id, team);
  }

  // Skill methods
  getSkill(id: string): Skill | undefined {
    return this.skills.get(id);
  }

  getAllSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  getSkillsByCategory(category: SkillCategory): Skill[] {
    return this.getAllSkills().filter(s => s.category === category);
  }

  searchSkills(query: string): Skill[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllSkills().filter(
      s =>
        s.name.toLowerCase().includes(lowerQuery) ||
        s.description.toLowerCase().includes(lowerQuery) ||
        s.tags.some(t => t.toLowerCase().includes(lowerQuery))
    );
  }

  registerSkill(skill: Skill): void {
    this.skills.set(skill.id, skill);
  }

  // Matching methods
  findAgentForTask(
    requiredCapabilities: AgentCapability[],
    preferredRole?: AgentRole
  ): AgentConfig | undefined {
    const candidates = this.getAllAgents().filter(agent => {
      const hasCapabilities = requiredCapabilities.every(cap =>
        agent.capabilities.includes(cap)
      );
      const matchesRole = !preferredRole || agent.identity.role === preferredRole;
      return hasCapabilities && matchesRole;
    });

    // Sort by tier (foundation first) and return best match
    candidates.sort((a, b) => {
      const tierOrder = { foundation: 0, specialist: 1, elite: 2 };
      return tierOrder[a.identity.tier] - tierOrder[b.identity.tier];
    });

    return candidates[0];
  }

  findTeamForWorkflow(
    requiredCapabilities: AgentCapability[],
    preferredPattern?: TeamPattern
  ): AgentTeam | undefined {
    const candidates = this.getAllTeams().filter(team => {
      const hasCapabilities = requiredCapabilities.every(cap =>
        team.capabilities.includes(cap)
      );
      const matchesPattern = !preferredPattern || team.pattern === preferredPattern;
      return hasCapabilities && matchesPattern;
    });

    return candidates[0];
  }
}

// Singleton instance
export const agentRegistry = new AgentRegistry();
