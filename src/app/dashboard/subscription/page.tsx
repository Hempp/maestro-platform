'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

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

const planNames: Record<string, string> = {
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
  team_starter: 'Team Starter',
  team_growth: 'Team Growth',
  team_enterprise: 'Team Enterprise',
};

export default function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const success = searchParams.get('success');

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const res = await fetch('/api/stripe/manage-subscription');
      const data = await res.json();
      setSubscription(data.subscription);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'cancel' | 'resume' | 'portal') => {
    setActionLoading(action);
    try {
      const res = await fetch('/api/stripe/manage-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (action === 'portal' && data.url) {
        window.location.href = data.url;
        return;
      }

      if (data.success) {
        fetchSubscription();
      } else if (data.error) {
        alert(data.error);
      }
    } catch (error) {
      console.error('Action failed:', error);
      alert('Failed to process request');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30"
          >
            <p className="text-emerald-400 font-medium">
              Your subscription is now active! Welcome aboard.
            </p>
          </motion.div>
        )}

        <h1 className="text-3xl font-bold text-white mb-8">Subscription</h1>

        {subscription ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8"
          >
            {/* Status Badge */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {planNames[subscription.plan_id] || subscription.plan_id}
                </h2>
                <p className="text-slate-400 capitalize">{subscription.billing_cycle} billing</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  subscription.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : subscription.status === 'past_due'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-slate-500/20 text-slate-400'
                }`}
              >
                {subscription.status}
              </span>
            </div>

            {/* Cancellation Notice */}
            {subscription.cancel_at_period_end && (
              <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <p className="text-amber-400">
                  Your subscription will end on {formatDate(subscription.current_period_end)}
                </p>
              </div>
            )}

            {/* Billing Details */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-slate-900/50 rounded-xl p-4">
                <p className="text-slate-400 text-sm mb-1">Amount</p>
                <p className="text-xl font-semibold text-white">
                  {formatAmount(subscription.amount, subscription.currency)}
                  <span className="text-slate-400 text-sm font-normal">
                    /{subscription.billing_cycle === 'yearly' ? 'year' : 'month'}
                  </span>
                </p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4">
                <p className="text-slate-400 text-sm mb-1">Next billing date</p>
                <p className="text-xl font-semibold text-white">
                  {formatDate(subscription.current_period_end)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => handleAction('portal')}
                disabled={actionLoading === 'portal'}
                className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {actionLoading === 'portal' ? 'Loading...' : 'Manage Billing'}
              </button>

              {subscription.cancel_at_period_end ? (
                <button
                  onClick={() => handleAction('resume')}
                  disabled={actionLoading === 'resume'}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'resume' ? 'Loading...' : 'Resume Subscription'}
                </button>
              ) : (
                <button
                  onClick={() => handleAction('cancel')}
                  disabled={actionLoading === 'cancel'}
                  className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'cancel' ? 'Loading...' : 'Cancel Subscription'}
                </button>
              )}
            </div>

            {/* Upgrade CTA */}
            {!subscription.plan_id.startsWith('team_') && (
              <div className="mt-8 pt-8 border-t border-slate-700">
                <p className="text-slate-400 mb-4">
                  Need more features or team access?
                </p>
                <button
                  onClick={() => router.push('/pricing')}
                  className="text-violet-400 hover:text-violet-300 font-medium"
                >
                  View upgrade options →
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          /* No Subscription */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 text-center"
          >
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No Active Subscription</h2>
            <p className="text-slate-400 mb-6">
              Subscribe to unlock full access to all features and paths.
            </p>
            <button
              onClick={() => router.push('/pricing')}
              className="px-8 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              View Plans
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
