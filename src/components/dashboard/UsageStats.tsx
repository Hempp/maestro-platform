'use client';

/**
 * USAGE STATS COMPONENT
 * Displays current usage vs limits for the user's subscription
 */

import Link from 'next/link';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

interface UsageBarProps {
  label: string;
  used: number;
  limit: number | 'unlimited';
  icon: React.ReactNode;
  color: 'violet' | 'blue' | 'emerald';
}

function UsageBar({ label, used, limit, icon, color }: UsageBarProps) {
  const isUnlimited = limit === 'unlimited';
  const percentage = isUnlimited ? 0 : Math.min(100, (used / (limit as number)) * 100);
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && percentage >= 100;

  const colorClasses = {
    violet: {
      bg: 'bg-violet-500/20',
      fill: 'bg-violet-500',
      text: 'text-violet-400',
    },
    blue: {
      bg: 'bg-blue-500/20',
      fill: 'bg-blue-500',
      text: 'text-blue-400',
    },
    emerald: {
      bg: 'bg-emerald-500/20',
      fill: 'bg-emerald-500',
      text: 'text-emerald-400',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
            {icon}
          </div>
          <span className="text-white font-medium">{label}</span>
        </div>
        <span className={`text-sm ${isAtLimit ? 'text-red-400' : isNearLimit ? 'text-amber-400' : 'text-slate-400'}`}>
          {used} / {isUnlimited ? '∞' : limit}
        </span>
      </div>
      {!isUnlimited && (
        <div className={`h-2 ${colors.bg} rounded-full overflow-hidden`}>
          <div
            className={`h-full ${isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : colors.fill} transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      {isUnlimited && (
        <div className="text-xs text-emerald-400">Unlimited usage</div>
      )}
    </div>
  );
}

export function UsageStats() {
  const { tutorUsage, agentUsage, skillUsage, loading, daysUntilReset } = useUsageTracking();
  const { planName, isSubscribed } = useFeatureAccess();

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-slate-800/50 rounded-xl" />
        <div className="h-24 bg-slate-800/50 rounded-xl" />
        <div className="h-24 bg-slate-800/50 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-white">Usage This Period</h3>
        {daysUntilReset && (
          <span className="text-xs text-slate-400">
            Resets in {daysUntilReset} day{daysUntilReset !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <UsageBar
        label="AI Tutor Sessions"
        used={tutorUsage.used}
        limit={tutorUsage.limit}
        color="violet"
        icon={
          <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        }
      />

      <UsageBar
        label="Agent Executions"
        used={agentUsage.used}
        limit={agentUsage.limit}
        color="blue"
        icon={
          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        }
      />

      <UsageBar
        label="Skill Uses"
        used={skillUsage.used}
        limit={skillUsage.limit}
        color="emerald"
        icon={
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        }
      />

      <div className="pt-2 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Current Plan</span>
          <span className="text-white font-medium">{planName}</span>
        </div>
        {!isSubscribed && (
          <Link
            href="/pricing"
            className="mt-3 block w-full text-center py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Upgrade for More
          </Link>
        )}
      </div>
    </div>
  );
}

// Compact version for sidebar
export function UsageStatsCompact() {
  const { tutorUsage, agentUsage, skillUsage, loading } = useUsageTracking();

  if (loading) {
    return <div className="h-8 bg-slate-800/50 rounded animate-pulse" />;
  }

  const formatUsage = (used: number, limit: number | 'unlimited') => {
    if (limit === 'unlimited') return `${used}`;
    return `${used}/${limit}`;
  };

  return (
    <div className="flex items-center gap-4 text-xs text-slate-400">
      <span title="Tutor Sessions">
        <svg className="w-3 h-3 inline mr-1 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        {formatUsage(tutorUsage.used, tutorUsage.limit)}
      </span>
      <span title="Agent Executions">
        <svg className="w-3 h-3 inline mr-1 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        {formatUsage(agentUsage.used, agentUsage.limit)}
      </span>
      <span title="Skill Uses">
        <svg className="w-3 h-3 inline mr-1 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        {formatUsage(skillUsage.used, skillUsage.limit)}
      </span>
    </div>
  );
}
