'use client';

/**
 * PHAZUR WORKSPACE
 * Split-screen learning environment:
 * - Left: Socratic AI Tutor
 * - Right: Workflow Sandbox
 */

import { useState, useCallback } from 'react';
import { SocraticTutor } from '@/components/tutor/SocraticTutor';
import { WorkflowSandbox } from '@/components/sandbox/WorkflowSandbox';
import type { AtomicKnowledgeUnit, SandboxState, TutorMessage } from '@/types';

interface PhazurWorkspaceProps {
  aku: AtomicKnowledgeUnit;
  learnerId: string;
  onComplete: (sandboxState: SandboxState) => void;
}

export function PhazurWorkspace({
  aku,
  learnerId,
  onComplete,
}: PhazurWorkspaceProps) {
  const [sandboxState, setSandboxState] = useState<SandboxState>({
    learnerId,
    sessionId: crypto.randomUUID(),
    workflow: aku.sandboxChallenge.starterWorkflow || [],
    executionLog: [],
    status: 'idle',
  });

  const [tutorMessages, setTutorMessages] = useState<TutorMessage[]>([
    {
      id: '1',
      role: 'tutor',
      content: `Welcome to "${aku.title}". ${aku.concept.trim()}\n\n**Your Challenge:** ${aku.sandboxChallenge.prompt}`,
      timestamp: new Date(),
    },
  ]);

  const [hintsUsed, setHintsUsed] = useState(0);
  const [splitPosition, setSplitPosition] = useState(40); // Percentage

  // Handle tutor observation of sandbox
  const handleSandboxChange = useCallback((newState: SandboxState) => {
    setSandboxState(newState);

    // Tutor observes significant changes
    if (newState.status === 'executing') {
      setTutorMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'system',
        content: 'Running workflow...',
        timestamp: new Date(),
      }]);
    }
  }, []);

  // Handle hint request
  const handleHintRequest = useCallback(() => {
    if (hintsUsed >= aku.sandboxChallenge.maxHints) {
      setTutorMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'tutor',
        content: "You've used all available hints. Let's think through this together. What part is most confusing?",
        timestamp: new Date(),
      }]);
      return;
    }

    const hint = aku.sandboxChallenge.hints[hintsUsed];
    setHintsUsed(h => h + 1);

    setTutorMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'tutor',
      content: `💡 **Hint ${hintsUsed + 1}/${aku.sandboxChallenge.maxHints}:** ${hint}`,
      timestamp: new Date(),
    }]);
  }, [hintsUsed, aku.sandboxChallenge]);

  // Handle completion
  const handleComplete = useCallback(() => {
    onComplete(sandboxState);
  }, [sandboxState, onComplete]);

  // Handle split pane resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startPosition = splitPosition;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const containerWidth = window.innerWidth;
      const newPosition = startPosition + (delta / containerWidth) * 100;
      setSplitPosition(Math.min(70, Math.max(30, newPosition)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [splitPosition]);

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      {/* Header */}
      <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold text-white">PHAZUR</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">{aku.title}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">
            Hints: {hintsUsed}/{aku.sandboxChallenge.maxHints}
          </span>
          <button
            onClick={handleHintRequest}
            className="px-3 py-1.5 bg-amber-600/20 text-amber-400 rounded text-sm hover:bg-amber-600/30 transition"
          >
            Need a hint?
          </button>
          <button
            onClick={handleComplete}
            disabled={sandboxState.status !== 'complete'}
            className="px-4 py-1.5 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit for Verification
          </button>
        </div>
      </header>

      {/* Split Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Socratic Tutor */}
        <div
          className="h-full border-r border-slate-800"
          style={{ width: `${splitPosition}%` }}
        >
          <SocraticTutor
            messages={tutorMessages}
            onMessageSend={(content) => {
              // Add user message
              setTutorMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                role: 'tutor',
                content,
                timestamp: new Date(),
              }]);
            }}
            sandboxState={sandboxState}
            aku={aku}
          />
        </div>

        {/* Resize Handle */}
        <div
          className="w-1 bg-slate-800 hover:bg-blue-500 cursor-col-resize transition-colors"
          onMouseDown={handleMouseDown}
        />

        {/* Right: Workflow Sandbox */}
        <div
          className="h-full"
          style={{ width: `${100 - splitPosition}%` }}
        >
          <WorkflowSandbox
            state={sandboxState}
            onChange={handleSandboxChange}
            challenge={aku.sandboxChallenge}
          />
        </div>
      </div>
    </div>
  );
}
