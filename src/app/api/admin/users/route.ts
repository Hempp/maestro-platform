/**
 * ADMIN USERS API
 * Manage all platform users with admin tier system
 *
 * NOTE: This API gracefully handles the case where admin_tier column
 * or admin_tier_permissions table doesn't exist yet (pre-migration)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AdminTier } from '@/types';
import { TIER_PERMISSIONS } from '@/types';

// ═══════════════════════════════════════════════════════════════════════════
// PERMISSION HELPERS (with graceful degradation)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all permissions for a user based on their admin_tier
 * Falls back to in-memory TIER_PERMISSIONS if database table doesn't exist
 */
async function getUserPermissions(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, userId: string, adminTier?: string | null): Promise<string[]> {
  // If we already have the admin_tier from the user query, use it directly
  const tier = adminTier;

  if (!tier) {
    // Try to fetch from database if not provided
    try {
      const { data } = await supabase
        .from('users')
        .select('admin_tier')
        .eq('id', userId)
        .single() as { data: { admin_tier: string | null } | null };

      if (!data?.admin_tier) return [];

      // Fall back to in-memory permissions
      return TIER_PERMISSIONS[data.admin_tier as AdminTier] || [];
    } catch {
      return [];
    }
  }

  // Use in-memory TIER_PERMISSIONS as the source of truth
  // This works even if the admin_tier_permissions table doesn't exist
  return TIER_PERMISSIONS[tier as AdminTier] || [];
}

/**
 * Check if a user has a specific permission
 * Uses in-memory TIER_PERMISSIONS for reliability
 */
async function checkPermission(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, userId: string, permission: string): Promise<boolean> {
  const perms = await getUserPermissions(supabase, userId);
  return perms.includes(permission);
}

/**
 * Check if admin_tier column exists in users table
 * Returns false if column doesn't exist (pre-migration state)
 */
