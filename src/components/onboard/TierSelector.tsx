'use client';

/**
 * TIER SELECTOR
 * Onboarding component to select business tier
 */

import { useRouter } from 'next/navigation';
import type { BusinessTier } from '@/types';
import { useAnalytics } from '@/components/providers/AnalyticsProvider';

const TIERS: {
  id: BusinessTier;
  label: string;
  title: string;
  description: string;
  capstone: string;
  color: string;
  popular?: boolean;
}[] = [
  {
    id: 'student',
    label: 'FOR STUDENTS',
    title: 'Job-Ready Portfolio',
    description: 'Build proof you can do the work of a junior dev or marketer',
    capstone: 'AI-Enhanced Portfolio Website',
    color: 'purple',
  },
  {
    id: 'employee',
    label: 'FOR EMPLOYEES',
    title: 'Efficiency Mastery',
    description: 'Automate your specific 9-5 tasks with custom AI workflows',
    capstone: 'Custom GPT for Internal Docs',
    color: 'blue',
    popular: true,
  },
  {
    id: 'owner',
    label: 'FOR OWNERS',
    title: 'Operations Scaling',
    description: 'Replace manual labor with automated AI chains',
    capstone: 'AI Operations Manual',
    color: 'emerald',
  },
];

export function TierSelector() {
  const router = useRouter();
  const { trackPathSelection, trackEvent } = useAnalytics();

  const selectTier = (tier: BusinessTier) => {
    // Track path selection
    trackPathSelection(tier);
    trackEvent('onboarding_tier_selected', { tier });
    router.push(`/learn?tier=${tier}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Mastery Path</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Each path ends with a deployed AI workflow and an on-chain certificate.
            The AI tutor adapts to your learning style.
          </p>
        </div>

        {/* Tier Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <button
              key={tier.id}
              onClick={() => selectTier(tier.id)}
              className={`relative p-8 rounded-xl bg-slate-900 border-2 text-left transition-all hover:scale-[1.02] ${
                tier.popular
                  ? 'border-blue-500'
                  : 'border-slate-800 hover:border-slate-600'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-xs rounded-full font-medium">
                  MOST POPULAR
                </div>
              )}

              <div className={`text-${tier.color}-400 text-sm font-medium mb-2`}>
                {tier.label}
              </div>

              <h2 className="text-2xl font-bold mb-3">{tier.title}</h2>

              <p className="text-slate-400 mb-6 min-h-[48px]">
                {tier.description}
              </p>

              <div className="pt-4 border-t border-slate-800">
                <div className="text-slate-500 text-sm mb-1">Capstone Project:</div>
                <div className="font-medium">{tier.capstone}</div>
              </div>

              <div className={`mt-6 w-full py-3 rounded-lg text-center font-medium transition ${
                tier.popular
                  ? 'bg-blue-600 hover:bg-blue-500'
                  : 'bg-slate-800 hover:bg-slate-700'
              }`}>
                Start This Path
              </div>
            </button>
          ))}
        </div>

        {/* Info */}
        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>
            All paths include: Socratic AI tutoring • Live workflow sandbox •
            Blockchain-verified certificate
          </p>
        </div>
      </div>
    </div>
  );
}
