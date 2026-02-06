/**
 * EMAIL SERVICE
 * Centralized email sending using Resend
 */

import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

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
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo || SUPPORT_EMAIL,
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
