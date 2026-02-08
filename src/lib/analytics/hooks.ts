/**
 * ANALYTICS HOOKS
 * Specialized hooks for common analytics patterns
 */

import { useEffect, useRef, useCallback } from 'react';
import { analytics, ANALYTICS_EVENTS, type EventProperties } from './index';

// ═══════════════════════════════════════════════════════════════════════════
// TIME ON PAGE TRACKING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Track time spent on a page/component
 * Sends event when component unmounts or page changes
 */
export function useTimeOnPage(pageName: string) {
  const startTime = useRef<number>(Date.now());
  const pageNameRef = useRef(pageName);

  useEffect(() => {
    startTime.current = Date.now();
    pageNameRef.current = pageName;

    return () => {
      const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
      analytics.trackEvent('time_on_page', {
        page: pageNameRef.current,
        seconds: timeSpent,
      });
    };
  }, [pageName]);
}

// ═══════════════════════════════════════════════════════════════════════════
// SCROLL DEPTH TRACKING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Track scroll depth on a page
 * Fires at 25%, 50%, 75%, and 100% scroll milestones
 */
export function useScrollDepth(pageName: string) {
  const milestonesReached = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const milestones = [25, 50, 75, 100];

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      for (const milestone of milestones) {
        if (scrollPercent >= milestone && !milestonesReached.current.has(milestone)) {
          milestonesReached.current.add(milestone);
          analytics.trackEvent('scroll_depth', {
            page: pageName,
            depth: milestone,
          });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      milestonesReached.current.clear();
    };
  }, [pageName]);
}

// ═══════════════════════════════════════════════════════════════════════════
// ENGAGEMENT TRACKING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Track user engagement metrics
 * Monitors clicks, scrolls, and activity
 */
