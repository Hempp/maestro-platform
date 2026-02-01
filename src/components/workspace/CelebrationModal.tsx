'use client';

/**
 * CELEBRATION MODAL
 * Shown when a learner completes an AKU
 * Displays struggle score and prepares for SBT minting
 */

import type { VerificationResult } from '@/types';

interface CelebrationModalProps {
  result: VerificationResult;
  akuTitle: string;
  onClose: () => void;
  onContinue: () => void;
}

export function CelebrationModal({
  result,
  akuTitle,
  onClose,
  onContinue,
}: CelebrationModalProps) {
  const tier = getPerformanceTier(result.struggleScore);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header with gradient */}
        <div className={`p-8 text-center ${tier.gradient}`}>
          <div className="text-6xl mb-4">{tier.emoji}</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {tier.title}
          </h2>
          <p className="text-white/80">
            You completed "{akuTitle}"
          </p>
        </div>

        {/* Stats */}
        <div className="p-6 space-y-4">
          {/* Struggle Score */}
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400">Struggle Score</span>
              <span className={`text-lg font-bold ${tier.color}`}>
                {result.struggleScore}
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${tier.barColor} transition-all duration-1000`}
                style={{ width: `${100 - result.struggleScore}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Lower is better • {tier.description}
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white">{result.hintsUsed}</div>
              <div className="text-xs text-slate-500">Hints Used</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white">
                {formatTime(result.timeToComplete)}
              </div>
              <div className="text-xs text-slate-500">Time</div>
            </div>
          </div>

          {/* Message */}
          <p className="text-sm text-slate-400 text-center">
            {tier.message}
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
          >
            Review Work
          </button>
          <button
            onClick={onContinue}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition font-medium"
          >
            Continue Learning
          </button>
        </div>
      </div>
    </div>
  );
}

function getPerformanceTier(score: number) {
  if (score <= 20) {
    return {
      title: 'Elite Performance!',
      emoji: '🏆',
      description: 'Top tier - minimal assistance needed',
      message: 'You crushed it! This level of mastery is rare.',
      gradient: 'bg-gradient-to-br from-amber-500 to-orange-600',
      color: 'text-amber-400',
      barColor: 'bg-amber-500',
    };
  }
  if (score <= 40) {
    return {
      title: 'Advanced Mastery',
      emoji: '⭐',
      description: 'Strong performance with confidence',
      message: 'Excellent work! You understood the concepts deeply.',
      gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      color: 'text-emerald-400',
      barColor: 'bg-emerald-500',
    };
  }
  if (score <= 60) {
    return {
      title: 'Solid Progress',
      emoji: '✨',
      description: 'Good understanding, building skills',
      message: "You're building real competency. Keep going!",
      gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      color: 'text-blue-400',
      barColor: 'bg-blue-500',
    };
  }
  if (score <= 80) {
    return {
      title: 'Challenge Accepted',
      emoji: '💪',
      description: 'Pushed through difficulty',
      message: 'You persevered through challenges—that takes grit.',
      gradient: 'bg-gradient-to-br from-purple-500 to-pink-600',
      color: 'text-purple-400',
      barColor: 'bg-purple-500',
    };
  }
  return {
    title: 'Foundation Built',
    emoji: '🌱',
    description: 'Learning fundamentals',
    message: "Every expert was once a beginner. You're on your way!",
    gradient: 'bg-gradient-to-br from-slate-600 to-slate-700',
    color: 'text-slate-400',
    barColor: 'bg-slate-500',
  };
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}
