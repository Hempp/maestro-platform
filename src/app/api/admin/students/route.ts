/**
 * ADMIN STUDENTS API (Firebase)
 * Get detailed student information with progress
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

    const decodedClaims = await auth.verifySessionCookie(session, true);
    const userId = decodedClaims.uid;

    // Check admin/teacher role
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || !['admin', 'teacher'].includes(userData.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const tierFilter = searchParams.get('tier') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get all learner profiles
    let profilesQuery = db.collection('learnerProfiles').orderBy('lastActivityAt', 'desc');

    if (tierFilter && ['student', 'employee', 'owner'].includes(tierFilter)) {
      profilesQuery = profilesQuery.where('tier', '==', tierFilter);
    }

    const profilesSnapshot = await profilesQuery.get();
    const profiles = profilesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get user data for each profile
    const studentsWithData = await Promise.all(
      profiles.map(async (profile: any) => {
        const profileUserId = profile.userId;
        const studentDoc = await db.collection('users').doc(profileUserId).get();
        const studentData = studentDoc.data();

        if (!studentData) return null;

        // Apply search filter on user data
        if (search) {
          const emailMatch = studentData.email?.toLowerCase().includes(search);
          const nameMatch = studentData.fullName?.toLowerCase().includes(search);
          if (!emailMatch && !nameMatch) return null;
        }

        // Filter by role (learner or null)
        if (studentData.role && studentData.role !== 'learner') return null;

        // Get AKU progress count
        const akuProgressQuery = await db
          .collection('akuProgress')
          .where('userId', '==', profileUserId)
          .where('status', '==', 'verified')
          .get();

        // Get certificates count
        const certificatesQuery = await db
          .collection('certificates')
          .where('userId', '==', profileUserId)
          .get();

        return {
          id: profileUserId,
          email: studentData.email,
          fullName: studentData.fullName,
          avatarUrl: studentData.avatarUrl,
          createdAt: studentData.createdAt,
          tier: profile.tier,
          learnerProfiles: [{
            id: profile.id,
            tier: profile.tier,
            currentPath: profile.currentPath,
            totalLearningTime: profile.totalLearningTime,
            currentStreak: profile.currentStreak,
            longestStreak: profile.longestStreak,
            struggleScore: profile.struggleScore,
            lastActivityAt: profile.lastActivityAt,
          }],
          stats: {
            akusCompleted: akuProgressQuery.size,
            certificatesCount: certificatesQuery.size,
          },
        };
      })
    );

    // Filter out nulls and apply pagination
    const filteredStudents = studentsWithData.filter(Boolean);
    const paginatedStudents = filteredStudents.slice(offset, offset + limit);

    return NextResponse.json({
      students: paginatedStudents,
      total: filteredStudents.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Admin students API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}
