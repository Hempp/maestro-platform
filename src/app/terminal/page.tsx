'use client';

/**
 * PHAZUR TERMINAL PAGE
 * Interactive terminal interface for power users
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Terminal from '@/components/terminal/Terminal';
import AuthButtons from '@/components/terminal/AuthButtons';

export default function TerminalPage() {
  const [selectedGoal, setSelectedGoal] = useState<'A' | 'B' | 'C' | null>(null);
  const [progress, setProgress] = useState(0);
  const [commandResult, setCommandResult] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleGoalSelect = useCallback((goal: 'A' | 'B' | 'C') => {
    setSelectedGoal(goal);
    setProgress(5);
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
        setProgress(prev => Math.min(prev + 10, 15));
      } else {
        setCommandResult(`Error: ${result.error}`);
      }
    } catch {
      setCommandResult('Failed to execute command. Check your connection.');
    } finally {
      setIsExecuting(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-2xl font-bold tracking-tight hover:text-blue-400 transition">
              PHAZUR
            </Link>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full font-mono">
              TERMINAL
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-400 hover:text-white transition text-sm">
              Dashboard
            </Link>
            <Link href="/learn" className="text-slate-400 hover:text-white transition text-sm">
              Learn
            </Link>
            <AuthButtons compact onAuthSuccess={() => {}} />
          </div>
        </nav>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Terminal Window - Main Focus */}
        <div className="flex-1 p-6 flex flex-col">
          <Terminal
            onCommand={handleCommand}
            onGoalSelect={handleGoalSelect}
            showProgress={true}
            progressPercent={progress}
          />
        </div>

        {/* Side Panel */}
        <div className="lg:w-80 p-6 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col gap-4">
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

          {/* Goal Selected */}
          {selectedGoal && (
            <div className="p-4 bg-slate-900 border border-blue-500/30 rounded-xl">
              <h3 className="text-sm font-semibold text-blue-400 mb-2">Path Selected</h3>
              <div className="text-white font-medium">
                {selectedGoal === 'A' && 'Certified AI Associate'}
                {selectedGoal === 'B' && 'Workflow Efficiency Lead'}
                {selectedGoal === 'C' && 'AI Operations Master'}
              </div>
              <Link
                href={`/learn?tier=${selectedGoal === 'A' ? 'student' : selectedGoal === 'B' ? 'employee' : 'owner'}`}
                className="mt-3 block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition"
              >
                Enter Learning Mode
              </Link>
            </div>
          )}

          {/* Available Commands */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Available Commands</h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="text-slate-400">
                <span className="text-emerald-400">A, B, C</span> - Select path
              </div>
              <div className="text-slate-400">
                <span className="text-emerald-400">ai-summarize-inbox</span>
              </div>
              <div className="text-slate-400">
                <span className="text-emerald-400">ai-meeting-notes</span>
              </div>
              <div className="text-slate-400">
                <span className="text-emerald-400">ai-audit-workflow</span>
              </div>
              <div className="text-slate-400">
                <span className="text-emerald-400">help</span> - Show all
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/"
              className="p-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-600 transition text-center"
            >
              <div className="text-lg mb-1">🏠</div>
              <div className="text-xs text-slate-400">Home</div>
            </Link>
            <Link
              href="/verify"
              className="p-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-600 transition text-center"
            >
              <div className="text-lg mb-1">🔗</div>
              <div className="text-xs text-slate-400">Verify</div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
