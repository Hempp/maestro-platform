/**
 * ADMIN USERS API
 * Manage all platform users with admin tier system
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AdminTier } from '@/types';

// ═══════════════════════════════════════════════════════════════════════════
// PERMISSION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all permissions for a user based on their admin_tier
 */
async function getUserPermissions(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('users')
    .select('admin_tier')
    .eq('id', userId)
    .single() as { data: { admin_tier: string | null } | null };

  if (!data?.admin_tier) return [];

  // Use type assertion since admin_tier_permissions table is from new migration
  const { data: perms } = await (supabase as any)
    .from('admin_tier_permissions')
    .select('permissions(name)')
    .eq('tier', data.admin_tier);

  return perms?.map((p: { permissions: { name: string } }) => p.permissions.name) || [];
}

/**
 * Check if a user has a specific permission
 */
async function checkPermission(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, userId: string, permission: string): Promise<boolean> {
  const perms = await getUserPermissions(supabase, userId);
  return perms.includes(permission);
}

// Helper to check admin/teacher role
async function checkAdminRole(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { authorized: false, user: null, role: null, adminTier: null };

  const { data: userData } = await supabase
    .from('users')
    .select('role, admin_tier')
    .eq('id', user.id)
    .single() as { data: { role: string | null; admin_tier: string | null } | null };

  const role = userData?.role;
  const adminTier = userData?.admin_tier as AdminTier | null;
  const authorized = role === 'admin' || role === 'teacher';
  return { authorized, user, role, adminTier };
}

