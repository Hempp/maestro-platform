'use client';

/**
 * ONBOARDING FLOW
 * 3-step onboarding to reduce churn and set expectations
 * Step 1: Welcome - explain the journey
 * Step 2: Choose path - Student/Employee/Owner
 * Step 3: Set expectations - time commitment, what you'll build
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type PathType = 'student' | 'employee' | 'owner' | null;

const PATHS = {
  student: {
    title: 'Starter',
    subtitle: 'Student Path',
    description: 'Build a live, AI-enhanced portfolio from the terminal.',
    credential: 'Certified AI Associate',
    price: '$29/mo',
    planId: 'starter',
    time: '2-4 weeks',
    color: 'purple',
    icon: '🎓',
  },
  employee: {
    title: 'Professional',
    subtitle: 'Student + Employee Paths',
    description: 'Unlimited AI coaching and 100 agent executions per month.',
    credential: 'Workflow Efficiency Lead',
    price: '$79/mo',
    planId: 'professional',
    time: '3-5 weeks',
    color: 'blue',
    icon: '💼',
  },
  owner: {
    title: 'Enterprise',
    subtitle: 'All Paths Included',
    description: 'Unlimited access to all features and team collaboration.',
    credential: 'AI Operations Master',
    price: '$199/mo',
    planId: 'enterprise',
    time: '4-6 weeks',
    color: 'emerald',
    icon: '🚀',
  },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedPath, setSelectedPath] = useState<PathType>(null);

  const handlePathSelect = (path: PathType) => {
    setSelectedPath(path);
  };

  const handleComplete = () => {
    // Store path selection
    if (selectedPath) {
      localStorage.setItem('phazur_selected_path', selectedPath);
      // Go directly to the learning path
      router.push(`/learn/path/${selectedPath}`);
    } else {
      router.push('/dashboard');
    }
  };

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors: Record<string, { border: string; bg: string; text: string }> = {
      purple: {
        border: isSelected ? 'border-purple-500' : 'border-slate-700 hover:border-purple-500/50',
        bg: isSelected ? 'bg-purple-500/10' : 'bg-[#1a1d21]',
        text: 'text-purple-400',
      },
      blue: {
        border: isSelected ? 'border-blue-500' : 'border-slate-700 hover:border-blue-500/50',
        bg: isSelected ? 'bg-blue-500/10' : 'bg-[#1a1d21]',
        text: 'text-blue-400',
      },
      emerald: {
        border: isSelected ? 'border-emerald-500' : 'border-slate-700 hover:border-emerald-500/50',
        bg: isSelected ? 'bg-emerald-500/10' : 'bg-[#1a1d21]',
        text: 'text-emerald-400',
      },
    };
    return colors[color] || colors.emerald;
  };

  return (
    <div className="min-h-screen bg-[#0f1115] flex items-center justify-center px-4 py-8 sm:p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6 sm:mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-8 bg-emerald-500'
                  : s < step
                  ? 'w-8 bg-emerald-500/50'
                  : 'w-2 bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-5 sm:mb-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
              <span className="text-3xl sm:text-4xl">🎯</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">Welcome to Phazur</h1>
            <p className="text-slate-400 text-base sm:text-lg mb-6 sm:mb-8 max-w-md mx-auto px-2">
              You're about to master AI through building, not watching. Here's how it works:
            </p>

            <div className="grid gap-3 sm:gap-4 text-left max-w-md mx-auto mb-6 sm:mb-8">
              <div className="flex items-start gap-4 p-4 bg-[#1a1d21] rounded-xl border border-slate-800">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <span className="text-emerald-400 font-bold">1</span>
                </div>
                <div>
                  <h3 className="text-white font-medium">Learn by Building</h3>
                  <p className="text-slate-400 text-sm">No videos. You'll build real projects with AI guidance.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-[#1a1d21] rounded-xl border border-slate-800">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <span className="text-emerald-400 font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-white font-medium">Struggle = Growth</h3>
                  <p className="text-slate-400 text-sm">Our AI coaches you through challenges, building real skills.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-[#1a1d21] rounded-xl border border-slate-800">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <span className="text-emerald-400 font-bold">3</span>
                </div>
                <div>
                  <h3 className="text-white font-medium">Prove Your Skills</h3>
                  <p className="text-slate-400 text-sm">Earn blockchain-verified credentials employers can validate.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full sm:w-auto px-8 py-3.5 min-h-[48px] bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition active:bg-emerald-700"
            >
              Choose Your Path
            </button>
          </div>
        )}

        {/* Step 2: Choose Path */}
        {step === 2 && (
          <div>
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">Choose Your Path</h1>
              <p className="text-slate-400 text-sm sm:text-base">Select the journey that matches your goals</p>
            </div>

            <div className="grid gap-3 sm:gap-4 mb-6 sm:mb-8">
              {(Object.keys(PATHS) as PathType[]).filter(Boolean).map((pathKey) => {
                const path = PATHS[pathKey!];
                const colors = getColorClasses(path.color, selectedPath === pathKey);
                return (
                  <button
                    key={pathKey}
                    onClick={() => handlePathSelect(pathKey)}
                    className={`w-full p-4 sm:p-5 rounded-xl border-2 ${colors.border} ${colors.bg} text-left transition-all duration-200 active:scale-[0.99]`}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="text-2xl sm:text-3xl">{path.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1 gap-2">
                          <h3 className="text-white font-semibold text-base sm:text-lg">{path.title}</h3>
                          <span className={`text-sm font-medium ${colors.text} shrink-0`}>{path.price}</span>
                        </div>
                        <p className="text-slate-500 text-sm mb-1 sm:mb-2">{path.subtitle}</p>
                        <p className="text-slate-400 text-sm">{path.description}</p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3 text-xs">
                          <span className="text-slate-500">~{path.time}</span>
                          <span className={colors.text}>{path.credential}</span>
                        </div>
                      </div>
                      {selectedPath === pathKey && (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 min-h-[48px] text-slate-400 hover:text-white transition text-center"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedPath}
                className="px-8 py-3.5 min-h-[48px] bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-xl transition active:bg-emerald-700"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Set Expectations */}
        {step === 3 && selectedPath && (
          <div className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-5 sm:mb-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
              <span className="text-3xl sm:text-4xl">{PATHS[selectedPath].icon}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">You're Ready!</h1>
            <p className="text-slate-400 text-base sm:text-lg mb-6 sm:mb-8">
              Here's what to expect on {PATHS[selectedPath].title} path
            </p>

            <div className="bg-[#1a1d21] rounded-xl border border-slate-800 p-4 sm:p-6 mb-6 sm:mb-8 text-left max-w-md mx-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Time commitment</span>
                  <span className="text-white font-medium">30-60 min/day</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Estimated duration</span>
                  <span className="text-white font-medium">{PATHS[selectedPath].time}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Credential earned</span>
                  <span className="text-emerald-400 font-medium">{PATHS[selectedPath].credential}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-400">Subscription</span>
                  <span className="text-white font-medium">{PATHS[selectedPath].price}</span>
                </div>
              </div>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6 sm:mb-8 max-w-md mx-auto">
              <p className="text-emerald-400 text-sm">
                <span className="font-medium">Pro tip:</span> Consistent daily practice beats weekend cramming.
                Set a daily reminder to keep your streak alive!
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 min-h-[48px] text-slate-400 hover:text-white transition"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                className="px-8 py-3.5 min-h-[48px] bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition active:bg-emerald-700"
              >
                Start Learning
              </button>
            </div>
          </div>
        )}

        {/* Skip link */}
        <div className="mt-6 sm:mt-8 text-center">
          <Link href="/dashboard" className="inline-block py-3 px-4 min-h-[44px] text-slate-600 hover:text-slate-400 text-sm transition">
            Skip for now
          </Link>
        </div>
      </div>
    </div>
  );
}
