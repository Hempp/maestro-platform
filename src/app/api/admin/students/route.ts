/**
 * ADMIN STUDENTS API
 * Get detailed student information with progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Valid tier values
type TierType = 'student' | 'employee' | 'owner';

// Type for student data returned from Supabase query
// Note: With !inner join, learner_profiles can be either array or single object
interface StudentQueryResult {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
  learner_profiles: {
    id: string;
    tier: TierType;
    current_path: string | null;
    total_learning_time: number | null;
    current_streak: number | null;
    longest_streak: number | null;
    struggle_score: number | null;
    last_activity_at: string | null;
  } | Array<{
    id: string;
    tier: TierType;
    current_path: string | null;
    total_learning_time: number | null;
    current_streak: number | null;
    longest_streak: number | null;
    struggle_score: number | null;
    last_activity_at: string | null;
  }>;
}

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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get students (role = learner or null)
    // Note: tier is stored in learner_profiles, not users table
    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        avatar_url,
        created_at,
        learner_profiles!inner (
          id,
          tier,
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
    if (tierFilter && ['student', 'employee', 'owner'].includes(tierFilter)) {
      // Filter by tier in learner_profiles table
      query = query.eq('learner_profiles.tier', tierFilter as TierType);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: students, error, count } = await query;

    if (error) throw error;

    // Get progress stats for each student
    const studentsWithProgress = await Promise.all(
      ((students || []) as StudentQueryResult[]).map(async (student) => {
        // Get AKU progress count (aku_progress uses user_id, not learner_id)
        const { count: akusCompleted } = await supabase
          .from('aku_progress')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', student.id)
          .eq('status', 'verified');

        // Get certificates count
        const { count: certificatesCount } = await supabase
          .from('certificates')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', student.id);

        // Extract tier from learner_profiles for easier frontend consumption
        // Handle both array and single object formats from Supabase
        const profiles = student.learner_profiles;
        const profile = Array.isArray(profiles) ? profiles[0] : profiles;
        return {
          ...student,
          // Normalize learner_profiles to always be an array for frontend
          learner_profiles: Array.isArray(profiles) ? profiles : [profiles],
          tier: profile?.tier || null,
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
