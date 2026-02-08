/**
 * EMAIL SERVICE
 * Centralized email sending using Resend
 */

import { Resend } from 'resend';

// Lazy initialize Resend client
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY || '');
  }
  return resendClient;
}

// Default sender
const FROM_EMAIL = process.env.FROM_EMAIL || 'Phazur <hello@phazur.com>';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@phazur.com';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  // Skip in development if no API key
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] Skipping email (no API key):', options.subject);
    console.log('[Email] To:', options.to);
    return { success: true, id: 'dev-skip' };
  }

  try {
    const { data, error } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo || SUPPORT_EMAIL,
      tags: options.tags,
    });

    if (error) {
      console.error('[Email] Failed to send:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email] Sent successfully:', data?.id);
    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Email] Exception:', message);
    return { success: false, error: message };
  }
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(
  email: string,
  name?: string
): Promise<EmailResult> {
  const firstName = name?.split(' ')[0] || 'there';

  return sendEmail({
    to: email,
    subject: 'Welcome to Phazur - Your AI Learning Journey Starts Now',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f1115; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 0;">PHAZUR</h1>
      <p style="color: #64748b; font-size: 14px; margin: 8px 0 0;">AI Learning Lab</p>
    </div>

    <!-- Main Content -->
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 40px; border: 1px solid #334155;">
      <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 16px;">Hey ${firstName}! 👋</h2>

      <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        Welcome to Phazur. You've just taken the first step toward mastering AI skills that actually matter for your career.
      </p>

      <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        Unlike other courses, we focus on <strong style="color: #22d3ee;">real projects</strong> and <strong style="color: #22d3ee;">hands-on challenges</strong> - no boring quizzes, just skills you can use immediately.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://pla-ten-eosin.vercel.app/learn"
           style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Start Learning Now
        </a>
      </div>

      <!-- What's Next -->
      <div style="background: rgba(6, 182, 212, 0.1); border-radius: 12px; padding: 24px; margin-top: 24px;">
        <h3 style="color: #22d3ee; font-size: 16px; margin: 0 0 16px;">Here's what to do next:</h3>
        <ul style="color: #94a3b8; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Choose your learning path (Student, Employee, or Owner)</li>
          <li>Complete your first module with real AI tools</li>
          <li>Build your portfolio with verified projects</li>
          <li>Earn blockchain-verified credentials</li>
        </ul>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 40px;">
      <p style="color: #64748b; font-size: 12px; margin: 0;">
        Questions? Reply to this email or reach us at ${SUPPORT_EMAIL}
      </p>
      <p style="color: #475569; font-size: 11px; margin: 16px 0 0;">
        © ${new Date().getFullYear()} Phazur. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `,
    tags: [{ name: 'type', value: 'welcome' }],
  });
}

/**
 * Send certificate issued email
 */
export async function sendCertificateEmail(
  email: string,
  name: string | undefined,
  certificateType: 'student' | 'employee' | 'owner',
  certificateId: string
): Promise<EmailResult> {
  const firstName = name?.split(' ')[0] || 'there';

  const tierInfo = {
    student: { title: 'Certified AI Associate', color: '#a855f7' },
    employee: { title: 'Workflow Efficiency Lead', color: '#22d3ee' },
    owner: { title: 'AI Operations Master', color: '#10b981' },
  };

  const { title, color } = tierInfo[certificateType];

  return sendEmail({
    to: email,
    subject: `🎉 Congratulations! You've earned your ${title} certificate`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f1115; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 0;">PHAZUR</h1>
    </div>

    <!-- Certificate Card -->
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 40px; border: 1px solid ${color}40; text-align: center;">

      <!-- Trophy Icon -->
      <div style="width: 80px; height: 80px; margin: 0 auto 24px; background: ${color}20; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 40px;">🏆</span>
      </div>

      <h2 style="color: #ffffff; font-size: 28px; margin: 0 0 8px;">Congratulations, ${firstName}!</h2>

      <p style="color: #94a3b8; font-size: 16px; margin: 0 0 32px;">
        You've successfully completed all requirements and earned your certificate.
      </p>

      <!-- Certificate Badge -->
      <div style="background: ${color}15; border: 2px solid ${color}; border-radius: 12px; padding: 24px; margin: 0 0 32px;">
        <p style="color: ${color}; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">Certificate Earned</p>
        <h3 style="color: #ffffff; font-size: 22px; margin: 0;">${title}</h3>
      </div>

      <!-- CTA Buttons -->
      <div style="margin: 32px 0;">
        <a href="https://pla-ten-eosin.vercel.app/api/certificates/verify?id=${certificateId}"
           style="display: inline-block; background: ${color}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 0 8px 12px;">
          View Certificate
        </a>
        <a href="https://www.linkedin.com/sharing/share-offsite/?url=https://pla-ten-eosin.vercel.app/api/certificates/verify?id=${certificateId}"
           style="display: inline-block; background: #0077b5; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 0 8px 12px;">
          Share on LinkedIn
        </a>
      </div>

      <p style="color: #64748b; font-size: 14px; margin: 0;">
        Your credential is blockchain-verified and can be shared with employers.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 40px;">
      <p style="color: #475569; font-size: 11px; margin: 0;">
        © ${new Date().getFullYear()} Phazur. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `,
    tags: [
      { name: 'type', value: 'certificate' },
      { name: 'tier', value: certificateType },
    ],
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<EmailResult> {
  const resetUrl = `https://pla-ten-eosin.vercel.app/reset-password?token=${resetToken}`;

  return sendEmail({
    to: email,
    subject: 'Reset your Phazur password',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f1115; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 0;">PHAZUR</h1>
    </div>

    <!-- Main Content -->
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 40px; border: 1px solid #334155;">
      <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 16px;">Reset Your Password</h2>

      <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        We received a request to reset your password. Click the button below to choose a new password.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}"
           style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Reset Password
        </a>
      </div>

      <p style="color: #64748b; font-size: 14px; margin: 24px 0 0; text-align: center;">
        This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 40px;">
      <p style="color: #475569; font-size: 11px; margin: 0;">
        © ${new Date().getFullYear()} Phazur. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `,
    tags: [{ name: 'type', value: 'password-reset' }],
  });
}

/**
 * Send session reminder email
 */
export async function sendSessionReminderEmail(
  email: string,
  name: string | undefined,
  sessionTitle: string,
  sessionDate: Date,
  meetingUrl: string,
  hoursUntil: number
): Promise<EmailResult> {
  const firstName = name?.split(' ')[0] || 'there';
  const formattedDate = sessionDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = sessionDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const reminderText = hoursUntil <= 1
    ? 'starting in less than an hour'
    : hoursUntil <= 24
      ? `starting in ${hoursUntil} hours`
      : `coming up on ${formattedDate}`;

  return sendEmail({
    to: email,
    subject: `⏰ Reminder: ${sessionTitle} is ${reminderText}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f1115; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 0;">PHAZUR</h1>
    </div>

    <!-- Main Content -->
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 40px; border: 1px solid #334155;">
      <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 16px;">Hey ${firstName}!</h2>

      <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        Just a friendly reminder that your live session is ${reminderText}.
      </p>

      <!-- Session Card -->
      <div style="background: rgba(6, 182, 212, 0.1); border-radius: 12px; padding: 24px; margin: 24px 0;">
        <h3 style="color: #22d3ee; font-size: 18px; margin: 0 0 16px;">${sessionTitle}</h3>
        <p style="color: #94a3b8; font-size: 14px; margin: 0 0 8px;">
          📅 ${formattedDate}
        </p>
        <p style="color: #94a3b8; font-size: 14px; margin: 0;">
          🕐 ${formattedTime}
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${meetingUrl}"
           style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Join Session
        </a>
      </div>

      <p style="color: #64748b; font-size: 14px; margin: 0; text-align: center;">
        Make sure to join a few minutes early to test your audio/video.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 40px;">
      <p style="color: #475569; font-size: 11px; margin: 0;">
        © ${new Date().getFullYear()} Phazur. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `,
    tags: [
      { name: 'type', value: 'session-reminder' },
      { name: 'hours_until', value: String(hoursUntil) },
    ],
  });
}

/**
 * Send module completion email
 */
export async function sendModuleCompletionEmail(
  email: string,
  name: string | undefined,
  moduleTitle: string,
  projectTitle: string,
  nextModuleTitle?: string
): Promise<EmailResult> {
  const firstName = name?.split(' ')[0] || 'there';

  return sendEmail({
    to: email,
    subject: `🎯 Module Complete: ${moduleTitle}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f1115; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 0;">PHAZUR</h1>
    </div>

    <!-- Main Content -->
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 40px; border: 1px solid #334155; text-align: center;">

      <!-- Checkmark Icon -->
      <div style="width: 64px; height: 64px; margin: 0 auto 24px; background: #10b98120; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 32px;">✓</span>
      </div>

      <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 8px;">Nice work, ${firstName}!</h2>

      <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        You've completed <strong style="color: #22d3ee;">${moduleTitle}</strong> and added a new project to your portfolio.
      </p>

      <!-- Project Badge -->
      <div style="background: #10b98115; border: 1px solid #10b98140; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: left;">
        <p style="color: #10b981; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Portfolio Project Added</p>
        <h3 style="color: #ffffff; font-size: 16px; margin: 0;">${projectTitle}</h3>
      </div>

      ${nextModuleTitle ? `
      <!-- Next Module -->
      <div style="margin-top: 32px;">
        <p style="color: #64748b; font-size: 14px; margin: 0 0 16px;">Ready for the next challenge?</p>
        <a href="https://pla-ten-eosin.vercel.app/learn"
           style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Start: ${nextModuleTitle}
        </a>
      </div>
      ` : `
      <div style="margin-top: 32px;">
        <a href="https://pla-ten-eosin.vercel.app/dashboard"
           style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          View Your Progress
        </a>
      </div>
      `}
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 40px;">
      <p style="color: #475569; font-size: 11px; margin: 0;">
        © ${new Date().getFullYear()} Phazur. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `,
    tags: [{ name: 'type', value: 'module-completion' }],
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// RETENTION EMAIL SEQUENCES
// Day 1, Day 3, Day 7 automated emails to improve user retention
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Day 1 Email - Welcome + First Lesson Nudge
 * Sent 24 hours after signup to encourage first engagement
 */
export async function sendDay1Email(
  email: string,
  name?: string,
  hasStartedLearning?: boolean
): Promise<EmailResult> {
  const firstName = name?.split(' ')[0] || 'there';

  const subject = hasStartedLearning
    ? "Great start! Here's what to tackle next"
    : "Ready to start your AI journey?";

  const mainMessage = hasStartedLearning
    ? `You've already taken your first steps - that's awesome! The key to mastering AI skills is consistent practice. Let's keep the momentum going.`
    : `It's been a day since you joined, and we're excited to help you get started. The first lesson takes just 15 minutes and you'll build something real.`;

  const ctaText = hasStartedLearning ? 'Continue Learning' : 'Start Your First Lesson';

  return sendEmail({
    to: email,
    subject,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f1115; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 0;">PHAZUR</h1>
      <p style="color: #64748b; font-size: 14px; margin: 8px 0 0;">AI Learning Lab</p>
    </div>

    <!-- Main Content -->
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 40px; border: 1px solid #334155;">
      <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 16px;">Hey ${firstName}!</h2>

      <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        ${mainMessage}
      </p>

      <!-- Quick Win Box -->
      <div style="background: rgba(6, 182, 212, 0.1); border-radius: 12px; padding: 24px; margin: 24px 0;">
        <h3 style="color: #22d3ee; font-size: 16px; margin: 0 0 12px;">Quick Win for Today</h3>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0;">
          Complete one hands-on exercise. Just one. You'll learn how to use AI tools that professionals use daily, and it takes less time than watching a YouTube video.
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://pla-ten-eosin.vercel.app/learn"
           style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          ${ctaText}
        </a>
      </div>

      <p style="color: #64748b; font-size: 14px; margin: 24px 0 0; text-align: center;">
        Remember: AI skills compound over time. Start small, stay consistent.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 40px;">
      <p style="color: #64748b; font-size: 12px; margin: 0;">
        Questions? Reply to this email - we read every message.
      </p>
      <p style="color: #475569; font-size: 11px; margin: 16px 0 0;">
        You're receiving this because you signed up for Phazur.
        <a href="https://pla-ten-eosin.vercel.app/settings" style="color: #64748b;">Manage preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
    `,
    tags: [
      { name: 'type', value: 'retention' },
      { name: 'sequence', value: 'day_1' },
    ],
  });
}

/**
 * Day 3 Email - Progress Check + Tips
 * Sent 72 hours after signup with personalized tips based on activity
 */
export async function sendDay3Email(
  email: string,
  name?: string,
  modulesCompleted?: number,
  currentStreak?: number
): Promise<EmailResult> {
  const firstName = name?.split(' ')[0] || 'there';
  const hasProgress = (modulesCompleted ?? 0) > 0;
  const hasStreak = (currentStreak ?? 0) > 1;

  let subject: string;
  let mainContent: string;
  let tipContent: string;

  if (hasProgress && hasStreak) {
    subject = `${firstName}, you're on fire! ${currentStreak}-day streak`;
    mainContent = `You've completed ${modulesCompleted} module${modulesCompleted! > 1 ? 's' : ''} and you're on a ${currentStreak}-day streak. That puts you ahead of 80% of learners. Keep it up!`;
    tipContent = `<strong>Pro tip:</strong> Set a specific time each day for learning. Morning learners have 40% better completion rates.`;
  } else if (hasProgress) {
    subject = `Nice progress, ${firstName}! Here's what's next`;
    mainContent = `You've completed ${modulesCompleted} module${modulesCompleted! > 1 ? 's' : ''} so far. Every completed lesson gets you closer to real AI skills you can use at work.`;
    tipContent = `<strong>Tip:</strong> Try to learn at the same time each day. Consistency beats intensity.`;
  } else {
    subject = `${firstName}, your AI learning path is waiting`;
    mainContent = `We noticed you haven't started a lesson yet. No pressure - but here's the thing: the first lesson is designed to give you a quick win in under 15 minutes.`;
    tipContent = `<strong>Getting started tip:</strong> Don't aim for perfect. Just open one lesson and follow along. You can always go deeper later.`;
  }

  return sendEmail({
    to: email,
    subject,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f1115; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 0;">PHAZUR</h1>
    </div>

    <!-- Main Content -->
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 40px; border: 1px solid #334155;">
      <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 16px;">Hey ${firstName}!</h2>

      <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        ${mainContent}
      </p>

      ${hasProgress ? `
      <!-- Progress Stats -->
      <div style="display: flex; gap: 16px; margin: 24px 0;">
        <div style="flex: 1; background: rgba(16, 185, 129, 0.1); border-radius: 12px; padding: 20px; text-align: center;">
          <p style="color: #10b981; font-size: 28px; font-weight: 600; margin: 0;">${modulesCompleted}</p>
          <p style="color: #64748b; font-size: 12px; margin: 8px 0 0;">Modules Done</p>
        </div>
        <div style="flex: 1; background: rgba(6, 182, 212, 0.1); border-radius: 12px; padding: 20px; text-align: center;">
          <p style="color: #22d3ee; font-size: 28px; font-weight: 600; margin: 0;">${currentStreak || 0}</p>
          <p style="color: #64748b; font-size: 12px; margin: 8px 0 0;">Day Streak</p>
        </div>
      </div>
      ` : ''}

      <!-- Tip Box -->
      <div style="background: rgba(168, 85, 247, 0.1); border-left: 3px solid #a855f7; padding: 16px 20px; margin: 24px 0;">
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0;">
          ${tipContent}
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://pla-ten-eosin.vercel.app/learn"
           style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          ${hasProgress ? 'Continue Learning' : 'Start Now'}
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 40px;">
      <p style="color: #64748b; font-size: 12px; margin: 0;">
        Need help? Just reply - we're here for you.
      </p>
      <p style="color: #475569; font-size: 11px; margin: 16px 0 0;">
        <a href="https://pla-ten-eosin.vercel.app/settings" style="color: #64748b;">Manage email preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
    `,
    tags: [
      { name: 'type', value: 'retention' },
      { name: 'sequence', value: 'day_3' },
    ],
  });
}

/**
 * Day 7 Email - Re-engagement for Inactive Users
 * Sent 168 hours (7 days) after signup, focuses on value proposition
 */
export async function sendDay7Email(
  email: string,
  name?: string,
  modulesCompleted?: number,
  daysInactive?: number
): Promise<EmailResult> {
  const firstName = name?.split(' ')[0] || 'there';
  const hasProgress = (modulesCompleted ?? 0) > 0;
  const isInactive = (daysInactive ?? 7) >= 3;

  let subject: string;
  let mainContent: string;
  let valueProps: string[];

  if (hasProgress && !isInactive) {
    // Active user with progress - celebrate and encourage
    subject = `One week in, ${firstName} - you're doing great!`;
    mainContent = `It's been a week since you joined, and you've already completed ${modulesCompleted} module${modulesCompleted! > 1 ? 's' : ''}. You're building real skills that will pay off.`;
    valueProps = [
      'Your progress is saved - pick up right where you left off',
      'Each module adds to your portfolio',
      'Earn blockchain-verified credentials employers trust',
    ];
  } else if (hasProgress && isInactive) {
    // Started but went inactive - gentle re-engagement
    subject = `${firstName}, your progress is still here`;
    mainContent = `We noticed it's been a few days since your last lesson. Life gets busy - we get it. The good news? Your progress is saved and you can jump back in anytime.`;
    valueProps = [
      'Resume exactly where you stopped',
      'Just 15 minutes can refresh your momentum',
      'Your learning path adapts to your schedule',
    ];
  } else {
    // Never started - strong value proposition
    subject = `${firstName}, AI skills are becoming essential`;
    mainContent = `A week ago you signed up to learn AI. We know starting something new can feel overwhelming, but here's the reality: AI skills are becoming as essential as Excel was 20 years ago.`;
    valueProps = [
      'Start with a 15-minute hands-on exercise',
      'Build real projects, not just watch videos',
      'Get credentials you can add to LinkedIn',
    ];
  }

  return sendEmail({
    to: email,
    subject,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f1115; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 0;">PHAZUR</h1>
    </div>

    <!-- Main Content -->
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 40px; border: 1px solid #334155;">
      <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 16px;">Hey ${firstName},</h2>

      <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        ${mainContent}
      </p>

      <!-- Value Props -->
      <div style="background: rgba(6, 182, 212, 0.08); border-radius: 12px; padding: 24px; margin: 24px 0;">
        <ul style="color: #94a3b8; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          ${valueProps.map(prop => `<li style="margin-bottom: 8px;">${prop}</li>`).join('')}
        </ul>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://pla-ten-eosin.vercel.app/learn"
           style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          ${hasProgress ? 'Resume Learning' : 'Start Your First Lesson'}
        </a>
      </div>

      ${!hasProgress ? `
      <!-- Social Proof -->
      <div style="text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px solid #334155;">
        <p style="color: #64748b; font-size: 13px; margin: 0;">
          Join 2,000+ learners building AI skills
        </p>
      </div>
      ` : ''}
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 40px;">
      <p style="color: #64748b; font-size: 12px; margin: 0;">
        Questions? We're always happy to help - just reply.
      </p>
      <p style="color: #475569; font-size: 11px; margin: 16px 0 0;">
        <a href="https://pla-ten-eosin.vercel.app/settings" style="color: #64748b;">Update preferences</a> |
        <a href="https://pla-ten-eosin.vercel.app/unsubscribe" style="color: #64748b;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
    `,
    tags: [
      { name: 'type', value: 'retention' },
      { name: 'sequence', value: 'day_7' },
    ],
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MILESTONE COMPLETION EMAILS
// Celebrate user progress through the 10-milestone certification journey
// ═══════════════════════════════════════════════════════════════════════════

export interface MilestoneInfo {
  number: number;
  title: string;
  description: string;
}

/**
 * Send milestone completion email - celebrates progress at each milestone
 * Called when user completes milestones 1-4, 6-8 (5 and 9 have special emails)
 */
export async function sendMilestoneCompleteEmail(
  email: string,
  name: string | undefined,
  milestone: MilestoneInfo,
  totalMilestones: number = 10
): Promise<EmailResult> {
  const firstName = name?.split(' ')[0] || 'there';
  const progress = Math.round((milestone.number / totalMilestones) * 100);

  // Motivational messages based on progress
  const motivationalMessages: Record<number, string> = {
    1: "First milestone down! You're building real momentum.",
    2: "Two milestones complete - you're getting into a great rhythm.",
    3: "Three down, seven to go. You're proving this is possible!",
    4: "Almost halfway there! Your dedication is showing.",
    6: "Over halfway! The finish line is in sight.",
    7: "Seven milestones complete. You're in the home stretch now.",
    8: "Just two more to go. You've got this!",
  };

  const message = motivationalMessages[milestone.number] || `Milestone ${milestone.number} complete! Keep going!`;

  return sendEmail({
    to: email,
    subject: `Milestone ${milestone.number} Complete: ${milestone.title}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f1115; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 0;">PHAZUR</h1>
      <p style="color: #64748b; font-size: 14px; margin: 8px 0 0;">AI Learning Lab</p>
    </div>

    <!-- Main Content -->
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 40px; border: 1px solid #334155; text-align: center;">

      <!-- Celebration Icon -->
      <div style="width: 80px; height: 80px; margin: 0 auto 24px; background: linear-gradient(135deg, #10b98130 0%, #06b6d430 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 40px;">&#127942;</span>
      </div>

      <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 8px;">Great work, ${firstName}!</h2>

      <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        ${message}
      </p>

      <!-- Milestone Badge -->
      <div style="background: linear-gradient(135deg, #10b98120 0%, #06b6d420 100%); border: 1px solid #10b98140; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <p style="color: #10b981; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">Milestone ${milestone.number} of ${totalMilestones}</p>
        <h3 style="color: #ffffff; font-size: 20px; margin: 0 0 8px;">${milestone.title}</h3>
        <p style="color: #94a3b8; font-size: 14px; margin: 0;">${milestone.description}</p>
      </div>

      <!-- Progress Bar -->
      <div style="margin: 32px 0;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #64748b; font-size: 12px;">Progress</span>
          <span style="color: #10b981; font-size: 12px; font-weight: 600;">${progress}%</span>
        </div>
        <div style="background: #1e293b; border-radius: 8px; height: 8px; overflow: hidden;">
          <div style="background: linear-gradient(90deg, #10b981 0%, #06b6d4 100%); height: 100%; width: ${progress}%; border-radius: 8px;"></div>
        </div>
      </div>

      <!-- CTA Button -->
      <div style="margin: 32px 0;">
        <a href="https://pla-ten-eosin.vercel.app/learn"
           style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Continue to Milestone ${milestone.number + 1}
        </a>
      </div>

      <!-- Social Proof -->
      <p style="color: #64748b; font-size: 13px; margin: 24px 0 0;">
        You're ahead of 70% of learners who started this week
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 40px;">
      <p style="color: #64748b; font-size: 12px; margin: 0;">
        Keep the momentum going - you're doing amazing!
      </p>
      <p style="color: #475569; font-size: 11px; margin: 16px 0 0;">
        &copy; ${new Date().getFullYear()} Phazur. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `,
    tags: [
      { name: 'type', value: 'milestone' },
      { name: 'milestone', value: String(milestone.number) },
    ],
  });
}

/**
 * Send halfway celebration email - special email for milestone 5
 * This is a major psychological moment in the journey
 */
export async function sendHalfwayEmail(
  email: string,
  name: string | undefined,
  milestonesCompleted: number = 5,
  daysOnPlatform: number,
  totalTimeSpent: string
): Promise<EmailResult> {
  const firstName = name?.split(' ')[0] || 'there';

  return sendEmail({
    to: email,
    subject: `You're Halfway There, ${firstName}! The finish line is in sight`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f1115; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 0;">PHAZUR</h1>
    </div>

    <!-- Main Content -->
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 40px; border: 1px solid #a855f740; text-align: center;">

      <!-- Celebration Banner -->
      <div style="background: linear-gradient(135deg, #a855f720 0%, #06b6d420 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <span style="font-size: 48px;">&#127881;</span>
        <h2 style="color: #ffffff; font-size: 28px; margin: 16px 0 0;">HALFWAY THERE!</h2>
      </div>

      <p style="color: #94a3b8; font-size: 18px; line-height: 1.6; margin: 0 0 32px;">
        ${firstName}, you've completed <strong style="color: #a855f7;">5 out of 10 milestones</strong>.
        This is a huge achievement - most people never make it this far!
      </p>

      <!-- Stats Grid -->
      <div style="display: flex; gap: 12px; margin: 24px 0;">
        <div style="flex: 1; background: rgba(168, 85, 247, 0.1); border-radius: 12px; padding: 20px;">
          <p style="color: #a855f7; font-size: 24px; font-weight: 600; margin: 0;">${milestonesCompleted}</p>
          <p style="color: #64748b; font-size: 11px; margin: 8px 0 0;">Milestones Done</p>
        </div>
        <div style="flex: 1; background: rgba(6, 182, 212, 0.1); border-radius: 12px; padding: 20px;">
          <p style="color: #22d3ee; font-size: 24px; font-weight: 600; margin: 0;">${daysOnPlatform}</p>
          <p style="color: #64748b; font-size: 11px; margin: 8px 0 0;">Days Learning</p>
        </div>
        <div style="flex: 1; background: rgba(16, 185, 129, 0.1); border-radius: 12px; padding: 20px;">
          <p style="color: #10b981; font-size: 24px; font-weight: 600; margin: 0;">${totalTimeSpent}</p>
          <p style="color: #64748b; font-size: 11px; margin: 8px 0 0;">Hours Invested</p>
        </div>
      </div>

      <!-- Progress Bar - 50% -->
      <div style="margin: 32px 0;">
        <div style="background: #1e293b; border-radius: 8px; height: 12px; overflow: hidden;">
          <div style="background: linear-gradient(90deg, #a855f7 0%, #06b6d4 100%); height: 100%; width: 50%; border-radius: 8px;"></div>
        </div>
        <p style="color: #a855f7; font-size: 14px; font-weight: 600; margin: 12px 0 0;">50% Complete</p>
      </div>

      <!-- What's Ahead -->
      <div style="background: rgba(6, 182, 212, 0.08); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: left;">
        <h3 style="color: #22d3ee; font-size: 16px; margin: 0 0 16px;">What's coming in the next 5 milestones:</h3>
        <ul style="color: #94a3b8; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Advanced AI tool mastery</li>
          <li>Real-world project showcase</li>
          <li>Portfolio completion</li>
          <li>Blockchain-verified certification</li>
        </ul>
      </div>

      <!-- CTA Button -->
      <div style="margin: 32px 0;">
        <a href="https://pla-ten-eosin.vercel.app/learn"
           style="display: inline-block; background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Keep the Momentum Going
        </a>
      </div>

      <!-- Motivation -->
      <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #334155;">
        <p style="color: #64748b; font-size: 13px; font-style: italic; margin: 0;">
          "The only person you are destined to become is the person you decide to be."
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 40px;">
      <p style="color: #475569; font-size: 11px; margin: 0;">
        &copy; ${new Date().getFullYear()} Phazur. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `,
    tags: [
      { name: 'type', value: 'milestone' },
      { name: 'milestone', value: 'halfway' },
    ],
  });
}

/**
 * Send almost there email - special email for milestone 9
 * Creates urgency and excitement for the final push
 */
export async function sendAlmostThereEmail(
  email: string,
  name: string | undefined,
  milestone9Title: string,
  finalMilestoneTitle: string,
  estimatedTimeToComplete: string = '30-45 minutes'
): Promise<EmailResult> {
  const firstName = name?.split(' ')[0] || 'there';

  return sendEmail({
    to: email,
    subject: `ONE MORE TO GO, ${firstName}! You're 90% there!`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f1115; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 0;">PHAZUR</h1>
    </div>

    <!-- Main Content -->
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 40px; border: 1px solid #10b98140; text-align: center;">

      <!-- Urgency Banner -->
      <div style="background: linear-gradient(135deg, #10b98130 0%, #06b6d430 100%); border: 2px solid #10b981; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <span style="font-size: 48px;">&#128293;</span>
        <h2 style="color: #10b981; font-size: 32px; margin: 16px 0 0;">ONE MORE!</h2>
      </div>

      <h3 style="color: #ffffff; font-size: 22px; margin: 0 0 16px;">
        ${firstName}, you just completed Milestone 9!
      </h3>

      <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        You've crushed <strong style="color: #10b981;">"${milestone9Title}"</strong> and now there's only
        <strong style="color: #22d3ee;">ONE milestone</strong> between you and your certification.
      </p>

      <!-- Progress Bar - 90% -->
      <div style="margin: 32px 0;">
        <div style="background: #1e293b; border-radius: 8px; height: 16px; overflow: hidden; position: relative;">
          <div style="background: linear-gradient(90deg, #10b981 0%, #06b6d4 100%); height: 100%; width: 90%; border-radius: 8px;"></div>
        </div>
        <p style="color: #10b981; font-size: 18px; font-weight: 700; margin: 12px 0 0;">90% COMPLETE</p>
      </div>

      <!-- Final Milestone Preview -->
      <div style="background: rgba(6, 182, 212, 0.1); border-radius: 12px; padding: 24px; margin: 24px 0;">
        <p style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Your Final Challenge</p>
        <h3 style="color: #22d3ee; font-size: 18px; margin: 0 0 12px;">Milestone 10: ${finalMilestoneTitle}</h3>
        <p style="color: #94a3b8; font-size: 14px; margin: 0;">
          Estimated time: <strong style="color: #ffffff;">${estimatedTimeToComplete}</strong>
        </p>
      </div>

      <!-- What Happens After -->
      <div style="background: rgba(168, 85, 247, 0.1); border-left: 3px solid #a855f7; padding: 20px; margin: 24px 0; text-align: left;">
        <p style="color: #a855f7; font-size: 14px; font-weight: 600; margin: 0 0 8px;">After you complete Milestone 10:</p>
        <ul style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
          <li>Claim your blockchain-verified certification</li>
          <li>Add your credential to LinkedIn</li>
          <li>Join our certified professionals community</li>
        </ul>
      </div>

      <!-- CTA Button -->
      <div style="margin: 32px 0;">
        <a href="https://pla-ten-eosin.vercel.app/learn"
           style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 8px; font-weight: 700; font-size: 18px;">
          Finish Strong - Complete Milestone 10
        </a>
      </div>

      <p style="color: #64748b; font-size: 14px; margin: 0;">
        You've come too far to stop now. Let's finish this!
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 40px;">
      <p style="color: #475569; font-size: 11px; margin: 0;">
        &copy; ${new Date().getFullYear()} Phazur. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `,
    tags: [
      { name: 'type', value: 'milestone' },
      { name: 'milestone', value: 'almost_there' },
    ],
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// CERTIFICATION EMAILS
// Emails for the certification purchase and completion flow
// ═══════════════════════════════════════════════════════════════════════════

export interface CertificationTier {
  id: 'student' | 'employee' | 'owner';
  name: string;
  price: number;
}

/**
 * Send certification ready email - user completed M10, time to pay
 * This is a conversion-focused email with strong value proposition
 */
export async function sendCertificationReadyEmail(
  email: string,
  name: string | undefined,
  tier: CertificationTier,
  milestonesCompleted: number = 10,
  totalTimeSpent: string,
  projectsBuilt: number
): Promise<EmailResult> {
  const firstName = name?.split(' ')[0] || 'there';

  const tierColors: Record<string, string> = {
    student: '#a855f7',
    employee: '#22d3ee',
    owner: '#10b981',
  };

  const tierBenefits: Record<string, string[]> = {
    student: [
      'Blockchain-verified credential on your profile',
      'Share directly to LinkedIn with one click',
      'Stand out in internship and entry-level applications',
      'Join the Phazur certified community',
    ],
    employee: [
      'Blockchain-verified credential employers trust',
      'Demonstrate workflow automation skills',
      'Add to performance reviews and promotions',
      'Access to exclusive advanced workshops',
    ],
    owner: [
      'Blockchain-verified business credential',
      'Showcase AI operations mastery',
      'Priority access to new AI tools and training',
      'Network with other certified business leaders',
    ],
  };

  const color = tierColors[tier.id] || '#22d3ee';
  const benefits = tierBenefits[tier.id] || tierBenefits.student;

  return sendEmail({
    to: email,
    subject: `You Did It, ${firstName}! Claim Your ${tier.name} Certification`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f1115; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 0;">PHAZUR</h1>
    </div>

    <!-- Main Content -->
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 40px; border: 2px solid ${color}60; text-align: center;">

      <!-- Celebration -->
      <div style="background: linear-gradient(135deg, ${color}20 0%, ${color}10 100%); border-radius: 12px; padding: 32px; margin-bottom: 24px;">
        <span style="font-size: 56px;">&#127942;</span>
        <h2 style="color: #ffffff; font-size: 28px; margin: 16px 0 8px;">YOU DID IT!</h2>
        <p style="color: ${color}; font-size: 16px; margin: 0;">All 10 milestones complete</p>
      </div>

      <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        ${firstName}, you've completed the entire certification journey. That puts you in the top 15% of learners who started. You should be proud!
      </p>

      <!-- Stats -->
      <div style="display: flex; gap: 12px; margin: 24px 0;">
        <div style="flex: 1; background: rgba(16, 185, 129, 0.1); border-radius: 12px; padding: 16px;">
          <p style="color: #10b981; font-size: 24px; font-weight: 600; margin: 0;">${milestonesCompleted}</p>
          <p style="color: #64748b; font-size: 11px; margin: 4px 0 0;">Milestones</p>
        </div>
        <div style="flex: 1; background: rgba(6, 182, 212, 0.1); border-radius: 12px; padding: 16px;">
          <p style="color: #22d3ee; font-size: 24px; font-weight: 600; margin: 0;">${projectsBuilt}</p>
          <p style="color: #64748b; font-size: 11px; margin: 4px 0 0;">Projects Built</p>
        </div>
        <div style="flex: 1; background: rgba(168, 85, 247, 0.1); border-radius: 12px; padding: 16px;">
          <p style="color: #a855f7; font-size: 24px; font-weight: 600; margin: 0;">${totalTimeSpent}</p>
          <p style="color: #64748b; font-size: 11px; margin: 4px 0 0;">Hours</p>
        </div>
      </div>

      <!-- Certificate Preview -->
      <div style="background: #0f172a; border: 2px solid ${color}; border-radius: 16px; padding: 24px; margin: 24px 0;">
        <p style="color: ${color}; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">Your Certificate Awaits</p>
        <h3 style="color: #ffffff; font-size: 22px; margin: 0 0 8px;">${tier.name}</h3>
        <p style="color: #64748b; font-size: 14px; margin: 0;">Blockchain-verified credential</p>
      </div>

      <!-- Benefits -->
      <div style="background: rgba(6, 182, 212, 0.08); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: left;">
        <h4 style="color: #22d3ee; font-size: 14px; margin: 0 0 16px;">What you'll get:</h4>
        <ul style="color: #94a3b8; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          ${benefits.map(b => `<li>${b}</li>`).join('')}
        </ul>
      </div>

      <!-- CTA Button -->
      <div style="margin: 32px 0;">
        <a href="https://pla-ten-eosin.vercel.app/certification/checkout?tier=${tier.id}"
           style="display: inline-block; background: linear-gradient(135deg, ${color} 0%, ${color}cc 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 8px; font-weight: 700; font-size: 18px;">
          Claim Your Certificate - $${tier.price}
        </a>
      </div>

      <p style="color: #64748b; font-size: 13px; margin: 0;">
        One-time payment. Your credential never expires.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 40px;">
      <p style="color: #64748b; font-size: 12px; margin: 0;">
        Questions about certification? Reply to this email.
      </p>
      <p style="color: #475569; font-size: 11px; margin: 16px 0 0;">
        &copy; ${new Date().getFullYear()} Phazur. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `,
    tags: [
      { name: 'type', value: 'certification' },
      { name: 'event', value: 'ready' },
      { name: 'tier', value: tier.id },
    ],
  });
}

/**
 * Send certification complete email - congrats + share links
 * User has paid and received their certificate
 */
export async function sendCertificationCompleteEmail(
  email: string,
  name: string | undefined,
  tier: CertificationTier,
  certificateId: string,
  certificateUrl: string,
  linkedInShareUrl: string,
  twitterShareUrl: string
): Promise<EmailResult> {
  const firstName = name?.split(' ')[0] || 'there';

  const tierColors: Record<string, string> = {
    student: '#a855f7',
    employee: '#22d3ee',
    owner: '#10b981',
  };

  const color = tierColors[tier.id] || '#22d3ee';

  return sendEmail({
    to: email,
    subject: `Your ${tier.name} Certificate is Ready! Share Your Achievement`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f1115; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 0;">PHAZUR</h1>
    </div>

    <!-- Main Content -->
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 40px; border: 2px solid ${color}; text-align: center;">

      <!-- Trophy + Confetti -->
      <div style="margin-bottom: 24px;">
        <span style="font-size: 64px;">&#127881;&#127942;&#127881;</span>
      </div>

      <h2 style="color: #ffffff; font-size: 28px; margin: 0 0 8px;">Congratulations, ${firstName}!</h2>

      <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 32px;">
        You are now a <strong style="color: ${color};">Phazur Certified ${tier.name}</strong>.
        Your blockchain-verified credential is ready to share with the world.
      </p>

      <!-- Certificate Card -->
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border: 3px solid ${color}; border-radius: 16px; padding: 32px; margin: 24px 0;">
        <div style="width: 80px; height: 80px; margin: 0 auto 16px; background: ${color}20; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 40px;">&#128272;</span>
        </div>
        <p style="color: ${color}; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">Certificate Issued</p>
        <h3 style="color: #ffffff; font-size: 24px; margin: 0 0 8px;">${tier.name}</h3>
        <p style="color: #64748b; font-size: 12px; margin: 0;">ID: ${certificateId}</p>
      </div>

      <!-- CTA Buttons -->
      <div style="margin: 32px 0;">
        <a href="${certificateUrl}"
           style="display: inline-block; background: linear-gradient(135deg, ${color} 0%, ${color}cc 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 0 8px 12px;">
          View Certificate
        </a>
      </div>

      <!-- Share Options -->
      <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 24px; margin: 24px 0;">
        <h4 style="color: #ffffff; font-size: 16px; margin: 0 0 16px;">Share Your Achievement</h4>
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <a href="${linkedInShareUrl}"
             style="display: inline-block; background: #0077b5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Share on LinkedIn
          </a>
          <a href="${twitterShareUrl}"
             style="display: inline-block; background: #1da1f2; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Share on X/Twitter
          </a>
        </div>
      </div>

      <!-- Verification Note -->
      <div style="background: rgba(16, 185, 129, 0.1); border-left: 3px solid #10b981; padding: 16px 20px; margin: 24px 0; text-align: left;">
        <p style="color: #10b981; font-size: 14px; font-weight: 600; margin: 0 0 4px;">Blockchain Verified</p>
        <p style="color: #94a3b8; font-size: 13px; margin: 0;">
          Your credential is permanently recorded on-chain. Employers can verify its authenticity anytime at phazur.com/verify
        </p>
      </div>

      <!-- Next Steps -->
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #334155; text-align: left;">
        <h4 style="color: #ffffff; font-size: 14px; margin: 0 0 12px;">What to do next:</h4>
        <ul style="color: #94a3b8; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Add this credential to your LinkedIn profile</li>
          <li>Update your resume with your new certification</li>
          <li>Join our certified professionals Discord community</li>
          <li>Explore advanced workshops and masterclasses</li>
        </ul>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 40px;">
      <p style="color: #64748b; font-size: 12px; margin: 0;">
        Welcome to the Phazur certified community!
      </p>
      <p style="color: #475569; font-size: 11px; margin: 16px 0 0;">
        &copy; ${new Date().getFullYear()} Phazur. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `,
    tags: [
      { name: 'type', value: 'certification' },
      { name: 'event', value: 'complete' },
      { name: 'tier', value: tier.id },
    ],
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// RE-ENGAGEMENT EMAILS
// Win back inactive users at 7, 14, and 30 days of inactivity
// ═══════════════════════════════════════════════════════════════════════════

export interface InactiveUserInfo {
  email: string;
  name?: string;
  milestonesCompleted: number;
  lastMilestoneTitle?: string;
  daysSinceActive: number;
  totalTimeSpent?: string;
}

/**
 * Send inactive reminder email - 7, 14, 30 day variants
 * Messaging intensifies as inactivity increases
 */
export async function sendInactiveReminderEmail(
  user: InactiveUserInfo
): Promise<EmailResult> {
  const firstName = user.name?.split(' ')[0] || 'there';
  const { daysSinceActive, milestonesCompleted, lastMilestoneTitle } = user;

  // Determine which variant to send
  let variant: '7day' | '14day' | '30day';
  if (daysSinceActive >= 30) {
    variant = '30day';
  } else if (daysSinceActive >= 14) {
    variant = '14day';
  } else {
    variant = '7day';
  }

  const progress = Math.round((milestonesCompleted / 10) * 100);
  const milestonesRemaining = 10 - milestonesCompleted;

  // Variant-specific content
  const variantContent = {
    '7day': {
      subject: `${firstName}, your progress is waiting for you`,
      headline: 'Missing You!',
      emoji: '&#128075;',
      message: `It's been a week since your last lesson. Your progress is saved and you're ${progress}% of the way to certification.`,
      urgency: '',
      cta: 'Pick Up Where You Left Off',
    },
    '14day': {
      subject: `${firstName}, don't lose your momentum`,
      headline: 'Your Journey Isn\'t Complete',
      emoji: '&#9203;',
      message: `Two weeks have passed, but your ${milestonesCompleted} completed milestones are still there. You only need ${milestonesRemaining} more to get certified.`,
      urgency: 'Studies show that learners who return within 2 weeks are 3x more likely to complete their certification.',
      cta: 'Resume Your Learning',
    },
    '30day': {
      subject: `${firstName}, we miss you - your certification is waiting`,
      headline: 'It\'s Been a Month',
      emoji: '&#128532;',
      message: `Life gets busy, we understand. But you've already invested time in ${milestonesCompleted} milestones. Don't let that go to waste.`,
      urgency: 'AI skills are evolving fast. The sooner you complete your certification, the more relevant it will be for your career.',
      cta: 'Restart Your Journey Today',
    },
  };

  const content = variantContent[variant];

  return sendEmail({
    to: user.email,
    subject: content.subject,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f1115; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 0;">PHAZUR</h1>
      <p style="color: #64748b; font-size: 14px; margin: 8px 0 0;">AI Learning Lab</p>
    </div>

    <!-- Main Content -->
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 40px; border: 1px solid #334155;">

      <!-- Emoji Header -->
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px;">${content.emoji}</span>
        <h2 style="color: #ffffff; font-size: 24px; margin: 16px 0 0;">${content.headline}</h2>
      </div>

      <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
        ${content.message}
      </p>

      <!-- Progress Display -->
      <div style="background: rgba(6, 182, 212, 0.1); border-radius: 12px; padding: 24px; margin: 24px 0;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
          <span style="color: #64748b; font-size: 14px;">Your Progress</span>
          <span style="color: #22d3ee; font-size: 14px; font-weight: 600;">${progress}%</span>
        </div>
        <div style="background: #1e293b; border-radius: 8px; height: 8px; overflow: hidden;">
          <div style="background: linear-gradient(90deg, #22d3ee 0%, #06b6d4 100%); height: 100%; width: ${progress}%; border-radius: 8px;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 16px;">
          <div style="text-align: center;">
            <p style="color: #22d3ee; font-size: 20px; font-weight: 600; margin: 0;">${milestonesCompleted}</p>
            <p style="color: #64748b; font-size: 11px; margin: 4px 0 0;">Completed</p>
          </div>
          <div style="text-align: center;">
            <p style="color: #a855f7; font-size: 20px; font-weight: 600; margin: 0;">${milestonesRemaining}</p>
            <p style="color: #64748b; font-size: 11px; margin: 4px 0 0;">Remaining</p>
          </div>
          <div style="text-align: center;">
            <p style="color: #10b981; font-size: 20px; font-weight: 600; margin: 0;">${user.totalTimeSpent || '?'}</p>
            <p style="color: #64748b; font-size: 11px; margin: 4px 0 0;">Hours</p>
          </div>
        </div>
      </div>

      ${lastMilestoneTitle ? `
      <!-- Last Activity -->
      <div style="text-align: center; margin: 16px 0;">
        <p style="color: #64748b; font-size: 13px; margin: 0;">
          Last milestone: <strong style="color: #94a3b8;">${lastMilestoneTitle}</strong>
        </p>
      </div>
      ` : ''}

      ${content.urgency ? `
      <!-- Urgency Message -->
      <div style="background: rgba(168, 85, 247, 0.1); border-left: 3px solid #a855f7; padding: 16px 20px; margin: 24px 0;">
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0;">
          ${content.urgency}
        </p>
      </div>
      ` : ''}

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://pla-ten-eosin.vercel.app/learn"
           style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          ${content.cta}
        </a>
      </div>

      <!-- Social Proof -->
      <div style="text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px solid #334155;">
        <p style="color: #64748b; font-size: 13px; margin: 0;">
          Over 500 learners completed their certification this month
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 40px;">
      <p style="color: #64748b; font-size: 12px; margin: 0;">
        Need help getting back on track? Reply to this email.
      </p>
      <p style="color: #475569; font-size: 11px; margin: 16px 0 0;">
        <a href="https://pla-ten-eosin.vercel.app/settings" style="color: #64748b;">Update preferences</a> |
        <a href="https://pla-ten-eosin.vercel.app/unsubscribe" style="color: #64748b;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
    `,
    tags: [
      { name: 'type', value: 're-engagement' },
      { name: 'variant', value: variant },
      { name: 'days_inactive', value: String(daysSinceActive) },
    ],
  });
}
