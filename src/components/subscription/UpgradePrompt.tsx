'use client';

/**
 * UPGRADE PROMPT COMPONENT
 * Shows when users try to access features above their plan
 */

import Link from 'next/link';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

interface UpgradePromptProps {
  feature: string;
  description?: string;
  requiredPlan?: string;
  compact?: boolean;
}

const PLAN_NAMES: Record<string, string> = {
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
  team_starter: 'Team Starter',
  team_growth: 'Team Growth',
  team_enterprise: 'Team Enterprise',
};

export function UpgradePrompt({ feature, description, requiredPlan, compact = false }: UpgradePromptProps) {
  const planDisplayName = requiredPlan ? PLAN_NAMES[requiredPlan] || requiredPlan : 'a higher plan';

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium truncate">{feature}</p>
          <p className="text-xs text-slate-400">Requires {planDisplayName}</p>
        </div>
        <Link
          href="/pricing"
          className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-lg transition-colors flex-shrink-0"
        >
          Upgrade
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-xl text-center">
      <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-violet-500/20 flex items-center justify-center">
        <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{feature}</h3>
      <p className="text-slate-400 text-sm mb-4">
        {description || `This feature requires ${planDisplayName} or higher.`}
      </p>
      <Link
        href="/pricing"
        className="inline-block px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg transition-colors"
      >
        View Plans
      </Link>
    </div>
  );
}

// Limit reached variant
export function LimitReachedPrompt({
  feature,
  current,
  limit,
  resetDate,
}: {
  feature: string;
  current: number;
  limit: number;
  resetDate?: string;
}) {
  return (
    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-white font-medium mb-1">{feature} Limit Reached</h4>
          <p className="text-slate-400 text-sm mb-3">
            You've used {current} of {limit} this month.
            {resetDate && ` Resets on ${resetDate}.`}
          </p>
          <Link
            href="/pricing"
            className="inline-block px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Upgrade for More
          </Link>
        </div>
      </div>
    </div>
  );
}

// Feature gate wrapper - gates based on plan features
export function FeatureGate({
  feature,
  requiredPlan,
  children,
  fallback,
}: {
  feature: string;
  requiredPlan?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { needsUpgradeFor, loading, features } = useFeatureAccess();

  if (loading) {
    return <div className="animate-pulse bg-slate-800 rounded-xl h-32" />;
  }

  // Check if user has access to this feature based on their plan
  const featureKey = feature.toLowerCase().replace(/\s+/g, '') as keyof typeof features;
  const hasAccess = !needsUpgradeFor(featureKey as keyof import('@/lib/subscription/features').PlanFeatures);

  if (!hasAccess) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <UpgradePrompt feature={feature} requiredPlan={requiredPlan} />
    );
  }

  return <>{children}</>;
}

// Usage gate wrapper - gates based on usage limits
export function UsageGate({
  featureType,
  featureName,
  children,
  onLimitReached,
}: {
  featureType: 'tutor' | 'agent' | 'skill';
  featureName: string;
  children: React.ReactNode;
  onLimitReached?: () => void;
}) {
  // Import dynamically to avoid circular deps
  const { useUsageTracking } = require('@/hooks/useUsageTracking');
  const { canUseTutor, canUseAgent, canUseSkill, tutorUsage, agentUsage, skillUsage, periodEnd, loading } = useUsageTracking();

  if (loading) {
    return <div className="animate-pulse bg-slate-800 rounded-xl h-32" />;
  }

  const canUseMap = { tutor: canUseTutor, agent: canUseAgent, skill: canUseSkill };
  const usageMap = { tutor: tutorUsage, agent: agentUsage, skill: skillUsage };

  const canUse = canUseMap[featureType];
  const usage = usageMap[featureType];

  if (!canUse && usage.limit !== 'unlimited') {
    if (onLimitReached) onLimitReached();
    const resetDate = periodEnd ? periodEnd.toLocaleDateString() : undefined;
    return (
      <LimitReachedPrompt
        feature={featureName}
        current={usage.used}
        limit={usage.limit as number}
        resetDate={resetDate}
      />
    );
  }

  return <>{children}</>;
}
