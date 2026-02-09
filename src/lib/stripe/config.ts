/**
 * STRIPE CONFIGURATION
 * Centralized Stripe configuration for the Phazur platform
 */

import Stripe from 'stripe';

// Lazy-initialize Stripe to avoid build-time errors when env vars aren't available
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    });
  }
  return _stripe;
}

// For backward compatibility
export const stripe = {
  get checkout() { return getStripe().checkout; },
  get customers() { return getStripe().customers; },
  get paymentIntents() { return getStripe().paymentIntents; },
  get webhooks() { return getStripe().webhooks; },
};

// Certification tier pricing (in cents) - One-time payments
export const CERTIFICATION_PRICES = {
  student: {
    amount: 4900, // $49
    name: 'Student Certification',
    description: 'Phazur Student Level Certification',
  },
  employee: {
    amount: 19900, // $199
    name: 'Employee Certification',
    description: 'Phazur Employee Level Certification',
  },
  owner: {
    amount: 49900, // $499
    name: 'Owner Certification',
    description: 'Phazur Owner Level Certification',
  },
} as const;

export type CertificationTier = keyof typeof CERTIFICATION_PRICES;

// Validate that a tier is valid
export function isValidTier(tier: string): tier is CertificationTier {
  return tier in CERTIFICATION_PRICES;
}

// ============================================================================
// SUBSCRIPTION PLANS - Recurring Revenue Model
// ============================================================================

export const SUBSCRIPTION_PLANS = {
  // Individual plans
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for individuals getting started with AI mastery',
    monthlyAmount: 2900, // $29/month
    yearlyAmount: 29000, // $290/year (2 months free)
    features: [
      'Access to Student path',
      '10 AI tutor sessions/month',
      'Basic sandbox challenges',
      'Community access',
      'Email support',
    ],
    limits: {
      tutorSessions: 10,
      agentExecutions: 50,
      skillUses: 100,
    },
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'For professionals automating their workflows',
    monthlyAmount: 7900, // $79/month
    yearlyAmount: 79000, // $790/year (2 months free)
    features: [
      'Access to Student + Employee paths',
      'Unlimited AI tutor sessions',
      'Advanced sandbox challenges',
      'Priority community access',
      'Chat support',
      '100 agent executions/month',
      'Custom skill creation',
    ],
    limits: {
      tutorSessions: -1, // unlimited
      agentExecutions: 100,
      skillUses: 500,
    },
    popular: true,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For business owners building AI operations',
    monthlyAmount: 19900, // $199/month
    yearlyAmount: 199000, // $1990/year (2 months free)
    features: [
      'Access to ALL paths (Student, Employee, Owner)',
      'Unlimited AI tutor sessions',
      'Full sandbox environment',
      'Unlimited agent executions',
      'Team collaboration (up to 5)',
      'Priority support',
      'Custom agent creation',
      'API access',
      'White-label certificates',
    ],
    limits: {
      tutorSessions: -1,
      agentExecutions: -1,
      skillUses: -1,
    },
  },

  // Team plans - Higher revenue
  team_starter: {
    id: 'team_starter',
    name: 'Team Starter',
    description: 'For small teams (up to 10 members)',
    monthlyAmount: 49900, // $499/month
    yearlyAmount: 499000, // $4990/year
    features: [
      'Up to 10 team members',
      'All individual Enterprise features',
      'Team analytics dashboard',
      'Shared skill library',
      'Team agent deployments',
      'Admin controls',
      'SSO integration',
    ],
    limits: {
      teamMembers: 10,
      agentExecutions: -1,
      skillUses: -1,
    },
  },
  team_growth: {
    id: 'team_growth',
    name: 'Team Growth',
    description: 'For growing teams (up to 50 members)',
    monthlyAmount: 149900, // $1,499/month
    yearlyAmount: 1499000, // $14,990/year
    features: [
      'Up to 50 team members',
      'Everything in Team Starter',
      'Dedicated success manager',
      'Custom training programs',
      'Advanced analytics',
      'Custom integrations',
      'Priority API access',
    ],
    limits: {
      teamMembers: 50,
      agentExecutions: -1,
      skillUses: -1,
    },
  },
  team_enterprise: {
    id: 'team_enterprise',
    name: 'Team Enterprise',
    description: 'For large organizations (unlimited)',
    monthlyAmount: 499900, // $4,999/month
    yearlyAmount: 4999000, // $49,990/year
    features: [
      'Unlimited team members',
      'Everything in Team Growth',
      'Custom deployment',
      'SLA guarantees',
      'On-call support',
      'Custom agent development',
      'Training & onboarding',
      'Compliance reporting',
    ],
    limits: {
      teamMembers: -1,
      agentExecutions: -1,
      skillUses: -1,
    },
  },
} as const;

export type SubscriptionPlanId = keyof typeof SUBSCRIPTION_PLANS;

export function isValidPlan(planId: string): planId is SubscriptionPlanId {
  return planId in SUBSCRIPTION_PLANS;
}

export function getSubscriptionPlan(planId: SubscriptionPlanId) {
  return SUBSCRIPTION_PLANS[planId];
}

// ============================================================================
// REVENUE CALCULATIONS
// ============================================================================

/**
 * Calculate monthly revenue needed to hit $50k/month target
 *
 * Scenario 1: Certifications only (one-time)
 * - 100 Owner certs @ $499 = $49,900
 * - Need continuous pipeline of completions
 *
 * Scenario 2: Subscriptions (recurring)
 * - 50 Professional @ $79/mo = $3,950
 * - 100 Enterprise @ $199/mo = $19,900
 * - 5 Team Starter @ $499/mo = $2,495
 * - 10 Team Growth @ $1,499/mo = $14,990
 * - 2 Team Enterprise @ $4,999/mo = $9,998
 * Total: $51,333/month recurring
 *
 * Optimal Mix: Subscriptions + Certifications
 */
export const REVENUE_TARGET = 50000; // $50,000/month

export function calculateRevenueProjection(subscribers: Record<SubscriptionPlanId, number>): number {
  let total = 0;
  for (const [planId, count] of Object.entries(subscribers)) {
    if (isValidPlan(planId)) {
      total += SUBSCRIPTION_PLANS[planId].monthlyAmount * count / 100;
    }
  }
  return total;
}

// ============================================================================
// MENTOR SESSIONS - Additional Revenue Stream
// ============================================================================

export const MENTOR_SESSION_PRICES = {
  single: {
    amount: 9900, // $99
    name: 'Single Mentor Session',
    description: '60-minute 1:1 session with an AI expert',
    duration: 60,
  },
  pack_4: {
    amount: 34900, // $349 (save $47)
    name: '4-Session Pack',
    description: 'Four 60-minute sessions (save 12%)',
    duration: 60,
    sessions: 4,
  },
  pack_8: {
    amount: 59900, // $599 (save $193)
    name: '8-Session Pack',
    description: 'Eight 60-minute sessions (save 24%)',
    duration: 60,
    sessions: 8,
  },
} as const;

export type MentorSessionType = keyof typeof MENTOR_SESSION_PRICES;
