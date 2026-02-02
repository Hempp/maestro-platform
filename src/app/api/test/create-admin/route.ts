/**
 * TEMP: Create test admin user
 * DELETE THIS FILE after testing
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    // Use service role to create user (bypasses email confirmation)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const testEmail = 'admin@test.com';
    const testPassword = 'admin123';

    // Check if user exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === testEmail);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      // Update password
      await supabaseAdmin.auth.admin.updateUserById(userId, { password: testPassword });
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
      });

      if (createError) throw createError;
      userId = newUser.user.id;

      // Create user profile
      await supabaseAdmin.from('users').insert({
        id: userId,
        email: testEmail,
        full_name: 'Test Admin',
        role: 'admin',
      });
    }

    // Ensure role is admin
    await supabaseAdmin.from('users').update({ role: 'admin' }).eq('id', userId);

    return NextResponse.json({
      success: true,
      credentials: {
        email: testEmail,
        password: testPassword,
      },
      message: 'Test admin created! Use these credentials to log in.',
    });
  } catch (error: any) {
    console.error('Create admin error:', error);
    return NextResponse.json({
      error: 'Failed to create test admin',
      details: error.message,
    }, { status: 500 });
  }
}
