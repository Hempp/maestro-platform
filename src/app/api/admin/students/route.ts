/**
 * ADMIN STUDENTS API
 * Get detailed student information with progress
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

    if (!userData || !['admin', 'teacher'].includes(userData.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const tierFilter = searchParams.get('tier') || '';
    const sortBy = searchParams.get('sortBy') || 'last_activity_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get students (role = learner or null)
    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        avatar_url,
        tier,
        created_at,
        learner_profiles!inner (
          id,
          current_path,
          total_learning_time,
          current_streak,
          longest_streak,
          struggle_score,
          last_activity_at
        )
      `, { count: 'exact' })
      .or('role.is.null,role.eq.learner');

    // Apply filters
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }
    if (tierFilter) {
      query = query.eq('tier', tierFilter);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: students, error, count } = await query;

    if (error) throw error;

    // Get progress stats for each student
    const studentsWithProgress = await Promise.all(
      (students || []).map(async (student: any) => {
        // Get AKU progress count
        const { count: akusCompleted } = await supabase
          .from('aku_progress')
          .select('*', { count: 'exact', head: true })
          .eq('learner_id', student.learner_profiles?.[0]?.id)
          .eq('status', 'verified');

        // Get certificates count
        const { count: certificatesCount } = await supabase
          .from('certificates')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', student.id);

        return {
          ...student,
          stats: {
            akusCompleted: akusCompleted || 0,
            certificatesCount: certificatesCount || 0,
          },
        };
      })
    );

    return NextResponse.json({
      students: studentsWithProgress,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Admin students API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}
