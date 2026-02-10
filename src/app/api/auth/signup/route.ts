/**
 * SIGNUP API ROUTE
 * Creates new user accounts with email/password
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendWelcomeEmail } from '@/lib/email/resend';
import { rateLimit, RATE_LIMITS } from '@/lib/security';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Strict rate limit on auth endpoints
  const rateLimitResponse = rateLimit(request, RATE_LIMITS.auth);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { email, password, fullName, tier } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          tier: tier || null,
        },
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // If user already exists but hasn't confirmed email
    if (data.user && !data.session) {
      return NextResponse.json({
        message: 'Check your email for the confirmation link',
        user: data.user,
      });
    }

    // Send welcome email (async, don't block response)
    if (data.user?.email) {
      sendWelcomeEmail(data.user.email, fullName).catch((err) => {
        console.error('Failed to send welcome email:', err);
      });
    }

    return NextResponse.json({
      message: 'Account created successfully',
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
