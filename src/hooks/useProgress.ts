/**
 * PROGRESS HOOK
 * Track and update user learning progress
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

interface AkuProgress {
  id: string;
  aku_id: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'verified';
  hints_used: number;
  attempts: number;
  time_spent: number;
  struggle_score: number;
  completed_at: string | null;
  verified_at: string | null;
}

interface ProgressStats {
  completed: number;
  inProgress: number;
  totalTimeSpent: number;
  totalHintsUsed: number;
  averageStruggleScore: number;
  currentStreak: number;
  longestStreak: number;
}

export function useProgress() {
  const [progress, setProgress] = useState<AkuProgress[]>([]);
  const [stats, setStats] = useState<ProgressStats>({
    completed: 0,
    inProgress: 0,
    totalTimeSpent: 0,
    totalHintsUsed: 0,
    averageStruggleScore: 50,
    currentStreak: 0,
    longestStreak: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    try {
      const response = await fetch('/api/user/progress');
      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated, use local state
          return;
        }
        throw new Error('Failed to fetch progress');
      }

      const data = await response.json();
      setProgress(data.progress);
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to fetch progress:', err);
      // Don't set error for unauthenticated users
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const updateProgress = useCallback(async (
    akuId: string,
    updates: Partial<Omit<AkuProgress, 'id' | 'aku_id'>>
  ) => {
    try {
      const response = await fetch('/api/user/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          akuId,
          ...updates,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update progress');
      }

      const data = await response.json();

      // Update local state
      setProgress(prev => {
        const existing = prev.findIndex(p => p.aku_id === akuId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = data.progress;
          return updated;
        }
        return [...prev, data.progress];
      });

      // Refresh stats
      fetchProgress();

      return data.progress;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update progress';
      setError(message);
      throw err;
    }
  }, [fetchProgress]);

  const startAku = useCallback((akuId: string) => {
    return updateProgress(akuId, { status: 'in_progress' });
  }, [updateProgress]);

  const completeAku = useCallback((akuId: string, timeSpent: number, hintsUsed: number) => {
    return updateProgress(akuId, {
      status: 'completed',
      time_spent: timeSpent,
      hints_used: hintsUsed,
    });
  }, [updateProgress]);

  const verifyAku = useCallback((akuId: string, struggleScore: number) => {
    return updateProgress(akuId, {
      status: 'verified',
      struggle_score: struggleScore,
    });
  }, [updateProgress]);

  const getAkuProgress = useCallback((akuId: string) => {
    return progress.find(p => p.aku_id === akuId);
  }, [progress]);

  return {
    progress,
    stats,
    isLoading,
    error,
    updateProgress,
    startAku,
    completeAku,
    verifyAku,
    getAkuProgress,
    refresh: fetchProgress,
  };
}
