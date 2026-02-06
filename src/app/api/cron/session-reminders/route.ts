/**
 * SESSION REMINDERS CRON
 * Sends reminder emails for upcoming live sessions
 * Call via Vercel Cron or external scheduler
 */

import { createAdminClient } from '@/lib/supabase/server';
import { sendSessionReminderEmail } from '@/lib/email/resend';
import { NextRequest, NextResponse } from 'next/server';

// Verify cron secret to prevent unauthorized calls
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Skip verification in development
  if (process.env.NODE_ENV === 'development') return true;

  // If no secret configured, skip verification
  if (!cronSecret) return true;

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createAdminClient();
    const now = new Date();

    // Get sessions starting in the next 24 hours that haven't had reminders sent
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    const { data: upcomingSessions, error: sessionsError } = await supabase
      .from('live_sessions')
      .select(`
        id,
        title,
        scheduled_at,
        meeting_url,
        google_meet_url,
        zoom_url
      `)
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', oneDayFromNow.toISOString())
      .eq('status', 'scheduled');

    if (sessionsError) {
      console.error('Failed to fetch sessions:', sessionsError);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    if (!upcomingSessions || upcomingSessions.length === 0) {
      return NextResponse.json({ message: 'No upcoming sessions', sent: 0 });
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const session of upcomingSessions) {
      const sessionDate = new Date(session.scheduled_at);
      const hoursUntil = Math.round((sessionDate.getTime() - now.getTime()) / (60 * 60 * 1000));

      // Determine which reminder to send (24h, 1h, or skip)
      let shouldSend = false;
      if (hoursUntil <= 1 && hoursUntil > 0) {
        shouldSend = true; // 1 hour reminder
      } else if (hoursUntil <= 24 && hoursUntil > 23) {
        shouldSend = true; // 24 hour reminder
      }

      if (!shouldSend) continue;

      // Get enrolled users for this session
      const { data: enrollments, error: enrollError } = await supabase
        .from('seat_purchases')
        .select(`
          user_id,
          users:user_id (
            id,
            email,
            raw_user_meta_data
          )
        `)
        .eq('session_id', session.id)
        .eq('status', 'completed');

      if (enrollError) {
        errors.push(`Failed to fetch enrollments for session ${session.id}`);
        continue;
      }

      // Determine meeting URL
      const meetingUrl = session.meeting_url || session.google_meet_url || session.zoom_url || '';

      // Send reminders to each enrolled user
      for (const enrollment of enrollments || []) {
        const user = enrollment.users as unknown as {
          email?: string;
          raw_user_meta_data?: { full_name?: string };
        };

        if (!user?.email) continue;

        try {
          await sendSessionReminderEmail(
            user.email,
            user.raw_user_meta_data?.full_name,
            session.title,
            sessionDate,
            meetingUrl,
            hoursUntil
          );
          sentCount++;
        } catch (err) {
          errors.push(`Failed to send reminder to ${user.email}: ${err}`);
        }
      }
    }

    return NextResponse.json({
      message: `Session reminders sent`,
      sent: sentCount,
      sessions: upcomingSessions.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}

// Also support POST for Vercel Cron
export async function POST(request: NextRequest) {
  return GET(request);
}
