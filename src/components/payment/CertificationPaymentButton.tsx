'use client';

/**
 * CERTIFICATION PAYMENT BUTTON
 * A button component that triggers Stripe checkout for certification payment
 *
 * Usage:
 * <CertificationPaymentButton
 *   tier="student"
 *   courseId="course-uuid"
 *   certificateId="certificate-uuid"
 * />
 *
 * This component is designed for the pay-after-completion model:
 * - User completes certification
 * - Certificate is generated (unpaid/unverified)
 * - User clicks this button to pay
 * - On successful payment, certificate is marked as verified
 */

import { useState } from 'react';
import { useAnalytics } from '@/components/providers/AnalyticsProvider';

// Pricing display (in dollars)
const TIER_PRICES = {
  student: 49,
  employee: 199,
  owner: 499,
} as const;

const TIER_LABELS = {
  student: 'Student',
  employee: 'Employee',
  owner: 'Owner',
} as const;

type CertificationTier = keyof typeof TIER_PRICES;

interface CertificationPaymentButtonProps {
  tier: CertificationTier;
  courseId: string;
  certificateId: string;
  className?: string;
  disabled?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function CertificationPaymentButton({
  tier,
  courseId,
  certificateId,
  className = '',
  disabled = false,
  onSuccess,
  onError,
}: CertificationPaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { trackPayment, trackEvent } = useAnalytics();

  const price = TIER_PRICES[tier];
  const label = TIER_LABELS[tier];

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    // Track payment initiated
    trackPayment('initiated', price, tier);
    trackEvent('payment_button_clicked', { tier, price, courseId });

    try {
      // Create checkout session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier,
          courseId,
          certificateId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout using the URL
      if (data.url) {
        trackEvent('checkout_redirect', { tier, price });
        onSuccess?.();
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      trackPayment('failed', price, tier);
      trackEvent('payment_error', { tier, error: errorMessage });
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handlePayment}
        disabled={isLoading || disabled}
        className={`
          relative inline-flex items-center justify-center
          px-6 py-3 rounded-lg font-semibold text-white
          transition-all duration-200 ease-in-out
          ${isLoading || disabled
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
          }
          ${className}
        `}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            Complete {label} Certification - ${price}
          </>
        )}
      </button>

      {error && (
        <p className="text-sm text-red-500 mt-1">
          {error}
        </p>
      )}

      <p className="text-xs text-gray-500 text-center">
        Secure payment powered by Stripe
      </p>
    </div>
  );
}

/**
 * COMPACT PAYMENT BUTTON
 * A simpler version for inline use
 */
export function CompactPaymentButton({
  tier,
  courseId,
  certificateId,
  className = '',
}: Omit<CertificationPaymentButtonProps, 'onSuccess' | 'onError'>) {
  const [isLoading, setIsLoading] = useState(false);
  const { trackPayment, trackEvent } = useAnalytics();

  const price = TIER_PRICES[tier];

  const handlePayment = async () => {
    setIsLoading(true);
    trackPayment('initiated', price, tier);

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier, courseId, certificateId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      // Redirect to Stripe Checkout URL directly
      if (data.url) {
        trackEvent('checkout_redirect', { tier, price });
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Payment error:', err);
      trackPayment('failed', price, tier);
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={isLoading}
      className={`
        inline-flex items-center gap-2 px-4 py-2
        text-sm font-medium text-white
        bg-indigo-600 hover:bg-indigo-700
        rounded-md transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {isLoading ? (
        'Processing...'
      ) : (
        <>Pay ${price}</>
      )}
    </button>
  );
}

export default CertificationPaymentButton;
