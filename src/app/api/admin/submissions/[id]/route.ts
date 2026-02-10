/**
 * ADMIN SINGLE SUBMISSION API (Firebase)
 * GET /api/admin/submissions/[id] - Get a single submission
 * PATCH /api/admin/submissions/[id] - Update submission (start review)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    // Verify session and check role
    const decodedClaims = await auth.verifySessionCookie(session, true);
    const userId = decodedClaims.uid;

    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || !['admin', 'instructor'].includes(userData.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get the submission
    const submissionDoc = await db.collection('certificationSubmissions').doc(id).get();

    if (!submissionDoc.exists) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submission = { id: submissionDoc.id, ...submissionDoc.data() } as any;

    // Get user details
    let submissionUser = null;
    let reviewer = null;

    if (submission.userId) {
      const subUserDoc = await db.collection('users').doc(submission.userId).get();
      if (subUserDoc.exists) {
        const subUserData = subUserDoc.data();
        submissionUser = {
          id: subUserDoc.id,
          email: subUserData?.email,
          fullName: subUserData?.fullName,
          avatarUrl: subUserData?.avatarUrl,
          createdAt: subUserData?.createdAt,
        };
      }
    }

    if (submission.reviewedBy) {
      const reviewerDoc = await db.collection('users').doc(submission.reviewedBy).get();
      if (reviewerDoc.exists) {
        const reviewerData = reviewerDoc.data();
        reviewer = {
          id: reviewerDoc.id,
          email: reviewerData?.email,
          fullName: reviewerData?.fullName,
        };
      }
    }

    // Add user data to submission response
    const submissionWithUser = {
      ...submission,
      user: submissionUser,
      reviewer,
    };

    if (submission.userId) {
      // Get learner profile
      const profileQuery = await db
        .collection('learnerProfiles')
        .where('userId', '==', submission.userId)
        .limit(1)
        .get();

      const learnerProfile = profileQuery.empty ? null : profileQuery.docs[0].data();

      // Get completed AKUs count
      const akuQuery = await db
        .collection('akuProgress')
        .where('userId', '==', submission.userId)
        .where('status', '==', 'verified')
        .get();

      const akusCompleted = akuQuery.size;

      // Get certificates count
      const certsQuery = await db
        .collection('certificates')
        .where('userId', '==', submission.userId)
        .get();

      const certificatesCount = certsQuery.size;

      return NextResponse.json({
        submission: submissionWithUser,
        userStats: {
          learnerProfile,
          akusCompleted,
          certificatesCount,
        },
      });
    }

    return NextResponse.json({ submission: submissionWithUser, userStats: null });
  } catch (error) {
    console.error('Admin submission GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    // Verify session and check role
    const decodedClaims = await auth.verifySessionCookie(session, true);
    const userId = decodedClaims.uid;

    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || !['admin', 'instructor'].includes(userData.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    };

    // Allow updating status to under_review
    if (body.status === 'under_review') {
      updateData.status = 'under_review';
      updateData.reviewedBy = userId;
    }

    if (Object.keys(updateData).length === 1) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    await db.collection('certificationSubmissions').doc(id).update(updateData);

    const updatedDoc = await db.collection('certificationSubmissions').doc(id).get();
    const submission = { id: updatedDoc.id, ...updatedDoc.data() };

    return NextResponse.json({ submission });
  } catch (error) {
    console.error('Admin submission PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    );
  }
}
