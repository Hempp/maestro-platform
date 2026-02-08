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

// Certification tier pricing (in cents)
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
