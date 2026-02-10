/**
 * LEARNING SESSION STORE
 * Manages state for the active learning session
 */

import { create } from 'zustand';
import type {
  AtomicKnowledgeUnit,
  SandboxState,
  TutorMessage,
  BusinessTier,
  VerificationResult,
} from '@/types';

interface LearningSession {
  // Learner
  learnerId: string | null;
  tier: BusinessTier | null;

  // Current AKU
  currentAKU: AtomicKnowledgeUnit | null;
  akuProgress: { id: string; completed: boolean }[];

  // Sandbox
  sandboxState: SandboxState | null;

  // Tutor
  tutorMessages: TutorMessage[];

  // Session metrics
  hintsUsed: number;
  startTime: Date | null;

  // Verification
  verificationResult: VerificationResult | null;
  showCelebration: boolean;
}

interface LearningActions {
  // Session management
  initSession: (learnerId: string, tier: BusinessTier, akus: AtomicKnowledgeUnit[]) => void;
  resetSession: () => void;

  // AKU navigation
  setCurrentAKU: (aku: AtomicKnowledgeUnit) => void;
  completeCurrentAKU: () => void;

  // Sandbox
  updateSandboxState: (state: SandboxState) => void;

  // Tutor
  addTutorMessage: (message: TutorMessage) => void;

  // Hints
  useHint: () => void;

  // Verification
  setVerificationResult: (result: VerificationResult) => void;
  showCelebrationModal: () => void;
  hideCelebrationModal: () => void;
}

const initialState: LearningSession = {
  learnerId: null,
  tier: null,
  currentAKU: null,
  akuProgress: [],
  sandboxState: null,
  tutorMessages: [],
  hintsUsed: 0,
  startTime: null,
  verificationResult: null,
  showCelebration: false,
};

export const useLearningStore = create<LearningSession & LearningActions>((set, get) => ({
  ...initialState,

  initSession: (learnerId, tier, akus) => {
    set({
      learnerId,
      tier,
      akuProgress: akus.map(aku => ({ id: aku.id, completed: false })),
      currentAKU: akus[0] || null,
      startTime: new Date(),
      tutorMessages: akus[0] ? [{
        id: '1',
        role: 'tutor',
        content: `Welcome to "${akus[0].title}".\n\n${akus[0].concept.trim()}\n\n**Your Challenge:** ${akus[0].sandboxChallenge.prompt}`,
        timestamp: new Date(),
      }] : [],
      sandboxState: akus[0] ? {
        learnerId,
        sessionId: crypto.randomUUID(),
        workflow: akus[0].sandboxChallenge.starterWorkflow || [],
        executionLog: [],
        status: 'idle',
      } : null,
    });
  },

  resetSession: () => set(initialState),

  setCurrentAKU: (aku) => {
    const { learnerId } = get();
    set({
      currentAKU: aku,
      hintsUsed: 0,
      startTime: new Date(),
      tutorMessages: [{
        id: crypto.randomUUID(),
        role: 'tutor',
        content: `Let's work on "${aku.title}".\n\n${aku.concept.trim()}\n\n**Your Challenge:** ${aku.sandboxChallenge.prompt}`,
        timestamp: new Date(),
      }],
      sandboxState: {
        learnerId: learnerId!,
        sessionId: crypto.randomUUID(),
        workflow: aku.sandboxChallenge.starterWorkflow || [],
        executionLog: [],
        status: 'idle',
      },
      verificationResult: null,
    });
  },

  completeCurrentAKU: () => {
    const { currentAKU, akuProgress } = get();
    if (!currentAKU) return;

    set({
      akuProgress: akuProgress.map(p =>
        p.id === currentAKU.id ? { ...p, completed: true } : p
      ),
    });
  },

  updateSandboxState: (sandboxState) => set({ sandboxState }),

  addTutorMessage: (message) => {
    const { tutorMessages } = get();
    set({ tutorMessages: [...tutorMessages, message] });
  },

  useHint: () => {
    const { hintsUsed } = get();
    set({ hintsUsed: hintsUsed + 1 });
  },

  setVerificationResult: (result) => set({ verificationResult: result }),

  showCelebrationModal: () => set({ showCelebration: true }),

  hideCelebrationModal: () => set({ showCelebration: false }),
}));
