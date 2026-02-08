/**
 * CERTIFICATION SUBMISSION API
 * Called when user completes milestone 10 (final milestone)
 *
 * Flow:
 * 1. User completes milestone 10 via tutor chat
 * 2. This endpoint creates certification_submission with status 'submitted'
 * 3. Returns Stripe checkout URL for payment
 * 4. After payment, webhook updates status to 'passed' and mints SBT
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { stripe, CERTIFICATION_PRICES, isValidTier, type CertificationTier } from '@/lib/stripe/config';

interface SubmissionArtifacts {
  architectureUrl?: string;
  demoVideoUrl?: string;
  productionLogs?: Record<string, unknown>;
  roiDocument?: string;
  documentationUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

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
    const { data: milestones, error: milestoneError } = await (supabase as any)
      .from('user_milestones')
      .select('milestone_number, status')
      .eq('user_id', user.id)
      .eq('path', path)
      .order('milestone_number');

    if (milestoneError) {
      console.error('Error fetching milestones:', milestoneError);
      return NextResponse.json(
        { error: 'Failed to verify milestone progress' },
        { status: 500 }
      );
    }

    const approvedMilestones = milestones?.filter(
      (m: { status: string }) => m.status === 'approved'
    ) || [];

    // User must have at least 9 approved milestones to submit certification
    // (M10 is the certification submission itself)
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
    const { data: existingSubmission } = await (supabase as any)
      .from('certification_submissions')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('path', path)
      .single();

    if (existingSubmission) {
      if (existingSubmission.status === 'passed') {
        return NextResponse.json(
          { error: 'You have already been certified for this path' },
          { status: 400 }
        );
      }

      if (existingSubmission.status === 'submitted' || existingSubmission.status === 'under_review') {
        // Return existing checkout URL if not paid yet
        return NextResponse.json({
          message: 'Submission already exists',
          submissionId: existingSubmission.id,
          status: existingSubmission.status,
          nextStep: 'Complete payment to finalize certification',
        });
      }
    }

    // Create or update certification submission
    const submissionData = {
      user_id: user.id,
      path,
      architecture_url: artifacts?.architectureUrl || null,
      demo_video_url: artifacts?.demoVideoUrl || null,
      production_logs: artifacts?.productionLogs || null,
      roi_document: artifacts?.roiDocument || null,
      documentation_url: artifacts?.documentationUrl || null,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    };

    const { data: submission, error: submitError } = await (supabase as any)
      .from('certification_submissions')
      .upsert(submissionData, {
        onConflict: 'user_id,path',
      })
      .select()
      .single();

    if (submitError) {
      console.error('Error creating submission:', submitError);
      return NextResponse.json(
        { error: 'Failed to create certification submission' },
        { status: 500 }
      );
    }

    // Mark milestone 10 as submitted
    await (supabase as any)
      .from('user_milestones')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('path', path)
      .eq('milestone_number', 10);

    // Get user details for checkout
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('display_name, email')
      .eq('id', user.id)
      .single();

    // Create Stripe checkout session
    const tierConfig = CERTIFICATION_PRICES[path as CertificationTier];

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: profile?.email || user.email,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        path: path,
        submissionId: submission.id,
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
                submissionId: submission.id,
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
      submissionId: submission.id,
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
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      // Get all submissions for user
      const { data: submissions } = await (supabase as any)
        .from('certification_submissions')
        .select('*')
        .eq('user_id', user.id);

      return NextResponse.json({ submissions: submissions || [] });
    }

    // Get specific path submission
    const { data: submission } = await (supabase as any)
      .from('certification_submissions')
      .select('*')
      .eq('user_id', user.id)
      .eq('path', path)
      .single();

    if (!submission) {
      return NextResponse.json(
        { error: 'No submission found for this path' },
        { status: 404 }
      );
    }

    // Get milestone progress
    const { data: milestones } = await (supabase as any)
      .from('user_milestones')
      .select('milestone_number, status')
      .eq('user_id', user.id)
      .eq('path', path)
      .order('milestone_number');

    const approvedCount = milestones?.filter(
      (m: { status: string }) => m.status === 'approved'
    ).length || 0;

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
