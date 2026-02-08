'use client';

/**
 * LEARNING PROGRESS COMPONENTS
 * Dashboard integration for milestone-based learning paths
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';

type PathType = 'student' | 'employee' | 'owner';

interface MilestoneProgress {
  number: number;
  title: string;
  goal: string;
  status: 'locked' | 'active' | 'submitted' | 'approved' | 'needs_revision';
  submittedAt?: string;
  approvedAt?: string;
}

interface LearningProgressData {
  path: PathType | null;
  pathTitle: string;
  currentMilestone: number;
  currentMilestoneTitle: string;
  completedMilestones: number;
  totalMilestones: number;
  progressPercent: number;
  milestones: MilestoneProgress[];
  isEligibleForCertification: boolean;
}

const PATH_STYLES = {
  student: {
    gradient: 'from-purple-500 to-purple-600',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    icon: 'bg-purple-500/20',
    bar: 'bg-purple-500',
    hoverBg: 'hover:bg-purple-500/15',
  },
  employee: {
    gradient: 'from-cyan-500 to-cyan-600',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    icon: 'bg-cyan-500/20',
    bar: 'bg-cyan-500',
    hoverBg: 'hover:bg-cyan-500/15',
  },
  owner: {
    gradient: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    icon: 'bg-emerald-500/20',
    bar: 'bg-emerald-500',
    hoverBg: 'hover:bg-emerald-500/15',
  },
};

const PATH_INFO = {
  student: {
    title: 'The Student',
    subtitle: 'Build a Portfolio',
    description: 'Build a live, AI-enhanced portfolio and earn your Certified AI Associate credential.',
    credential: 'Certified AI Associate',
    price: '$49',
    emoji: '',
  },
  employee: {
    title: 'The Employee',
    subtitle: 'Efficiency Mastery',
    description: 'Create automations that save 10+ hours weekly and earn your Workflow Efficiency Lead credential.',
    credential: 'Workflow Efficiency Lead',
    price: '$199',
    emoji: '',
  },
  owner: {
    title: 'The Owner',
    subtitle: 'Operations Scaling',
    description: 'Build AI systems that replace entire business functions and earn your AI Operations Master credential.',
    credential: 'AI Operations Master',
    price: '$499',
    emoji: '',
  },
};

// Hook to fetch learning progress
export function useLearningProgress() {
  const [progress, setProgress] = useState<LearningProgressData | null>(null);
  const [allPaths, setAllPaths] = useState<Record<string, LearningProgressData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const response = await fetch('/api/user/learning-progress');
        if (!response.ok) {
          if (response.status === 401) {
            // Not authenticated, will use localStorage path
            setIsLoading(false);
            return;
          }
          throw new Error('Failed to fetch progress');
        }
        const data = await response.json();
        setProgress(data.progress);
        setAllPaths(data.allPaths || {});
      } catch (err) {
        console.error('Failed to fetch learning progress:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProgress();
  }, []);

  return { progress, allPaths, isLoading, error };
}

// Hook to get selected path from localStorage
export function useSelectedPath() {
  const [selectedPath, setSelectedPath] = useState<PathType | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('phazur_selected_path');
    if (stored && ['student', 'employee', 'owner'].includes(stored)) {
      setSelectedPath(stored as PathType);
    }
  }, []);

  const savePath = (path: PathType) => {
    localStorage.setItem('phazur_selected_path', path);
    setSelectedPath(path);
  };

  return { selectedPath, savePath };
}

// Continue Learning Card - Main prominent card
export function ContinueLearningCard({
  progress,
  selectedPath,
  className = '',
}: {
  progress: LearningProgressData | null;
  selectedPath: PathType | null;
  className?: string;
}) {
  // Use progress from API if available, otherwise use selected path
  const path = progress?.path || selectedPath;

  if (!path) {
    return null;
  }

  const styles = PATH_STYLES[path];
  const info = PATH_INFO[path];

  const currentMilestone = progress?.currentMilestone || 1;
  const currentMilestoneTitle = progress?.currentMilestoneTitle || 'Getting Started';
  const completedMilestones = progress?.completedMilestones || 0;
  const progressPercent = progress?.progressPercent || 0;

  return (
    <div className={`rounded-xl border ${styles.border} ${styles.bg} p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${styles.icon} flex items-center justify-center`}>
            <svg className={`w-5 h-5 ${styles.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-medium">{info.title}</h3>
            <p className="text-slate-500 text-xs">{info.subtitle}</p>
          </div>
        </div>
        <span className={`text-xs ${styles.text} font-medium`}>
          {completedMilestones}/10 Complete
        </span>
      </div>

      {/* Current Milestone */}
      <div className="mb-4">
        <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Current Milestone</p>
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full bg-gradient-to-br ${styles.gradient} flex items-center justify-center text-white text-xs font-medium`}>
            {currentMilestone}
          </span>
          <span className="text-slate-200 text-sm font-medium">{currentMilestoneTitle}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <span>Progress</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${styles.bar} rounded-full transition-all duration-500`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Continue Button */}
      <Link
        href={`/learn/path/${path}`}
        className={`block w-full py-2.5 rounded-lg bg-gradient-to-r ${styles.gradient} text-white text-sm font-medium text-center transition hover:opacity-90`}
      >
        Continue Learning
      </Link>

      {/* Certification notice */}
      {progress?.isEligibleForCertification && (
        <div className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <p className="text-emerald-400 text-xs text-center">
            You're eligible for certification! Complete your final milestone to earn your credential.
          </p>
        </div>
      )}
    </div>
  );
}

