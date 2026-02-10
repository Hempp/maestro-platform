/**
 * ADMIN SUBMISSION REVIEW API (Firebase)
 * POST /api/admin/submissions/[id]/review - Submit review with scores
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

interface ReviewPayload {
  scoreWorkingSystem: number;
  scoreProblemFit: number;
  scoreArchitecture: number;
  scoreProductionReady: number;
  scoreRoi: number;
  scoreDocumentation: number;
  reviewerNotes: string;
  decision: 'pass' | 'fail';
}

// Scoring limits for validation
const SCORE_LIMITS = {
  scoreWorkingSystem: { min: 0, max: 30 },
  scoreProblemFit: { min: 0, max: 20 },
  scoreArchitecture: { min: 0, max: 15 },
  scoreProductionReady: { min: 0, max: 15 },
  scoreRoi: { min: 0, max: 10 },
  scoreDocumentation: { min: 0, max: 10 },
};

const PASSING_SCORE = 70;

export async function POST(
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

    const body: ReviewPayload = await request.json();

    // Validate scores
    for (const [key, limits] of Object.entries(SCORE_LIMITS)) {
      const score = body[key as keyof typeof SCORE_LIMITS];
      if (typeof score !== 'number' || score < limits.min || score > limits.max) {
        return NextResponse.json(
          { error: `Invalid ${key}: must be between ${limits.min} and ${limits.max}` },
          { status: 400 }
        );
      }
    }

    // Calculate total score
    const totalScore =
      body.scoreWorkingSystem +
      body.scoreProblemFit +
      body.scoreArchitecture +
      body.scoreProductionReady +
      body.scoreRoi +
      body.scoreDocumentation;

    // Determine final status based on decision or auto-calculate
    let finalStatus: 'passed' | 'failed';
    if (body.decision) {
      finalStatus = body.decision === 'pass' ? 'passed' : 'failed';
    } else {
      finalStatus = totalScore >= PASSING_SCORE ? 'passed' : 'failed';
    }

    // Check if submission exists and is reviewable
    const submissionDoc = await db.collection('certificationSubmissions').doc(id).get();

    if (!submissionDoc.exists) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const existingSubmission = submissionDoc.data()!;

    if (existingSubmission.status === 'passed' || existingSubmission.status === 'failed') {
      return NextResponse.json(
        { error: 'This submission has already been reviewed' },
        { status: 400 }
      );
    }

    // Update the submission with review data
    await db.collection('certificationSubmissions').doc(id).update({
      scoreWorkingSystem: body.scoreWorkingSystem,
      scoreProblemFit: body.scoreProblemFit,
      scoreArchitecture: body.scoreArchitecture,
      scoreProductionReady: body.scoreProductionReady,
      scoreRoi: body.scoreRoi,
      scoreDocumentation: body.scoreDocumentation,
      reviewerNotes: body.reviewerNotes || null,
      reviewedBy: userId,
      reviewedAt: Timestamp.now(),
      status: finalStatus,
      updatedAt: Timestamp.now(),
    });

    // Fetch the updated submission with user data
    const updatedDoc = await db.collection('certificationSubmissions').doc(id).get();
    const submission = { id: updatedDoc.id, ...updatedDoc.data() } as any;

    // Get user data
    if (submission.userId) {
      const subUserDoc = await db.collection('users').doc(submission.userId).get();
      if (subUserDoc.exists) {
        submission.user = { id: subUserDoc.id, ...subUserDoc.data() };
      }
    }

    // If passed, we could trigger certificate generation here
    if (finalStatus === 'passed') {
      console.log(`Certification PASSED for user ${existingSubmission.userId} with score ${totalScore}`);
      // TODO: Trigger certificate generation workflow
    }

    return NextResponse.json({
      submission,
      totalScore,
      passed: finalStatus === 'passed',
      passingScore: PASSING_SCORE,
      message:
        finalStatus === 'passed'
          ? `Certification approved with score ${totalScore}/100`
          : `Certification not approved. Score: ${totalScore}/100 (required: ${PASSING_SCORE})`,
    });
  } catch (error) {
    console.error('Admin submission review error:', error);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}
