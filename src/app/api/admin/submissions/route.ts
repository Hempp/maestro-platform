/**
 * ADMIN SUBMISSIONS API
 * GET /api/admin/submissions - List all certification submissions
 * Supports filtering by path, status, and search
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const pathFilter = searchParams.get('path') || '';
    const statusFilter = searchParams.get('status') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query for certification submissions with user info
    let query = supabase
      .from('certification_submissions')
      .select(`
        *,
        user:users!certification_submissions_user_id_fkey (
          id,
          email,
          full_name,
          avatar_url
        ),
        reviewer:users!certification_submissions_reviewed_by_fkey (
          id,
          email,
          full_name
        )
      `, { count: 'exact' })
      .order('submitted_at', { ascending: false });

    // Apply filters
    if (pathFilter && ['student', 'employee', 'owner'].includes(pathFilter)) {
      query = query.eq('path', pathFilter as 'student' | 'employee' | 'owner');
    }

    if (statusFilter && ['submitted', 'under_review', 'passed', 'failed'].includes(statusFilter)) {
      query = query.eq('status', statusFilter as 'submitted' | 'under_review' | 'passed' | 'failed');
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: submissions, error, count } = await query;

    if (error) {
      console.error('Submissions query error:', error);
      throw error;
    }

    // If search filter, we need to filter by user email/name
    let filteredSubmissions = submissions || [];
    if (search) {
      const searchLower = search.toLowerCase();
      filteredSubmissions = filteredSubmissions.filter((sub) => {
        const user = sub.user as { email?: string; full_name?: string } | null;
        return (
          user?.email?.toLowerCase().includes(searchLower) ||
          user?.full_name?.toLowerCase().includes(searchLower) ||
          sub.project_title?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Get summary stats
    const { data: stats } = await supabase
      .from('certification_submissions')
      .select('status, path')
      .then(({ data }) => {
        const statusCounts = {
          submitted: 0,
          under_review: 0,
          passed: 0,
          failed: 0,
        };
        const pathCounts = {
          student: 0,
          employee: 0,
          owner: 0,
        };

        (data || []).forEach((sub) => {
          if (sub.status && sub.status in statusCounts) {
            statusCounts[sub.status as keyof typeof statusCounts]++;
          }
          if (sub.path && sub.path in pathCounts) {
            pathCounts[sub.path as keyof typeof pathCounts]++;
          }
        });

        return { data: { statusCounts, pathCounts } };
      });

    return NextResponse.json({
      submissions: filteredSubmissions,
      total: count,
      limit,
      offset,
      stats: stats || { statusCounts: {}, pathCounts: {} },
    });
  } catch (error) {
    console.error('Admin submissions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
