'use client';

/**
 * STREAK COUNTER COMPONENT
 * Displays user's activity streak with visual feedback
 * - Fire icon that grows with streak
 * - Glow effect for active streaks
 * - Encouraging messages
 */

import { useState, useEffect } from 'react';

interface StreakCounterProps {
  currentStreak?: number;
  longestStreak?: number;
  className?: string;
}

// Streak-based encouragement messages
const getStreakMessage = (streak: number): string => {
  if (streak === 0) return "Start your streak today!";
  if (streak === 1) return "Great start! Keep it going!";
  if (streak === 2) return "2 days strong!";
  if (streak === 3) return "You're on fire!";
  if (streak < 7) return "Building momentum!";
  if (streak < 14) return "One week warrior!";
  if (streak < 30) return "Unstoppable!";
  if (streak < 60) return "Legend in the making!";
  return "AI Mastery Unlocked!";
};

// Get fire size based on streak
const getFireSize = (streak: number): { width: string; height: string } => {
  if (streak === 0) return { width: 'w-5', height: 'h-5' };
  if (streak < 3) return { width: 'w-5', height: 'h-5' };
  if (streak < 7) return { width: 'w-6', height: 'h-6' };
  if (streak < 14) return { width: 'w-7', height: 'h-7' };
  if (streak < 30) return { width: 'w-8', height: 'h-8' };
  return { width: 'w-9', height: 'h-9' };
};

// Get glow intensity based on streak
const getGlowClass = (streak: number): string => {
  if (streak === 0) return '';
  if (streak < 3) return 'shadow-orange-500/20';
  if (streak < 7) return 'shadow-orange-500/30';
  if (streak < 14) return 'shadow-orange-500/40';
  if (streak < 30) return 'shadow-orange-500/50';
  return 'shadow-orange-500/60';
};

