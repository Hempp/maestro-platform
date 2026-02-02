/**
 * ADMIN USERS API
 * Manage all platform users
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Helper to check admin/teacher role
async function checkAdminRole(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { authorized: false, user: null, role: null };

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = userData?.role as string | null | undefined;
  const authorized = role === 'admin' || role === 'teacher';
  return { authorized, user, role };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { authorized, role } = await checkAdminRole(supabase);

    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const roleFilter = searchParams.get('role') || '';
    const tierFilter = searchParams.get('tier') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        avatar_url,
        tier,
        role,
        created_at,
        updated_at,
        learner_profiles (
          current_path,
          total_learning_time,
          current_streak,
          struggle_score,
          last_activity_at
        )
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }
    if (roleFilter) {
      query = query.eq('role', roleFilter as any);
    }
    if (tierFilter) {
      query = query.eq('tier', tierFilter as any);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data: users, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      users,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { authorized, role } = await checkAdminRole(supabase);

    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Only admins can change user roles
    const body = await request.json();
    const { userId, updates } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Teachers can only update certain fields, not roles
    if (role === 'teacher' && updates.role) {
      return NextResponse.json({ error: 'Only admins can change user roles' }, { status: 403 });
    }

    const allowedUpdates: Record<string, unknown> = {};
    if (updates.role && role === 'admin') allowedUpdates.role = updates.role;
    if (updates.tier) allowedUpdates.tier = updates.tier;
    if (updates.full_name) allowedUpdates.full_name = updates.full_name;

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    allowedUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('users')
      .update(allowedUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error('Admin users PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
