/**
 * FIRESTORE TYPE DEFINITIONS
 * Type-safe interfaces for Firestore collections
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// ENUMS / UNION TYPES
// ============================================================================

export type TierType = 'student' | 'employee' | 'owner';
export type UserRole = 'user' | 'admin' | 'teacher' | 'instructor';
export type AkuStatus = 'not_started' | 'in_progress' | 'completed' | 'verified';
export type SessionType = 'onboarding' | 'learning' | 'support';
export type SandboxStatus = 'idle' | 'running' | 'success' | 'error';
export type SubscriptionStatus = 'pending' | 'active' | 'cancelled' | 'past_due' | 'trialing' | 'incomplete';
export type BillingCycle = 'monthly' | 'yearly';
export type CertificationStatus = 'submitted' | 'under_review' | 'passed' | 'failed' | 'needs_revision';
export type MilestoneStatus = 'locked' | 'active' | 'submitted' | 'approved' | 'needs_revision';
export type ThemePreference = 'dark' | 'light' | 'system';
export type LearningPace = 'relaxed' | 'standard' | 'intensive';

// ============================================================================
// USER & PROFILE
// ============================================================================

export interface FirestoreUser {
  email: string;
  fullName?: string;
  avatarUrl?: string;
  tier?: TierType;
  walletAddress?: string;
  role?: UserRole;
  onboardingCompleted: boolean;
  stripeCustomerId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreLearnerProfile {
  userId: string;
  tier: TierType;
  currentPath: string;
  interactionDna: Record<string, unknown>;
  struggleScore: number;
  totalLearningTime: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreUserSettings {
  userId: string;
  // Profile
  displayName?: string;
  bio?: string;
  // Notifications
  emailNotifications: boolean;
  learningReminders: boolean;
  communityActivity: boolean;
  marketingEmails: boolean;
  // Learning Preferences
  learningPace: LearningPace;
  dailyGoalMinutes: number;
  showProgressOnProfile: boolean;
  // Appearance
  theme: ThemePreference;
  // Privacy & Security
  twoFactorEnabled: boolean;
  profileVisibility: 'public' | 'private' | 'friends';
  showActivityStatus: boolean;
  allowDataCollection: boolean;
  // Accessibility
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  screenReaderOptimized: boolean;
  // Wallet
  walletConnected: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// LEARNING & PROGRESS
// ============================================================================

export interface FirestoreAkuProgress {
  id?: string;
  userId: string;
  akuId: string;
  status: AkuStatus;
  hintsUsed: number;
  attempts: number;
  timeSpent: number;
  struggleScore: number;
  completedAt: Timestamp | null;
  verifiedAt: Timestamp | null;
  workflowSnapshot: Record<string, unknown> | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreChatSession {
  userId: string;
  sessionType: SessionType;
  messages: ChatMessage[];
  currentStep: number;
  metadata: Record<string, unknown>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface FirestoreTutorConversation {
  userId: string;
  path: TierType;
  messages: ChatMessage[];
  currentMilestone: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreUserMilestone {
  userId: string;
  path: TierType;
  milestoneNumber: number;
  status: MilestoneStatus;
  submissionContent?: Record<string, unknown>;
  submissionFiles?: string[];
  feedback?: string;
  submittedAt?: Timestamp;
  approvedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// CERTIFICATES & CREDENTIALS
// ============================================================================

export interface FirestoreCertificate {
  userId: string;
  courseId?: string;
  certificateType: TierType;
  tokenId?: string;
  contractAddress?: string;
  transactionHash?: string;
  ipfsHash?: string;
  metadata: Record<string, unknown>;
  issuedAt: Timestamp;
  verifiedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreCertificationSubmission {
  userId: string;
  path: TierType;
  projectTitle: string;
  projectDescription: string;
  githubRepoUrl?: string;
  architectureUrl?: string;
  demoVideoUrl?: string;
  liveDemoUrl?: string;
  roiDocument?: string;
  documentationUrl?: string;
  productionLogs?: Record<string, unknown>;
  scores: {
    architecture?: number;
    documentation?: number;
    codeQuality?: number;
    demonstration?: number;
    innovation?: number;
    businessImpact?: number;
  };
  totalScore?: number;
  status: CertificationStatus;
  reviewedBy?: string;
  reviewerNotes?: string;
  paidAt?: Timestamp;
  submittedAt: Timestamp;
  reviewedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// SUBSCRIPTIONS & PAYMENTS
// ============================================================================

export interface FirestoreSubscription {
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  stripeSessionId?: string;
  amount: number;
  currency: string;
  currentPeriodStart?: Timestamp;
  currentPeriodEnd?: Timestamp;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestorePayment {
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripePaymentIntentId?: string;
  metadata: Record<string, unknown>;
  completedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreUsageTracking {
  userId: string;
  periodStart: Timestamp;
  periodEnd: Timestamp;
  tutorSessions: number;
  agentExecutions: number;
  skillUses: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// SANDBOX & TERMINAL
// ============================================================================

export interface FirestoreSandboxSession {
  userId: string;
  akuId?: string;
  code: string;
  output: Record<string, unknown>;
  status: SandboxStatus;
  executionTime?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreTerminalHistory {
  userId: string;
  command: string;
  output: string;
  status: 'success' | 'error';
  executionTime?: number;
  createdAt: Timestamp;
}

// ============================================================================
// COURSES & ENROLLMENT
// ============================================================================

export interface FirestoreCourse {
  title: string;
  description: string;
  slug: string;
  instructorId: string;
  categoryId?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'draft' | 'published' | 'archived';
  price: number;
  thumbnailUrl?: string;
  requirements: string[];
  whatYouWillLearn: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreEnrollment {
  userId: string;
  courseId: string;
  progressPercentage: number;
  enrolledAt: Timestamp;
  lastAccessedAt?: Timestamp;
  completedAt?: Timestamp;
}

export interface FirestoreLiveSession {
  courseId: string;
  title: string;
  description: string;
  scheduledAt: Timestamp;
  durationMinutes: number;
  platform: string;
  targetTier: TierType;
  seatPrice: number;
  maxSeats: number;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export interface FirestoreNotification {
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  createdAt: Timestamp;
}

// ============================================================================
// ANALYTICS
// ============================================================================

export interface FirestoreDailyMetrics {
  date: string;
  userId: string;
  activeMinutes: number;
  akusCompleted: number;
  akusStarted: number;
  codeExecutions: number;
  terminalCommands: number;
  chatMessages: number;
  struggleEvents: number;
}
