/**
 * STRIPE TYPES
 * Type definitions for Stripe payment integration
 */

/**
 * Certification tier types matching pricing
 */
export type CertificationTier = 'student' | 'employee' | 'owner';

/**
 * Checkout session request payload
 */
export interface CreateCheckoutRequest {
  tier: CertificationTier;
  courseId: string;
  certificateId: string;
}

/**
 * Checkout session response
 */
export interface CreateCheckoutResponse {
  sessionId: string;
  url: string;
}

/**
 * Payment status from Stripe
 */
export type StripePaymentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled';

/**
 * Webhook event metadata stored in checkout session
 */
export interface CheckoutMetadata {
  userId: string;
  courseId: string;
  certificateId: string;
  tier: CertificationTier;
}

/**
 * Payment record for tracking
 */
export interface PaymentRecord {
  id: string;
  userId: string;
  courseId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripePaymentIntentId?: string;
  stripeSessionId?: string;
  createdAt: string;
  completedAt?: string;
}

/**
 * Certificate verification status after payment
 */
export interface CertificateVerification {
  certificateId: string;
  verifiedAt: string;
  paymentSessionId: string;
  paymentIntentId: string;
  amountPaid: number;
  currency: string;
}

/**
 * Pricing configuration for each tier
 */
export interface TierPricing {
  amount: number; // In cents
  name: string;
  description: string;
}

/**
 * Complete pricing configuration
 */
export type PricingConfig = {
  [K in CertificationTier]: TierPricing;
};
