/**
 * ADMIN SINGLE SUBMISSION API
 * GET /api/admin/submissions/[id] - Get a single submission
 * PATCH /api/admin/submissions/[id] - Update submission (start review)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
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
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'instructor'].includes(userData.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get the submission with user details
    const { data: submission, error } = await supabase
      .from('certification_submissions')
      .select(`
        *,
        user:users!certification_submissions_user_id_fkey (
          id,
          email,
          full_name,
          avatar_url,
          created_at
        ),
        reviewer:users!certification_submissions_reviewed_by_fkey (
          id,
          email,
          full_name
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
      }
      throw error;
    }

    // Get additional user stats
    const userId = (submission.user as { id: string })?.id;
    if (userId) {
      // Get learner profile
      const { data: learnerProfile } = await supabase
        .from('learner_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get completed AKUs count
      const { count: akusCompleted } = await supabase
        .from('aku_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'verified');

      // Get certificates count
      const { count: certificatesCount } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      return NextResponse.json({
        submission,
        userStats: {
          learnerProfile,
          akusCompleted: akusCompleted || 0,
          certificatesCount: certificatesCount || 0,
        },
      });
    }

    return NextResponse.json({ submission, userStats: null });
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
    const supabase = await createServerSupabaseClient();

    // Check admin/teacher role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'instructor'].includes(userData.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    // Build update object
    const updateData: Record<string, unknown> = {};

    // Allow updating status to under_review
    if (body.status === 'under_review') {
      updateData.status = 'under_review';
      updateData.reviewed_by = user.id;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    const { data: submission, error } = await supabase
      .from('certification_submissions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ submission });
  } catch (error) {
    console.error('Admin submission PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    );
  }
}
