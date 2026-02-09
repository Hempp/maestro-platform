/**
 * FEATURE ACCESS HOOK
 * Combines subscription state with feature access checks
 */

import { useMemo } from 'react';
import { useSubscription } from './useSubscription';
import { getPlanFeatures, hasPathAccess, toDisplayLimit, PlanFeatures } from '@/lib/subscription/features';

interface UseFeatureAccessReturn {
  // Subscription state
  loading: boolean;
  isSubscribed: boolean;
  planId: string | null;
  planName: string;

  // Feature access
  features: PlanFeatures;
  canAccessPath: (path: 'student' | 'employee' | 'owner') => boolean;
  canUseTutor: boolean;
  canUseAgents: boolean;
  canCreateCustomSkills: boolean;
  canAccessApi: boolean;
  hasTeamAccess: boolean;

  // Limits
  tutorSessionsRemaining: number | 'unlimited';
  agentExecutionsRemaining: number | 'unlimited';

  // Upgrade prompts
  needsUpgradeFor: (feature: keyof PlanFeatures) => boolean;
  getUpgradePlan: (feature: keyof PlanFeatures) => string | null;
}

// Which plan unlocks which features
const FEATURE_UNLOCK_PLAN: Partial<Record<keyof PlanFeatures, string>> = {
  employeePath: 'professional',
  ownerPath: 'enterprise',
  customSkillCreation: 'professional',
  apiAccess: 'enterprise',
  customAgents: 'enterprise',
  teamAnalytics: 'team_starter',
  ssoIntegration: 'team_starter',
};

export function useFeatureAccess(): UseFeatureAccessReturn {
  const { subscription, loading, isActive, planName } = useSubscription();

  const planId = isActive ? subscription?.plan_id || null : null;
  const features = useMemo(() => getPlanFeatures(planId), [planId]);

  const canAccessPath = (path: 'student' | 'employee' | 'owner') => {
    return hasPathAccess(planId, path);
  };

  const needsUpgradeFor = (feature: keyof PlanFeatures) => {
    const value = features[feature];
    if (typeof value === 'boolean') return !value;
    if (typeof value === 'number') return value === 0;
    return false;
  };

  const getUpgradePlan = (feature: keyof PlanFeatures) => {
    return FEATURE_UNLOCK_PLAN[feature] || null;
  };

  return {
    loading,
    isSubscribed: isActive,
    planId,
    planName,
    features,
    canAccessPath,
    canUseTutor: features.tutorSessionsPerMonth !== 0,
    canUseAgents: features.agentExecutionsPerMonth !== 0,
    canCreateCustomSkills: features.customSkillCreation,
    canAccessApi: features.apiAccess,
    hasTeamAccess: features.teamMembers !== 0,
    tutorSessionsRemaining: toDisplayLimit(features.tutorSessionsPerMonth),
    agentExecutionsRemaining: toDisplayLimit(features.agentExecutionsPerMonth),
    needsUpgradeFor,
    getUpgradePlan,
  };
}
