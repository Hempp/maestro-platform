/**
 * SUBSCRIPTION FEATURE ACCESS
 * Defines what features are available on each plan
 */

export type PlanId = 'free' | 'starter' | 'professional' | 'enterprise' | 'team_starter' | 'team_growth' | 'team_enterprise';

export interface PlanFeatures {
  // Learning paths
  studentPath: boolean;
  employeePath: boolean;
  ownerPath: boolean;

  // AI Tutor
  tutorSessionsPerMonth: number; // -1 = unlimited

  // Agent executions
  agentExecutionsPerMonth: number; // -1 = unlimited

  // Skills
  skillUsesPerMonth: number; // -1 = unlimited
  customSkillCreation: boolean;

  // Team features
  teamMembers: number; // -1 = unlimited, 0 = no team
  teamAnalytics: boolean;
  sharedSkillLibrary: boolean;

  // Advanced features
  apiAccess: boolean;
  customAgents: boolean;
  prioritySupport: boolean;
  ssoIntegration: boolean;
}

export const PLAN_FEATURES: Record<PlanId, PlanFeatures> = {
  free: {
    studentPath: true,
    employeePath: false,
    ownerPath: false,
    tutorSessionsPerMonth: 3,
    agentExecutionsPerMonth: 5,
    skillUsesPerMonth: 10,
    customSkillCreation: false,
    teamMembers: 0,
    teamAnalytics: false,
    sharedSkillLibrary: false,
    apiAccess: false,
    customAgents: false,
    prioritySupport: false,
    ssoIntegration: false,
  },
  starter: {
    studentPath: true,
    employeePath: false,
    ownerPath: false,
    tutorSessionsPerMonth: 10,
    agentExecutionsPerMonth: 50,
    skillUsesPerMonth: 100,
    customSkillCreation: false,
    teamMembers: 0,
    teamAnalytics: false,
    sharedSkillLibrary: false,
    apiAccess: false,
    customAgents: false,
    prioritySupport: false,
    ssoIntegration: false,
  },
  professional: {
    studentPath: true,
    employeePath: true,
    ownerPath: false,
    tutorSessionsPerMonth: -1,
    agentExecutionsPerMonth: 100,
    skillUsesPerMonth: 500,
    customSkillCreation: true,
    teamMembers: 0,
    teamAnalytics: false,
    sharedSkillLibrary: false,
    apiAccess: false,
    customAgents: false,
    prioritySupport: false,
    ssoIntegration: false,
  },
  enterprise: {
    studentPath: true,
    employeePath: true,
    ownerPath: true,
    tutorSessionsPerMonth: -1,
    agentExecutionsPerMonth: -1,
    skillUsesPerMonth: -1,
    customSkillCreation: true,
    teamMembers: 5,
    teamAnalytics: false,
    sharedSkillLibrary: false,
    apiAccess: true,
    customAgents: true,
    prioritySupport: true,
    ssoIntegration: false,
  },
  team_starter: {
    studentPath: true,
    employeePath: true,
    ownerPath: true,
    tutorSessionsPerMonth: -1,
    agentExecutionsPerMonth: -1,
    skillUsesPerMonth: -1,
    customSkillCreation: true,
    teamMembers: 10,
    teamAnalytics: true,
    sharedSkillLibrary: true,
    apiAccess: true,
    customAgents: true,
    prioritySupport: true,
    ssoIntegration: true,
  },
  team_growth: {
    studentPath: true,
    employeePath: true,
    ownerPath: true,
    tutorSessionsPerMonth: -1,
    agentExecutionsPerMonth: -1,
    skillUsesPerMonth: -1,
    customSkillCreation: true,
    teamMembers: 50,
    teamAnalytics: true,
    sharedSkillLibrary: true,
    apiAccess: true,
    customAgents: true,
    prioritySupport: true,
    ssoIntegration: true,
  },
  team_enterprise: {
    studentPath: true,
    employeePath: true,
    ownerPath: true,
    tutorSessionsPerMonth: -1,
    agentExecutionsPerMonth: -1,
    skillUsesPerMonth: -1,
    customSkillCreation: true,
    teamMembers: -1,
    teamAnalytics: true,
    sharedSkillLibrary: true,
    apiAccess: true,
    customAgents: true,
    prioritySupport: true,
    ssoIntegration: true,
  },
};

export function getPlanFeatures(planId: string | null): PlanFeatures {
  if (!planId || !(planId in PLAN_FEATURES)) {
    return PLAN_FEATURES.free;
  }
  return PLAN_FEATURES[planId as PlanId];
}

export function hasPathAccess(planId: string | null, path: 'student' | 'employee' | 'owner'): boolean {
  const features = getPlanFeatures(planId);
  switch (path) {
    case 'student':
      return features.studentPath;
    case 'employee':
      return features.employeePath;
    case 'owner':
      return features.ownerPath;
  }
}

export function isUnlimited(value: number): boolean {
  return value === -1;
}

export function formatLimit(value: number): string {
  return value === -1 ? 'Unlimited' : value.toString();
}
