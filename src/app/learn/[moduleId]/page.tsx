'use client';

/**
 * DYNAMIC MODULE LEARNING PAGE
 * Interactive learning with sandbox challenges and AI tutor
 */

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

interface AKU {
  id: string;
  category: string;
  title: string;
  duration: number;
  prerequisiteAKUs: string[];
  businessKPI: string;
  concept: string;
  visualAid: string;
  sandboxChallenge: {
    prompt: string;
    expectedOutputSchema: Record<string, string>;
    hints: string[];
    maxHints: number;
  };
  alternativeFormats: {
    visual: string;
    textual: string;
    handsOn: string;
  };
}

interface Module {
  moduleId: string;
  moduleTitle: string;
  tier: string;
  akus: AKU[];
}

interface ModuleInfo {
  id: string;
  title: string;
  description: string;
  duration: number;
  order: number;
  tier: string;
  category: string;
  whyItMatters: string;
  conceptContent: string;
  realWorldExample: string;
  project: {
    id: string;
    title: string;
    description: string;
    deliverable: string;
    estimatedTime: string;
    skills: string[];
    aiPromptContext: string;
  };
  prerequisites: string[];
}

const TIER_COLORS = {
  student: {
    primary: 'emerald',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    accent: '#10b981',
  },
  employee: {
    primary: 'cyan',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    accent: '#06b6d4',
  },
  owner: {
    primary: 'purple',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    accent: '#a855f7',
  },
};

