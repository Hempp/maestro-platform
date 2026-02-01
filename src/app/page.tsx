'use client';

/**
 * PHAZUR_OS TERMINAL HOMEPAGE
 * Single-click entry point - from landing to mastery in 60 seconds
 *
 * Philosophy: Build first, pay later.
 * No login walls. Immediate value. Prove ROI before commitment.
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Terminal from '@/components/terminal/Terminal';
import AuthButtons from '@/components/terminal/AuthButtons';

type GoalType = 'A' | 'B' | 'C' | null;

export default function Home() {
  const [selectedGoal, setSelectedGoal] = useState<GoalType>(null);
  const [progress, setProgress] = useState(0);
  const [commandResult, setCommandResult] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleGoalSelect = useCallback((goal: 'A' | 'B' | 'C') => {
    setSelectedGoal(goal);
    setProgress(5); // 5% just for selecting a goal
  }, []);

  const handleCommand = useCallback(async (command: string) => {
    setIsExecuting(true);
    setCommandResult(null);

    try {
      const response = await fetch('/api/instant-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });

      const result = await response.json();

      if (result.success) {
        setCommandResult(result.result);
        setProgress(prev => Math.min(prev + 10, 15)); // Progress for completing demo
      } else {
        setCommandResult(`Error: ${result.error}`);
      }
    } catch {
      setCommandResult('Failed to execute command. Check your connection.');
    } finally {
      setIsExecuting(false);
    }
  }, []);

  const handleAuthSuccess = useCallback((method: 'google' | 'wallet', address?: string) => {
    setIsAuthenticated(true);
    setProgress(prev => prev + 5);
    console.log(`Authenticated via ${method}`, address);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold tracking-tight">MAESTRO</div>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full font-mono">
              PHAZUR_OS v2.0
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-400 hover:text-white transition text-sm">
              Dashboard
            </Link>
            <Link href="/verify" className="text-slate-400 hover:text-white transition text-sm">
              Verify
            </Link>
            <AuthButtons compact onAuthSuccess={handleAuthSuccess} />
          </div>
        </nav>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Terminal Section */}
        <section className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">
          {/* Terminal Window - Main Focus */}
          <div className="flex-1 min-h-[500px] flex flex-col">
            <Terminal
              onCommand={handleCommand}
              onGoalSelect={handleGoalSelect}
              showProgress={true}
              progressPercent={progress}
            />
          </div>

          {/* Side Panel - Results/Info */}
          <div className="lg:w-80 flex flex-col gap-4">
            {/* Auth Status */}
            {!isAuthenticated && (
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                <h3 className="text-sm font-semibold text-slate-400 mb-3">
                  Quick Sign In (Optional)
                </h3>
                <AuthButtons onAuthSuccess={handleAuthSuccess} />
                <p className="text-xs text-slate-500 mt-3 text-center">
                  Save progress & sync across devices
                </p>
              </div>
            )}

            {/* Command Result */}
            {(commandResult || isExecuting) && (
              <div className="p-4 bg-slate-900 border border-emerald-500/30 rounded-xl">
                <h3 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-2">
                  {isExecuting && (
                    <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  )}
                  AI Output
                </h3>
                {isExecuting ? (
                  <p className="text-slate-400 text-sm">Processing...</p>
                ) : (
                  <pre className="text-slate-300 text-xs whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
                    {commandResult}
                  </pre>
                )}
              </div>
            )}

            {/* Goal Selected Info */}
            {selectedGoal && (
              <div className="p-4 bg-slate-900 border border-blue-500/30 rounded-xl">
                <h3 className="text-sm font-semibold text-blue-400 mb-2">
                  Path Selected
                </h3>
                <div className="text-white font-medium">
                  {selectedGoal === 'A' && 'Career Development'}
                  {selectedGoal === 'B' && 'Work Efficiency'}
                  {selectedGoal === 'C' && 'Business Scaling'}
                </div>
                <p className="text-slate-400 text-xs mt-1">
                  Sandbox provisioned and ready
                </p>
                <Link
                  href={`/learn?tier=${
                    selectedGoal === 'A' ? 'student' : selectedGoal === 'B' ? 'employee' : 'owner'
                  }`}
                  className="mt-3 block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition"
                >
                  Enter Full Learning Mode
                </Link>
              </div>
            )}

            {/* Value Props */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Why Terminal-First?</h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">$</span>
                  <span>Immediate results - no sign-up required</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">$</span>
                  <span>Real AI commands, not video tutorials</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">$</span>
                  <span>Build first, pay after Capstone verified</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">$</span>
                  <span>Blockchain certificate on completion</span>
                </li>
              </ul>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/learn"
                className="p-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-600 transition text-center"
              >
                <div className="text-lg mb-1">📚</div>
                <div className="text-xs text-slate-400">Learn</div>
              </Link>
              <Link
                href="/dashboard"
                className="p-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-600 transition text-center"
              >
                <div className="text-lg mb-1">📊</div>
                <div className="text-xs text-slate-400">Progress</div>
              </Link>
              <Link
                href="/verify"
                className="p-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-600 transition text-center"
              >
                <div className="text-lg mb-1">🔗</div>
                <div className="text-xs text-slate-400">Verify</div>
              </Link>
              <Link
                href="/support"
                className="p-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-600 transition text-center"
              >
                <div className="text-lg mb-1">💬</div>
                <div className="text-xs text-slate-400">Support</div>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Strip */}
        <section className="border-t border-slate-800 bg-slate-900/50 py-8">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-white mb-1">60s</div>
                <div className="text-xs text-slate-400">First AI result</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-400 mb-1">$0</div>
                <div className="text-xs text-slate-400">Until Capstone verified</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400 mb-1">SBT</div>
                <div className="text-xs text-slate-400">Polygon certificate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400 mb-1">1:1</div>
                <div className="text-xs text-slate-400">Human mentor calls</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>© 2025 Maestro. Build first, pay later.</div>
          <div className="flex items-center gap-6">
            <Link href="/accessibility" className="hover:text-white transition">
              Accessibility
            </Link>
            <Link href="/privacy" className="hover:text-white transition">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white transition">
              Terms
            </Link>
            <span className="flex items-center gap-1">
              <span className="text-emerald-500">●</span>
              WCAG 2.1 AA
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
