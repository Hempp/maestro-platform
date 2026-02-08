/**
 * RETENTION EMAILS CRON JOB
 * Sends automated retention emails at Day 1, Day 3, and Day 7 after signup
 *
 * This endpoint should be called by a cron service (Vercel Cron, etc.)
 * Recommended schedule: Every hour
 *
 * Security: Requires CRON_SECRET header to prevent unauthorized access
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  sendDay1Email,
  sendDay3Email,
  sendDay7Email,
} from '@/lib/email/resend';

// Email type configuration
const EMAIL_CONFIGS = [
  { type: 'day_1' as const, daysSinceSignup: 1, handler: handleDay1Emails },
  { type: 'day_3' as const, daysSinceSignup: 3, handler: handleDay3Emails },
  { type: 'day_7' as const, daysSinceSignup: 7, handler: handleDay7Emails },
] as const;

type RetentionEmailType = 'day_1' | 'day_3' | 'day_7';

interface EmailCandidate {
  user_id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  has_activity: boolean;
  modules_completed: number;
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

    const supabase = createAdminClient();
    const results: EmailResult[] = [];
    const errors: string[] = [];

    // Process each email type
    for (const config of EMAIL_CONFIGS) {
      try {
        const emailResults = await config.handler(supabase);
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

/**
 * Handle Day 1 emails - Welcome + First Lesson Nudge
 */
async function handleDay1Emails(
  supabase: ReturnType<typeof createAdminClient>
): Promise<EmailResult[]> {
  const candidates = await getEmailCandidates(supabase, 'day_1', 1);
  const results: EmailResult[] = [];

  for (const candidate of candidates) {
    const result = await sendDay1Email(
      candidate.email,
      candidate.full_name ?? undefined,
      candidate.has_activity
    );

    const emailResult: EmailResult = {
      userId: candidate.user_id,
      email: candidate.email,
      type: 'day_1',
      success: result.success,
      error: result.error,
      resendId: result.id,
    };

    // Record the email send attempt
    await recordEmailSent(supabase, candidate.user_id, 'day_1', result);

    results.push(emailResult);
  }

  console.log(`[Retention Emails] Day 1: Processed ${results.length} emails`);
  return results;
}

/**
 * Handle Day 3 emails - Progress Check + Tips
 */
async function handleDay3Emails(
  supabase: ReturnType<typeof createAdminClient>
): Promise<EmailResult[]> {
  const candidates = await getEmailCandidates(supabase, 'day_3', 3);
  const results: EmailResult[] = [];

  for (const candidate of candidates) {
    // Get additional user data for personalization
    const { data: profile } = await supabase
      .from('learner_profiles')
      .select('current_streak')
      .eq('user_id', candidate.user_id)
      .single();

    const result = await sendDay3Email(
      candidate.email,
      candidate.full_name ?? undefined,
      candidate.modules_completed,
      profile?.current_streak ?? 0
    );

    const emailResult: EmailResult = {
      userId: candidate.user_id,
      email: candidate.email,
      type: 'day_3',
      success: result.success,
      error: result.error,
      resendId: result.id,
    };

    await recordEmailSent(supabase, candidate.user_id, 'day_3', result);
    results.push(emailResult);
  }

  console.log(`[Retention Emails] Day 3: Processed ${results.length} emails`);
  return results;
}

/**
 * Handle Day 7 emails - Re-engagement
 */