async function adminTierColumnExists(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>): Promise<boolean> {
  try {
    // Try a query that selects admin_tier - if it fails, column doesn't exist
    const { error } = await supabase
      .from('users')
      .select('admin_tier')
      .limit(1);

    // If error contains "column" and "does not exist", the column is missing
    if (error?.message?.includes('does not exist')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Helper to check admin/teacher role
async function checkAdminRole(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { authorized: false, user: null, role: null, adminTier: null, adminTierExists: true };

  // Check if admin_tier column exists
  const adminTierExists = await adminTierColumnExists(supabase);

  // Build query based on what columns exist
  const selectFields = adminTierExists ? 'role, admin_tier' : 'role';

  const { data: userData } = await supabase
    .from('users')
    .select(selectFields)
    .eq('id', user.id)
    .single() as { data: { role: string | null; admin_tier?: string | null } | null };

  const role = userData?.role;
  const adminTier = adminTierExists ? (userData?.admin_tier as AdminTier | null) : null;
  const authorized = role === 'admin' || role === 'teacher';
  return { authorized, user, role, adminTier, adminTierExists };
}

// ═══════════════════════════════════════════════════════════════════════════
// GET - Fetch users with filtering
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { authorized, adminTierExists } = await checkAdminRole(supabase);

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

    // Build select fields based on whether admin_tier column exists
    const selectFields = adminTierExists
      ? `
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
      `
      : `
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
      `;

    let query = supabase
      .from('users')
      .select(selectFields, { count: 'exact' });

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

    // Filter by admin_tier (only if column exists)
    if (adminTierFilter && adminTierExists) {
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
        admin_tier?: string | null;
        created_at: string | null;
        updated_at: string | null;
        learner_profiles: unknown;
      }> | null;
      error: Error | null;
      count: number | null;
    };

    if (error) throw error;

    // Normalize users and fetch permissions for each user with an admin_tier
    const usersWithPermissions = await Promise.all(
      (users || []).map(async (user) => {
        // Ensure admin_tier is always present (null if column doesn't exist)
        const adminTier = adminTierExists ? (user.admin_tier || null) : null;

        if (adminTier) {
          const permissions = await getUserPermissions(supabase, user.id, adminTier);
          return { ...user, admin_tier: adminTier, permissions };
        }
        return { ...user, admin_tier: null, permissions: [] };
      })
    );

    return NextResponse.json({
      users: usersWithPermissions,
      total: count,
      limit,
      offset,
      // Include metadata about admin tier system status
      adminTierSystemActive: adminTierExists,
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
    const { authorized, user, adminTierExists } = await checkAdminRole(supabase);

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

    // If admin_tier is provided but column doesn't exist, return error with helpful message
    if (admin_tier && !adminTierExists) {
      return NextResponse.json({
        error: 'Admin tier system not available',
        message: 'The admin_tier column has not been created yet. Please run the database migration first.',
      }, { status: 400 });
    }

    // Build select fields based on whether admin_tier column exists
    const existingUserSelectFields = adminTierExists
      ? 'id, email, full_name, role, admin_tier'
      : 'id, email, full_name, role';

    // Check if user with this email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select(existingUserSelectFields)
      .eq('email', email)
      .single() as { data: { id: string; email: string; full_name: string | null; role: string | null; admin_tier?: string | null } | null };

    if (existingUser) {
      // Update existing user's role and admin_tier
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (role) updateData.role = role;
      if (admin_tier !== undefined && adminTierExists) updateData.admin_tier = admin_tier;
      if (full_name) updateData.full_name = full_name;

      const updateSelectFields = adminTierExists
        ? 'id, email, full_name, role, admin_tier, created_at, updated_at'
        : 'id, email, full_name, role, created_at, updated_at';

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updateData as never)
        .eq('id', existingUser.id)
        .select(updateSelectFields)
        .single() as { data: { id: string; email: string; full_name: string | null; role: string | null; admin_tier?: string | null; created_at: string | null; updated_at: string | null } | null; error: Error | null };

      if (updateError) throw updateError;
      if (!updatedUser) throw new Error('Failed to update user');

      // Get permissions for the updated user
      const adminTierValue = adminTierExists ? (updatedUser.admin_tier || null) : null;
      const permissions = adminTierValue ? await getUserPermissions(supabase, updatedUser.id, adminTierValue) : [];

      return NextResponse.json({
        user: { ...updatedUser, admin_tier: adminTierValue, permissions },
        action: 'updated',
        message: 'Existing user updated with new admin privileges',
      });
    }

    // Create new user with pending status (invitation)
    // Note: The actual auth account will be created when they accept the invitation
    const insertData: Record<string, unknown> = {
      email,
      full_name: full_name || null,
      role: role || 'admin',
      tier: 'student', // Default business tier
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Only include admin_tier if column exists
    if (adminTierExists) {
      insertData.admin_tier = admin_tier || null;
    }

    const insertSelectFields = adminTierExists
      ? 'id, email, full_name, role, admin_tier, created_at, updated_at'
      : 'id, email, full_name, role, created_at, updated_at';

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert(insertData as never)
      .select(insertSelectFields)
      .single() as { data: { id: string; email: string; full_name: string | null; role: string | null; admin_tier?: string | null; created_at: string | null; updated_at: string | null } | null; error: Error | null };

    if (createError) throw createError;
    if (!newUser) throw new Error('Failed to create user');

    // Get permissions for the new user
    const newUserTier = adminTierExists ? (newUser.admin_tier || null) : null;
    const permissions = newUserTier ? await getUserPermissions(supabase, newUser.id, newUserTier) : [];

    return NextResponse.json({
      user: { ...newUser, admin_tier: newUserTier, permissions },
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
    const { authorized, user, role, adminTierExists } = await checkAdminRole(supabase);

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
      // If admin_tier column doesn't exist, return helpful error
      if (!adminTierExists) {
        return NextResponse.json({
          error: 'Admin tier system not available',
          message: 'The admin_tier column has not been created yet. Please run the database migration first.',
        }, { status: 400 });
      }

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
      if (updates.role === 'learner' && adminTierExists) {
        allowedUpdates.admin_tier = null;
      }
    }

    // Handle admin_tier updates (only if column exists)
    if (updates.admin_tier !== undefined && adminTierExists) {
      allowedUpdates.admin_tier = updates.admin_tier;
    }

    if (updates.tier) allowedUpdates.tier = updates.tier;
    if (updates.full_name) allowedUpdates.full_name = updates.full_name;

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    allowedUpdates.updated_at = new Date().toISOString();

    const selectFields = adminTierExists
      ? 'id, email, full_name, role, admin_tier, tier, created_at, updated_at'
      : 'id, email, full_name, role, tier, created_at, updated_at';

    const { data, error } = await supabase
      .from('users')
      .update(allowedUpdates as never)
      .eq('id', userId)
      .select(selectFields)
      .single() as { data: { id: string; email: string; full_name: string | null; role: string | null; admin_tier?: string | null; tier: string | null; created_at: string | null; updated_at: string | null } | null; error: Error | null };

    if (error) throw error;
    if (!data) throw new Error('User not found');

    // Get updated permissions
    const adminTierValue = adminTierExists ? (data.admin_tier || null) : null;
    const permissions = adminTierValue ? await getUserPermissions(supabase, data.id, adminTierValue) : [];

    return NextResponse.json({ user: { ...data, admin_tier: adminTierValue, permissions } });
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
    const { authorized, user, adminTierExists } = await checkAdminRole(supabase);

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

    // Build update data based on whether admin_tier column exists
    const updateData: Record<string, unknown> = {
      role: 'learner',
      updated_at: new Date().toISOString(),
    };

    if (adminTierExists) {
      updateData.admin_tier = null;
    }

    const selectFields = adminTierExists
      ? 'id, email, full_name, role, admin_tier, tier, created_at, updated_at'
      : 'id, email, full_name, role, tier, created_at, updated_at';

    // Remove admin privileges by setting admin_tier to null and role to 'learner'
    const { data, error } = await supabase
      .from('users')
      .update(updateData as never)
      .eq('id', userId)
      .select(selectFields)
      .single() as { data: { id: string; email: string; full_name: string | null; role: string | null; admin_tier?: string | null; tier: string | null; created_at: string | null; updated_at: string | null } | null; error: Error | null };

    if (error) throw error;
    if (!data) throw new Error('User not found');

    return NextResponse.json({
      user: { ...data, admin_tier: null, permissions: [] },
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
