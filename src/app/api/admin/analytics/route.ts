/**
 * ADMIN ANALYTICS API (Firebase)
 * Platform-wide analytics and insights
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
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Total users
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;

    // Users by tier
    const usersByTier = {
      student: 0,
      employee: 0,
      owner: 0,
    };
    usersSnapshot.docs.forEach(doc => {
      const tier = doc.data().tier;
      if (tier && tier in usersByTier) {
        usersByTier[tier as keyof typeof usersByTier]++;
      }
    });

    // Active users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsersQuery = await db
      .collection('learnerProfiles')
      .where('lastActivityAt', '>=', sevenDaysAgo)
      .get();
    const activeUsers = activeUsersQuery.size;

    // Total certificates issued
    const certificatesSnapshot = await db.collection('certificates').get();
    const totalCertificates = certificatesSnapshot.size;

    // Certificates by type
    const certificatesByType = {
      student: 0,
      employee: 0,
      owner: 0,
    };
    certificatesSnapshot.docs.forEach(doc => {
      const type = doc.data().certificateType;
      if (type && type in certificatesByType) {
        certificatesByType[type as keyof typeof certificatesByType]++;
      }
    });

    // Total AKUs completed
    const akuProgressQuery = await db
      .collection('akuProgress')
      .where('status', '==', 'verified')
      .get();
    const totalAkusCompleted = akuProgressQuery.size;

    // Average struggle score
    const learnerProfilesQuery = await db.collection('learnerProfiles').get();
    let totalStruggleScore = 0;
    let struggleCount = 0;
    let totalLearningTime = 0;

    learnerProfilesQuery.docs.forEach(doc => {
      const data = doc.data();
      if (data.struggleScore !== null && data.struggleScore !== undefined) {
        totalStruggleScore += data.struggleScore;
        struggleCount++;
      }
      if (data.totalLearningTime) {
        totalLearningTime += data.totalLearningTime;
      }
    });

    const avgStruggleScore = struggleCount > 0 ? Math.round(totalStruggleScore / struggleCount) : 0;
    const totalLearningHours = Math.round(totalLearningTime / 60);

    // Live courses stats
    const coursesQuery = await db
      .collection('liveCourses')
      .where('isActive', '==', true)
      .get();
    const totalCourses = coursesQuery.size;

    const sessionsQuery = await db.collection('liveSessions').get();
    const totalSessions = sessionsQuery.size;

    const upcomingSessionsQuery = await db
      .collection('liveSessions')
      .where('status', '==', 'scheduled')
      .where('scheduledAt', '>=', new Date())
      .get();
    const upcomingSessions = upcomingSessionsQuery.size;

    // New users in period
    const newUsersQuery = await db
      .collection('users')
      .where('createdAt', '>=', startDate)
      .get();
    const newUsersInPeriod = newUsersQuery.size;

    // Daily signups for chart
    const signupsByDay: Record<string, number> = {};
    newUsersQuery.docs.forEach(doc => {
      const createdAt = doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt);
      if (createdAt) {
        const day = createdAt.toISOString().split('T')[0];
        signupsByDay[day] = (signupsByDay[day] || 0) + 1;
      }
    });

    // Top performers (highest streak)
    const topPerformersQuery = await db
      .collection('learnerProfiles')
      .orderBy('currentStreak', 'desc')
      .limit(5)
      .get();

    const topPerformers = await Promise.all(
      topPerformersQuery.docs.map(async doc => {
        const profile = doc.data();
        const profileUserId = profile.userId;
        const userDoc = await db.collection('users').doc(profileUserId).get();
        const user = userDoc.data();
        return {
          currentStreak: profile.currentStreak,
          totalLearningTime: profile.totalLearningTime,
          user: {
            id: profileUserId,
            fullName: user?.fullName,
            email: user?.email,
            avatarUrl: user?.avatarUrl,
            tier: user?.tier,
          },
        };
      })
    );

    // Struggling students (high struggle score)
    const strugglingQuery = await db
      .collection('learnerProfiles')
      .where('struggleScore', '>=', 70)
      .orderBy('struggleScore', 'desc')
      .limit(5)
      .get();

    const strugglingStudents = await Promise.all(
      strugglingQuery.docs.map(async doc => {
        const profile = doc.data();
        const profileUserId = profile.userId;
        const userDoc = await db.collection('users').doc(profileUserId).get();
        const user = userDoc.data();
        return {
          struggleScore: profile.struggleScore,
          lastActivityAt: profile.lastActivityAt,
          user: {
            id: profileUserId,
            fullName: user?.fullName,
            email: user?.email,
            avatarUrl: user?.avatarUrl,
            tier: user?.tier,
          },
        };
      })
    );

    return NextResponse.json({
      overview: {
        totalUsers,
        activeUsers,
        newUsersInPeriod,
        totalCertificates,
        totalAkusCompleted,
        totalLearningHours,
        avgStruggleScore,
      },
      courses: {
        totalCourses,
        totalSessions,
        upcomingSessions,
      },
      breakdown: {
        usersByTier,
        certificatesByType,
      },
      trends: {
        signupsByDay,
      },
      insights: {
        topPerformers,
        strugglingStudents,
      },
    });
  } catch (error) {
    console.error('Admin analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
