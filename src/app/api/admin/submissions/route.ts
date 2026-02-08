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

    // Build query for certification submissions
    let query = supabase
      .from('certification_submissions')
      .select('*', { count: 'exact' })
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

    // Fetch user data for all submissions
    const userIds = [...new Set((submissions || []).map(s => s.user_id).filter(Boolean))] as string[];
    const reviewerIds = [...new Set((submissions || []).map(s => s.reviewed_by).filter(Boolean))] as string[];
    const allUserIds = [...new Set([...userIds, ...reviewerIds])];

    let usersMap: Record<string, { id: string; email: string; full_name: string; avatar_url: string | null }> = {};
    if (allUserIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, email, full_name, avatar_url')
        .in('id', allUserIds);

      if (users) {
        usersMap = Object.fromEntries(users.map(u => [u.id, u]));
      }
    }

    // Merge user data into submissions
    const submissionsWithUsers = (submissions || []).map(sub => ({
      ...sub,
      user: sub.user_id ? usersMap[sub.user_id] || null : null,
      reviewer: sub.reviewed_by ? usersMap[sub.reviewed_by] || null : null,
    }));

    // If search filter, filter by user email/name
    let filteredSubmissions = submissionsWithUsers;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredSubmissions = filteredSubmissions.filter((sub) => {
        return (
          sub.user?.email?.toLowerCase().includes(searchLower) ||
          sub.user?.full_name?.toLowerCase().includes(searchLower) ||
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
