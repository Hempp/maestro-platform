'use client';

/**
 * ANALYTICS PROVIDER
 * Wraps the app to enable analytics tracking throughout
 *
 * Features:
 * - Automatic page view tracking
 * - User identification on auth state change
 * - Funnel tracking for conversion optimization
 * - Error boundary integration
 */

import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  analytics,
  ANALYTICS_EVENTS,
  FUNNEL_STAGES,
  type AnalyticsEventName,
  type EventProperties,
  type UserTraits,
} from '@/lib/analytics';

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

interface AnalyticsContextValue {
  trackEvent: (name: AnalyticsEventName | string, properties?: EventProperties) => void;
  trackPageView: (page: string, properties?: EventProperties) => void;
  identifyUser: (userId: string, traits?: UserTraits) => void;
  trackConversion: (type: string, value?: number, currency?: string, properties?: EventProperties) => void;
  trackFunnelStep: (funnelName: string, stepName: string, stepNumber: number, properties?: EventProperties) => void;
  // Convenience methods for common events
  trackSignup: (tier: string, method?: string) => void;
  trackOnboarding: (step: number, completed: boolean) => void;
  trackPathSelection: (pathName: string, previousPath?: string) => void;
  trackMilestone: (milestoneNumber: number, action: 'started' | 'completed', properties?: EventProperties) => void;
  trackTutorMessage: (messageType?: string) => void;
  trackPayment: (status: 'initiated' | 'completed' | 'failed', amount?: number, plan?: string) => void;
  trackCertification: (certificationType: string, tier?: string) => void;
  reset: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize analytics on mount
  useEffect(() => {
    analytics.init();
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (pathname) {
      const url = searchParams?.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;

      analytics.trackPageView(url, {
        path: pathname,
        search: searchParams?.toString() || '',
      });
    }
  }, [pathname, searchParams]);

  // ─────────────────────────────────────────────────────────────────────────
  // EVENT TRACKING METHODS
  // ─────────────────────────────────────────────────────────────────────────

  const trackEvent = useCallback((name: AnalyticsEventName | string, properties: EventProperties = {}) => {
    analytics.trackEvent(name, properties);
  }, []);

  const trackPageView = useCallback((page: string, properties: EventProperties = {}) => {
    analytics.trackPageView(page, properties);
  }, []);

  const identifyUser = useCallback((userId: string, traits: UserTraits = {}) => {
    analytics.identify(userId, traits);
  }, []);

  const trackConversion = useCallback((
    type: string,
    value?: number,
    currency: string = 'USD',
    properties: EventProperties = {}
  ) => {
    analytics.trackConversion(type, value, currency, properties);
  }, []);

