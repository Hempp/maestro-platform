/**
 * CERTIFICATION SUBMISSION API (Firebase)
 * Called when user completes milestone 10 (final milestone)
 *
 * Flow:
 * 1. User completes milestone 10 via tutor chat
 * 2. This endpoint creates certification_submission with status 'submitted'
 * 3. Returns Stripe checkout URL for payment
 * 4. After payment, webhook updates status to 'passed' and mints SBT
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { stripe, CERTIFICATION_PRICES, type CertificationTier } from '@/lib/stripe/config';

interface SubmissionArtifacts {
  architectureUrl?: string;
  demoVideoUrl?: string;
  productionLogs?: Record<string, unknown>;
  roiDocument?: string;
  documentationUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    const decodedClaims = await auth.verifySessionCookie(session, true);
    const userId = decodedClaims.uid;

    // Parse request body
    const body = await request.json();
    const { path, artifacts } = body as {
      path: 'student' | 'employee' | 'owner';
      artifacts?: SubmissionArtifacts;
    };

    // Validate path
    if (!path || !['student', 'employee', 'owner'].includes(path)) {
      return NextResponse.json(
        { error: 'Invalid path. Must be: student, employee, or owner' },
        { status: 400 }
      );
    }

    // Verify user has completed all 10 milestones (at least 9 approved + 1 submitted/active for M10)
    const milestonesQuery = await db
      .collection('userMilestones')
      .where('userId', '==', userId)
      .where('path', '==', path)
      .orderBy('milestoneNumber')
      .get();

    const milestones = milestonesQuery.docs.map(doc => doc.data());
    const approvedMilestones = milestones.filter(m => m.status === 'approved');

    // User must have at least 9 approved milestones to submit certification
    if (approvedMilestones.length < 9) {
      return NextResponse.json(
        {
          error: 'Not all milestones completed',
          required: 9,
          completed: approvedMilestones.length,
          message: 'Complete all milestones 1-9 before submitting for certification',
        },
        { status: 400 }
      );
    }

    // Check if already submitted
    const existingQuery = await db
      .collection('certificationSubmissions')
      .where('userId', '==', userId)
      .where('path', '==', path)
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      const existingSubmission = existingQuery.docs[0].data();

      if (existingSubmission.status === 'passed') {
        return NextResponse.json(
          { error: 'You have already been certified for this path' },
          { status: 400 }
        );
      }

      if (existingSubmission.status === 'submitted' || existingSubmission.status === 'under_review') {
        return NextResponse.json({
          message: 'Submission already exists',
          submissionId: existingQuery.docs[0].id,
          status: existingSubmission.status,
          nextStep: 'Complete payment to finalize certification',
        });
      }
    }

    // Create certification submission
    const submissionData = {
      userId,
      path,
      architectureUrl: artifacts?.architectureUrl || null,
      demoVideoUrl: artifacts?.demoVideoUrl || null,
      productionLogs: artifacts?.productionLogs || null,
      roiDocument: artifacts?.roiDocument || null,
      documentationUrl: artifacts?.documentationUrl || null,
      status: 'submitted',
      submittedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const submissionRef = await db.collection('certificationSubmissions').add(submissionData);

    // Mark milestone 10 as submitted
    const milestone10Query = await db
      .collection('userMilestones')
      .where('userId', '==', userId)
      .where('path', '==', path)
      .where('milestoneNumber', '==', 10)
      .limit(1)
      .get();

    if (!milestone10Query.empty) {
      await milestone10Query.docs[0].ref.update({
        status: 'submitted',
        submittedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }

    // Get user details for checkout
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    // Create Stripe checkout session
    const tierConfig = CERTIFICATION_PRICES[path as CertificationTier];

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: userData?.email || decodedClaims.email,
      client_reference_id: userId,
      metadata: {
        userId: userId,
        path: path,
        submissionId: submissionRef.id,
        type: 'certification_submission',
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: tierConfig.name,
              description: `${tierConfig.description} - Includes Soulbound Token (SBT) credential`,
              metadata: {
                path: path,
                submissionId: submissionRef.id,
              },
            },
            unit_amount: tierConfig.amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/certification/success?path=${path}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/learn/path/${path}?payment=cancelled`,
    });

    return NextResponse.json({
      success: true,
      submissionId: submissionRef.id,
      checkoutUrl: checkoutSession.url,
      checkoutSessionId: checkoutSession.id,
      message: 'Certification submitted! Complete payment to receive your credential.',
    });
  } catch (error) {
    console.error('Certification submission error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit certification' },
      { status: 500 }
    );
  }
}

// GET: Check submission status
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    const decodedClaims = await auth.verifySessionCookie(session, true);
    const userId = decodedClaims.uid;

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      // Get all submissions for user
      const submissionsQuery = await db
        .collection('certificationSubmissions')
        .where('userId', '==', userId)
        .get();

      const submissions = submissionsQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return NextResponse.json({ submissions });
    }

    // Get specific path submission
    const submissionQuery = await db
      .collection('certificationSubmissions')
      .where('userId', '==', userId)
      .where('path', '==', path)
      .limit(1)
      .get();

    if (submissionQuery.empty) {
      return NextResponse.json(
        { error: 'No submission found for this path' },
        { status: 404 }
      );
    }

    const submission = {
      id: submissionQuery.docs[0].id,
      ...submissionQuery.docs[0].data(),
    };

    // Get milestone progress
    const milestonesQuery = await db
      .collection('userMilestones')
      .where('userId', '==', userId)
      .where('path', '==', path)
      .orderBy('milestoneNumber')
      .get();

    const approvedCount = milestonesQuery.docs.filter(
      doc => doc.data().status === 'approved'
    ).length;

    return NextResponse.json({
      submission,
      progress: {
        totalMilestones: 10,
        approvedMilestones: approvedCount,
        completionPercentage: (approvedCount / 10) * 100,
        isEligibleForCertification: approvedCount >= 9,
      },
    });
  } catch (error) {
    console.error('Certification status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission status' },
      { status: 500 }
    );
  }
}
