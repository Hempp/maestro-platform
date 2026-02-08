/**
 * PHAZUR ANALYTICS
 * Comprehensive analytics and conversion tracking for the platform
 *
 * Easy to plug in any analytics provider:
 * - Google Analytics 4
 * - Mixpanel
 * - PostHog
 * - Amplitude
 * - Segment
 *
 * Usage:
 *   import { analytics } from '@/lib/analytics';
 *   analytics.trackEvent('signup_completed', { tier: 'student' });
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type AnalyticsProvider = 'console' | 'google_analytics' | 'mixpanel' | 'posthog' | 'amplitude' | 'segment';

export interface AnalyticsConfig {
  provider: AnalyticsProvider;
  debug: boolean;
  enabled: boolean;
  // Provider-specific config
  googleAnalyticsId?: string;
  mixpanelToken?: string;
  posthogKey?: string;
  posthogHost?: string;
  amplitudeApiKey?: string;
  segmentWriteKey?: string;
}

export interface UserTraits {
  email?: string;
  name?: string;
  tier?: 'student' | 'employee' | 'owner';
  createdAt?: string;
  role?: 'learner' | 'admin' | 'teacher';
  walletAddress?: string;
  [key: string]: unknown;
}

export interface EventProperties {
  [key: string]: string | number | boolean | null | undefined;
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENT NAMES - Type-safe event tracking
// ═══════════════════════════════════════════════════════════════════════════

export const ANALYTICS_EVENTS = {
  // Page views
  PAGE_VIEW: 'page_view',

  // Authentication
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
  LOGIN_COMPLETED: 'login_completed',
  LOGOUT: 'logout',

  // Onboarding
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_SKIPPED: 'onboarding_skipped',

  // Path selection
  PATH_VIEWED: 'path_viewed',
  PATH_SELECTED: 'path_selected',
  PATH_CHANGED: 'path_changed',

  // Learning milestones
  MILESTONE_STARTED: 'milestone_started',
  MILESTONE_PROGRESS: 'milestone_progress',
  MILESTONE_COMPLETED: 'milestone_completed',

  // AKU (Atomic Knowledge Units)
  AKU_STARTED: 'aku_started',
  AKU_HINT_USED: 'aku_hint_used',
  AKU_COMPLETED: 'aku_completed',
  AKU_FAILED: 'aku_failed',

  // Tutor interactions
  TUTOR_SESSION_STARTED: 'tutor_session_started',
  TUTOR_MESSAGE_SENT: 'tutor_message_sent',
  TUTOR_MESSAGE_RECEIVED: 'tutor_message_received',
  TUTOR_SESSION_ENDED: 'tutor_session_ended',

  // Sandbox
  SANDBOX_OPENED: 'sandbox_opened',
  SANDBOX_CODE_EXECUTED: 'sandbox_code_executed',
  SANDBOX_WORKFLOW_DEPLOYED: 'sandbox_workflow_deployed',

  // Payment
  PAYMENT_PAGE_VIEWED: 'payment_page_viewed',
  PAYMENT_INITIATED: 'payment_initiated',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',

  // Certification
  CERTIFICATION_ELIGIBLE: 'certification_eligible',
  CERTIFICATION_STARTED: 'certification_started',
  CERTIFICATION_EARNED: 'certification_earned',
  SBT_MINTED: 'sbt_minted',

  // Engagement
  STREAK_CONTINUED: 'streak_continued',
  STREAK_BROKEN: 'streak_broken',
  BADGE_EARNED: 'badge_earned',

  // Support
  SUPPORT_TICKET_OPENED: 'support_ticket_opened',
  SUPPORT_ESCALATED: 'support_escalated',

  // Errors
  ERROR_OCCURRED: 'error_occurred',
} as const;

export type AnalyticsEventName = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];

// ═══════════════════════════════════════════════════════════════════════════
// CONVERSION FUNNEL TRACKING
// ═══════════════════════════════════════════════════════════════════════════

export const FUNNEL_STAGES = {
  // Main conversion funnel
  MAIN: {
    name: 'main_conversion',
    stages: [
      'signup_completed',
      'onboarding_completed',
      'path_selected',
      'milestone_completed',
      'payment_completed',
      'certification_earned',
    ] as const,
  },
  // First session funnel
  FIRST_SESSION: {
    name: 'first_session',
    stages: [
      'signup_completed',
      'onboarding_started',
      'path_viewed',
      'aku_started',
      'aku_completed',
    ] as const,
  },
  // Payment funnel
  PAYMENT: {
    name: 'payment_funnel',
    stages: [
      'payment_page_viewed',
      'payment_initiated',
      'payment_completed',
    ] as const,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS CLASS
// ═══════════════════════════════════════════════════════════════════════════

class Analytics {
  private config: AnalyticsConfig;
  private userId: string | null = null;
  private userTraits: UserTraits = {};
  private sessionId: string;
  private pageLoadTime: number;
  private initialized: boolean = false;

  constructor() {
    // Default config - console logging in development
    this.config = {
      provider: 'console',
      debug: process.env.NODE_ENV === 'development',
      enabled: true,
      googleAnalyticsId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
      mixpanelToken: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
      posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      amplitudeApiKey: process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY,
      segmentWriteKey: process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY,
    };

    this.sessionId = this.generateSessionId();
    this.pageLoadTime = Date.now();

    // Auto-detect provider based on available config
    this.autoDetectProvider();
  }

  /**
   * Auto-detect which analytics provider to use based on available config
   */
  private autoDetectProvider(): void {
    if (this.config.posthogKey) {
      this.config.provider = 'posthog';
    } else if (this.config.mixpanelToken) {
      this.config.provider = 'mixpanel';
    } else if (this.config.googleAnalyticsId) {
      this.config.provider = 'google_analytics';
    } else if (this.config.amplitudeApiKey) {
      this.config.provider = 'amplitude';
    } else if (this.config.segmentWriteKey) {
      this.config.provider = 'segment';
    } else {
      this.config.provider = 'console';
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize the analytics system
   */
  public init(): void {
    if (this.initialized) return;

    if (typeof window === 'undefined') return;

    this.initialized = true;

    // Initialize provider-specific setup
    switch (this.config.provider) {
      case 'google_analytics':
        this.initGoogleAnalytics();
        break;
      case 'posthog':
        this.initPostHog();
        break;
      case 'mixpanel':
        this.initMixpanel();
        break;
      case 'amplitude':
        this.initAmplitude();
        break;
      case 'segment':
        this.initSegment();
        break;
      default:
        this.log('Analytics initialized in console mode');
    }
  }

  /**
   * Initialize Google Analytics 4
   */
  private initGoogleAnalytics(): void {
    if (!this.config.googleAnalyticsId) return;

    // GA4 should be loaded via script tag in _document or layout
    this.log('Google Analytics ready with ID:', this.config.googleAnalyticsId);
  }

  /**
   * Initialize PostHog
   */
  private initPostHog(): void {
    if (!this.config.posthogKey || typeof window === 'undefined') return;

    // PostHog initialization would happen here
    // For now, we'll use the window object if posthog is loaded
    this.log('PostHog ready');
  }

  /**
   * Initialize Mixpanel
   */
  private initMixpanel(): void {
    if (!this.config.mixpanelToken) return;
    this.log('Mixpanel ready');
  }

  /**
   * Initialize Amplitude
   */
  private initAmplitude(): void {
    if (!this.config.amplitudeApiKey) return;
    this.log('Amplitude ready');
  }

  /**
   * Initialize Segment
   */
  private initSegment(): void {
    if (!this.config.segmentWriteKey) return;
    this.log('Segment ready');
  }

  /**
   * Log debug messages
   */
  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[Analytics]', ...args);
    }
  }

  /**
   * Identify a user
   */
  public identify(userId: string, traits: UserTraits = {}): void {
    if (!this.config.enabled) return;

    this.userId = userId;
    this.userTraits = { ...this.userTraits, ...traits };

    const identifyData = {
      userId,
      traits: this.userTraits,
      timestamp: new Date().toISOString(),
    };

    switch (this.config.provider) {
      case 'google_analytics':
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('set', 'user_id', userId);
          window.gtag('set', 'user_properties', traits);
        }
        break;
      case 'posthog':
        if (typeof window !== 'undefined' && window.posthog) {
          window.posthog.identify(userId, traits);
        }
        break;
      case 'mixpanel':
        if (typeof window !== 'undefined' && window.mixpanel) {
          window.mixpanel.identify(userId);
          window.mixpanel.people.set(traits);
        }
        break;
      case 'amplitude':
        if (typeof window !== 'undefined' && window.amplitude) {
          window.amplitude.setUserId(userId);
          window.amplitude.setUserProperties(traits);
        }
        break;
      case 'segment':
        if (typeof window !== 'undefined' && window.analytics) {
          window.analytics.identify(userId, traits);
        }
        break;
      default:
        this.log('Identify:', identifyData);
    }
  }

  /**
   * Track a page view
   */
  public trackPageView(page: string, properties: EventProperties = {}): void {
    if (!this.config.enabled) return;

    const pageViewData = {
      page,
      url: typeof window !== 'undefined' ? window.location.href : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      title: typeof document !== 'undefined' ? document.title : '',
      sessionId: this.sessionId,
      userId: this.userId,
      ...properties,
      timestamp: new Date().toISOString(),
    };

    switch (this.config.provider) {
      case 'google_analytics':
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'page_view', {
            page_path: page,
            page_title: pageViewData.title,
            ...properties,
          });
        }
        break;
      case 'posthog':
        if (typeof window !== 'undefined' && window.posthog) {
          window.posthog.capture('$pageview', { $current_url: page, ...properties });
        }
        break;
      case 'mixpanel':
        if (typeof window !== 'undefined' && window.mixpanel) {
          window.mixpanel.track('Page View', { page, ...properties });
        }
        break;
      case 'amplitude':
        if (typeof window !== 'undefined' && window.amplitude) {
          window.amplitude.track('Page View', { page, ...properties });
        }
        break;
      case 'segment':
        if (typeof window !== 'undefined' && window.analytics) {
          window.analytics.page(page, properties);
        }
        break;
      default:
        this.log('Page View:', pageViewData);
    }
  }

  /**
   * Track an event
   */
  public trackEvent(name: AnalyticsEventName | string, properties: EventProperties = {}): void {
    if (!this.config.enabled) return;

    const eventData = {
      event: name,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        userId: this.userId,
        userTier: this.userTraits.tier,
        timestamp: new Date().toISOString(),
        timeOnPage: typeof window !== 'undefined' ? Date.now() - this.pageLoadTime : 0,
      },
    };

    switch (this.config.provider) {
      case 'google_analytics':
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', name, properties);
        }
        break;
      case 'posthog':
        if (typeof window !== 'undefined' && window.posthog) {
          window.posthog.capture(name, properties);
        }
        break;
      case 'mixpanel':
        if (typeof window !== 'undefined' && window.mixpanel) {
          window.mixpanel.track(name, properties);
        }
        break;
      case 'amplitude':
        if (typeof window !== 'undefined' && window.amplitude) {
          window.amplitude.track(name, properties);
        }
        break;
      case 'segment':
        if (typeof window !== 'undefined' && window.analytics) {
          window.analytics.track(name, properties);
        }
        break;
      default:
        this.log('Event:', eventData);
    }
  }

  /**
   * Track a funnel step
   */
  public trackFunnelStep(
    funnelName: string,
    stepName: string,
    stepNumber: number,
    properties: EventProperties = {}
  ): void {
    this.trackEvent('funnel_step', {
      funnel_name: funnelName,
      step_name: stepName,
      step_number: stepNumber,
      ...properties,
    });
  }

  /**
   * Track conversion (e.g., payment completed)
   */
  public trackConversion(
    conversionType: string,
    value?: number,
    currency: string = 'USD',
    properties: EventProperties = {}
  ): void {
    const conversionData = {
      conversion_type: conversionType,
      value,
      currency,
      ...properties,
    };

    // Special handling for revenue/conversion events
    switch (this.config.provider) {
      case 'google_analytics':
        if (typeof window !== 'undefined' && window.gtag && value !== undefined) {
          window.gtag('event', 'purchase', {
            transaction_id: `${Date.now()}`,
            value,
            currency,
            ...properties,
          });
        }
        break;
      case 'posthog':
        if (typeof window !== 'undefined' && window.posthog) {
          window.posthog.capture('conversion', conversionData);
        }
        break;
      case 'mixpanel':
        if (typeof window !== 'undefined' && window.mixpanel) {
          window.mixpanel.track('Conversion', conversionData);
          if (value !== undefined) {
            window.mixpanel.people.track_charge(value);
          }
        }
        break;
      default:
        this.log('Conversion:', conversionData);
    }

    // Also track as regular event
    this.trackEvent('conversion', conversionData);
  }

  /**
   * Track an error
   */
  public trackError(error: Error | string, context: EventProperties = {}): void {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    this.trackEvent(ANALYTICS_EVENTS.ERROR_OCCURRED, {
      error_message: errorMessage,
      error_stack: errorStack,
      ...context,
    });
  }

  /**
   * Reset user identity (on logout)
   */
  public reset(): void {
    this.userId = null;
    this.userTraits = {};
    this.sessionId = this.generateSessionId();

    switch (this.config.provider) {
      case 'posthog':
        if (typeof window !== 'undefined' && window.posthog) {
          window.posthog.reset();
        }
        break;
      case 'mixpanel':
        if (typeof window !== 'undefined' && window.mixpanel) {
          window.mixpanel.reset();
        }
        break;
      case 'amplitude':
        if (typeof window !== 'undefined' && window.amplitude) {
          window.amplitude.reset();
        }
        break;
      case 'segment':
        if (typeof window !== 'undefined' && window.analytics) {
          window.analytics.reset();
        }
        break;
      default:
        this.log('User reset');
    }
  }

  /**
   * Set super properties (included in all events)
   */
  public setSuperProperties(properties: EventProperties): void {
    switch (this.config.provider) {
      case 'mixpanel':
        if (typeof window !== 'undefined' && window.mixpanel) {
          window.mixpanel.register(properties);
        }
        break;
      case 'posthog':
        if (typeof window !== 'undefined' && window.posthog) {
          window.posthog.register(properties);
        }
        break;
      default:
        // Store in user traits for other providers
        this.userTraits = { ...this.userTraits, ...properties };
        this.log('Super properties set:', properties);
    }
  }

  /**
   * Time an event (for performance tracking)
   */
  public timeEvent(eventName: string): void {
    if (typeof window !== 'undefined' && window.mixpanel) {
      window.mixpanel.time_event(eventName);
    }
    // Store start time for other providers
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>)[`_analytics_time_${eventName}`] = Date.now();
    }
  }

  /**
   * Get current user ID
   */
  public getUserId(): string | null {
    return this.userId;
  }

  /**
   * Check if analytics is enabled
   */
  public isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get current provider
   */
  public getProvider(): AnalyticsProvider {
    return this.config.provider;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

export const analytics = new Analytics();

// ═══════════════════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export const trackEvent = analytics.trackEvent.bind(analytics);
export const trackPageView = analytics.trackPageView.bind(analytics);
export const identifyUser = analytics.identify.bind(analytics);
export const trackConversion = analytics.trackConversion.bind(analytics);
export const trackError = analytics.trackError.bind(analytics);

// ═══════════════════════════════════════════════════════════════════════════
// TYPE AUGMENTATIONS FOR WINDOW OBJECT
// ═══════════════════════════════════════════════════════════════════════════

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    posthog?: {
      identify: (userId: string, traits?: Record<string, unknown>) => void;
      capture: (event: string, properties?: Record<string, unknown>) => void;
      reset: () => void;
      register: (properties: Record<string, unknown>) => void;
    };
    mixpanel?: {
      identify: (userId: string) => void;
      track: (event: string, properties?: Record<string, unknown>) => void;
      people: {
        set: (properties: Record<string, unknown>) => void;
        track_charge: (amount: number) => void;
      };
      reset: () => void;
      register: (properties: Record<string, unknown>) => void;
      time_event: (eventName: string) => void;
    };
    amplitude?: {
      setUserId: (userId: string) => void;
      setUserProperties: (properties: Record<string, unknown>) => void;
      track: (event: string, properties?: Record<string, unknown>) => void;
      reset: () => void;
    };
    analytics?: {
      identify: (userId: string, traits?: Record<string, unknown>) => void;
      track: (event: string, properties?: Record<string, unknown>) => void;
      page: (name: string, properties?: Record<string, unknown>) => void;
      reset: () => void;
    };
  }
}
