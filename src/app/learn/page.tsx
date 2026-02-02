'use client';

/**
 * LEARNING PATH VIEW
 * Displays curriculum, modules, and progress
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';

interface Module {
  id: string;
  title: string;
  description: string;
  lessons: number;
  duration: string;
  tier: 'student' | 'employee' | 'owner';
  status: 'locked' | 'available' | 'in_progress' | 'completed';
}

interface Certificate {
  id: string;
  certificate_type: string;
  issued_at: string;
  metadata: {
    certificationName: string;
    designation: string;
    akusCompleted: number;
  };
}

const CURRICULUM: Record<string, Module[]> = {
  student: [
    {
      id: 'foundation-1',
      title: 'Terminal Foundations',
      description: 'Master the command line and developer tools',
      lessons: 8,
      duration: '2 hours',
      tier: 'student',
      status: 'available',
    },
    {
      id: 'foundation-2',
      title: 'Git & Version Control',
      description: 'Collaborate like a professional developer',
      lessons: 6,
      duration: '1.5 hours',
      tier: 'student',
      status: 'locked',
    },
    {
      id: 'ai-dev-1',
      title: 'AI-Powered Development',
      description: 'Build with Claude Code and AI assistants',
      lessons: 10,
      duration: '3 hours',
      tier: 'student',
      status: 'locked',
    },
    {
      id: 'portfolio-1',
      title: 'Portfolio Project',
      description: 'Create your showcase website',
      lessons: 12,
      duration: '4 hours',
      tier: 'student',
      status: 'locked',
    },
    {
      id: 'capstone-student',
      title: 'Capstone: Deploy & Certify',
      description: 'Ship your project and earn your credential',
      lessons: 4,
      duration: '1 hour',
      tier: 'student',
      status: 'locked',
    },
  ],
  employee: [
    {
      id: 'workflow-1',
      title: 'Workflow Analysis',
      description: 'Identify automation opportunities',
      lessons: 6,
      duration: '1.5 hours',
      tier: 'employee',
      status: 'available',
    },
    {
      id: 'gpt-builder-1',
      title: 'Custom GPT Development',
      description: 'Build internal knowledge assistants',
      lessons: 8,
      duration: '2.5 hours',
      tier: 'employee',
      status: 'locked',
    },
    {
      id: 'automation-1',
      title: 'Email & Calendar Automation',
      description: 'Automate repetitive communication',
      lessons: 10,
      duration: '3 hours',
      tier: 'employee',
      status: 'locked',
    },
    {
      id: 'api-1',
      title: 'API Integrations',
      description: 'Connect your tools with code',
      lessons: 8,
      duration: '2.5 hours',
      tier: 'employee',
      status: 'locked',
    },
    {
      id: 'capstone-employee',
      title: 'Capstone: Efficiency Report',
      description: 'Document your time savings',
      lessons: 4,
      duration: '1 hour',
      tier: 'employee',
      status: 'locked',
    },
  ],
  owner: [
    {
      id: 'ops-audit-1',
      title: 'Operations Audit',
      description: 'Map your business workflows',
      lessons: 6,
      duration: '2 hours',
      tier: 'owner',
      status: 'available',
    },
    {
      id: 'agent-basics-1',
      title: 'Agent Fundamentals',
      description: 'Understand autonomous AI agents',
      lessons: 8,
      duration: '2.5 hours',
      tier: 'owner',
      status: 'locked',
    },
    {
      id: 'agent-build-1',
      title: 'Building Your First Agent',
      description: 'Create an autonomous research agent',
      lessons: 12,
      duration: '4 hours',
      tier: 'owner',
      status: 'locked',
    },
    {
      id: 'multi-agent-1',
      title: 'Multi-Agent Orchestration',
      description: 'Chain agents for complex workflows',
      lessons: 10,
      duration: '3.5 hours',
      tier: 'owner',
      status: 'locked',
    },
    {
      id: 'capstone-owner',
      title: 'Capstone: Operations System',
      description: 'Deploy your agent infrastructure',
      lessons: 6,
      duration: '2 hours',
      tier: 'owner',
      status: 'locked',
    },
  ],
};

const TIER_INFO = {
  student: {
    title: 'The Student Path',
    subtitle: 'Build a Job-Ready Portfolio',
    cert: 'Certified AI Associate',
    color: 'emerald',
  },
  employee: {
    title: 'The Employee Path',
    subtitle: 'Efficiency Mastery',
    cert: 'Workflow Efficiency Lead',
    color: 'blue',
  },
  owner: {
    title: 'The Owner Path',
    subtitle: 'Operations Scaling',
    cert: 'AI Operations Master',
    color: 'purple',
  },
};

function ModuleCard({ module, index }: { module: Module; index: number }) {
  const isLocked = module.status === 'locked';
  const isCompleted = module.status === 'completed';
  const isInProgress = module.status === 'in_progress';

  return (
    <div
      className={`relative p-6 rounded-2xl border transition ${
        isLocked
          ? 'bg-slate-900/50 border-slate-800 opacity-60'
          : isCompleted
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : isInProgress
          ? 'bg-blue-500/10 border-blue-500/30'
          : 'bg-[#2a2d32] border-slate-700 hover:border-slate-600'
      }`}
    >
      {/* Module Number */}
      <div
        className={`absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          isCompleted
            ? 'bg-emerald-500 text-white'
            : isInProgress
            ? 'bg-blue-500 text-white'
            : 'bg-slate-700 text-slate-300'
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
        <div className="absolute top-4 right-4">
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
      )}

      <h3 className="text-lg font-semibold text-white mb-2">{module.title}</h3>
      <p className="text-slate-400 text-sm mb-4">{module.description}</p>

      <div className="flex items-center gap-4 text-sm text-slate-500">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          {module.lessons} lessons
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {module.duration}
        </span>
      </div>

      {!isLocked && (
        <Link
          href={`/learn/${module.id}`}
          className={`mt-4 block w-full py-2 text-center rounded-lg font-medium transition ${
            isCompleted
              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              : isInProgress
              ? 'bg-blue-500 text-white hover:bg-blue-400'
              : 'bg-slate-700 text-white hover:bg-slate-600'
          }`}
        >
          {isCompleted ? 'Review' : isInProgress ? 'Continue' : 'Start Module'}
        </Link>
      )}
    </div>
  );
}

export default function LearnPage() {
  const { user } = useAuth();
  const { stats } = useProgress();
  const [selectedTier, setSelectedTier] = useState<'student' | 'employee' | 'owner'>('student');
  const [modules, setModules] = useState<Module[]>(CURRICULUM.student);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  useEffect(() => {
    setModules(CURRICULUM[selectedTier]);
  }, [selectedTier]);

  // Fetch certificates
  useEffect(() => {
    async function fetchCertificates() {
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
    if (user) {
      fetchCertificates();
    }
  }, [user]);

  const tierInfo = TIER_INFO[selectedTier];
  const completedModules = modules.filter((m) => m.status === 'completed').length;
  const progress = Math.round((completedModules / modules.length) * 100);

  return (
    <div className="min-h-screen bg-[#1a1d21]">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <span className="text-white font-semibold">Phazur</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-slate-400 hover:text-white transition text-sm"
            >
              Dashboard
            </Link>
            {user ? (
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-medium">
                {user.email?.charAt(0).toUpperCase()}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Path Selector */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-white mb-6">Choose Your Path</h1>

          <div className="grid md:grid-cols-3 gap-4">
            {(['student', 'employee', 'owner'] as const).map((tier) => {
              const info = TIER_INFO[tier];
              const isSelected = selectedTier === tier;

              return (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`p-6 rounded-2xl border text-left transition ${
                    isSelected
                      ? tier === 'student'
                        ? 'bg-emerald-500/10 border-emerald-500/50'
                        : tier === 'employee'
                        ? 'bg-blue-500/10 border-blue-500/50'
                        : 'bg-purple-500/10 border-purple-500/50'
                      : 'bg-[#2a2d32] border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <h3 className="text-lg font-semibold text-white mb-1">{info.title}</h3>
                  <p className="text-slate-400 text-sm mb-3">{info.subtitle}</p>
                  <div
                    className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                      tier === 'student'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : tier === 'employee'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-purple-500/20 text-purple-400'
                    }`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="mb-8 p-6 bg-[#2a2d32] rounded-2xl border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-semibold text-white">{tierInfo.title}</h2>
              <p className="text-slate-400 text-sm">
                {completedModules} of {modules.length} modules completed
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{progress}%</p>
              <p className="text-slate-500 text-sm">Complete</p>
            </div>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                selectedTier === 'student'
                  ? 'bg-emerald-500'
                  : selectedTier === 'employee'
                  ? 'bg-blue-500'
                  : 'bg-purple-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {stats && stats.currentStreak > 0 && (
            <p className="mt-3 text-sm text-slate-400">
              Current streak: <span className="text-orange-400">{stats.currentStreak} days</span>
            </p>
          )}
        </div>

        {/* Certificates Earned */}
        {certificates.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Certificates Earned</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {certificates.map((cert) => {
                const certColor = cert.certificate_type === 'student'
                  ? 'emerald'
                  : cert.certificate_type === 'employee'
                  ? 'blue'
                  : 'purple';

                return (
                  <div
                    key={cert.id}
                    className={`p-5 rounded-xl border ${
                      certColor === 'emerald'
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : certColor === 'blue'
                        ? 'bg-blue-500/10 border-blue-500/30'
                        : 'bg-purple-500/10 border-purple-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        certColor === 'emerald'
                          ? 'bg-emerald-500/20'
                          : certColor === 'blue'
                          ? 'bg-blue-500/20'
                          : 'bg-purple-500/20'
                      }`}>
                        <svg className={`w-6 h-6 ${
                          certColor === 'emerald'
                            ? 'text-emerald-400'
                            : certColor === 'blue'
                            ? 'text-blue-400'
                            : 'text-purple-400'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${
                          certColor === 'emerald'
                            ? 'text-emerald-400'
                            : certColor === 'blue'
                            ? 'text-blue-400'
                            : 'text-purple-400'
                        }`}>
                          {cert.metadata?.certificationName || TIER_INFO[cert.certificate_type as keyof typeof TIER_INFO]?.cert}
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">
                          {cert.metadata?.designation || 'Verified Credential'}
                        </p>
                        <p className="text-slate-500 text-xs mt-2">
                          Issued {new Date(cert.issued_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Module Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module, index) => (
            <ModuleCard key={module.id} module={module} index={index} />
          ))}
        </div>

        {/* Certificate Preview */}
        <div className="mt-12 p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-700 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">{tierInfo.cert}</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            Complete all modules to earn your blockchain-verified Soulbound Token (SBT) credential.
            Displayed on LinkedIn and verified on-chain.
          </p>
        </div>
      </main>
    </div>
  );
}
