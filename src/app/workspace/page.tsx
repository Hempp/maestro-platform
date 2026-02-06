'use client';

/**
 * WORKSPACE PAGE
 * Interactive AKU-based learning with sandbox challenges
 * Uses LearnWorkspace component with SocraticTutor and WorkflowSandbox
 */

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLearningStore } from '@/stores/learning-store';
import { LearnWorkspace } from '@/components/workspace/LearnWorkspace';
import Link from 'next/link';
import type { AtomicKnowledgeUnit, BusinessTier } from '@/types';

interface ModuleAKUs {
  module: {
    id: string;
    title: string;
    tier: string;
  };
  akus: AtomicKnowledgeUnit[];
}

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { initSession, currentAKU } = useLearningStore();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const moduleId = searchParams.get('moduleId');
  const tier = searchParams.get('tier') as BusinessTier | null;
  const akuId = searchParams.get('akuId');

  useEffect(() => {
    async function loadAKUs() {
      if (authLoading) return;

      // If no moduleId, show selection
      if (!moduleId && !akuId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        let url = '/api/aku';
        const params = new URLSearchParams();

        if (akuId) {
          params.set('akuId', akuId);
        } else if (moduleId && tier) {
          params.set('moduleId', moduleId);
          params.set('tier', tier);
        }

        const response = await fetch(`${url}?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to load learning content');
        }

        const data = await response.json();

        if (akuId && data.aku) {
          // Single AKU requested - fetch full module for context
          const moduleResponse = await fetch(`/api/aku?moduleId=${data.module.id}&tier=${data.module.tier}`);
          const moduleData = await moduleResponse.json();

          initSession(
            user?.id || 'anonymous',
            data.module.tier as BusinessTier,
            moduleData.akus || [data.aku]
          );
        } else if (data.akus && data.akus.length > 0) {
          // Module AKUs
          initSession(
            user?.id || 'anonymous',
            tier as BusinessTier,
            data.akus
          );
        } else {
          setError('No learning content found');
        }
      } catch (err) {
        console.error('Failed to load AKUs:', err);
        setError('Unable to load learning content. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    loadAKUs();
  }, [moduleId, tier, akuId, user?.id, authLoading, initSession]);

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-red-500/20 flex items-center justify-center">
            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-slate-200 mb-2">Unable to Load</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <Link
            href="/learn"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Learning Paths
          </Link>
        </div>
      </div>
    );
  }

  // No module selected - show module picker
  if (!moduleId && !akuId) {
    return <ModulePicker />;
  }

  // Workspace loaded - show LearnWorkspace
  if (currentAKU) {
    return <LearnWorkspace />;
  }

  // Fallback
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <p className="text-slate-400">Initializing workspace...</p>
    </div>
  );
}

function ModulePicker() {
  const [selectedTier, setSelectedTier] = useState<BusinessTier>('student');
  const [modules, setModules] = useState<Array<{
    id: string;
    title: string;
    akuCount: number;
    totalDuration: number;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadModules() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/aku?tier=${selectedTier}`);
        const data = await response.json();
        setModules(data.modules || []);
      } catch (err) {
        console.error('Failed to load modules:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadModules();
  }, [selectedTier]);

  const TIER_INFO = {
    student: {
      title: 'The Student',
      description: 'Build job-ready AI skills',
      color: 'purple',
    },
    employee: {
      title: 'The Employee',
      description: 'Automate your workflow',
      color: 'cyan',
    },
    owner: {
      title: 'The Owner',
      description: 'Scale business operations',
      color: 'emerald',
    },
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-semibold text-white">
              PHAZUR
            </Link>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 text-sm">Interactive Workspace</span>
          </div>
          <Link
            href="/learn"
            className="text-slate-400 hover:text-white text-sm transition"
          >
            Back to Paths
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-semibold text-white mb-2">
            Choose Your Learning Path
          </h1>
          <p className="text-slate-400">
            Select a tier and module to start your interactive learning session
          </p>
        </div>

        {/* Tier Selector */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {(['student', 'employee', 'owner'] as const).map((tier) => {
            const info = TIER_INFO[tier];
            const isSelected = selectedTier === tier;

            return (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`p-5 rounded-xl border text-left transition ${
                  isSelected
                    ? `bg-${info.color}-500/10 border-${info.color}-500/30`
                    : 'bg-slate-800/30 border-slate-800/60 hover:border-slate-700'
                }`}
              >
                <h3 className={`font-medium mb-1 ${
                  isSelected ? `text-${info.color}-400` : 'text-slate-300'
                }`}>
                  {info.title}
                </h3>
                <p className="text-slate-500 text-sm">{info.description}</p>
              </button>
            );
          })}
        </div>

        {/* Modules Grid */}
        <h2 className="text-lg font-medium text-slate-200 mb-4">
          Available Modules
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-16 bg-slate-800/20 rounded-xl border border-slate-800/40">
            <p className="text-slate-500">No modules available for this tier yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {modules.map((module, index) => (
              <Link
                key={module.id}
                href={`/workspace?moduleId=${module.id}&tier=${selectedTier}`}
                className="group p-5 bg-slate-800/30 rounded-xl border border-slate-800/60 hover:border-cyan-500/30 transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-200 group-hover:text-cyan-400 transition mb-1">
                      {module.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        {module.akuCount} lessons
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {module.totalDuration} min
                      </span>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    }>
      <WorkspaceContent />
    </Suspense>
  );
}
