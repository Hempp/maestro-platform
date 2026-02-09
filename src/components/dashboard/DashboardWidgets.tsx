'use client';

/**
 * DASHBOARD WIDGETS
 * Enhanced dashboard components for improved UX:
 * - Progress visualization with charts
 * - Quick action cards
 * - Recent activity feed
 * - Gamification elements (XP, achievements, levels)
 */

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

type PathType = 'student' | 'employee' | 'owner';

// ============================================================================
// PROGRESS VISUALIZATION - Weekly Activity Chart
// ============================================================================

interface WeeklyActivityData {
  day: string;
  shortDay: string;
  minutes: number;
  date: Date;
}

function getWeeklyData(): WeeklyActivityData[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fullDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date();
  const result: WeeklyActivityData[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    result.push({
      day: fullDays[date.getDay()],
      shortDay: days[date.getDay()],
      minutes: 0,
      date,
    });
  }

  // Load activity from localStorage
  try {
    const stored = localStorage.getItem('phazur_activity_log');
    if (stored) {
      const log = JSON.parse(stored);
      result.forEach((day) => {
        const dateKey = day.date.toISOString().split('T')[0];
        if (log[dateKey]) {
          day.minutes = log[dateKey];
        }
      });
    }
  } catch (e) {
    console.error('Failed to load activity log:', e);
  }

  return result;
}

export function WeeklyActivityChart({ className = '' }: { className?: string }) {
  const [data, setData] = useState<WeeklyActivityData[]>([]);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  useEffect(() => {
    setData(getWeeklyData());
  }, []);

  const maxMinutes = useMemo(() => Math.max(...data.map(d => d.minutes), 60), [data]);
  const totalMinutes = useMemo(() => data.reduce((sum, d) => sum + d.minutes, 0), [data]);
  const avgMinutes = useMemo(() => Math.round(totalMinutes / 7), [totalMinutes]);

  const getBarColor = (minutes: number) => {
    if (minutes === 0) return 'bg-slate-800';
    if (minutes < 15) return 'bg-cyan-900/60';
    if (minutes < 30) return 'bg-cyan-700/70';
    if (minutes < 60) return 'bg-cyan-500';
    return 'bg-cyan-400';
  };

  return (
    <div className={`bg-slate-800/20 border border-slate-800/40 rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-slate-300">Weekly Activity</h3>
          <p className="text-xs text-slate-600 mt-0.5">Minutes spent learning</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-cyan-400">{totalMinutes}</p>
          <p className="text-[10px] text-slate-600">total minutes</p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="flex items-end justify-between gap-1.5 h-24 mb-3">
        {data.map((day, i) => {
          const height = day.minutes > 0 ? Math.max((day.minutes / maxMinutes) * 100, 8) : 8;
          const isToday = i === data.length - 1;

          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1"
              onMouseEnter={() => setHoveredDay(i)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <div className="relative w-full flex justify-center">
                {/* Tooltip */}
                {hoveredDay === i && (
                  <div className="absolute bottom-full mb-2 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-300 whitespace-nowrap z-10">
                    {day.minutes > 0 ? `${day.minutes} min` : 'No activity'}
                  </div>
                )}
                <div
                  className={`w-full max-w-[28px] rounded-t transition-all duration-300 cursor-pointer hover:opacity-80 ${getBarColor(day.minutes)} ${isToday ? 'ring-1 ring-cyan-500/50' : ''}`}
                  style={{ height: `${height}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Labels */}
      <div className="flex justify-between text-[10px] text-slate-600">
        {data.map((day, i) => (
          <span key={i} className={`flex-1 text-center ${i === data.length - 1 ? 'text-cyan-500' : ''}`}>
            {day.shortDay}
          </span>
        ))}
      </div>

      {/* Average indicator */}
      <div className="mt-3 pt-3 border-t border-slate-800/40 flex items-center justify-between text-xs">
        <span className="text-slate-600">Daily average</span>
        <span className="text-slate-400">{avgMinutes} min/day</span>
      </div>
    </div>
  );
}

