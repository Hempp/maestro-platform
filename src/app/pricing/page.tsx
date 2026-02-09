'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

// Simple icon components
const Check = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const Zap = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const Building2 = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const Users = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const plans = {
  individual: [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Perfect for individuals getting started',
      monthlyPrice: 29,
      yearlyPrice: 290,
      features: [
        'Access to Student path',
        '10 AI tutor sessions/month',
        'Basic sandbox challenges',
        'Community access',
        'Email support',
      ],
      icon: Zap,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'For professionals automating workflows',
      monthlyPrice: 79,
      yearlyPrice: 790,
      popular: true,
      features: [
        'Student + Employee paths',
        'Unlimited AI tutor sessions',
        'Advanced sandbox challenges',
        'Priority community access',
        'Chat support',
        '100 agent executions/month',
        'Custom skill creation',
      ],
      icon: Building2,
      color: 'from-violet-500 to-purple-500',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For business owners building AI ops',
      monthlyPrice: 199,
      yearlyPrice: 1990,
      features: [
        'ALL paths (Student, Employee, Owner)',
        'Unlimited AI tutor sessions',
        'Full sandbox environment',
        'Unlimited agent executions',
        'Team collaboration (up to 5)',
        'Priority support',
        'Custom agent creation',
        'API access',
        'White-label certificates',
      ],
      icon: Building2,
      color: 'from-amber-500 to-orange-500',
    },
  ],
  team: [
    {
      id: 'team_starter',
      name: 'Team Starter',
      description: 'For small teams (up to 10)',
      monthlyPrice: 499,
      yearlyPrice: 4990,
      features: [
        'Up to 10 team members',
        'All Enterprise features',
        'Team analytics dashboard',
        'Shared skill library',
        'Admin controls',
        'SSO integration',
      ],
      icon: Users,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      id: 'team_growth',
      name: 'Team Growth',
      description: 'For growing teams (up to 50)',
      monthlyPrice: 1499,
      yearlyPrice: 14990,
      features: [
        'Up to 50 team members',
        'Everything in Team Starter',
        'Dedicated success manager',
        'Custom training programs',
        'Advanced analytics',
        'Custom integrations',
      ],
      icon: Users,
      color: 'from-rose-500 to-pink-500',
    },
    {
      id: 'team_enterprise',
      name: 'Team Enterprise',
      description: 'For large organizations',
      monthlyPrice: 4999,
      yearlyPrice: 49990,
      features: [
        'Unlimited team members',
        'Everything in Team Growth',
        'Custom deployment',
        'SLA guarantees',
        'On-call support',
        'Compliance reporting',
      ],
      icon: Users,
      color: 'from-slate-600 to-slate-800',
    },
  ],
};

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    setLoading(planId);
    try {
      const res = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billingCycle }),
      });

      const data = await res.json();

      if (data.error) {
        if (data.error.includes('Authentication')) {
          router.push('/login?redirect=/pricing');
          return;
        }
        alert(data.error);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="pt-20 pb-12 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold text-white mb-4"
        >
          Simple, Transparent Pricing
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-slate-400 max-w-2xl mx-auto px-4"
        >
          Choose the plan that fits your journey. Upgrade or downgrade anytime.
        </motion.p>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 flex items-center justify-center gap-4"
        >
          <span className={billingCycle === 'monthly' ? 'text-white' : 'text-slate-500'}>
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(b => b === 'monthly' ? 'yearly' : 'monthly')}
            className="relative w-14 h-7 bg-slate-700 rounded-full transition-colors"
          >
            <div
              className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${
                billingCycle === 'yearly' ? 'left-8' : 'left-1'
              }`}
            />
          </button>
          <span className={billingCycle === 'yearly' ? 'text-white' : 'text-slate-500'}>
            Yearly
            <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">
              Save 17%
            </span>
          </span>
        </motion.div>
      </div>

      {/* Individual Plans */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-semibold text-white mb-8 text-center">Individual Plans</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {plans.individual.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className={`relative rounded-2xl border ${
                plan.popular
                  ? 'border-violet-500/50 bg-slate-800/80'
                  : 'border-slate-700/50 bg-slate-800/50'
              } p-8`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-medium px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${plan.color} flex items-center justify-center mb-4`}>
                <plan.icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <p className="text-slate-400 text-sm mt-1">{plan.description}</p>

              <div className="mt-6">
                <span className="text-4xl font-bold text-white">
                  ${billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice}
                </span>
                <span className="text-slate-400">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
              </div>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading === plan.id}
                className={`mt-6 w-full py-3 rounded-xl font-medium transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:opacity-90'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === plan.id ? 'Loading...' : 'Get Started'}
              </button>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                    <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Team Plans */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-semibold text-white mb-8 text-center">Team Plans</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {plans.team.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-8"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${plan.color} flex items-center justify-center mb-4`}>
                <plan.icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <p className="text-slate-400 text-sm mt-1">{plan.description}</p>

              <div className="mt-6">
                <span className="text-4xl font-bold text-white">
                  ${billingCycle === 'yearly'
                    ? plan.yearlyPrice.toLocaleString()
                    : plan.monthlyPrice.toLocaleString()}
                </span>
                <span className="text-slate-400">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
              </div>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading === plan.id}
                className="mt-6 w-full py-3 rounded-xl font-medium bg-slate-700 text-white hover:bg-slate-600 transition-all disabled:opacity-50"
              >
                {loading === plan.id ? 'Loading...' : 'Contact Sales'}
              </button>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                    <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>

      {/* FAQ or CTA */}
      <div className="border-t border-slate-800 py-16 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Ready to master AI?</h2>
        <p className="text-slate-400 mb-8">
          Start with our free tier and upgrade when you're ready.
        </p>
        <button
          onClick={() => router.push('/signup')}
          className="bg-white text-slate-900 px-8 py-3 rounded-xl font-medium hover:bg-slate-100 transition-all"
        >
          Start Free Trial
        </button>
      </div>
    </div>
  );
}
