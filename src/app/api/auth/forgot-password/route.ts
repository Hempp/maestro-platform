/**
 * FORGOT PASSWORD API
 * Sends password reset email
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendPasswordResetEmail } from '@/lib/email/resend';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Use Supabase's built-in password reset
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://pla-ten-eosin.vercel.app'}/reset-password`,
    });

    if (error) {
      console.error('Password reset error:', error);
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        message: 'If an account with that email exists, you will receive a password reset link.',
      });
    }

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
