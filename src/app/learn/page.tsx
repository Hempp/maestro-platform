'use client';

/**
 * LEARNING PATH VIEW
 * Project-based learning with real deliverables
 * No quizzes - all meaningful projects for portfolio building
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

interface ModulePreview {
  id: string;
  title: string;
  description: string;
  duration: number;
  order: number;
  category: string;
  prerequisites: string[];
  projectTitle: string;
}

interface Certificate {
  id: string;
  certificate_type: string;
  issued_at: string;
  metadata: {
    certificationName: string;
    designation: string;
  };
}

interface ProgressRecord {
  aku_id: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'verified';
}

const TIER_INFO = {
  student: {
    title: 'The Student',
    subtitle: 'Build a Job-Ready Portfolio',
    cert: 'Certified AI Associate',
    description: 'Learn AI fundamentals and build a portfolio that proves your skills to employers.',
  },
  employee: {
    title: 'The Employee',
    subtitle: 'Efficiency Mastery',
    cert: 'Workflow Efficiency Lead',
    description: 'Automate your work and become the AI expert on your team.',
  },
  owner: {
    title: 'The Owner',
    subtitle: 'Operations Scaling',
    cert: 'AI Operations Master',
    description: 'Transform your business operations with AI agents and automation.',
  },
};

function ModuleCard({
  module,
  index,
  status,
  completedModules,
}: {
  module: ModulePreview;
  index: number;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  completedModules: string[];
}) {
  const isLocked = status === 'locked';
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';

  return (
    <div
      className={`relative p-5 rounded-lg border transition ${
        isLocked
          ? 'bg-slate-900/30 border-slate-800/40 opacity-60'
          : isCompleted
          ? 'bg-slate-800/30 border-green-500/20'
          : isInProgress
          ? 'bg-slate-800/40 border-cyan-500/30'
          : 'bg-slate-800/30 border-slate-800/60 hover:border-slate-700'
      }`}
    >
      {/* Module Number */}
      <div
        className={`absolute -top-2.5 -left-2.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
          isCompleted
            ? 'bg-green-500/80 text-white'
            : isInProgress
            ? 'bg-cyan-500/80 text-white'
            : 'bg-slate-800 text-slate-500 border border-slate-700'
        }`}
      >
        {isCompleted ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          index + 1
        )}
      </div>

      {/* Lock Icon */}
      {isLocked && (
        <div className="absolute top-3 right-3">
          <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
      )}

      {/* Category Badge */}
      <div className="mb-3">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/60 text-slate-500 uppercase tracking-wider">
          {module.category}
        </span>
      </div>

      <h3 className="text-sm font-medium text-slate-200 mb-1.5">{module.title}</h3>
      <p className="text-slate-500 text-xs mb-3 line-clamp-2">{module.description}</p>

      {/* Project Preview */}
      <div className="p-2.5 rounded bg-slate-900/50 border border-slate-800/40 mb-3">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-600 mb-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          PROJECT
        </div>
        <p className="text-slate-400 text-[11px]">{module.projectTitle}</p>
      </div>

      <div className="flex items-center gap-3 text-[10px] text-slate-600 mb-4">
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {module.duration} min
        </span>
      </div>

      {!isLocked && (
        <Link
          href={`/dashboard?module=${module.id}`}
          className={`block w-full py-2.5 text-center rounded-lg text-xs font-medium transition ${
            isCompleted
              ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
              : isInProgress
              ? 'bg-cyan-500 text-white hover:bg-cyan-400'
              : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {isCompleted ? 'Review Module' : isInProgress ? 'Continue Learning' : 'Start Module'}
        </Link>
      )}
    </div>
  );
}

export default function LearnPage() {
  const { user } = useAuth();
  const [selectedTier, setSelectedTier] = useState<'student' | 'employee' | 'owner'>('student');
  const [modules, setModules] = useState<ModulePreview[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch curriculum
  useEffect(() => {
    async function fetchCurriculum() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/curriculum?tier=${selectedTier}`);
        if (!response.ok) {
          throw new Error('Failed to fetch curriculum');
        }
        const data = await response.json();
        setModules(data.modules || []);
      } catch (err) {
        console.error('Failed to fetch curriculum:', err);
        setError('Unable to load curriculum. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCurriculum();
  }, [selectedTier]);

  // Fetch user progress
  useEffect(() => {
    async function fetchProgress() {
      if (!user) {
        setProgress([]);
        return;
      }

      try {
        const response = await fetch('/api/user/progress');
        if (response.ok) {
          const data = await response.json();
          setProgress(data.progress || []);
        }
      } catch (error) {
        console.error('Failed to fetch progress:', error);
      }
    }

    fetchProgress();
  }, [user]);

  // Fetch certificates
  useEffect(() => {
    async function fetchCertificates() {
      if (!user) return;

      try {
        const response = await fetch('/api/certificates');
        if (response.ok) {
          const data = await response.json();
          setCertificates(data.certificates || []);
        }
      } catch (error) {
        console.error('Failed to fetch certificates:', error);
      }
    }

    fetchCertificates();
  }, [user]);

  // Calculate module status
  const getModuleStatus = (module: ModulePreview, index: number): 'locked' | 'available' | 'in_progress' | 'completed' => {
    const progressRecord = progress.find((p) => p.aku_id === module.id);

    if (progressRecord?.status === 'completed' || progressRecord?.status === 'verified') {
      return 'completed';
    }
    if (progressRecord?.status === 'in_progress') {
      return 'in_progress';
    }

    // First module is always available
    if (index === 0) return 'available';

    // Check prerequisites
    const allPrereqsMet = module.prerequisites.every((prereqId) => {
      const prereqProgress = progress.find((p) => p.aku_id === prereqId);
      return prereqProgress?.status === 'completed' || prereqProgress?.status === 'verified';
    });

    // Also check previous module
    const prevModule = modules[index - 1];
    const prevProgress = progress.find((p) => p.aku_id === prevModule?.id);
    const prevCompleted = prevProgress?.status === 'completed' || prevProgress?.status === 'verified';

    if (allPrereqsMet && prevCompleted) {
      return 'available';
    }

    return 'locked';
  };

  const completedModules = modules.filter(
    (m) => progress.find((p) => p.aku_id === m.id)?.status === 'completed'
  );
  const completionPercent = modules.length > 0 ? Math.round((completedModules.length / modules.length) * 100) : 0;
  const tierInfo = TIER_INFO[selectedTier];

  return (
    <div className="min-h-screen bg-[#0f1115]">
      {/* Navigation - Matches Homepage */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/40 bg-[#0f1115]/80 backdrop-blur-xl">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Phazur" width={32} height={32} className="invert opacity-90" />
            <span className="text-lg font-semibold tracking-tight">PHAZUR</span>
            <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded font-mono">
              v2.0
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/#about" className="text-slate-500 hover:text-white transition-colors text-sm">
              About
            </Link>
            <Link href="/#paths" className="text-slate-500 hover:text-white transition-colors text-sm">
              Paths
            </Link>
            <Link href="/learn" className="text-cyan-400 text-sm">
              Learn
            </Link>
            <Link href="/#teams" className="text-slate-500 hover:text-white transition-colors text-sm">
              Teams
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors"
                >
                  Dashboard
                </Link>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 pt-24">
        {/* Path Selector */}
        <div className="mb-10">
          <h1 className="text-lg font-semibold text-slate-200 mb-4">Choose Your Path</h1>

          <div className="grid md:grid-cols-3 gap-3">
            {(['student', 'employee', 'owner'] as const).map((tier) => {
              const info = TIER_INFO[tier];
              const isSelected = selectedTier === tier;

              return (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`p-4 rounded-lg border text-left transition ${
                    isSelected
                      ? 'bg-slate-800/50 border-cyan-500/30'
                      : 'bg-slate-800/20 border-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <h3 className="text-sm font-medium text-slate-300 mb-0.5">{info.title}</h3>
                  <p className="text-slate-600 text-xs mb-2">{info.subtitle}</p>
                  <div
                    className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800/60 text-slate-500'
                    }`}
                  >
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                    {info.cert}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 p-5 bg-slate-800/30 rounded-lg border border-slate-800/40">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-medium text-slate-300">{tierInfo.title} Path</h2>
              <p className="text-slate-600 text-xs mt-0.5">{tierInfo.description}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-slate-300">{completionPercent}%</p>
              <p className="text-slate-600 text-[10px]">
                {completedModules.length} of {modules.length} modules
              </p>
            </div>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(completionPercent, 2)}%` }}
            />
          </div>
        </div>

        {/* Certificates Earned */}
        {certificates.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-slate-400 mb-3">Your Certificates</h2>
            <div className="grid md:grid-cols-3 gap-3">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="p-3 rounded-lg border bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-green-500/20"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-green-400">
                        {cert.metadata?.certificationName ||
                          TIER_INFO[cert.certificate_type as keyof typeof TIER_INFO]?.cert}
                      </h3>
                      <p className="text-slate-600 text-[10px]">
                        {new Date(cert.issued_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Module Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500 text-sm">Loading curriculum...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
            <p className="text-red-400 text-sm mb-3">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-slate-400 hover:text-slate-300 transition underline"
            >
              Try again
            </button>
          </div>
        ) : modules.length === 0 ? (
          <div className="p-8 bg-slate-800/30 border border-slate-800/40 rounded-lg text-center">
            <p className="text-slate-500 text-sm">No modules available for this path yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.map((module, index) => (
              <ModuleCard
                key={module.id}
                module={module}
                index={index}
                status={getModuleStatus(module, index)}
                completedModules={completedModules.map((m) => m.id)}
              />
            ))}
          </div>
        )}

        {/* Certificate Preview */}
        <div className="mt-12 p-8 bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-lg border border-slate-800/40 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-slate-800/60 flex items-center justify-center">
            <svg className="w-7 h-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>
          <h3 className="text-base font-medium text-slate-300 mb-2">{tierInfo.cert}</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-4">
            Complete all {modules.length} modules with real projects to earn your blockchain-verified credential.
          </p>
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-600">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              {modules.length} Portfolio Projects
            </span>
            <span className="text-slate-700">|</span>
            <span>No Quizzes</span>
            <span className="text-slate-700">|</span>
            <span>Real Deliverables</span>
          </div>
        </div>
      </main>
    </div>
  );
}