// ============================================================================
// MILESTONE PROGRESS CHART - Visual milestone tracker
// ============================================================================

interface MilestoneData {
  number: number;
  title: string;
  status: 'locked' | 'active' | 'completed';
}

export function MilestoneProgressChart({
  milestones,
  pathColor = 'cyan',
  className = '',
}: {
  milestones?: MilestoneData[];
  pathColor?: 'purple' | 'cyan' | 'emerald';
  className?: string;
}) {
  const defaultMilestones: MilestoneData[] = Array.from({ length: 10 }, (_, i) => ({
    number: i + 1,
    title: `Milestone ${i + 1}`,
    status: i === 0 ? 'active' : 'locked',
  }));

  const data = milestones || defaultMilestones;
  const completed = data.filter(m => m.status === 'completed').length;
  const progressPercent = (completed / data.length) * 100;

  const colorClasses = {
    purple: {
      bg: 'bg-purple-500',
      ring: 'ring-purple-500',
      text: 'text-purple-400',
      light: 'bg-purple-500/20',
    },
    cyan: {
      bg: 'bg-cyan-500',
      ring: 'ring-cyan-500',
      text: 'text-cyan-400',
      light: 'bg-cyan-500/20',
    },
    emerald: {
      bg: 'bg-emerald-500',
      ring: 'ring-emerald-500',
      text: 'text-emerald-400',
      light: 'bg-emerald-500/20',
    },
  };

  const colors = colorClasses[pathColor];

  return (
    <div className={`bg-slate-800/20 border border-slate-800/40 rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-slate-300">Milestone Progress</h3>
          <p className="text-xs text-slate-600 mt-0.5">{completed} of {data.length} completed</p>
        </div>
        <div className={`text-lg font-semibold ${colors.text}`}>
          {Math.round(progressPercent)}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full ${colors.bg} rounded-full transition-all duration-500`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Milestone Dots */}
      <div className="flex items-center justify-between">
        {data.map((milestone, i) => {
          const isCompleted = milestone.status === 'completed';
          const isActive = milestone.status === 'active';

          return (
            <div key={i} className="relative group">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer
                  ${isCompleted ? `${colors.bg} text-white` : isActive ? `${colors.light} ${colors.text} ring-2 ${colors.ring}` : 'bg-slate-800 text-slate-600'}
                `}
              >
                {isCompleted ? (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-[10px] font-medium">{milestone.number}</span>
                )}
              </div>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[10px] text-slate-300 whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                {milestone.title}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// QUICK ACTION CARDS
// ============================================================================

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: 'purple' | 'cyan' | 'emerald' | 'amber' | 'rose';
  badge?: string;
}

const defaultQuickActions: QuickAction[] = [
  {
    id: 'continue',
    title: 'Continue Learning',
    description: 'Pick up where you left off',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    href: '/learn',
    color: 'cyan',
  },
  {
    id: 'certificates',
    title: 'View Certificates',
    description: 'Your earned credentials',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    href: '/certificates',
    color: 'emerald',
  },
  {
    id: 'live',
    title: 'Live Courses',
    description: 'Join upcoming sessions',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    href: '/dashboard?view=live-courses',
    color: 'rose',
    badge: 'LIVE',
  },
  {
    id: 'projects',
    title: 'My Projects',
    description: 'View your portfolio',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
    href: '/projects',
    color: 'amber',
  },
];

export function QuickActionCards({
  actions = defaultQuickActions,
  selectedPath,
  className = '',
}: {
  actions?: QuickAction[];
  selectedPath?: PathType | null;
  className?: string;
}) {
  const colorClasses = {
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      text: 'text-purple-400',
      hover: 'hover:bg-purple-500/15 hover:border-purple-500/30',
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      text: 'text-cyan-400',
      hover: 'hover:bg-cyan-500/15 hover:border-cyan-500/30',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      hover: 'hover:bg-emerald-500/15 hover:border-emerald-500/30',
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      hover: 'hover:bg-amber-500/15 hover:border-amber-500/30',
    },
    rose: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      text: 'text-rose-400',
      hover: 'hover:bg-rose-500/15 hover:border-rose-500/30',
    },
  };

  // Update continue learning link based on selected path
  const updatedActions = actions.map(action => {
    if (action.id === 'continue' && selectedPath) {
      return { ...action, href: `/learn/path/${selectedPath}` };
    }
    return action;
  });

  return (
    <div className={className}>
      <h3 className="text-sm font-medium text-slate-300 mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2">
        {updatedActions.map((action) => {
          const colors = colorClasses[action.color];
          return (
            <Link
              key={action.id}
              href={action.href}
              className={`relative p-3 rounded-lg border transition-all ${colors.bg} ${colors.border} ${colors.hover}`}
            >
              {action.badge && (
                <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-medium bg-rose-500 text-white rounded animate-pulse">
                  {action.badge}
                </span>
              )}
              <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center mb-2`}>
                <span className={colors.text}>{action.icon}</span>
              </div>
              <h4 className="text-sm font-medium text-slate-300">{action.title}</h4>
              <p className="text-[10px] text-slate-600 mt-0.5">{action.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// RECENT ACTIVITY FEED
// ============================================================================

interface ActivityItem {
  id: string;
  type: 'lesson' | 'milestone' | 'achievement' | 'streak' | 'certificate';
  title: string;
  description: string;
  timestamp: Date;
  icon?: React.ReactNode;
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

const activityIcons: Record<string, React.ReactNode> = {
  lesson: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  milestone: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  achievement: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  streak: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
    </svg>
  ),
  certificate: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
};

const activityColors: Record<string, { bg: string; text: string }> = {
  lesson: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  milestone: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  achievement: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  streak: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
  certificate: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
};

export function RecentActivityFeed({
  activities,
  maxItems = 5,
  className = '',
}: {
  activities?: ActivityItem[];
  maxItems?: number;
  className?: string;
}) {
  // Generate sample activities if none provided
  const defaultActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'lesson',
      title: 'Completed Terminal Basics',
      description: 'Finished the introduction to command line',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    },
    {
      id: '2',
      type: 'streak',
      title: '3-Day Streak!',
      description: 'Keep up the momentum',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      id: '3',
      type: 'milestone',
      title: 'Milestone 1 Complete',
      description: 'Environment Setup finished',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    },
  ];

  const displayActivities = (activities || defaultActivities).slice(0, maxItems);

  if (displayActivities.length === 0) {
    return (
      <div className={`bg-slate-800/20 border border-slate-800/40 rounded-xl p-4 ${className}`}>
        <h3 className="text-sm font-medium text-slate-300 mb-3">Recent Activity</h3>
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-slate-500">No activity yet</p>
          <p className="text-xs text-slate-600 mt-1">Start learning to see your progress here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800/20 border border-slate-800/40 rounded-xl p-4 ${className}`}>
      <h3 className="text-sm font-medium text-slate-300 mb-3">Recent Activity</h3>
      <div className="space-y-3">
        {displayActivities.map((activity, index) => {
          const colors = activityColors[activity.type];
          const icon = activity.icon || activityIcons[activity.type];

          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                <span className={colors.text}>{icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300 truncate">{activity.title}</p>
                <p className="text-[10px] text-slate-600">{activity.description}</p>
              </div>
              <span className="text-[10px] text-slate-700 flex-shrink-0">
                {getTimeAgo(activity.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// XP & LEVEL DISPLAY - Gamification
// ============================================================================

interface XPDisplayProps {
  currentXP: number;
  level: number;
  xpToNextLevel: number;
  className?: string;
}

export function XPLevelDisplay({
  currentXP = 0,
  level = 1,
  xpToNextLevel = 100,
  className = '',
}: Partial<XPDisplayProps>) {
  const progressPercent = (currentXP / xpToNextLevel) * 100;

  const getLevelTitle = (lvl: number): string => {
    if (lvl < 3) return 'Novice';
    if (lvl < 5) return 'Apprentice';
    if (lvl < 10) return 'Practitioner';
    if (lvl < 15) return 'Expert';
    if (lvl < 20) return 'Master';
    return 'Grandmaster';
  };

  return (
    <div className={`bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-800/40 rounded-xl p-4 ${className}`}>
      <div className="flex items-center gap-4">
        {/* Level Badge */}
        <div className="relative">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <span className="text-xl font-bold text-white">{level}</span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border-2 border-amber-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        </div>

        {/* XP Info */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-amber-400">{getLevelTitle(level)}</span>
            <span className="text-xs text-slate-500">Level {level}</span>
          </div>

          {/* XP Bar */}
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-1.5">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-600">{currentXP} XP</span>
            <span className="text-slate-500">{xpToNextLevel - currentXP} XP to level {level + 1}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ACHIEVEMENT BADGES
// ============================================================================

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const defaultAchievements: Achievement[] = [
  { id: 'first-lesson', name: 'First Steps', description: 'Complete your first lesson', icon: '1', unlocked: true, unlockedAt: new Date(), rarity: 'common' },
  { id: 'streak-3', name: 'On Fire', description: 'Maintain a 3-day streak', icon: '3', unlocked: true, unlockedAt: new Date(), rarity: 'common' },
  { id: 'streak-7', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '7', unlocked: false, rarity: 'rare' },
  { id: 'milestone-5', name: 'Halfway There', description: 'Complete 5 milestones', icon: '5', unlocked: false, rarity: 'rare' },
  { id: 'certified', name: 'Certified', description: 'Earn your first certificate', icon: 'C', unlocked: false, rarity: 'epic' },
  { id: 'master', name: 'AI Master', description: 'Complete all paths', icon: 'M', unlocked: false, rarity: 'legendary' },
];

export function AchievementBadges({
  achievements = defaultAchievements,
  showLocked = true,
  maxDisplay = 6,
  className = '',
}: {
  achievements?: Achievement[];
  showLocked?: boolean;
  maxDisplay?: number;
  className?: string;
}) {
  const rarityColors = {
    common: { bg: 'bg-slate-500', border: 'border-slate-400', glow: '' },
    rare: { bg: 'bg-cyan-500', border: 'border-cyan-400', glow: 'shadow-cyan-500/30' },
    epic: { bg: 'bg-purple-500', border: 'border-purple-400', glow: 'shadow-purple-500/30' },
    legendary: { bg: 'bg-amber-500', border: 'border-amber-400', glow: 'shadow-amber-500/40' },
  };

  const displayAchievements = showLocked
    ? achievements.slice(0, maxDisplay)
    : achievements.filter(a => a.unlocked).slice(0, maxDisplay);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className={`bg-slate-800/20 border border-slate-800/40 rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-300">Achievements</h3>
        <span className="text-xs text-slate-600">{unlockedCount}/{achievements.length}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {displayAchievements.map((achievement) => {
          const colors = rarityColors[achievement.rarity];
          return (
            <div
              key={achievement.id}
              className="relative group"
              title={achievement.name}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all
                  ${achievement.unlocked
                    ? `${colors.bg} text-white shadow-lg ${colors.glow}`
                    : 'bg-slate-800/50 text-slate-700'
                  }
                `}
              >
                <span className="text-sm font-bold">{achievement.icon}</span>
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-center opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 w-32">
                <p className={`text-xs font-medium ${achievement.unlocked ? colors.border.replace('border-', 'text-') : 'text-slate-400'}`}>
                  {achievement.name}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">{achievement.description}</p>
              </div>

              {/* Lock overlay */}
              {!achievement.unlocked && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

interface EmptyStateProps {
  type: 'no-path' | 'no-progress' | 'no-certificates' | 'no-activity';
  onAction?: () => void;
  className?: string;
}

export function EnhancedEmptyState({ type, onAction, className = '' }: EmptyStateProps) {
  const states = {
    'no-path': {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      title: 'Choose Your Learning Path',
      description: 'Select a path to begin your AI mastery journey. Each path is designed for different goals.',
      actionText: 'Explore Paths',
      color: 'cyan',
    },
    'no-progress': {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'Start Your First Lesson',
      description: 'Begin learning and track your progress as you complete milestones.',
      actionText: 'Start Learning',
      color: 'emerald',
    },
    'no-certificates': {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      title: 'No Certificates Yet',
      description: 'Complete your learning path to earn verifiable credentials.',
      actionText: 'View Requirements',
      color: 'purple',
    },
    'no-activity': {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'No Recent Activity',
      description: 'Your learning activity will appear here once you start.',
      actionText: 'Start Now',
      color: 'amber',
    },
  };

  const state = states[type];

  const colorClasses = {
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', btn: 'bg-cyan-500 hover:bg-cyan-600' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', btn: 'bg-emerald-500 hover:bg-emerald-600' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', btn: 'bg-purple-500 hover:bg-purple-600' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', btn: 'bg-amber-500 hover:bg-amber-600' },
  };

  const colors = colorClasses[state.color as keyof typeof colorClasses];

  return (
    <div className={`text-center py-8 px-4 ${className}`}>
      <div className={`w-16 h-16 rounded-2xl ${colors.bg} flex items-center justify-center mx-auto mb-4`}>
        <span className={colors.text}>{state.icon}</span>
      </div>
      <h3 className="text-lg font-medium text-slate-300 mb-2">{state.title}</h3>
      <p className="text-sm text-slate-500 mb-4 max-w-xs mx-auto">{state.description}</p>
      {onAction && (
        <button
          onClick={onAction}
          className={`px-4 py-2 ${colors.btn} text-white text-sm font-medium rounded-lg transition-colors`}
        >
          {state.actionText}
        </button>
      )}
    </div>
  );
}

// ============================================================================
// STATS OVERVIEW CARDS
// ============================================================================

interface StatsOverviewProps {
  totalMinutes: number;
  completedLessons: number;
  currentStreak: number;
  certificatesEarned: number;
  className?: string;
}

export function StatsOverview({
  totalMinutes = 0,
  completedLessons = 0,
  currentStreak = 0,
  certificatesEarned = 0,
  className = '',
}: Partial<StatsOverviewProps>) {
  const stats = [
    {
      label: 'Learning Time',
      value: totalMinutes > 60 ? `${Math.floor(totalMinutes / 60)}h` : `${totalMinutes}m`,
      subValue: totalMinutes > 60 ? `${totalMinutes % 60}m` : null,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'cyan',
    },
    {
      label: 'Lessons Done',
      value: completedLessons.toString(),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'emerald',
    },
    {
      label: 'Day Streak',
      value: currentStreak.toString(),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        </svg>
      ),
      color: 'orange',
    },
    {
      label: 'Certificates',
      value: certificatesEarned.toString(),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      color: 'purple',
    },
  ];

  const colorClasses: Record<string, { bg: string; text: string }> = {
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
  };

  return (
    <div className={`grid grid-cols-4 gap-3 ${className}`}>
      {stats.map((stat, i) => {
        const colors = colorClasses[stat.color];
        return (
          <div key={i} className="bg-slate-800/20 border border-slate-800/40 rounded-lg p-3 text-center">
            <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center mx-auto mb-2`}>
              <span className={colors.text}>{stat.icon}</span>
            </div>
            <div className="flex items-baseline justify-center gap-0.5">
              <span className="text-lg font-semibold text-white">{stat.value}</span>
              {stat.subValue && <span className="text-xs text-slate-500">{stat.subValue}</span>}
            </div>
            <p className="text-[10px] text-slate-600 mt-0.5">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}

export default {
  WeeklyActivityChart,
  MilestoneProgressChart,
  QuickActionCards,
  RecentActivityFeed,
  XPLevelDisplay,
  AchievementBadges,
  EnhancedEmptyState,
  StatsOverview,
};
