/**
 * ADMIN USERS API (Firebase)
 * Manage all platform users with admin tier system
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { AdminTier } from '@/types';
import { TIER_PERMISSIONS } from '@/types';

// Get permissions for a user based on their admin tier
function getUserPermissions(adminTier?: string | null): string[] {
  if (!adminTier) return [];
  return TIER_PERMISSIONS[adminTier as AdminTier] || [];
}

// Helper to check admin role
async function checkAdminRole() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;

  if (!session) {
    return { authorized: false, user: null, role: null, adminTier: null };
  }

  try {
    const auth = getAdminAuth();
    const db = getAdminDb();

    const decodedClaims = await auth.verifySessionCookie(session, true);
    const userId = decodedClaims.uid;

    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    const role = userData?.role;
    const adminTier = userData?.adminTier as AdminTier | null;
    const authorized = role === 'admin' || role === 'teacher';

    return { authorized, user: { id: userId, email: decodedClaims.email }, role, adminTier };
  } catch {
    return { authorized: false, user: null, role: null, adminTier: null };
  }
}

// GET - Fetch users with filtering
export async function GET(request: NextRequest) {
  try {
    const { authorized } = await checkAdminRole();

    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const db = getAdminDb();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const roleFilters = searchParams.getAll('role');
    const tierFilter = searchParams.get('tier') || '';
    const adminTierFilter = searchParams.get('admin_tier') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get all users and filter in memory (Firestore doesn't support complex queries)
    const usersSnapshot = await db.collection('users').orderBy('createdAt', 'desc').get();

    let users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Apply filters
    if (search) {
      users = users.filter((u: any) =>
        u.email?.toLowerCase().includes(search) ||
        u.fullName?.toLowerCase().includes(search)
      );
    }

    if (roleFilters.length > 0) {
      users = users.filter((u: any) => roleFilters.includes(u.role));
    }

    if (tierFilter) {
      users = users.filter((u: any) => u.tier === tierFilter);
    }

    if (adminTierFilter) {
      users = users.filter((u: any) => u.adminTier === adminTierFilter);
    }

    const total = users.length;
    const paginatedUsers = users.slice(offset, offset + limit);

    // Get learner profiles for each user
    const usersWithProfiles = await Promise.all(
      paginatedUsers.map(async (user: any) => {
        const profileQuery = await db
          .collection('learnerProfiles')
          .where('userId', '==', user.id)
          .limit(1)
          .get();

        const learnerProfile = profileQuery.empty ? null : profileQuery.docs[0].data();
        const permissions = getUserPermissions(user.adminTier);

        return {
          ...user,
          learnerProfiles: learnerProfile ? [learnerProfile] : [],
          permissions,
        };
      })
    );

    return NextResponse.json({
      users: usersWithProfiles,
      total,
      limit,
      offset,
      adminTierSystemActive: true,
    });
  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST - Invite/create admin users
export async function POST(request: NextRequest) {
  try {
    const { authorized, user } = await checkAdminRole();

    if (!authorized || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const db = getAdminDb();

    // Check if current user has 'manage_admins' permission
    const currentUserDoc = await db.collection('users').doc(user.id).get();
    const currentUserData = currentUserDoc.data();
    const permissions = getUserPermissions(currentUserData?.adminTier);

    if (!permissions.includes('manage_admins')) {
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
    const existingQuery = await db
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      // Update existing user's role and admin_tier
      const existingDoc = existingQuery.docs[0];
      const updateData: Record<string, unknown> = {
        updatedAt: Timestamp.now(),
      };

      if (role) updateData.role = role;
      if (admin_tier !== undefined) updateData.adminTier = admin_tier;
      if (full_name) updateData.fullName = full_name;

      await existingDoc.ref.update(updateData);

      const updatedDoc = await existingDoc.ref.get();
      const updatedUserData = updatedDoc.data() as Record<string, unknown>;
      const updatedUser = { id: updatedDoc.id, ...updatedUserData };
      const updatedPermissions = getUserPermissions(updatedUserData?.adminTier as string | null);

      return NextResponse.json({
        user: { ...updatedUser, permissions: updatedPermissions },
        action: 'updated',
        message: 'Existing user updated with new admin privileges',
      });
    }

    // Create new user
    const newUserRef = await db.collection('users').add({
      email,
      fullName: full_name || null,
      role: role || 'admin',
      adminTier: admin_tier || null,
      tier: 'student',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    const newUserDoc = await newUserRef.get();
    const newUserData = newUserDoc.data() as Record<string, unknown>;
    const newUser = { id: newUserDoc.id, ...newUserData };
    const newUserPermissions = getUserPermissions(newUserData?.adminTier as string | null);

    return NextResponse.json({
      user: { ...newUser, permissions: newUserPermissions },
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

// PATCH - Update user details including admin_tier
export async function PATCH(request: NextRequest) {
  try {
    const { authorized, user, role } = await checkAdminRole();

    if (!authorized || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const db = getAdminDb();
    const body = await request.json();
    const { userId, updates } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Check if trying to update admin_tier - requires manage_admins permission
    if (updates.admin_tier !== undefined || updates.adminTier !== undefined) {
      const currentUserDoc = await db.collection('users').doc(user.id).get();
      const currentUserData = currentUserDoc.data();
      const permissions = getUserPermissions(currentUserData?.adminTier);

      if (!permissions.includes('manage_admins')) {
        return NextResponse.json({ error: 'Insufficient permissions - requires manage_admins to change admin_tier' }, { status: 403 });
      }

      // Prevent self-demotion for super_admins
      if (userId === user.id && currentUserData?.adminTier === 'super_admin') {
        const newTier = updates.admin_tier ?? updates.adminTier;
        if (newTier !== 'super_admin') {
          return NextResponse.json({ error: 'Cannot demote yourself from super_admin' }, { status: 403 });
        }
      }
    }

    // Teachers can only update certain fields, not roles
    if (role === 'teacher' && updates.role) {
      return NextResponse.json({ error: 'Only admins can change user roles' }, { status: 403 });
    }

    const allowedUpdates: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    };

    // Map updates
    if (updates.role && role === 'admin') {
      allowedUpdates.role = updates.role;
      if (updates.role === 'learner') {
        allowedUpdates.adminTier = null;
      }
    }
    if (updates.admin_tier !== undefined) allowedUpdates.adminTier = updates.admin_tier;
    if (updates.adminTier !== undefined) allowedUpdates.adminTier = updates.adminTier;
    if (updates.tier) allowedUpdates.tier = updates.tier;
    if (updates.full_name) allowedUpdates.fullName = updates.full_name;
    if (updates.fullName) allowedUpdates.fullName = updates.fullName;

    if (Object.keys(allowedUpdates).length === 1) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    await db.collection('users').doc(userId).update(allowedUpdates);

    const updatedDoc = await db.collection('users').doc(userId).get();
    const updatedUserData = updatedDoc.data() as Record<string, unknown>;
    const updatedUser = { id: updatedDoc.id, ...updatedUserData };
    const updatedPermissions = getUserPermissions(updatedUserData?.adminTier as string | null);

    return NextResponse.json({ user: { ...updatedUser, permissions: updatedPermissions } });
  } catch (error) {
    console.error('Admin users PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE - Remove admin privileges from a user
export async function DELETE(request: NextRequest) {
  try {
    const { authorized, user } = await checkAdminRole();

    if (!authorized || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const db = getAdminDb();

    // Check if current user has 'manage_admins' permission
    const currentUserDoc = await db.collection('users').doc(user.id).get();
    const currentUserData = currentUserDoc.data();
    const permissions = getUserPermissions(currentUserData?.adminTier);

    if (!permissions.includes('manage_admins')) {
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

    // Remove admin privileges
    await db.collection('users').doc(userId).update({
      role: 'learner',
      adminTier: null,
      updatedAt: Timestamp.now(),
    });

    const updatedDoc = await db.collection('users').doc(userId).get();
    const updatedUser = { id: updatedDoc.id, ...updatedDoc.data() };

    return NextResponse.json({
      user: { ...updatedUser, permissions: [] },
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
