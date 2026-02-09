/**
 * USAGE TRACKING HOOK
 * Tracks and manages feature usage for the current user
 */

import { useState, useEffect, useCallback } from 'react';
import { useFeatureAccess } from './useFeatureAccess';

interface Usage {
  tutor_sessions: number;
  agent_executions: number;
  skill_uses: number;
  period_start: string | null;
  period_end: string | null;
}

interface UseUsageTrackingReturn {
  // Current usage
  usage: Usage | null;
  loading: boolean;
  error: string | null;

  // Usage vs limits
  tutorUsage: { used: number; limit: number | 'unlimited'; remaining: number | 'unlimited' };
  agentUsage: { used: number; limit: number | 'unlimited'; remaining: number | 'unlimited' };
  skillUsage: { used: number; limit: number | 'unlimited'; remaining: number | 'unlimited' };

  // Limit checks
  canUseTutor: boolean;
  canUseAgent: boolean;
  canUseSkill: boolean;

  // Actions
  incrementTutor: () => Promise<boolean>;
  incrementAgent: () => Promise<boolean>;
  incrementSkill: () => Promise<boolean>;
  refresh: () => Promise<void>;

  // Period info
  periodStart: Date | null;
  periodEnd: Date | null;
  daysUntilReset: number | null;
}

export function useUsageTracking(): UseUsageTrackingReturn {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { features } = useFeatureAccess();

  const fetchUsage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/usage');
      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated - that's fine, just no usage
          setUsage(null);
          return;
        }
        throw new Error('Failed to fetch usage');
      }

      const data = await response.json();
      setUsage(data.usage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch usage');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const increment = async (feature: 'tutor' | 'agent' | 'skill'): Promise<boolean> => {
    try {
      const response = await fetch('/api/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature }),
      });

      if (!response.ok) {
        return false;
      }

      // Refresh usage after increment
      await fetchUsage();
      return true;
    } catch {
      return false;
    }
  };

  // Calculate usage vs limits
  const calculateUsage = (
    used: number,
    limit: number
  ): { used: number; limit: number | 'unlimited'; remaining: number | 'unlimited' } => {
    if (limit === -1) {
      return { used, limit: 'unlimited', remaining: 'unlimited' };
    }
    return { used, limit, remaining: Math.max(0, limit - used) };
  };

  const tutorUsage = calculateUsage(
    usage?.tutor_sessions || 0,
    features.tutorSessionsPerMonth
  );
  const agentUsage = calculateUsage(
    usage?.agent_executions || 0,
    features.agentExecutionsPerMonth
  );
  const skillUsage = calculateUsage(usage?.skill_uses || 0, features.skillUsesPerMonth);

  // Check if can use (has remaining)
  const canUseTutor = tutorUsage.remaining === 'unlimited' || tutorUsage.remaining > 0;
  const canUseAgent = agentUsage.remaining === 'unlimited' || agentUsage.remaining > 0;
  const canUseSkill = skillUsage.remaining === 'unlimited' || skillUsage.remaining > 0;

  // Period dates
  const periodStart = usage?.period_start ? new Date(usage.period_start) : null;
  const periodEnd = usage?.period_end ? new Date(usage.period_end) : null;
  const daysUntilReset = periodEnd
    ? Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    usage,
    loading,
    error,
    tutorUsage,
    agentUsage,
    skillUsage,
    canUseTutor,
    canUseAgent,
    canUseSkill,
    incrementTutor: () => increment('tutor'),
    incrementAgent: () => increment('agent'),
    incrementSkill: () => increment('skill'),
    refresh: fetchUsage,
    periodStart,
    periodEnd,
    daysUntilReset,
  };
}
