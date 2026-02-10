/**
 * LOGIN API ROUTE
 * Authenticates users with email/password
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { rateLimit, RATE_LIMITS } from '@/lib/security';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Strict rate limit on auth endpoints to prevent brute force
  const rateLimitResponse = rateLimit(request, RATE_LIMITS.auth);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: 'Login successful',
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}