async function handleDay7Emails(
  supabase: ReturnType<typeof createAdminClient>
): Promise<EmailResult[]> {
  const candidates = await getEmailCandidates(supabase, 'day_7', 7);
  const results: EmailResult[] = [];

  for (const candidate of candidates) {
    // Calculate days inactive
    const { data: profile } = await supabase
      .from('learner_profiles')
      .select('last_activity_at')
      .eq('user_id', candidate.user_id)
      .single();

    let daysInactive = 7;
    if (profile?.last_activity_at) {
      const lastActivity = new Date(profile.last_activity_at);
      const now = new Date();
      daysInactive = Math.floor(
        (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    const result = await sendDay7Email(
      candidate.email,
      candidate.full_name ?? undefined,
      candidate.modules_completed,
      daysInactive
    );

    const emailResult: EmailResult = {
      userId: candidate.user_id,
      email: candidate.email,
      type: 'day_7',
      success: result.success,
      error: result.error,
      resendId: result.id,
    };

    await recordEmailSent(supabase, candidate.user_id, 'day_7', result);
    results.push(emailResult);
  }

  console.log(`[Retention Emails] Day 7: Processed ${results.length} emails`);
  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get users eligible for a specific retention email
 */
async function getEmailCandidates(
  supabase: ReturnType<typeof createAdminClient>,
  emailType: RetentionEmailType,
  daysSinceSignup: number
): Promise<EmailCandidate[]> {
  // Calculate the date range for users who signed up X days ago
  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() - daysSinceSignup);

  // Set the time window: users who signed up between 23-25 hours ago from the target
  const startOfWindow = new Date(targetDate);
  startOfWindow.setHours(startOfWindow.getHours() - 1);

  const endOfWindow = new Date(targetDate);
  endOfWindow.setHours(endOfWindow.getHours() + 23);

  // Query users who:
  // 1. Signed up in the target window
  // 2. Haven't received this email yet
  // 3. Have email notifications enabled
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select(`
      id,
      email,
      full_name,
      created_at
    `)
    .gte('created_at', startOfWindow.toISOString())
    .lt('created_at', endOfWindow.toISOString())
    .limit(100);

  if (usersError) {
    console.error('[Retention Emails] Error fetching users:', usersError);
    return [];
  }

  if (!users || users.length === 0) {
    return [];
  }

  // Filter out users who already received this email
  const { data: sentEmails } = await supabase
    .from('retention_emails')
    .select('user_id')
    .eq('email_type', emailType)
    .in('user_id', users.map(u => u.id));

  const sentUserIds = new Set(sentEmails?.map(e => e.user_id) || []);

  // Filter out users who have disabled email notifications
  const { data: settings } = await supabase
    .from('user_settings')
    .select('user_id, email_notifications, learning_reminders')
    .in('user_id', users.map(u => u.id));

  const disabledUserIds = new Set(
    settings
      ?.filter(s => s.email_notifications === false || s.learning_reminders === false)
      .map(s => s.user_id) || []
  );

  // Get activity data for eligible users
  const eligibleUsers = users.filter(
    u => !sentUserIds.has(u.id) && !disabledUserIds.has(u.id)
  );

  if (eligibleUsers.length === 0) {
    return [];
  }

  // Get learner profiles for activity info
  const { data: profiles } = await supabase
    .from('learner_profiles')
    .select('user_id, last_activity_at')
    .in('user_id', eligibleUsers.map(u => u.id));

  type ProfileData = { user_id: string; last_activity_at: string | null };
  const profileMap = new Map<string, ProfileData>(
    profiles?.map(p => [p.user_id, p as ProfileData]) || []
  );

  // Get completed modules count
  const { data: progress } = await supabase
    .from('aku_progress')
    .select('user_id')
    .in('user_id', eligibleUsers.map(u => u.id))
    .in('status', ['completed', 'verified']);

  const modulesCounts = new Map<string, number>();
  progress?.forEach(p => {
    modulesCounts.set(p.user_id, (modulesCounts.get(p.user_id) || 0) + 1);
  });

  // Build candidates list
  return eligibleUsers
    .filter(user => user.created_at !== null)
    .map(user => {
      const profile = profileMap.get(user.id);
      const signupTime = new Date(user.created_at!).getTime();
      const lastActivityTime = profile?.last_activity_at
        ? new Date(profile.last_activity_at).getTime()
        : 0;

      return {
        user_id: user.id,
        email: user.email,
        full_name: user.full_name,
        created_at: user.created_at!,
        has_activity: lastActivityTime > signupTime + 60 * 60 * 1000, // Activity > 1hr after signup
        modules_completed: modulesCounts.get(user.id) || 0,
      };
    });
}

/**
 * Record that an email was sent (or attempted)
 */
async function recordEmailSent(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  emailType: RetentionEmailType,
  result: { success: boolean; id?: string; error?: string }
): Promise<void> {
  try {
    await supabase.from('retention_emails').insert({
      user_id: userId,
      email_type: emailType,
      resend_id: result.id,
      success: result.success,
      error_message: result.error,
    });
  } catch (err) {
    console.error('[Retention Emails] Failed to record email send:', err);
  }
}