export default function ModuleLearningPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const moduleId = params.moduleId as string;

  const [module, setModule] = useState<ModuleInfo | null>(null);
  const [akuData, setAkuData] = useState<Module | null>(null);
  const [currentAKU, setCurrentAKU] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sandbox state
  const [userResponse, setUserResponse] = useState('');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [completedAKUs, setCompletedAKUs] = useState<Set<string>>(new Set());

  // Extract tier from moduleId (e.g., "student-m1" -> "student")
  const tier = moduleId.split('-')[0] as 'student' | 'employee' | 'owner';
  const colors = TIER_COLORS[tier] || TIER_COLORS.student;

  // Fetch module data
  useEffect(() => {
    async function fetchModuleData() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch curriculum module info
        const curriculumRes = await fetch(`/api/curriculum?tier=${tier}&moduleId=${moduleId}`);
        if (curriculumRes.ok) {
          const data = await curriculumRes.json();
          setModule(data.module);
        }

        // Fetch AKU details
        const akuRes = await fetch(`/api/aku?moduleId=${moduleId}`);
        if (akuRes.ok) {
          const data = await akuRes.json();
          setAkuData(data.module);
        }
      } catch (err) {
        console.error('Failed to fetch module:', err);
        setError('Unable to load module content.');
      } finally {
        setIsLoading(false);
      }
    }

    if (moduleId) {
      fetchModuleData();
    }
  }, [moduleId, tier]);

  const currentAKUData = akuData?.akus[currentAKU];
  const totalAKUs = akuData?.akus.length || 0;
  const progressPercent = totalAKUs > 0 ? Math.round(((currentAKU + 1) / totalAKUs) * 100) : 0;

  const handleHint = () => {
    if (currentAKUData && hintsUsed < currentAKUData.sandboxChallenge.maxHints) {
      setHintsUsed(prev => prev + 1);
      setShowHint(true);
    }
  };

  const handleSubmitChallenge = async () => {
    if (!userResponse.trim() || !currentAKUData) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch('/api/tutor/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          akuId: currentAKUData.id,
          response: userResponse,
          challenge: currentAKUData.sandboxChallenge.prompt,
          hintsUsed,
        }),
      });

      const data = await response.json();

      if (data.passed) {
        setFeedback({ type: 'success', message: data.feedback || 'Excellent work! Moving to the next concept.' });
        setCompletedAKUs(prev => new Set([...prev, currentAKUData.id]));

        // Auto-advance after delay
        setTimeout(() => {
          if (currentAKU < totalAKUs - 1) {
            setCurrentAKU(prev => prev + 1);
            setUserResponse('');
            setHintsUsed(0);
            setShowHint(false);
            setFeedback(null);
          }
        }, 2000);
      } else {
        setFeedback({ type: 'error', message: data.feedback || 'Not quite. Review the concept and try again.' });
      }
    } catch (error) {
      console.error('Submission error:', error);
      setFeedback({ type: 'error', message: 'Failed to submit. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateAKU = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentAKU > 0) {
      setCurrentAKU(prev => prev - 1);
    } else if (direction === 'next' && currentAKU < totalAKUs - 1) {
      setCurrentAKU(prev => prev + 1);
    }
    setUserResponse('');
    setHintsUsed(0);
    setShowHint(false);
    setFeedback(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm font-mono">Loading module...</p>
        </div>
      </div>
    );
  }

  if (error || (!module && !akuData)) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-medium text-slate-200 mb-2">Module Not Found</h1>
          <p className="text-slate-500 text-sm mb-6">{error || 'The requested module could not be loaded.'}</p>
          <Link
            href="/learn"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Learning Paths
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1115]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/40 bg-[#0f1115]/95 backdrop-blur-xl">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/learn')}
              className="p-2 text-slate-500 hover:text-slate-300 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-sm font-medium text-slate-200 line-clamp-1">
                {module?.title || akuData?.moduleTitle || 'Module'}
              </h1>
              <p className="text-[10px] text-slate-500 font-mono uppercase">{tier} PATH</p>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-mono">
                AKU {currentAKU + 1}/{totalAKUs}
              </span>
              <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${colors.bg} ${colors.text}`}>
              {tier}
            </span>
          </div>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-12">
        {/* Module Overview */}
        {module && (
          <div className={`mb-8 p-5 rounded-xl border ${colors.border} ${colors.bg}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/60 text-slate-500 uppercase tracking-wider font-mono">
                  {module.category}
                </span>
              </div>
              <span className="text-xs text-slate-500">{module.duration} min</span>
            </div>
            <h2 className="text-lg font-medium text-slate-200 mb-2">{module.title}</h2>
            <p className="text-slate-400 text-sm mb-4">{module.description}</p>

            {/* Why It Matters */}
            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/40">
              <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-2 font-mono">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                WHY THIS MATTERS
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">{module.whyItMatters}</p>
            </div>
          </div>
        )}

        {/* AKU Learning Section */}
        {currentAKUData && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Concept Panel */}
            <div className="bg-slate-800/30 rounded-xl border border-slate-800/40 overflow-hidden">
              <div className="p-4 border-b border-slate-800/40">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-mono ${colors.text}`}>
                    CONCEPT {currentAKU + 1}
                  </span>
                  <span className="text-[10px] text-slate-600">{currentAKUData.duration} min</span>
                </div>
                <h3 className="text-base font-medium text-slate-200">{currentAKUData.title}</h3>
              </div>

              <div className="p-4">
                <div className="prose prose-sm prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-slate-300 text-sm leading-relaxed font-sans">
                    {currentAKUData.concept}
                  </pre>
                </div>
              </div>

              {/* Navigation */}
              <div className="p-4 border-t border-slate-800/40 flex items-center justify-between">
                <button
                  onClick={() => navigateAKU('prev')}
                  disabled={currentAKU === 0}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>

                <div className="flex gap-1">
                  {akuData?.akus.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentAKU(idx)}
                      className={`w-2 h-2 rounded-full transition ${
                        idx === currentAKU
                          ? 'bg-cyan-500'
                          : completedAKUs.has(akuData.akus[idx].id)
                          ? 'bg-emerald-500'
                          : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => navigateAKU('next')}
                  disabled={currentAKU === totalAKUs - 1}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Sandbox Challenge Panel */}
            <div className="bg-slate-800/30 rounded-xl border border-slate-800/40 overflow-hidden">
              <div className="p-4 border-b border-slate-800/40">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg ${colors.bg} flex items-center justify-center`}>
                    <svg className={`w-3.5 h-3.5 ${colors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-500">SANDBOX CHALLENGE</span>
                    <h4 className="text-sm font-medium text-slate-200">Apply What You Learned</h4>
                  </div>
                </div>
              </div>

              <div className="p-4">
                {/* Challenge Prompt */}
                <div className="mb-4 p-3 rounded-lg bg-slate-900/50 border border-slate-800/40">
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {currentAKUData.sandboxChallenge.prompt}
                  </p>
                </div>

                {/* Hint Section */}
                {showHint && hintsUsed > 0 && (
                  <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span className="text-[10px] font-mono text-amber-400">HINT {hintsUsed}/{currentAKUData.sandboxChallenge.maxHints}</span>
                    </div>
                    <p className="text-amber-200/80 text-xs">
                      {currentAKUData.sandboxChallenge.hints[hintsUsed - 1]}
                    </p>
                  </div>
                )}

                {/* Response Input */}
                <textarea
                  value={userResponse}
                  onChange={(e) => setUserResponse(e.target.value)}
                  placeholder="Type your response here..."
                  className="w-full h-32 p-3 rounded-lg bg-slate-900/50 border border-slate-800/40 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-slate-700 resize-none font-mono"
                />

                {/* Feedback */}
                {feedback && (
                  <div className={`mt-3 p-3 rounded-lg ${
                    feedback.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : 'bg-red-500/10 border border-red-500/20'
                  }`}>
                    <p className={`text-xs ${feedback.type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>
                      {feedback.message}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={handleHint}
                    disabled={hintsUsed >= currentAKUData.sandboxChallenge.maxHints}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs text-amber-400 hover:text-amber-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Get Hint ({currentAKUData.sandboxChallenge.maxHints - hintsUsed} left)
                  </button>

                  <button
                    onClick={handleSubmitChallenge}
                    disabled={!userResponse.trim() || isSubmitting}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${colors.bg} ${colors.text} hover:opacity-80`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Checking...
                      </span>
                    ) : (
                      'Submit Response'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Project Section */}
        {module?.project && (
          <div className="mt-8 p-6 bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-xl border border-slate-800/40">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}>
                <svg className={`w-6 h-6 ${colors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase">MODULE PROJECT</span>
                <h3 className="text-lg font-medium text-slate-200 mt-1">{module.project.title}</h3>
                <p className="text-slate-400 text-sm mt-2">{module.project.description}</p>

                <div className="mt-4 p-3 rounded-lg bg-slate-900/50 border border-slate-800/40">
                  <div className="text-[10px] font-mono text-slate-500 mb-1">DELIVERABLE</div>
                  <p className="text-slate-300 text-sm">{module.project.deliverable}</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {module.project.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-[10px] rounded-full bg-slate-800 text-slate-400 font-mono"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {module.project.estimatedTime}
                  </span>
                </div>

                <Link
                  href={`/learn/path/${tier}`}
                  className={`mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium ${colors.bg} ${colors.text} hover:opacity-80 transition`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Start Project in Terminal
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Real World Example */}
        {module?.realWorldExample && (
          <div className="mt-6 p-4 rounded-xl bg-slate-800/20 border border-slate-800/30">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <span className="text-[10px] font-mono text-slate-500 uppercase">REAL-WORLD EXAMPLE</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{module.realWorldExample}</p>
          </div>
        )}
      </main>
    </div>
  );
}
