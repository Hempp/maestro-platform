/**
 * ADMIN SUBMISSION REVIEW API
 * POST /api/admin/submissions/[id]/review - Submit review with scores
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface ReviewPayload {
  score_working_system: number;
  score_problem_fit: number;
  score_architecture: number;
  score_production_ready: number;
  score_roi: number;
  score_documentation: number;
  reviewer_notes: string;
  decision: 'pass' | 'fail';
}

// Scoring limits for validation
const SCORE_LIMITS = {
  score_working_system: { min: 0, max: 30 },
  score_problem_fit: { min: 0, max: 20 },
  score_architecture: { min: 0, max: 15 },
  score_production_ready: { min: 0, max: 15 },
  score_roi: { min: 0, max: 10 },
  score_documentation: { min: 0, max: 10 },
};

const PASSING_SCORE = 70;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Check admin/teacher role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

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
      body.score_working_system +
      body.score_problem_fit +
      body.score_architecture +
      body.score_production_ready +
      body.score_roi +
      body.score_documentation;

    // Determine final status based on decision or auto-calculate
    let finalStatus: 'passed' | 'failed';
    if (body.decision) {
      finalStatus = body.decision === 'pass' ? 'passed' : 'failed';
    } else {
      finalStatus = totalScore >= PASSING_SCORE ? 'passed' : 'failed';
    }

    // Check if submission exists and is reviewable
    const { data: existingSubmission, error: fetchError } = await supabase
      .from('certification_submissions')
      .select('id, status, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingSubmission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (existingSubmission.status === 'passed' || existingSubmission.status === 'failed') {
      return NextResponse.json(
        { error: 'This submission has already been reviewed' },
        { status: 400 }
      );
    }

    // Update the submission with review data
    const { data: submission, error: updateError } = await supabase
      .from('certification_submissions')
      .update({
        score_working_system: body.score_working_system,
        score_problem_fit: body.score_problem_fit,
        score_architecture: body.score_architecture,
        score_production_ready: body.score_production_ready,
        score_roi: body.score_roi,
        score_documentation: body.score_documentation,
        reviewer_notes: body.reviewer_notes || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        status: finalStatus,
      })
      .eq('id', id)
      .select(`
        *,
        user:users!certification_submissions_user_id_fkey (
          id,
          email,
          full_name
        )
      `)
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    // If passed, we could trigger certificate generation here
    // For now, just log it
    if (finalStatus === 'passed') {
      console.log(`Certification PASSED for user ${existingSubmission.user_id} with score ${totalScore}`);
      // TODO: Trigger certificate generation workflow
    }

    return NextResponse.json({
      submission,
      totalScore,
      passed: finalStatus === 'passed',
      passingScore: PASSING_SCORE,
      message: finalStatus === 'passed'
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
