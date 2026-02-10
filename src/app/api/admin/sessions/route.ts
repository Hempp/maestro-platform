/**
 * ADMIN SESSIONS API (Firebase)
 * CRUD operations for live sessions with Google Meet/Zoom
 * Supports tiered access (student/employee/owner) with seat purchases
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

async function checkAdminRole() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;

  if (!session) {
    return { authorized: false, user: null, role: null };
  }

  try {
    const auth = getAdminAuth();
    const db = getAdminDb();

    const decodedClaims = await auth.verifySessionCookie(session, true);
    const userId = decodedClaims.uid;

    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    const role = userData?.role as string | null;
    const authorized = role === 'admin' || role === 'teacher';

    return { authorized, user: { id: userId, email: decodedClaims.email }, role };
  } catch {
    return { authorized: false, user: null, role: null };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { authorized, user, role } = await checkAdminRole();

    if (!authorized || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const db = getAdminDb();
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const status = searchParams.get('status');
    const upcoming = searchParams.get('upcoming') === 'true';

    // Build query
    let query: FirebaseFirestore.Query = db
      .collection('liveSessions')
      .orderBy('scheduledAt', 'asc');

    if (courseId) {
      query = query.where('courseId', '==', courseId);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    if (upcoming) {
      query = query
        .where('scheduledAt', '>=', Timestamp.now())
        .where('status', 'in', ['scheduled', 'live']);
    }

    // Teachers only see sessions for their courses
    let teacherCourseIds: string[] = [];
    if (role === 'teacher') {
      const teacherCoursesQuery = await db
        .collection('liveCourses')
        .where('teacherId', '==', user.id)
        .get();

      teacherCourseIds = teacherCoursesQuery.docs.map(doc => doc.id);

      if (teacherCourseIds.length === 0) {
        return NextResponse.json({ sessions: [] });
      }
    }

    const sessionsSnapshot = await query.get();

    let sessions = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    // Filter by teacher's courses if not admin
    if (role === 'teacher' && teacherCourseIds.length > 0) {
      sessions = sessions.filter(s => teacherCourseIds.includes(s.courseId));
    }

    // Fetch course and enrollment data for each session
    const sessionsWithData = await Promise.all(
      sessions.map(async (session) => {
        // Get course data
        let course = null;
        if (session.courseId) {
          const courseDoc = await db.collection('liveCourses').doc(session.courseId).get();
          if (courseDoc.exists) {
            course = { id: courseDoc.id, ...courseDoc.data() };
          }
        }

        // Get enrollments
        const enrollmentsQuery = await db
          .collection('sessionEnrollments')
          .where('sessionId', '==', session.id)
          .get();

        const enrollments = await Promise.all(
          enrollmentsQuery.docs.map(async (doc) => {
            const enrollment = { id: doc.id, ...doc.data() } as any;

            // Get student data
            if (enrollment.studentId) {
              const studentDoc = await db.collection('users').doc(enrollment.studentId).get();
              if (studentDoc.exists) {
                enrollment.student = { id: studentDoc.id, ...studentDoc.data() };
              }
            }

            return enrollment;
          })
        );

        return {
          ...session,
          course,
          enrollments,
          enrollmentCount: enrollments.length,
          attendedCount: enrollments.filter((e: any) => e.attended).length,
        };
      })
    );

    return NextResponse.json({ sessions: sessionsWithData });
  } catch (error) {
    console.error('Admin sessions GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authorized, user, role } = await checkAdminRole();

    if (!authorized || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const db = getAdminDb();
    const body = await request.json();
    const {
      courseId,
      title,
      description,
      scheduledAt,
      durationMinutes,
      googleMeetLink,
      zoomLink,
      platform,
      targetTier,
      seatPrice,
      maxSeats,
      earlyBirdPrice,
      earlyBirdDeadline,
    } = body;

    if (!courseId || !title || !scheduledAt) {
      return NextResponse.json(
        { error: 'Course ID, title, and scheduled time are required' },
        { status: 400 }
      );
    }

    // Check course ownership (unless admin)
    if (role === 'teacher') {
      const courseDoc = await db.collection('liveCourses').doc(courseId).get();
      if (courseDoc.data()?.teacherId !== user.id) {
        return NextResponse.json({ error: 'Not your course' }, { status: 403 });
      }
    }

    const sessionRef = await db.collection('liveSessions').add({
      courseId,
      title,
      description: description || null,
      scheduledAt: Timestamp.fromDate(new Date(scheduledAt)),
      durationMinutes: durationMinutes || 60,
      googleMeetLink: googleMeetLink || null,
      zoomLink: zoomLink || null,
      platform: platform || 'google_meet',
      targetTier: targetTier || 'student',
      seatPrice: seatPrice || 0,
      maxSeats: maxSeats || 100,
      earlyBirdPrice: earlyBirdPrice || null,
      earlyBirdDeadline: earlyBirdDeadline ? Timestamp.fromDate(new Date(earlyBirdDeadline)) : null,
      status: 'scheduled',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    const sessionDoc = await sessionRef.get();
    const session = { id: sessionDoc.id, ...sessionDoc.data() };

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error('Admin sessions POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { authorized, user, role } = await checkAdminRole();

    if (!authorized || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const db = getAdminDb();
    const body = await request.json();
    const { sessionId, updates } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Check ownership via course (unless admin)
    if (role === 'teacher') {
      const sessionDoc = await db.collection('liveSessions').doc(sessionId).get();
      const sessionData = sessionDoc.data();

      if (sessionData?.courseId) {
        const courseDoc = await db.collection('liveCourses').doc(sessionData.courseId).get();
        if (courseDoc.data()?.teacherId !== user.id) {
          return NextResponse.json({ error: 'Not your session' }, { status: 403 });
        }
      }
    }

    const allowedUpdates: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    };

    if (updates.title) allowedUpdates.title = updates.title;
    if (updates.description !== undefined) allowedUpdates.description = updates.description;
    if (updates.scheduledAt) allowedUpdates.scheduledAt = Timestamp.fromDate(new Date(updates.scheduledAt));
    if (updates.durationMinutes) allowedUpdates.durationMinutes = updates.durationMinutes;
    if (updates.googleMeetLink !== undefined) allowedUpdates.googleMeetLink = updates.googleMeetLink;
    if (updates.zoomLink !== undefined) allowedUpdates.zoomLink = updates.zoomLink;
    if (updates.platform) allowedUpdates.platform = updates.platform;
    if (updates.targetTier) allowedUpdates.targetTier = updates.targetTier;
    if (updates.seatPrice !== undefined) allowedUpdates.seatPrice = updates.seatPrice;
    if (updates.maxSeats !== undefined) allowedUpdates.maxSeats = updates.maxSeats;
    if (updates.earlyBirdPrice !== undefined) allowedUpdates.earlyBirdPrice = updates.earlyBirdPrice;
    if (updates.earlyBirdDeadline !== undefined) {
      allowedUpdates.earlyBirdDeadline = updates.earlyBirdDeadline
        ? Timestamp.fromDate(new Date(updates.earlyBirdDeadline))
        : null;
    }
    if (updates.status) allowedUpdates.status = updates.status;
    if (updates.recordingUrl !== undefined) allowedUpdates.recordingUrl = updates.recordingUrl;
    if (updates.notes !== undefined) allowedUpdates.notes = updates.notes;

    await db.collection('liveSessions').doc(sessionId).update(allowedUpdates);

    const updatedDoc = await db.collection('liveSessions').doc(sessionId).get();
    const session = { id: updatedDoc.id, ...updatedDoc.data() };

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Admin sessions PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { authorized, user, role } = await checkAdminRole();

    if (!authorized || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const db = getAdminDb();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Check ownership via course (unless admin)
    if (role === 'teacher') {
      const sessionDoc = await db.collection('liveSessions').doc(sessionId).get();
      const sessionData = sessionDoc.data();

      if (sessionData?.courseId) {
        const courseDoc = await db.collection('liveCourses').doc(sessionData.courseId).get();
        if (courseDoc.data()?.teacherId !== user.id) {
          return NextResponse.json({ error: 'Not your session' }, { status: 403 });
        }
      }
    }

    await db.collection('liveSessions').doc(sessionId).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin sessions DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