export function useEngagement(sectionName: string) {
  const clickCount = useRef(0);
  const lastActivity = useRef<number>(Date.now());
  const isEngaged = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ENGAGEMENT_THRESHOLD = 10000; // 10 seconds of activity

    const markEngaged = () => {
      if (!isEngaged.current) {
        const timeSinceStart = Date.now() - lastActivity.current;
        if (timeSinceStart >= ENGAGEMENT_THRESHOLD) {
          isEngaged.current = true;
          analytics.trackEvent('user_engaged', {
            section: sectionName,
            clicks: clickCount.current,
          });
        }
      }
    };

    const handleClick = () => {
      clickCount.current++;
      markEngaged();
    };

    const handleActivity = () => {
      lastActivity.current = Date.now();
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('scroll', handleActivity, { passive: true });
    document.addEventListener('mousemove', handleActivity, { passive: true });

    const engagementTimer = setInterval(markEngaged, 5000);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleActivity);
      document.removeEventListener('mousemove', handleActivity);
      clearInterval(engagementTimer);
    };
  }, [sectionName]);

  return {
    getClickCount: () => clickCount.current,
    isEngaged: () => isEngaged.current,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MILESTONE TRACKING
// ═══════════════════════════════════════════════════════════════════════════

interface MilestoneTrackerOptions {
  milestoneNumber: number;
  milestoneName?: string;
  pathName?: string;
}

/**
 * Track milestone progress
 * Automatically fires started event on mount and completed on unmount (if completed)
 */
export function useMilestoneTracking({ milestoneNumber, milestoneName, pathName }: MilestoneTrackerOptions) {
  const completed = useRef(false);
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    // Track milestone started
    analytics.trackEvent(ANALYTICS_EVENTS.MILESTONE_STARTED, {
      milestone_number: milestoneNumber,
      milestone_name: milestoneName,
      path_name: pathName,
    });

    startTime.current = Date.now();

    return () => {
      // Track time spent on milestone
      const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
      analytics.trackEvent('milestone_time', {
        milestone_number: milestoneNumber,
        seconds: timeSpent,
        completed: completed.current,
      });
    };
  }, [milestoneNumber, milestoneName, pathName]);

  const markCompleted = useCallback((properties: EventProperties = {}) => {
    if (completed.current) return;
    completed.current = true;

    const timeSpent = Math.round((Date.now() - startTime.current) / 1000);

    analytics.trackEvent(ANALYTICS_EVENTS.MILESTONE_COMPLETED, {
      milestone_number: milestoneNumber,
      milestone_name: milestoneName,
      path_name: pathName,
      time_to_complete: timeSpent,
      ...properties,
    });
  }, [milestoneNumber, milestoneName, pathName]);

  const trackProgress = useCallback((progressPercent: number) => {
    analytics.trackEvent(ANALYTICS_EVENTS.MILESTONE_PROGRESS, {
      milestone_number: milestoneNumber,
      progress_percent: progressPercent,
    });
  }, [milestoneNumber]);

  return {
    markCompleted,
    trackProgress,
    isCompleted: () => completed.current,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// AKU (ATOMIC KNOWLEDGE UNIT) TRACKING
// ═══════════════════════════════════════════════════════════════════════════

interface AKUTrackerOptions {
  akuId: string;
  akuTitle?: string;
  category?: string;
}

/**
 * Track AKU completion and hints
 */
export function useAKUTracking({ akuId, akuTitle, category }: AKUTrackerOptions) {
  const hintsUsed = useRef(0);
  const attempts = useRef(0);
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    analytics.trackEvent(ANALYTICS_EVENTS.AKU_STARTED, {
      aku_id: akuId,
      aku_title: akuTitle,
      category,
    });

    startTime.current = Date.now();
  }, [akuId, akuTitle, category]);

  const trackHintUsed = useCallback((hintNumber: number) => {
    hintsUsed.current++;
    analytics.trackEvent(ANALYTICS_EVENTS.AKU_HINT_USED, {
      aku_id: akuId,
      hint_number: hintNumber,
      total_hints_used: hintsUsed.current,
    });
  }, [akuId]);

  const trackAttempt = useCallback((success: boolean, properties: EventProperties = {}) => {
    attempts.current++;
    const timeSpent = Math.round((Date.now() - startTime.current) / 1000);

    if (success) {
      analytics.trackEvent(ANALYTICS_EVENTS.AKU_COMPLETED, {
        aku_id: akuId,
        aku_title: akuTitle,
        category,
        hints_used: hintsUsed.current,
        attempts: attempts.current,
        time_to_complete: timeSpent,
        ...properties,
      });
    } else {
      analytics.trackEvent(ANALYTICS_EVENTS.AKU_FAILED, {
        aku_id: akuId,
        attempt_number: attempts.current,
        ...properties,
      });
    }
  }, [akuId, akuTitle, category]);

  return {
    trackHintUsed,
    trackAttempt,
    getHintsUsed: () => hintsUsed.current,
    getAttempts: () => attempts.current,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TUTOR SESSION TRACKING
// ═══════════════════════════════════════════════════════════════════════════

interface TutorSessionOptions {
  sessionId?: string;
  context?: string;
}

/**
 * Track tutor session interactions
 */
export function useTutorTracking({ sessionId, context }: TutorSessionOptions = {}) {
  const messageCount = useRef(0);
  const sessionStartTime = useRef<number>(Date.now());

  const startSession = useCallback(() => {
    sessionStartTime.current = Date.now();
    analytics.trackEvent(ANALYTICS_EVENTS.TUTOR_SESSION_STARTED, {
      session_id: sessionId,
      context,
    });
  }, [sessionId, context]);

  const trackMessage = useCallback((messageType: 'sent' | 'received', content?: string) => {
    messageCount.current++;
    const event = messageType === 'sent'
      ? ANALYTICS_EVENTS.TUTOR_MESSAGE_SENT
      : ANALYTICS_EVENTS.TUTOR_MESSAGE_RECEIVED;

    analytics.trackEvent(event, {
      session_id: sessionId,
      message_number: messageCount.current,
      content_length: content?.length,
    });
  }, [sessionId]);

  const endSession = useCallback(() => {
    const sessionDuration = Math.round((Date.now() - sessionStartTime.current) / 1000);
    analytics.trackEvent(ANALYTICS_EVENTS.TUTOR_SESSION_ENDED, {
      session_id: sessionId,
      duration_seconds: sessionDuration,
      message_count: messageCount.current,
    });
  }, [sessionId]);

  return {
    startSession,
    trackMessage,
    endSession,
    getMessageCount: () => messageCount.current,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SANDBOX TRACKING
// ═══════════════════════════════════════════════════════════════════════════

interface SandboxOptions {
  sandboxId?: string;
  sandboxType?: string;
}

/**
 * Track sandbox interactions
 */
export function useSandboxTracking({ sandboxId, sandboxType }: SandboxOptions = {}) {
  const executionCount = useRef(0);

  const trackOpened = useCallback(() => {
    analytics.trackEvent(ANALYTICS_EVENTS.SANDBOX_OPENED, {
      sandbox_id: sandboxId,
      sandbox_type: sandboxType,
    });
  }, [sandboxId, sandboxType]);

  const trackExecution = useCallback((success: boolean, executionTime?: number) => {
    executionCount.current++;
    analytics.trackEvent(ANALYTICS_EVENTS.SANDBOX_CODE_EXECUTED, {
      sandbox_id: sandboxId,
      execution_number: executionCount.current,
      success,
      execution_time_ms: executionTime,
    });
  }, [sandboxId]);

  const trackDeployment = useCallback((properties: EventProperties = {}) => {
    analytics.trackEvent(ANALYTICS_EVENTS.SANDBOX_WORKFLOW_DEPLOYED, {
      sandbox_id: sandboxId,
      sandbox_type: sandboxType,
      ...properties,
    });
  }, [sandboxId, sandboxType]);

  return {
    trackOpened,
    trackExecution,
    trackDeployment,
    getExecutionCount: () => executionCount.current,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// STREAK TRACKING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Track learning streak
 */
export function useStreakTracking() {
  const trackStreakContinued = useCallback((currentStreak: number, isPersonalBest: boolean = false) => {
    analytics.trackEvent(ANALYTICS_EVENTS.STREAK_CONTINUED, {
      current_streak: currentStreak,
      is_personal_best: isPersonalBest,
    });
  }, []);

  const trackStreakBroken = useCallback((previousStreak: number) => {
    analytics.trackEvent(ANALYTICS_EVENTS.STREAK_BROKEN, {
      previous_streak: previousStreak,
    });
  }, []);

  return {
    trackStreakContinued,
    trackStreakBroken,
  };
}
