'use client';

/**
 * LEARN WORKSPACE
 * Full learning experience with:
 * - Progress sidebar (left)
 * - Socratic Tutor (center-left)
 * - Workflow Sandbox (center-right)
 * - Verification & celebration
 */

import { useState, useCallback } from 'react';
import { useLearningStore } from '@/stores/learning-store';
import { SocraticTutor } from '@/components/tutor/SocraticTutor';
import { WorkflowSandbox } from '@/components/sandbox/WorkflowSandbox';
import { ProgressSidebar } from '@/components/workspace/ProgressSidebar';
import { CelebrationModal } from '@/components/workspace/CelebrationModal';
import type { SandboxState, TutorMessage } from '@/types';

export function LearnWorkspace() {
  const {
    currentAKU,
    sandboxState,
    tutorMessages,
    hintsUsed,
    startTime,
    akuProgress,
    verificationResult,
    showCelebration,
    updateSandboxState,
    addTutorMessage,
    useHint,
    setVerificationResult,
    completeCurrentAKU,
    showCelebrationModal,
    hideCelebrationModal,
  } = useLearningStore();

  const [isVerifying, setIsVerifying] = useState(false);
  const [splitPosition, setSplitPosition] = useState(45);

  // Handle sandbox changes
  const handleSandboxChange = useCallback((newState: SandboxState) => {
    updateSandboxState(newState);

    // Add system message for status changes
    if (newState.status === 'executing') {
      addTutorMessage({
        id: crypto.randomUUID(),
        role: 'system',
        content: 'Running workflow...',
        timestamp: new Date(),
      });
    } else if (newState.status === 'complete') {
      addTutorMessage({
        id: crypto.randomUUID(),
        role: 'tutor',
        content: "Your workflow completed! Let's verify it meets the requirements. Click **Submit for Verification** when ready.",
        timestamp: new Date(),
      });
    }
  }, [updateSandboxState, addTutorMessage]);

  // Handle hint request
  const handleHintRequest = useCallback(() => {
    if (!currentAKU) return;

    if (hintsUsed >= currentAKU.sandboxChallenge.maxHints) {
      addTutorMessage({
        id: crypto.randomUUID(),
        role: 'tutor',
        content: "You've used all available hints. Let's think through this together. What part feels most confusing?",
        timestamp: new Date(),
      });
      return;
    }

    const hint = currentAKU.sandboxChallenge.hints[hintsUsed];
    useHint();

    addTutorMessage({
      id: crypto.randomUUID(),
      role: 'tutor',
      content: `**Hint ${hintsUsed + 1}/${currentAKU.sandboxChallenge.maxHints}:** ${hint}`,
      timestamp: new Date(),
    });
  }, [currentAKU, hintsUsed, useHint, addTutorMessage]);

  // Handle verification submission
  const handleSubmitVerification = useCallback(async () => {
    if (!currentAKU || !sandboxState || !startTime) return;

    setIsVerifying(true);

    try {
      const response = await fetch('/api/verification/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          akuId: currentAKU.id,
          sandboxState,
          hintsUsed,
          startTime: startTime.toISOString(),
          endTime: new Date().toISOString(),
        }),
      });

      const result = await response.json();
      setVerificationResult(result);

      if (result.passed) {
        completeCurrentAKU();
        addTutorMessage({
          id: crypto.randomUUID(),
          role: 'tutor',
          content: `**Excellent work!** You've completed "${currentAKU.title}" with a Struggle Score of ${result.struggleScore}. ${
            result.struggleScore <= 30
              ? "That's Elite-level performance!"
              : result.struggleScore <= 50
              ? "Solid work—you're building real skills."
              : "You pushed through challenges—that's what matters."
          }`,
          timestamp: new Date(),
        });
        showCelebrationModal();
      } else {
        addTutorMessage({
          id: crypto.randomUUID(),
          role: 'tutor',
          content: "Not quite there yet. Let's look at what's missing. " +
            result.outputValidations
              .filter((v: { passed: boolean }) => !v.passed)
              .map((v: { field: string }) => `The **${v.field}** requirement wasn't met.`)
              .join(' ') +
            " What do you think needs to change?",
          timestamp: new Date(),
        });
      }
    } catch (error) {
      addTutorMessage({
        id: crypto.randomUUID(),
        role: 'tutor',
        content: "Verification failed. Let's try again—make sure your workflow runs successfully first.",
        timestamp: new Date(),
      });
    } finally {
      setIsVerifying(false);
    }
  }, [currentAKU, sandboxState, hintsUsed, startTime, setVerificationResult, completeCurrentAKU, addTutorMessage, showCelebrationModal]);

  // Handle split pane resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startPosition = splitPosition;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const containerWidth = window.innerWidth - 240; // Account for sidebar
      const newPosition = startPosition + (delta / containerWidth) * 100;
      setSplitPosition(Math.min(65, Math.max(35, newPosition)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [splitPosition]);

  if (!currentAKU || !sandboxState) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Loading workspace...</p>
      </div>
    );
  }

  const completedCount = akuProgress.filter(p => p.completed).length;
  const totalCount = akuProgress.length;

  return (
    <div className="h-screen flex bg-slate-950">
      {/* Progress Sidebar */}
      <ProgressSidebar />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900">
          <div className="flex items-center gap-4">
            <span className="text-lg font-semibold text-white">{currentAKU.title}</span>
            <span className="text-slate-500">|</span>
            <span className="text-sm text-slate-400">
              {completedCount}/{totalCount} completed
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">
              Hints: {hintsUsed}/{currentAKU.sandboxChallenge.maxHints}
            </span>
            <button
              onClick={handleHintRequest}
              disabled={hintsUsed >= currentAKU.sandboxChallenge.maxHints}
              className="px-3 py-1.5 bg-amber-600/20 text-amber-400 rounded text-sm hover:bg-amber-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Need a hint?
            </button>
            <button
              onClick={handleSubmitVerification}
              disabled={sandboxState.status !== 'complete' || isVerifying}
              className="px-4 py-1.5 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? 'Verifying...' : 'Submit for Verification'}
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
                addTutorMessage({
                  id: crypto.randomUUID(),
                  role: 'tutor',
                  content,
                  timestamp: new Date(),
                });
              }}
              sandboxState={sandboxState}
              aku={currentAKU}
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
              challenge={currentAKU.sandboxChallenge}
            />
          </div>
        </div>
      </div>

      {/* Celebration Modal */}
      {showCelebration && verificationResult && (
        <CelebrationModal
          result={verificationResult}
          akuTitle={currentAKU.title}
          onClose={hideCelebrationModal}
          onContinue={() => {
            hideCelebrationModal();
            // TODO: Navigate to next AKU
          }}
        />
      )}
    </div>
  );
}
