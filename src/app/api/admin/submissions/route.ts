/**
 * ADMIN SUBMISSIONS API (Firebase)
 * GET /api/admin/submissions - List all certification submissions
 * Supports filtering by path, status, and search
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    // Verify session and get user
    const decodedClaims = await auth.verifySessionCookie(session, true);
    const userId = decodedClaims.uid;

    // Check admin/instructor role
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || !['admin', 'instructor'].includes(userData.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const pathFilter = searchParams.get('path') || '';
    const statusFilter = searchParams.get('status') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query for certification submissions
    let query: FirebaseFirestore.Query = db
      .collection('certificationSubmissions')
      .orderBy('submittedAt', 'desc');

    // Apply filters
    if (pathFilter && ['student', 'employee', 'owner'].includes(pathFilter)) {
      query = query.where('path', '==', pathFilter);
    }

    if (statusFilter && ['submitted', 'under_review', 'passed', 'failed'].includes(statusFilter)) {
      query = query.where('status', '==', statusFilter);
    }

    const submissionsSnapshot = await query.get();

    // Get all submissions first
    let submissions = submissionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    // Fetch user data for all submissions
    const userIds = [...new Set(submissions.map(s => s.userId).filter(Boolean))] as string[];
    const reviewerIds = [...new Set(submissions.map(s => s.reviewedBy).filter(Boolean))] as string[];
    const allUserIds = [...new Set([...userIds, ...reviewerIds])];

    let usersMap: Record<string, any> = {};
    if (allUserIds.length > 0) {
      // Fetch users in batches (Firestore limits 'in' queries to 30 items)
      const batchSize = 30;
      for (let i = 0; i < allUserIds.length; i += batchSize) {
        const batch = allUserIds.slice(i, i + batchSize);
        const usersQuery = await db
          .collection('users')
          .where('__name__', 'in', batch)
          .get();

        usersQuery.docs.forEach(doc => {
          usersMap[doc.id] = { id: doc.id, ...doc.data() };
        });
      }
    }

    // Merge user data into submissions
    let submissionsWithUsers = submissions.map(sub => ({
      ...sub,
      user: sub.userId ? usersMap[sub.userId] || null : null,
      reviewer: sub.reviewedBy ? usersMap[sub.reviewedBy] || null : null,
    }));

    // If search filter, filter by user email/name
    if (search) {
      const searchLower = search.toLowerCase();
      submissionsWithUsers = submissionsWithUsers.filter((sub) => {
        return (
          sub.user?.email?.toLowerCase().includes(searchLower) ||
          sub.user?.fullName?.toLowerCase().includes(searchLower) ||
          sub.projectTitle?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Get total count before pagination
    const total = submissionsWithUsers.length;

    // Apply pagination
    const paginatedSubmissions = submissionsWithUsers.slice(offset, offset + limit);

    // Get summary stats
    const statusCounts = {
      submitted: 0,
      under_review: 0,
      passed: 0,
      failed: 0,
    };
    const pathCounts = {
      student: 0,
      employee: 0,
      owner: 0,
    };

    submissions.forEach((sub) => {
      if (sub.status && sub.status in statusCounts) {
        statusCounts[sub.status as keyof typeof statusCounts]++;
      }
      if (sub.path && sub.path in pathCounts) {
        pathCounts[sub.path as keyof typeof pathCounts]++;
      }
    });

    return NextResponse.json({
      submissions: paginatedSubmissions,
      total,
      limit,
      offset,
      stats: { statusCounts, pathCounts },
    });
  } catch (error) {
    console.error('Admin submissions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
