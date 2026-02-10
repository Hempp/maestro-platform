/**
 * PUBLIC SESSIONS API (Firebase)
 * Get available live sessions for learners (with tier-based access)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    // Get user tier if authenticated
    let userId: string | null = null;
    let userTier = 'student';

    if (session) {
      try {
        const auth = getAdminAuth();
        const decodedClaims = await auth.verifySessionCookie(session, true);
        userId = decodedClaims.uid;

        const userDoc = await db.collection('users').doc(userId).get();
        userTier = userDoc.data()?.tier || 'student';
      } catch {
        // Session invalid, continue as unauthenticated
      }
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'scheduled';
    const includeAll = searchParams.get('includeAll') === 'true';

    // Get sessions
    let sessionsQuery = db.collection('liveSessions').orderBy('scheduledAt', 'asc');

    if (!includeAll) {
      sessionsQuery = sessionsQuery.where('status', '==', status);
    }

    const sessionsSnapshot = await sessionsQuery.get();
    const sessions = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter for future sessions if scheduled
    const filteredSessions = includeAll
      ? sessions
      : sessions.filter((s: any) => {
          if (status === 'scheduled') {
            const scheduledAt = s.scheduledAt?.toDate?.() || new Date(s.scheduledAt);
            return scheduledAt >= new Date();
          }
          return true;
        });

    // Get enrollment counts and user's purchase status
    const sessionsWithAccess = await Promise.all(
      filteredSessions.map(async (sessionData: any) => {
        // Get enrollment count
        const enrollmentQuery = await db
          .collection('sessionEnrollments')
          .where('sessionId', '==', sessionData.id)
          .get();
        const enrollmentCount = enrollmentQuery.size;

        // Check user's access
        let hasAccess = false;
        let hasPurchased = false;
        let isEnrolled = false;

        if (userId) {
          // Check tier-based access
          if (userTier === 'owner') {
            hasAccess = true;
          } else if (userTier === 'employee' && ['student', 'employee'].includes(sessionData.targetTier)) {
            hasAccess = true;
          } else if (userTier === 'student' && sessionData.targetTier === 'student') {
            hasAccess = true;
          }

          // Check if purchased
          if (!hasAccess) {
            const purchaseQuery = await db
              .collection('seatPurchases')
              .where('sessionId', '==', sessionData.id)
              .where('userId', '==', userId)
              .where('paymentStatus', '==', 'completed')
              .limit(1)
              .get();

            if (!purchaseQuery.empty) {
              hasPurchased = true;
              hasAccess = true;
            }
          }

          // Check if enrolled
          const enrollmentCheck = await db
            .collection('sessionEnrollments')
            .where('sessionId', '==', sessionData.id)
            .where('studentId', '==', userId)
            .limit(1)
            .get();

          isEnrolled = !enrollmentCheck.empty;
        }

        return {
          ...sessionData,
          enrollmentCount,
          seatsAvailable: (sessionData.maxSeats || 100) - enrollmentCount,
          userAccess: {
            hasAccess,
            hasPurchased,
            isEnrolled,
            requiresPurchase: !hasAccess && sessionData.targetTier !== 'student',
            price: hasAccess ? 0 : sessionData.seatPrice,
          },
        };
      })
    );

    return NextResponse.json({
      sessions: sessionsWithAccess,
      userTier,
    });
  } catch (error) {
    console.error('Sessions API error:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

// POST: Enroll in a session (free access only)
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Get user tier
    const userDoc = await db.collection('users').doc(userId).get();
    const userTier = userDoc.data()?.tier || 'student';

    // Get session
    const sessionDoc = await db.collection('liveSessions').doc(sessionId).get();

    if (!sessionDoc.exists) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionData = sessionDoc.data();

    // Check tier access
    let hasAccess = false;
    if (userTier === 'owner') {
      hasAccess = true;
    } else if (userTier === 'employee' && ['student', 'employee'].includes(sessionData?.targetTier)) {
      hasAccess = true;
    } else if (userTier === 'student' && sessionData?.targetTier === 'student') {
      hasAccess = true;
    }

    // Check if purchased
    if (!hasAccess) {
      const purchaseQuery = await db
        .collection('seatPurchases')
        .where('sessionId', '==', sessionId)
        .where('userId', '==', userId)
        .where('paymentStatus', '==', 'completed')
        .limit(1)
        .get();

      if (!purchaseQuery.empty) hasAccess = true;
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'You need to purchase a seat to enroll' }, { status: 403 });
    }

    // Check seat availability
    const enrollmentQuery = await db
      .collection('sessionEnrollments')
      .where('sessionId', '==', sessionId)
      .get();
    const enrollmentCount = enrollmentQuery.size;

    if (enrollmentCount >= (sessionData?.maxSeats || 100)) {
      return NextResponse.json({ error: 'No seats available' }, { status: 400 });
    }

    // Check if already enrolled
    const existingEnrollment = await db
      .collection('sessionEnrollments')
      .where('sessionId', '==', sessionId)
      .where('studentId', '==', userId)
      .limit(1)
      .get();

    if (!existingEnrollment.empty) {
      return NextResponse.json({ error: 'Already enrolled' }, { status: 400 });
    }

    // Enroll
    const enrollmentRef = await db.collection('sessionEnrollments').add({
      sessionId,
      studentId: userId,
      accessType: 'tier_included',
      createdAt: Timestamp.now(),
    });

    const enrollmentDoc = await enrollmentRef.get();
    const enrollment = { id: enrollmentDoc.id, ...enrollmentDoc.data() };

    return NextResponse.json({ success: true, enrollment });
  } catch (error) {
    console.error('Enroll error:', error);
    return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 });
  }
}
