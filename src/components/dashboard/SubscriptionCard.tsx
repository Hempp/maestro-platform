'use client';

/**
 * SUBSCRIPTION CARD
 * Shows subscription status in the dashboard
 */

import Link from 'next/link';
import { useSubscription } from '@/hooks/useSubscription';

export function SubscriptionCard() {
  const { subscription, loading, isActive, isPastDue, isCancelling, planName, daysRemaining } = useSubscription();

  if (loading) {
    return (
      <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-24 mb-2" />
        <div className="h-6 bg-slate-700 rounded w-32" />
      </div>
    );
  }

  // No subscription - show upgrade prompt
  if (!subscription) {
    return (
      <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Plan</p>
            <p className="text-white font-semibold">Free Trial</p>
          </div>
          <Link
            href="/pricing"
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Upgrade
          </Link>
        </div>
      </div>
    );
  }

  // Past due - show warning
  if (isPastDue) {
    return (
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-amber-400 text-xs uppercase tracking-wider mb-1">Payment Required</p>
            <p className="text-white font-semibold">{planName}</p>
          </div>
          <Link
            href="/dashboard/subscription"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Update Payment
          </Link>
        </div>
      </div>
    );
  }

  // Active subscription
  return (
    <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-slate-400 text-xs uppercase tracking-wider">Plan</p>
            {isActive && (
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-medium rounded">
                Active
              </span>
            )}
          </div>
          <p className="text-white font-semibold">{planName}</p>
          {isCancelling && (
            <p className="text-amber-400 text-xs mt-1">
              Ends in {daysRemaining} days
            </p>
          )}
        </div>
        <Link
          href="/dashboard/subscription"
          className="px-3 py-1.5 text-slate-400 hover:text-white text-sm font-medium transition-colors"
        >
          Manage →
        </Link>
      </div>
    </div>
  );
}

// Compact version for sidebar
export function SubscriptionBadge() {
  const { subscription, loading, isActive, planName } = useSubscription();

  if (loading) {
    return <div className="h-6 w-16 bg-slate-700 rounded animate-pulse" />;
  }

  if (!subscription) {
    return (
      <Link
        href="/pricing"
        className="px-2 py-1 bg-violet-500/20 text-violet-400 text-xs font-medium rounded hover:bg-violet-500/30 transition-colors"
      >
        Upgrade
      </Link>
    );
  }

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded ${
        isActive
          ? 'bg-emerald-500/20 text-emerald-400'
          : 'bg-amber-500/20 text-amber-400'
      }`}
    >
      {planName}
    </span>
  );
}
