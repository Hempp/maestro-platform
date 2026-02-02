/**
 * TEMP: Make current user an admin
 * DELETE THIS FILE after setting up your admin user
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Update user role to admin
    const { data, error } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      // If role column doesn't exist, try without it
      console.error('Error updating role:', error);
      return NextResponse.json({
        error: 'Failed to update role. Make sure the migration has been run.',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'You are now an admin!',
      user: data
    });
  } catch (error) {
    console.error('Make admin error:', error);
    return NextResponse.json({ error: 'Failed to make admin' }, { status: 500 });
  }
}
