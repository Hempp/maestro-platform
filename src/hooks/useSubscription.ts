/**
 * SUBSCRIPTION HOOK
 * Fetches and manages subscription state
 */

import { useState, useEffect } from 'react';

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  billing_cycle: string;
  amount: number;
  currency: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
}

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  isActive: boolean;
  isPastDue: boolean;
  isCancelling: boolean;
  planName: string;
  daysRemaining: number;
  refetch: () => Promise<void>;
}

const planNames: Record<string, string> = {
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
  team_starter: 'Team Starter',
  team_growth: 'Team Growth',
  team_enterprise: 'Team Enterprise',
};

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stripe/manage-subscription');
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setSubscription(null);
      } else {
        setSubscription(data.subscription);
        setError(null);
      }
    } catch (_err) {
      setError('Failed to fetch subscription');
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  const isPastDue = subscription?.status === 'past_due';
  const isCancelling = subscription?.cancel_at_period_end === true;
  const planName = subscription ? planNames[subscription.plan_id] || subscription.plan_id : 'Free';

  const daysRemaining = subscription?.current_period_end
    ? Math.max(0, Math.ceil((new Date(subscription.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    subscription,
    loading,
    error,
    isActive,
    isPastDue,
    isCancelling,
    planName,
    daysRemaining,
    refetch: fetchSubscription,
  };
}