// Milestone Progress Sidebar
export function MilestoneProgressSidebar({
  progress,
  selectedPath,
  onClose,
  className = '',
}: {
  progress: LearningProgressData | null;
  selectedPath: PathType | null;
  onClose?: () => void;
  className?: string;
}) {
  const path = progress?.path || selectedPath;

  if (!path) {
    return null;
  }

  const styles = PATH_STYLES[path];
  const info = PATH_INFO[path];
  const milestones = progress?.milestones || [];

  const getStatusIcon = (status: MilestoneProgress['status']) => {
    switch (status) {
      case 'approved':
        return (
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'active':
        return <div className={`w-2 h-2 ${styles.bar} rounded-full animate-pulse`} />;
      case 'submitted':
        return (
          <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'needs_revision':
        return (
          <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return <div className="w-2 h-2 bg-slate-700 rounded-full" />;
    }
  };

  const getStatusColor = (status: MilestoneProgress['status']) => {
    switch (status) {
      case 'approved':
        return 'border-emerald-500/30 bg-emerald-500/5';
      case 'active':
        return `${styles.border} ${styles.bg}`;
      case 'submitted':
        return 'border-yellow-500/30 bg-yellow-500/5';
      case 'needs_revision':
        return 'border-orange-500/30 bg-orange-500/5';
      default:
        return 'border-slate-800/60 bg-slate-800/20';
    }
  };

  return (
    <div className={`bg-[#0f1115] border border-slate-800/40 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b border-slate-800/40 ${styles.bg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-lg ${styles.icon} flex items-center justify-center`}>
              <svg className={`w-3.5 h-3.5 ${styles.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-300">Milestones</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-600 hover:text-slate-400 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Milestone List */}
      <div className="p-3 space-y-1.5 max-h-[400px] overflow-y-auto scrollbar-thin">
        {milestones.length > 0 ? (
          milestones.map((milestone) => (
            <div
              key={milestone.number}
              className={`p-2.5 rounded-lg border ${getStatusColor(milestone.status)} transition-colors`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-slate-800/50 flex items-center justify-center">
                  {getStatusIcon(milestone.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 text-xs">{milestone.number}.</span>
                    <span className={`text-sm truncate ${
                      milestone.status === 'active' ? styles.text :
                      milestone.status === 'approved' ? 'text-slate-300' :
                      'text-slate-500'
                    }`}>
                      {milestone.title}
                    </span>
                  </div>
                  {milestone.status !== 'locked' && (
                    <p className="text-slate-600 text-[10px] truncate mt-0.5">{milestone.goal}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          // Placeholder milestones when no progress data
          Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className={`p-2.5 rounded-lg border ${i === 0 ? `${styles.border} ${styles.bg}` : 'border-slate-800/60 bg-slate-800/20'}`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-slate-800/50 flex items-center justify-center">
                  {i === 0 ? (
                    <div className={`w-2 h-2 ${styles.bar} rounded-full animate-pulse`} />
                  ) : (
                    <div className="w-2 h-2 bg-slate-700 rounded-full" />
                  )}
                </div>
                <div className="flex-1">
                  <span className={`text-sm ${i === 0 ? styles.text : 'text-slate-500'}`}>
                    Milestone {i + 1}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer with credential info */}
      <div className="px-4 py-3 border-t border-slate-800/40 bg-slate-800/20">
        <p className="text-slate-500 text-xs">
          Complete all milestones to earn: <span className={styles.text}>{info.credential}</span>
        </p>
      </div>
    </div>
  );
}

// Path Selection Cards - For users without a selected path
export function PathSelectionCards({
  onPathSelect,
  className = '',
}: {
  onPathSelect?: (path: PathType) => void;
  className?: string;
}) {
  const handleSelect = (path: PathType) => {
    if (onPathSelect) {
      onPathSelect(path);
    }
    // Save to localStorage
    localStorage.setItem('phazur_selected_path', path);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="mb-4">
        <h3 className="text-white font-medium mb-1">Choose Your Path</h3>
        <p className="text-slate-500 text-sm">Select a learning journey to get started</p>
      </div>

      {(['student', 'employee', 'owner'] as PathType[]).map((path) => {
        const styles = PATH_STYLES[path];
        const info = PATH_INFO[path];

        return (
          <Link
            key={path}
            href={`/learn/path/${path}`}
            onClick={() => handleSelect(path)}
            className={`block p-4 rounded-xl border ${styles.border} ${styles.bg} ${styles.hoverBg} transition-all`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg ${styles.icon} flex items-center justify-center flex-shrink-0`}>
                <svg className={`w-5 h-5 ${styles.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {path === 'student' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                  )}
                  {path === 'employee' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  )}
                  {path === 'owner' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  )}
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-white font-medium">{info.title}</h4>
                  <span className={`text-xs ${styles.text}`}>{info.price}</span>
                </div>
                <p className="text-slate-500 text-xs mb-2">{info.subtitle}</p>
                <p className="text-slate-400 text-xs line-clamp-2">{info.description}</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// Combined Learning Section for Dashboard
export function DashboardLearningSection({ className = '' }: { className?: string }) {
  const { progress, isLoading } = useLearningProgress();
  const { selectedPath, savePath } = useSelectedPath();
  const [showMilestones, setShowMilestones] = useState(false);

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-48 bg-slate-800/30 rounded-xl" />
      </div>
    );
  }

  const hasPath = progress?.path || selectedPath;

  if (!hasPath) {
    return (
      <div className={className}>
        <PathSelectionCards onPathSelect={savePath} />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <ContinueLearningCard progress={progress} selectedPath={selectedPath} />

      {/* Toggle for milestone details */}
      <button
        onClick={() => setShowMilestones(!showMilestones)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-800/30 hover:bg-slate-800/50 border border-slate-800/60 rounded-lg transition"
      >
        <span className="text-slate-400 text-sm">View All Milestones</span>
        <svg
          className={`w-4 h-4 text-slate-500 transition-transform ${showMilestones ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showMilestones && (
        <MilestoneProgressSidebar
          progress={progress}
          selectedPath={selectedPath}
          onClose={() => setShowMilestones(false)}
        />
      )}
    </div>
  );
}

export default DashboardLearningSection;