// ═══════════════════════════════════════════════════════════════════════════
// GET - Fetch users with filtering
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { authorized } = await checkAdminRole(supabase);

    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    // Support array of roles: ?role=admin&role=teacher
    const roleFilters = searchParams.getAll('role');
    const tierFilter = searchParams.get('tier') || '';
    // Support filtering by admin_tier
    const adminTierFilter = searchParams.get('admin_tier') || '';
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
        admin_tier,
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

    // Support array of role filters
    if (roleFilters.length === 1) {
      query = query.eq('role', roleFilters[0] as any);
    } else if (roleFilters.length > 1) {
      query = query.in('role', roleFilters as any);
    }

    if (tierFilter) {
      query = query.eq('tier', tierFilter as any);
    }

    // Filter by admin_tier
    if (adminTierFilter) {
      query = query.eq('admin_tier', adminTierFilter as any);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data: users, error, count } = await query as {
      data: Array<{
        id: string;
        email: string;
        full_name: string | null;
        avatar_url: string | null;
        tier: string | null;
        role: string | null;
        admin_tier: string | null;
        created_at: string | null;
        updated_at: string | null;
        learner_profiles: unknown;
      }> | null;
      error: Error | null;
      count: number | null;
    };

    if (error) throw error;

    // Fetch permissions for each user with an admin_tier
    const usersWithPermissions = await Promise.all(
      (users || []).map(async (user) => {
        if (user.admin_tier) {
          const permissions = await getUserPermissions(supabase, user.id);
          return { ...user, permissions };
        }
        return { ...user, permissions: [] };
      })
    );

    return NextResponse.json({
      users: usersWithPermissions,
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

// ═══════════════════════════════════════════════════════════════════════════
// POST - Invite/create admin users
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { authorized, user } = await checkAdminRole(supabase);

    if (!authorized || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if current user has 'manage_admins' permission
    const hasPermission = await checkPermission(supabase, user.id, 'manage_admins');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions - requires manage_admins' }, { status: 403 });
    }

    const body = await request.json();
    const { email, full_name, role, admin_tier } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate role
    if (role && !['admin', 'teacher', 'learner'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Must be admin, teacher, or learner' }, { status: 400 });
    }

    // Validate admin_tier if provided
    const validTiers = ['super_admin', 'content_admin', 'analytics_admin', 'support_admin', 'teacher'];
    if (admin_tier && !validTiers.includes(admin_tier)) {
      return NextResponse.json({ error: 'Invalid admin_tier' }, { status: 400 });
    }

    // Check if user with this email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, full_name, role, admin_tier')
      .eq('email', email)
      .single() as { data: { id: string; email: string; full_name: string | null; role: string | null; admin_tier: string | null } | null };

    if (existingUser) {
      // Update existing user's role and admin_tier
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (role) updateData.role = role;
      if (admin_tier !== undefined) updateData.admin_tier = admin_tier;
      if (full_name) updateData.full_name = full_name;

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updateData as never)
        .eq('id', existingUser.id)
        .select('id, email, full_name, role, admin_tier, created_at, updated_at')
        .single() as { data: { id: string; email: string; full_name: string | null; role: string | null; admin_tier: string | null; created_at: string | null; updated_at: string | null } | null; error: Error | null };

      if (updateError) throw updateError;
      if (!updatedUser) throw new Error('Failed to update user');

      // Get permissions for the updated user
      const permissions = await getUserPermissions(supabase, updatedUser.id);

      return NextResponse.json({
        user: { ...updatedUser, permissions },
        action: 'updated',
        message: 'Existing user updated with new admin privileges',
      });
    }

    // Create new user with pending status (invitation)
    // Note: The actual auth account will be created when they accept the invitation
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email,
        full_name: full_name || null,
        role: role || 'admin',
        admin_tier: admin_tier || null,
        tier: 'student', // Default business tier
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as never)
      .select('id, email, full_name, role, admin_tier, created_at, updated_at')
      .single() as { data: { id: string; email: string; full_name: string | null; role: string | null; admin_tier: string | null; created_at: string | null; updated_at: string | null } | null; error: Error | null };

    if (createError) throw createError;
    if (!newUser) throw new Error('Failed to create user');

    // Get permissions for the new user
    const permissions = newUser.admin_tier ? await getUserPermissions(supabase, newUser.id) : [];

    return NextResponse.json({
      user: { ...newUser, permissions },
      action: 'created',
      message: 'New admin user created. They will need to be invited via auth system.',
    }, { status: 201 });

  } catch (error) {
    console.error('Admin users POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create/invite admin user' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PATCH - Update user details including admin_tier
// ═══════════════════════════════════════════════════════════════════════════

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { authorized, user, role } = await checkAdminRole(supabase);

    if (!authorized || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, updates } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Check if trying to update admin_tier - requires manage_admins permission
    if (updates.admin_tier !== undefined) {
      const hasPermission = await checkPermission(supabase, user.id, 'manage_admins');
      if (!hasPermission) {
        return NextResponse.json({ error: 'Insufficient permissions - requires manage_admins to change admin_tier' }, { status: 403 });
      }

      // Prevent self-demotion for super_admins
      if (userId === user.id) {
        const { data: currentUserData } = await supabase
          .from('users')
          .select('admin_tier')
          .eq('id', user.id)
          .single() as { data: { admin_tier: string | null } | null };

        if (currentUserData?.admin_tier === 'super_admin' && updates.admin_tier !== 'super_admin') {
          return NextResponse.json({ error: 'Cannot demote yourself from super_admin' }, { status: 403 });
        }
      }
    }

    // Teachers can only update certain fields, not roles
    if (role === 'teacher' && updates.role) {
      return NextResponse.json({ error: 'Only admins can change user roles' }, { status: 403 });
    }

    const allowedUpdates: Record<string, unknown> = {};

    // Role changes require admin role
    if (updates.role && role === 'admin') {
      allowedUpdates.role = updates.role;

      // If changing role to 'learner' and admin_tier is being set to null, this effectively removes admin
      if (updates.role === 'learner') {
        allowedUpdates.admin_tier = null;
      }
    }

    // Handle admin_tier updates
    if (updates.admin_tier !== undefined) {
      allowedUpdates.admin_tier = updates.admin_tier;
    }

    if (updates.tier) allowedUpdates.tier = updates.tier;
    if (updates.full_name) allowedUpdates.full_name = updates.full_name;

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    allowedUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('users')
      .update(allowedUpdates as never)
      .eq('id', userId)
      .select('id, email, full_name, role, admin_tier, tier, created_at, updated_at')
      .single() as { data: { id: string; email: string; full_name: string | null; role: string | null; admin_tier: string | null; tier: string | null; created_at: string | null; updated_at: string | null } | null; error: Error | null };

    if (error) throw error;
    if (!data) throw new Error('User not found');

    // Get updated permissions
    const permissions = data.admin_tier ? await getUserPermissions(supabase, data.id) : [];

    return NextResponse.json({ user: { ...data, permissions } });
  } catch (error) {
    console.error('Admin users PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DELETE - Remove admin privileges from a user
// ═══════════════════════════════════════════════════════════════════════════

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { authorized, user } = await checkAdminRole(supabase);

    if (!authorized || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if current user has 'manage_admins' permission
    const hasPermission = await checkPermission(supabase, user.id, 'manage_admins');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions - requires manage_admins' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Cannot delete yourself
    if (userId === user.id) {
      return NextResponse.json({ error: 'Cannot remove your own admin privileges' }, { status: 403 });
    }

    // Remove admin privileges by setting admin_tier to null and role to 'learner'
    const { data, error } = await supabase
      .from('users')
      .update({
        admin_tier: null,
        role: 'learner',
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', userId)
      .select('id, email, full_name, role, admin_tier, tier, created_at, updated_at')
      .single() as { data: { id: string; email: string; full_name: string | null; role: string | null; admin_tier: string | null; tier: string | null; created_at: string | null; updated_at: string | null } | null; error: Error | null };

    if (error) throw error;
    if (!data) throw new Error('User not found');

    return NextResponse.json({
      user: { ...data, permissions: [] },
      message: 'Admin privileges removed successfully',
    });
  } catch (error) {
    console.error('Admin users DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to remove admin privileges' },
      { status: 500 }
    );
  }
}
