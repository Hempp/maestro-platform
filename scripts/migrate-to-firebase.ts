/**
 * DATA MIGRATION SCRIPT: Supabase → Firebase
 *
 * This script migrates data from Supabase (PostgreSQL) to Firebase (Firestore).
 * Run with: npx tsx scripts/migrate-to-firebase.ts
 *
 * Prerequisites:
 * - Supabase service role key in SUPABASE_SERVICE_ROLE_KEY
 * - Firebase Admin credentials configured
 * - Both databases accessible
 */

import { createClient } from '@supabase/supabase-js';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Batch size for Firestore writes
const BATCH_SIZE = 500;

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

// Initialize Supabase client with service role (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY,
    }),
  });
}

const db = admin.firestore();

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert snake_case to camelCase
 */
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert object keys from snake_case to camelCase
 */
function convertKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = toCamelCase(key);
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[camelKey] = convertKeys(value as Record<string, unknown>);
    } else {
      result[camelKey] = value;
    }
  }
  return result;
}

/**
 * Convert ISO date string to Firestore Timestamp
 */
function toTimestamp(dateStr: string | null): Timestamp | null {
  if (!dateStr) return null;
  return Timestamp.fromDate(new Date(dateStr));
}

/**
 * Log progress
 */
function log(message: string, count?: number) {
  const timestamp = new Date().toISOString();
  if (count !== undefined) {
    console.log(`[${timestamp}] ${message}: ${count}`);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MIGRATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Migrate users table
 */
async function migrateUsers() {
  log('Starting users migration...');

  const { data: users, error } = await supabase
    .from('users')
    .select('*');

  if (error) {
    log(`Error fetching users: ${error.message}`);
    return;
  }

  if (!users?.length) {
    log('No users to migrate');
    return;
  }

  log('Users found', users.length);

  let batch = db.batch();
  let count = 0;

  for (const user of users) {
    const docRef = db.collection('users').doc(user.id);
    batch.set(docRef, {
      email: user.email,
      fullName: user.full_name,
      avatarUrl: user.avatar_url,
      tier: user.tier,
      walletAddress: user.wallet_address,
      role: user.role || 'user',
      onboardingCompleted: user.onboarding_completed || false,
      stripeCustomerId: user.stripe_customer_id,
      createdAt: toTimestamp(user.created_at) || Timestamp.now(),
      updatedAt: toTimestamp(user.updated_at) || Timestamp.now(),
    });

    count++;
    if (count % BATCH_SIZE === 0) {
      await batch.commit();
      log(`Committed users batch`, count);
      batch = db.batch();
    }
  }

  if (count % BATCH_SIZE !== 0) {
    await batch.commit();
  }

  log('Users migration complete', count);
}

/**
 * Migrate learner_profiles table
 */
async function migrateLearnerProfiles() {
  log('Starting learner_profiles migration...');

  const { data: profiles, error } = await supabase
    .from('learner_profiles')
    .select('*');

  if (error) {
    log(`Error fetching learner_profiles: ${error.message}`);
    return;
  }

  if (!profiles?.length) {
    log('No learner profiles to migrate');
    return;
  }

  log('Learner profiles found', profiles.length);

  let batch = db.batch();
  let count = 0;

  for (const profile of profiles) {
    const docRef = db.collection('learnerProfiles').doc(profile.user_id);
    batch.set(docRef, {
      userId: profile.user_id,
      tier: profile.tier,
      currentPath: profile.current_path || 'foundation',
      interactionDna: profile.interaction_dna || {},
      struggleScore: profile.struggle_score || 50,
      totalLearningTime: profile.total_learning_time || 0,
      currentStreak: profile.current_streak || 0,
      longestStreak: profile.longest_streak || 0,
      lastActivityAt: toTimestamp(profile.last_activity_at),
      createdAt: toTimestamp(profile.created_at) || Timestamp.now(),
      updatedAt: toTimestamp(profile.updated_at) || Timestamp.now(),
    });

    count++;
    if (count % BATCH_SIZE === 0) {
      await batch.commit();
      log(`Committed learner_profiles batch`, count);
      batch = db.batch();
    }
  }

  if (count % BATCH_SIZE !== 0) {
    await batch.commit();
  }

  log('Learner profiles migration complete', count);
}

/**
 * Migrate aku_progress table
 */
async function migrateAkuProgress() {
  log('Starting aku_progress migration...');

  const { data: progress, error } = await supabase
    .from('aku_progress')
    .select('*');

  if (error) {
    log(`Error fetching aku_progress: ${error.message}`);
    return;
  }

  if (!progress?.length) {
    log('No AKU progress to migrate');
    return;
  }

  log('AKU progress records found', progress.length);

  let batch = db.batch();
  let count = 0;

  for (const p of progress) {
    const docRef = db.collection('akuProgress').doc();
    batch.set(docRef, {
      userId: p.user_id,
      akuId: p.aku_id,
      status: p.status,
      hintsUsed: p.hints_used || 0,
      attempts: p.attempts || 1,
      timeSpent: p.time_spent || 0,
      struggleScore: p.struggle_score || 50,
      completedAt: toTimestamp(p.completed_at),
      verifiedAt: toTimestamp(p.verified_at),
      workflowSnapshot: p.workflow_snapshot || null,
      createdAt: toTimestamp(p.created_at) || Timestamp.now(),
      updatedAt: toTimestamp(p.updated_at) || Timestamp.now(),
    });

    count++;
    if (count % BATCH_SIZE === 0) {
      await batch.commit();
      log(`Committed aku_progress batch`, count);
      batch = db.batch();
    }
  }

  if (count % BATCH_SIZE !== 0) {
    await batch.commit();
  }

  log('AKU progress migration complete', count);
}

/**
 * Migrate certificates table
 */
async function migrateCertificates() {
  log('Starting certificates migration...');

  const { data: certs, error } = await supabase
    .from('certificates')
    .select('*');

  if (error) {
    log(`Error fetching certificates: ${error.message}`);
    return;
  }

  if (!certs?.length) {
    log('No certificates to migrate');
    return;
  }

  log('Certificates found', certs.length);

  let batch = db.batch();
  let count = 0;

  for (const cert of certs) {
    const docRef = db.collection('certificates').doc(cert.id);
    batch.set(docRef, {
      userId: cert.user_id,
      courseId: cert.course_id,
      certificateType: cert.certificate_type,
      tokenId: cert.token_id,
      contractAddress: cert.contract_address,
      transactionHash: cert.transaction_hash,
      ipfsHash: cert.ipfs_hash,
      metadata: cert.metadata || {},
      issuedAt: toTimestamp(cert.issued_at),
      verifiedAt: toTimestamp(cert.verified_at),
      createdAt: toTimestamp(cert.created_at) || Timestamp.now(),
      updatedAt: toTimestamp(cert.updated_at) || Timestamp.now(),
    });

    count++;
    if (count % BATCH_SIZE === 0) {
      await batch.commit();
      log(`Committed certificates batch`, count);
      batch = db.batch();
    }
  }

  if (count % BATCH_SIZE !== 0) {
    await batch.commit();
  }

  log('Certificates migration complete', count);
}

/**
 * Migrate subscriptions table
 */
async function migrateSubscriptions() {
  log('Starting subscriptions migration...');

  const { data: subs, error } = await supabase
    .from('subscriptions')
    .select('*');

  if (error) {
    log(`Error fetching subscriptions: ${error.message}`);
    return;
  }

  if (!subs?.length) {
    log('No subscriptions to migrate');
    return;
  }

  log('Subscriptions found', subs.length);

  let batch = db.batch();
  let count = 0;

  for (const sub of subs) {
    const docRef = db.collection('subscriptions').doc();
    batch.set(docRef, {
      userId: sub.user_id,
      planId: sub.plan_id,
      status: sub.status,
      billingCycle: sub.billing_cycle,
      stripeCustomerId: sub.stripe_customer_id,
      stripeSubscriptionId: sub.stripe_subscription_id,
      stripePriceId: sub.stripe_price_id,
      stripeSessionId: sub.stripe_session_id,
      amount: sub.amount,
      currency: sub.currency,
      currentPeriodStart: toTimestamp(sub.current_period_start),
      currentPeriodEnd: toTimestamp(sub.current_period_end),
      cancelAtPeriodEnd: sub.cancel_at_period_end || false,
      cancelledAt: toTimestamp(sub.cancelled_at),
      createdAt: toTimestamp(sub.created_at) || Timestamp.now(),
      updatedAt: toTimestamp(sub.updated_at) || Timestamp.now(),
    });

    count++;
    if (count % BATCH_SIZE === 0) {
      await batch.commit();
      log(`Committed subscriptions batch`, count);
      batch = db.batch();
    }
  }

  if (count % BATCH_SIZE !== 0) {
    await batch.commit();
  }

  log('Subscriptions migration complete', count);
}

/**
 * Migrate user_milestones table
 */
async function migrateUserMilestones() {
  log('Starting user_milestones migration...');

  const { data: milestones, error } = await supabase
    .from('user_milestones')
    .select('*');

  if (error) {
    log(`Error fetching user_milestones: ${error.message}`);
    return;
  }

  if (!milestones?.length) {
    log('No milestones to migrate');
    return;
  }

  log('User milestones found', milestones.length);

  let batch = db.batch();
  let count = 0;

  for (const m of milestones) {
    const docRef = db.collection('userMilestones').doc();
    batch.set(docRef, {
      userId: m.user_id,
      path: m.path,
      milestoneNumber: m.milestone_number,
      status: m.status,
      submissionContent: m.submission_content,
      submissionFiles: m.submission_files,
      feedback: m.feedback,
      submittedAt: toTimestamp(m.submitted_at),
      approvedAt: toTimestamp(m.approved_at),
      createdAt: toTimestamp(m.created_at) || Timestamp.now(),
      updatedAt: toTimestamp(m.updated_at) || Timestamp.now(),
    });

    count++;
    if (count % BATCH_SIZE === 0) {
      await batch.commit();
      log(`Committed user_milestones batch`, count);
      batch = db.batch();
    }
  }

  if (count % BATCH_SIZE !== 0) {
    await batch.commit();
  }

  log('User milestones migration complete', count);
}

/**
 * Migrate tutor_conversations table
 */
async function migrateTutorConversations() {
  log('Starting tutor_conversations migration...');

  const { data: convs, error } = await supabase
    .from('tutor_conversations')
    .select('*');

  if (error) {
    log(`Error fetching tutor_conversations: ${error.message}`);
    return;
  }

  if (!convs?.length) {
    log('No conversations to migrate');
    return;
  }

  log('Tutor conversations found', convs.length);

  let batch = db.batch();
  let count = 0;

  for (const conv of convs) {
    const docRef = db.collection('tutorConversations').doc();
    batch.set(docRef, {
      userId: conv.user_id,
      path: conv.path,
      messages: conv.messages || [],
      currentMilestone: conv.current_milestone || 1,
      createdAt: toTimestamp(conv.created_at) || Timestamp.now(),
      updatedAt: toTimestamp(conv.updated_at) || Timestamp.now(),
    });

    count++;
    if (count % BATCH_SIZE === 0) {
      await batch.commit();
      log(`Committed tutor_conversations batch`, count);
      batch = db.batch();
    }
  }

  if (count % BATCH_SIZE !== 0) {
    await batch.commit();
  }

  log('Tutor conversations migration complete', count);
}

/**
 * Migrate certification_submissions table
 */
async function migrateCertificationSubmissions() {
  log('Starting certification_submissions migration...');

  const { data: submissions, error } = await supabase
    .from('certification_submissions')
    .select('*');

  if (error) {
    log(`Error fetching certification_submissions: ${error.message}`);
    return;
  }

  if (!submissions?.length) {
    log('No submissions to migrate');
    return;
  }

  log('Certification submissions found', submissions.length);

  let batch = db.batch();
  let count = 0;

  for (const s of submissions) {
    const docRef = db.collection('certificationSubmissions').doc(s.id);
    batch.set(docRef, {
      userId: s.user_id,
      path: s.path,
      projectTitle: s.project_title,
      projectDescription: s.project_description,
      githubRepoUrl: s.github_repo_url,
      architectureUrl: s.architecture_url,
      demoVideoUrl: s.demo_video_url,
      liveDemoUrl: s.live_demo_url,
      roiDocument: s.roi_document,
      documentationUrl: s.documentation_url,
      productionLogs: s.production_logs,
      scores: s.scores || {},
      totalScore: s.total_score,
      status: s.status,
      reviewedBy: s.reviewed_by,
      reviewerNotes: s.reviewer_notes,
      paidAt: toTimestamp(s.paid_at),
      submittedAt: toTimestamp(s.submitted_at),
      reviewedAt: toTimestamp(s.reviewed_at),
      createdAt: toTimestamp(s.created_at) || Timestamp.now(),
      updatedAt: toTimestamp(s.updated_at) || Timestamp.now(),
    });

    count++;
    if (count % BATCH_SIZE === 0) {
      await batch.commit();
      log(`Committed certification_submissions batch`, count);
      batch = db.batch();
    }
  }

  if (count % BATCH_SIZE !== 0) {
    await batch.commit();
  }

  log('Certification submissions migration complete', count);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN MIGRATION RUNNER
// ═══════════════════════════════════════════════════════════════════════════

async function runMigration() {
  console.log('═'.repeat(60));
  console.log('SUPABASE → FIREBASE DATA MIGRATION');
  console.log('═'.repeat(60));
  console.log();

  const startTime = Date.now();

  try {
    // Validate environment
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('Supabase credentials not configured');
    }
    if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
      throw new Error('Firebase credentials not configured');
    }

    // Run migrations in order
    await migrateUsers();
    await migrateLearnerProfiles();
    await migrateAkuProgress();
    await migrateCertificates();
    await migrateSubscriptions();
    await migrateUserMilestones();
    await migrateTutorConversations();
    await migrateCertificationSubmissions();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log();
    console.log('═'.repeat(60));
    console.log(`MIGRATION COMPLETE - ${duration}s`);
    console.log('═'.repeat(60));
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