// Fire icon SVG with gradient
function FireIcon({ streak }: { streak: number }) {
  const size = getFireSize(streak);
  const isActive = streak > 0;

  return (
    <div className={`relative ${size.width} ${size.height} transition-all duration-300`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={`w-full h-full ${isActive ? 'animate-pulse' : ''}`}
        style={{ animationDuration: '2s' }}
      >
        <defs>
          <linearGradient id="fireGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={isActive ? "#f97316" : "#475569"} />
            <stop offset="50%" stopColor={isActive ? "#fb923c" : "#64748b"} />
            <stop offset="100%" stopColor={isActive ? "#fbbf24" : "#94a3b8"} />
          </linearGradient>
        </defs>
        <path
          d="M12 2C10.5 4.5 7 7 7 11c0 2.5 1.5 4.5 3.5 5.5C10 15.5 9 14 9 12.5c0-1 .5-2 1.5-3 .5 1 1 2 1.5 2.5.5-1.5 1-3 .5-4.5C14.5 9 16 10 16.5 12c.3-1 .5-2 .5-3 0-1-.5-2-1-2.5C18 8 19 10 19 13c0 3.5-3 6-7 7-4-1-7-3.5-7-7 0-4 3-7.5 5-9.5C11 2.5 11.5 2 12 2z"
          fill="url(#fireGradient)"
        />
      </svg>
      {/* Glow effect for active streaks */}
      {isActive && streak >= 3 && (
        <div className="absolute inset-0 blur-md opacity-50 -z-10">
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <path
              d="M12 2C10.5 4.5 7 7 7 11c0 2.5 1.5 4.5 3.5 5.5C10 15.5 9 14 9 12.5c0-1 .5-2 1.5-3 .5 1 1 2 1.5 2.5.5-1.5 1-3 .5-4.5C14.5 9 16 10 16.5 12c.3-1 .5-2 .5-3 0-1-.5-2-1-2.5C18 8 19 10 19 13c0 3.5-3 6-7 7-4-1-7-3.5-7-7 0-4 3-7.5 5-9.5C11 2.5 11.5 2 12 2z"
              fill="#f97316"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

export function StreakCounter({ currentStreak = 0, longestStreak = 0, className = '' }: StreakCounterProps) {
  const [displayStreak, setDisplayStreak] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const glowClass = getGlowClass(currentStreak);
  const message = getStreakMessage(currentStreak);
  const isActive = currentStreak > 0;

  // Animate streak number on change
  useEffect(() => {
    if (currentStreak !== displayStreak) {
      setIsAnimating(true);
      const timeout = setTimeout(() => {
        setDisplayStreak(currentStreak);
        setIsAnimating(false);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [currentStreak, displayStreak]);

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-300
        ${isActive
          ? 'bg-orange-500/5 border-orange-500/20 shadow-lg ' + glowClass
          : 'bg-slate-800/30 border-slate-800/60'
        }
        ${className}
      `}
    >
      {/* Fire Icon */}
      <div className="flex-shrink-0">
        <FireIcon streak={currentStreak} />
      </div>

      {/* Streak Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span
            className={`
              text-lg font-semibold transition-all duration-300
              ${isAnimating ? 'scale-125' : 'scale-100'}
              ${isActive ? 'text-orange-400' : 'text-slate-500'}
            `}
          >
            {displayStreak}
          </span>
          <span className={`text-xs ${isActive ? 'text-orange-400/70' : 'text-slate-600'}`}>
            day{currentStreak !== 1 ? 's' : ''}
          </span>
        </div>
        <p className={`text-xs truncate ${isActive ? 'text-orange-300/60' : 'text-slate-600'}`}>
          {message}
        </p>
      </div>

      {/* Best Streak Badge */}
      {longestStreak > 0 && longestStreak > currentStreak && (
        <div className="flex-shrink-0 text-right">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider">Best</p>
          <p className="text-xs text-slate-500 font-medium">{longestStreak}</p>
        </div>
      )}
    </div>
  );
}

// Hook for localStorage-based streak tracking (fallback when not authenticated)
export function useLocalStreak() {
  const [streak, setStreak] = useState({ current: 0, longest: 0 });

  useEffect(() => {
    // Load streak from localStorage
    const loadStreak = () => {
      try {
        const stored = localStorage.getItem('phazur_streak');
        if (stored) {
          const data = JSON.parse(stored);
          const lastActivity = new Date(data.lastActivityDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          lastActivity.setHours(0, 0, 0, 0);

          const diffDays = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays === 0) {
            // Same day, keep streak
            setStreak({ current: data.currentStreak, longest: data.longestStreak });
          } else if (diffDays === 1) {
            // Yesterday, streak continues if they do activity today
            setStreak({ current: data.currentStreak, longest: data.longestStreak });
          } else {
            // Streak broken
            setStreak({ current: 0, longest: data.longestStreak });
          }
        }
      } catch (e) {
        console.error('Failed to load streak:', e);
      }
    };

    loadStreak();
  }, []);

  const recordActivity = () => {
    try {
      const stored = localStorage.getItem('phazur_streak');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let newStreak = 1;
      let longestStreak = 1;

      if (stored) {
        const data = JSON.parse(stored);
        const lastActivity = new Date(data.lastActivityDate);
        lastActivity.setHours(0, 0, 0, 0);

        const diffDays = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          // Already recorded today
          return { current: data.currentStreak, longest: data.longestStreak };
        } else if (diffDays === 1) {
          // Consecutive day
          newStreak = data.currentStreak + 1;
        }
        // else: streak broken, start fresh

        longestStreak = Math.max(data.longestStreak, newStreak);
      }

      const newData = {
        currentStreak: newStreak,
        longestStreak,
        lastActivityDate: today.toISOString(),
      };

      localStorage.setItem('phazur_streak', JSON.stringify(newData));
      setStreak({ current: newStreak, longest: longestStreak });

      return { current: newStreak, longest: longestStreak };
    } catch (e) {
      console.error('Failed to record activity:', e);
      return streak;
    }
  };

  return { streak, recordActivity };
}

export default StreakCounter;
