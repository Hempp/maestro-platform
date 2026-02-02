'use client';

/**
 * LEARNING PATH VIEW
 * Displays curriculum, modules, and progress
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
    title: 'The Student',
    subtitle: 'Build a Job-Ready Portfolio',
    cert: 'Certified AI Associate',
  },
  employee: {
    title: 'The Employee',
    subtitle: 'Efficiency Mastery',
    cert: 'Workflow Efficiency Lead',
  },
  owner: {
    title: 'The Owner',
    subtitle: 'Operations Scaling',
    cert: 'AI Operations Master',
  },
};

function ModuleCard({ module, index }: { module: Module; index: number }) {
  const isLocked = module.status === 'locked';
  const isCompleted = module.status === 'completed';
  const isInProgress = module.status === 'in_progress';

  return (
    <div
      className={`relative p-5 rounded-lg border transition ${
        isLocked
          ? 'bg-slate-900/30 border-slate-800/40 opacity-50'
          : isCompleted
          ? 'bg-slate-800/30 border-slate-700/50'
          : isInProgress
          ? 'bg-slate-800/40 border-cyan-500/30'
          : 'bg-slate-800/30 border-slate-800/60 hover:border-slate-700'
      }`}
    >
      {/* Module Number */}
      <div
        className={`absolute -top-2.5 -left-2.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
          isCompleted
            ? 'bg-slate-700 text-slate-300'
            : isInProgress
            ? 'bg-cyan-500/80 text-white'
            : 'bg-slate-800 text-slate-500'
        }`}
      >
        {isCompleted ? (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      )}

      <h3 className="text-sm font-medium text-slate-200 mb-1">{module.title}</h3>
      <p className="text-slate-500 text-xs mb-3">{module.description}</p>

      <div className="flex items-center gap-3 text-[10px] text-slate-600">
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          {module.lessons} lessons
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {module.duration}
        </span>
      </div>

      {!isLocked && (
        <Link
          href={`/learn/${module.id}`}
          className={`mt-4 block w-full py-2 text-center rounded-lg text-xs font-medium transition ${
            isCompleted
              ? 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
              : isInProgress
              ? 'bg-cyan-500/80 text-white hover:bg-cyan-500'
              : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
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
    <div className="min-h-screen bg-[#0f1115]">
      {/* Header */}
      <header className="border-b border-slate-800/40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Phazur" width={24} height={24} className="invert opacity-80" />
            <span className="text-slate-200 font-medium text-sm">Phazur</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-500 hover:text-slate-300 transition text-xs">
              Dashboard
            </Link>
            {user ? (
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-medium">
                {user.email?.charAt(0).toUpperCase()}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
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
                      ? 'bg-slate-800/50 border-slate-700'
                      : 'bg-slate-800/20 border-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <h3 className="text-sm font-medium text-slate-300 mb-0.5">{info.title}</h3>
                  <p className="text-slate-600 text-xs mb-2">{info.subtitle}</p>
                  <div className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-500">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    {info.cert}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 p-4 bg-slate-800/30 rounded-lg border border-slate-800/40">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-medium text-slate-300">{tierInfo.title} Path</h2>
              <p className="text-slate-600 text-xs">
                {completedModules} of {modules.length} modules completed
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-slate-300">{progress}%</p>
              <p className="text-slate-600 text-[10px]">Complete</p>
            </div>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500/60 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(progress, 2)}%` }}
            />
          </div>
          {stats && stats.currentStreak > 0 && (
            <p className="mt-2 text-[10px] text-slate-600">
              Streak: <span className="text-slate-500">{stats.currentStreak} days</span>
            </p>
          )}
        </div>

        {/* Certificates Earned */}
        {certificates.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-slate-400 mb-3">Certificates Earned</h2>
            <div className="grid md:grid-cols-3 gap-3">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="p-3 rounded-lg border bg-slate-800/30 border-slate-800/40"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-800/60 flex items-center justify-center">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xs font-medium text-slate-400">
                        {cert.metadata?.certificationName || TIER_INFO[cert.certificate_type as keyof typeof TIER_INFO]?.cert}
                      </h3>
                      <p className="text-slate-600 text-[10px] mt-0.5">
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module, index) => (
            <ModuleCard key={module.id} module={module} index={index} />
          ))}
        </div>

        {/* Certificate Preview */}
        <div className="mt-10 p-6 bg-slate-800/20 rounded-lg border border-slate-800/40 text-center">
          <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-slate-800/60 flex items-center justify-center">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-slate-400 mb-1">{tierInfo.cert}</h3>
          <p className="text-slate-600 text-xs max-w-sm mx-auto">
            Complete all modules to earn your blockchain-verified credential.
          </p>
        </div>
      </main>
    </div>
  );
}
