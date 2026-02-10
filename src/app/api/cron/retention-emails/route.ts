/**
 * RETENTION EMAILS CRON JOB (Firebase)
 * Sends automated retention emails at Day 1, Day 3, and Day 7 after signup
 *
 * This endpoint should be called by a cron service (Vercel Cron, etc.)
 * Recommended schedule: Every hour
 *
 * Security: Requires CRON_SECRET header to prevent unauthorized access
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import {
  sendDay1Email,
  sendDay3Email,
  sendDay7Email,
} from '@/lib/email/resend';

type RetentionEmailType = 'day_1' | 'day_3' | 'day_7';

interface EmailCandidate {
  userId: string;
  email: string;
  fullName: string | null;
  createdAt: Date;
  hasActivity: boolean;
  modulesCompleted: number;
}

interface EmailResult {
  userId: string;
  email: string;
  type: RetentionEmailType;
  success: boolean;
  error?: string;
  resendId?: string;
}

/**
 * POST /api/cron/retention-emails
 * Processes and sends retention emails
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Retention Emails] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Retention Emails] Starting retention email job...');

    const results: EmailResult[] = [];
    const errors: string[] = [];

    // Process each email type
    const emailConfigs = [
      { type: 'day_1' as const, daysSinceSignup: 1, handler: handleDay1Emails },
      { type: 'day_3' as const, daysSinceSignup: 3, handler: handleDay3Emails },
      { type: 'day_7' as const, daysSinceSignup: 7, handler: handleDay7Emails },
    ];

    for (const config of emailConfigs) {
      try {
        const emailResults = await config.handler();
        results.push(...emailResults);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`${config.type}: ${message}`);
        console.error(`[Retention Emails] Error processing ${config.type}:`, message);
      }
    }

    // Summary
    const sent = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`[Retention Emails] Complete. Sent: ${sent}, Failed: ${failed}`);

    return NextResponse.json({
      success: true,
      summary: {
        sent,
        failed,
        total: results.length,
      },
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Retention Emails] Fatal error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET endpoint for health checks
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/cron/retention-emails',
    description: 'Sends Day 1, Day 3, and Day 7 retention emails',
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

async function handleDay1Emails(): Promise<EmailResult[]> {
  const candidates = await getEmailCandidates('day_1', 1);
  const results: EmailResult[] = [];

  for (const candidate of candidates) {
    const result = await sendDay1Email(
      candidate.email,
      candidate.fullName ?? undefined,
      candidate.hasActivity
    );

    const emailResult: EmailResult = {
      userId: candidate.userId,
      email: candidate.email,
      type: 'day_1',
      success: result.success,
      error: result.error,
      resendId: result.id,
    };

    await recordEmailSent(candidate.userId, 'day_1', result);
    results.push(emailResult);
  }

  console.log(`[Retention Emails] Day 1: Processed ${results.length} emails`);
  return results;
}

async function handleDay3Emails(): Promise<EmailResult[]> {
  const db = getAdminDb();
  const candidates = await getEmailCandidates('day_3', 3);
  const results: EmailResult[] = [];

  for (const candidate of candidates) {
    // Get additional user data for personalization
    const profileQuery = await db
      .collection('learnerProfiles')
      .where('userId', '==', candidate.userId)
      .limit(1)
      .get();

    const profile = profileQuery.empty ? null : profileQuery.docs[0].data();

    const result = await sendDay3Email(
      candidate.email,
      candidate.fullName ?? undefined,
      candidate.modulesCompleted,
      profile?.currentStreak ?? 0
    );

    const emailResult: EmailResult = {
      userId: candidate.userId,
      email: candidate.email,
      type: 'day_3',
      success: result.success,
      error: result.error,
      resendId: result.id,
    };

    await recordEmailSent(candidate.userId, 'day_3', result);
    results.push(emailResult);
  }

  console.log(`[Retention Emails] Day 3: Processed ${results.length} emails`);
  return results;
}

async function handleDay7Emails(): Promise<EmailResult[]> {
  const db = getAdminDb();
  const candidates = await getEmailCandidates('day_7', 7);
  const results: EmailResult[] = [];

  for (const candidate of candidates) {
    // Calculate days inactive
    const profileQuery = await db
      .collection('learnerProfiles')
      .where('userId', '==', candidate.userId)
      .limit(1)
      .get();

    const profile = profileQuery.empty ? null : profileQuery.docs[0].data();

    let daysInactive = 7;
    if (profile?.lastActivityAt) {
      const lastActivity = profile.lastActivityAt.toDate?.() || new Date(profile.lastActivityAt);
      const now = new Date();
      daysInactive = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    }

    const result = await sendDay7Email(
      candidate.email,
      candidate.fullName ?? undefined,
      candidate.modulesCompleted,
      daysInactive
    );

    const emailResult: EmailResult = {
      userId: candidate.userId,
      email: candidate.email,
      type: 'day_7',
      success: result.success,
      error: result.error,
      resendId: result.id,
    };

    await recordEmailSent(candidate.userId, 'day_7', result);
    results.push(emailResult);
  }

  console.log(`[Retention Emails] Day 7: Processed ${results.length} emails`);
  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

async function getEmailCandidates(
  emailType: RetentionEmailType,
  daysSinceSignup: number
): Promise<EmailCandidate[]> {
  const db = getAdminDb();

  // Calculate the date range for users who signed up X days ago
  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() - daysSinceSignup);

  // Set the time window: users who signed up between 23-25 hours ago from the target
  const startOfWindow = new Date(targetDate);
  startOfWindow.setHours(startOfWindow.getHours() - 1);

  const endOfWindow = new Date(targetDate);
  endOfWindow.setHours(endOfWindow.getHours() + 23);

  // Query users who signed up in the target window
  const usersQuery = await db
    .collection('users')
    .where('createdAt', '>=', Timestamp.fromDate(startOfWindow))
    .where('createdAt', '<', Timestamp.fromDate(endOfWindow))
    .limit(100)
    .get();

  if (usersQuery.empty) {
    return [];
  }

  const users = usersQuery.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as any[];

  // Filter out users who already received this email
  const sentEmailsQuery = await db
    .collection('retentionEmails')
    .where('emailType', '==', emailType)
    .where('userId', 'in', users.map(u => u.id).slice(0, 30)) // Firestore limit
    .get();

  const sentUserIds = new Set(sentEmailsQuery.docs.map(doc => doc.data().userId));

  // Filter out users who have disabled email notifications
  const userIds = users.map(u => u.id).slice(0, 30);
  const settingsQuery = userIds.length > 0
    ? await db
        .collection('userSettings')
        .where('userId', 'in', userIds)
        .get()
    : { docs: [] };

  const disabledUserIds = new Set(
    settingsQuery.docs
      .filter(doc => {
        const data = doc.data();
        return data.emailNotifications === false || data.learningReminders === false;
      })
      .map(doc => doc.data().userId)
  );

  // Get eligible users
  const eligibleUsers = users.filter(
    u => !sentUserIds.has(u.id) && !disabledUserIds.has(u.id)
  );

  if (eligibleUsers.length === 0) {
    return [];
  }

  // Get learner profiles for activity info
  const eligibleIds = eligibleUsers.map(u => u.id).slice(0, 30);
  const profilesQuery = eligibleIds.length > 0
    ? await db
        .collection('learnerProfiles')
        .where('userId', 'in', eligibleIds)
        .get()
    : { docs: [] };

  const profileMap = new Map(
    profilesQuery.docs.map(doc => [doc.data().userId, doc.data()])
  );

  // Get completed modules count
  const progressQuery = eligibleIds.length > 0
    ? await db
        .collection('akuProgress')
        .where('userId', 'in', eligibleIds)
        .where('status', 'in', ['completed', 'verified'])
        .get()
    : { docs: [] };

  const modulesCounts = new Map<string, number>();
  progressQuery.docs.forEach(doc => {
    const userId = doc.data().userId;
    modulesCounts.set(userId, (modulesCounts.get(userId) || 0) + 1);
  });

  // Build candidates list
  return eligibleUsers
    .filter(user => user.createdAt)
    .map(user => {
      const profile = profileMap.get(user.id);
      const createdAt = user.createdAt?.toDate?.() || new Date(user.createdAt);
      const signupTime = createdAt.getTime();
      const lastActivityAt = profile?.lastActivityAt?.toDate?.() || null;
      const lastActivityTime = lastActivityAt?.getTime() || 0;

      return {
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        createdAt,
        hasActivity: lastActivityTime > signupTime + 60 * 60 * 1000, // Activity > 1hr after signup
        modulesCompleted: modulesCounts.get(user.id) || 0,
      };
    });
}

async function recordEmailSent(
  userId: string,
  emailType: RetentionEmailType,
  result: { success: boolean; id?: string; error?: string }
): Promise<void> {
  try {
    const db = getAdminDb();
    await db.collection('retentionEmails').add({
      userId,
      emailType,
      resendId: result.id || null,
      success: result.success,
      errorMessage: result.error || null,
      createdAt: Timestamp.now(),
    });
  } catch (err) {
    console.error('[Retention Emails] Failed to record email send:', err);
  }
}
