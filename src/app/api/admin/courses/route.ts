/**
 * ADMIN COURSES API (Firebase)
 * CRUD operations for live courses
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
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Build query
    let query: FirebaseFirestore.Query = db
      .collection('liveCourses')
      .orderBy('createdAt', 'desc');

    // Teachers only see their own courses, admins see all
    if (role === 'teacher') {
      query = query.where('teacherId', '==', user.id);
    }

    if (!includeInactive) {
      query = query.where('isActive', '==', true);
    }

    const coursesSnapshot = await query.get();

    // Get all courses with related data
    const coursesWithData = await Promise.all(
      coursesSnapshot.docs.map(async (doc) => {
        const course = { id: doc.id, ...doc.data() } as any;

        // Get teacher data
        let teacher = null;
        if (course.teacherId) {
          const teacherDoc = await db.collection('users').doc(course.teacherId).get();
          if (teacherDoc.exists) {
            const teacherData = teacherDoc.data();
            teacher = {
              id: teacherDoc.id,
              fullName: teacherData?.fullName,
              email: teacherData?.email,
              avatarUrl: teacherData?.avatarUrl,
            };
          }
        }

        // Get sessions
        const sessionsQuery = await db
          .collection('liveSessions')
          .where('courseId', '==', doc.id)
          .get();

        const sessions = sessionsQuery.docs.map((s) => ({
          id: s.id,
          ...s.data(),
        }));

        // Get enrollments
        const enrollmentsQuery = await db
          .collection('courseEnrollments')
          .where('courseId', '==', doc.id)
          .get();

        const enrollments = enrollmentsQuery.docs.map((e) => ({
          id: e.id,
          ...e.data(),
        }));

        // Calculate counts
        const now = new Date();
        const upcomingSessions = sessions.filter((s: any) => {
          const scheduledAt = s.scheduledAt?.toDate?.() || new Date(s.scheduledAt);
          return s.status === 'scheduled' && scheduledAt > now;
        }).length;

        return {
          ...course,
          teacher,
          sessions,
          enrollments,
          enrollmentCount: enrollments.length,
          upcomingSessions,
        };
      })
    );

    return NextResponse.json({ courses: coursesWithData });
  } catch (error) {
    console.error('Admin courses GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authorized, user } = await checkAdminRole();

    if (!authorized || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const db = getAdminDb();
    const body = await request.json();
    const { title, description, tier, maxStudents, schedule, thumbnailUrl } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const courseRef = await db.collection('liveCourses').add({
      title,
      description: description || null,
      teacherId: user.id,
      tier: tier || null,
      maxStudents: maxStudents || 30,
      schedule: schedule || {},
      thumbnailUrl: thumbnailUrl || null,
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    const courseDoc = await courseRef.get();
    const course = { id: courseDoc.id, ...courseDoc.data() };

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error('Admin courses POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
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
    const { courseId, updates } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
    }

    // Check ownership (unless admin)
    if (role === 'teacher') {
      const courseDoc = await db.collection('liveCourses').doc(courseId).get();
      if (courseDoc.data()?.teacherId !== user.id) {
        return NextResponse.json({ error: 'Not your course' }, { status: 403 });
      }
    }

    const allowedUpdates: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    };

    if (updates.title) allowedUpdates.title = updates.title;
    if (updates.description !== undefined) allowedUpdates.description = updates.description;
    if (updates.tier !== undefined) allowedUpdates.tier = updates.tier;
    if (updates.maxStudents) allowedUpdates.maxStudents = updates.maxStudents;
    if (updates.schedule) allowedUpdates.schedule = updates.schedule;
    if (updates.thumbnailUrl !== undefined) allowedUpdates.thumbnailUrl = updates.thumbnailUrl;
    if (updates.isActive !== undefined) allowedUpdates.isActive = updates.isActive;

    await db.collection('liveCourses').doc(courseId).update(allowedUpdates);

    const updatedDoc = await db.collection('liveCourses').doc(courseId).get();
    const course = { id: updatedDoc.id, ...updatedDoc.data() };

    return NextResponse.json({ course });
  } catch (error) {
    console.error('Admin courses PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
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
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
    }

    // Check ownership (unless admin)
    if (role === 'teacher') {
      const courseDoc = await db.collection('liveCourses').doc(courseId).get();
      if (courseDoc.data()?.teacherId !== user.id) {
        return NextResponse.json({ error: 'Not your course' }, { status: 403 });
      }
    }

    await db.collection('liveCourses').doc(courseId).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin courses DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}