  const trackFunnelStep = useCallback((
    funnelName: string,
    stepName: string,
    stepNumber: number,
    properties: EventProperties = {}
  ) => {
    analytics.trackFunnelStep(funnelName, stepName, stepNumber, properties);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // CONVENIENCE METHODS FOR COMMON EVENTS
  // ─────────────────────────────────────────────────────────────────────────

  const trackSignup = useCallback((tier: string, method: string = 'email') => {
    analytics.trackEvent(ANALYTICS_EVENTS.SIGNUP_COMPLETED, {
      tier,
      signup_method: method,
    });

    // Track funnel step
    analytics.trackFunnelStep(
      FUNNEL_STAGES.MAIN.name,
      'signup_completed',
      0,
      { tier }
    );
  }, []);

  const trackOnboarding = useCallback((step: number, completed: boolean) => {
    if (completed) {
      analytics.trackEvent(ANALYTICS_EVENTS.ONBOARDING_COMPLETED, { total_steps: step });

      // Track funnel step
      analytics.trackFunnelStep(
        FUNNEL_STAGES.MAIN.name,
        'onboarding_completed',
        1,
        { total_steps: step }
      );
    } else {
      analytics.trackEvent(ANALYTICS_EVENTS.ONBOARDING_STEP_COMPLETED, {
        step_number: step,
      });
    }
  }, []);

  const trackPathSelection = useCallback((pathName: string, previousPath?: string) => {
    analytics.trackEvent(ANALYTICS_EVENTS.PATH_SELECTED, {
      path_name: pathName,
      previous_path: previousPath,
      is_change: !!previousPath,
    });

    // Track funnel step
    analytics.trackFunnelStep(
      FUNNEL_STAGES.MAIN.name,
      'path_selected',
      2,
      { path_name: pathName }
    );
  }, []);

  const trackMilestone = useCallback((
    milestoneNumber: number,
    action: 'started' | 'completed',
    properties: EventProperties = {}
  ) => {
    const eventName = action === 'started'
      ? ANALYTICS_EVENTS.MILESTONE_STARTED
      : ANALYTICS_EVENTS.MILESTONE_COMPLETED;

    analytics.trackEvent(eventName, {
      milestone_number: milestoneNumber,
      ...properties,
    });

    if (action === 'completed') {
      // Track funnel step
      analytics.trackFunnelStep(
        FUNNEL_STAGES.MAIN.name,
        'milestone_completed',
        3,
        { milestone_number: milestoneNumber }
      );
    }
  }, []);

  const trackTutorMessage = useCallback((messageType: string = 'text') => {
    analytics.trackEvent(ANALYTICS_EVENTS.TUTOR_MESSAGE_SENT, {
      message_type: messageType,
    });
  }, []);

  const trackPayment = useCallback((
    status: 'initiated' | 'completed' | 'failed',
    amount?: number,
    plan?: string
  ) => {
    const eventMap = {
      initiated: ANALYTICS_EVENTS.PAYMENT_INITIATED,
      completed: ANALYTICS_EVENTS.PAYMENT_COMPLETED,
      failed: ANALYTICS_EVENTS.PAYMENT_FAILED,
    };

    analytics.trackEvent(eventMap[status], {
      amount,
      plan,
    });

    if (status === 'completed' && amount !== undefined) {
      // Track as conversion
      analytics.trackConversion('payment', amount, 'USD', { plan });

      // Track funnel step
      analytics.trackFunnelStep(
        FUNNEL_STAGES.MAIN.name,
        'payment_completed',
        4,
        { amount, plan }
      );

      // Track payment funnel
      analytics.trackFunnelStep(
        FUNNEL_STAGES.PAYMENT.name,
        'payment_completed',
        2,
        { amount, plan }
      );
    }
  }, []);

  const trackCertification = useCallback((certificationType: string, tier?: string) => {
    analytics.trackEvent(ANALYTICS_EVENTS.CERTIFICATION_EARNED, {
      certification_type: certificationType,
      tier,
    });

    // Track funnel step
    analytics.trackFunnelStep(
      FUNNEL_STAGES.MAIN.name,
      'certification_earned',
      5,
      { certification_type: certificationType, tier }
    );
  }, []);

  const reset = useCallback(() => {
    analytics.reset();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // CONTEXT VALUE
  // ─────────────────────────────────────────────────────────────────────────

  const value: AnalyticsContextValue = {
    trackEvent,
    trackPageView,
    identifyUser,
    trackConversion,
    trackFunnelStep,
    trackSignup,
    trackOnboarding,
    trackPathSelection,
    trackMilestone,
    trackTutorMessage,
    trackPayment,
    trackCertification,
    reset,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useAnalytics(): AnalyticsContextValue {
  const context = useContext(AnalyticsContext);

  if (!context) {
    // Return no-op functions if not wrapped in provider
    // This prevents errors during SSR or when provider is missing
    return {
      trackEvent: () => {},
      trackPageView: () => {},
      identifyUser: () => {},
      trackConversion: () => {},
      trackFunnelStep: () => {},
      trackSignup: () => {},
      trackOnboarding: () => {},
      trackPathSelection: () => {},
      trackMilestone: () => {},
      trackTutorMessage: () => {},
      trackPayment: () => {},
      trackCertification: () => {},
      reset: () => {},
    };
  }

  return context;
}
