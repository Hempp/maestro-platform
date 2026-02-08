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
