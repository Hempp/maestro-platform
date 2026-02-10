/**
 * FORGOT PASSWORD API (Firebase)
 * Generates password reset link using Firebase Admin SDK
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { rateLimit, RATE_LIMITS } from '@/lib/security';

export async function POST(request: NextRequest) {
  // Rate limit to prevent abuse
  const rateLimitResponse = rateLimit(request, RATE_LIMITS.auth);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const auth = getAdminAuth();

    try {
      // Generate password reset link
      const resetLink = await auth.generatePasswordResetLink(email, {
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://maestro-platform-rho.vercel.app'}/login?reset=success`,
      });

      // In production, you would send this link via email
      // For now, Firebase also sends an email automatically if configured
      console.log('Password reset link generated for:', email);

      // Optionally send via your own email service for custom branding
      // await sendPasswordResetEmail(email, resetLink);
    } catch (error) {
      // Don't reveal if user exists or not for security
      console.error('Password reset error:', error);
    }

    // Always return success message (security best practice)
    return NextResponse.json({
      message: 'If an account with that email exists, you will receive a password reset link.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
