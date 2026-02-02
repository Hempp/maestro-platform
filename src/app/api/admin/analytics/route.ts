/**
 * ADMIN ANALYTICS API
 * Platform-wide analytics and insights
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
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Users by tier
    const { data: tierCounts } = await supabase
      .from('users')
      .select('tier')
      .not('tier', 'is', null) as { data: Array<{ tier: string }> | null };

    const usersByTier = {
      student: tierCounts?.filter(u => u.tier === 'student').length || 0,
      employee: tierCounts?.filter(u => u.tier === 'employee').length || 0,
      owner: tierCounts?.filter(u => u.tier === 'owner').length || 0,
    };

    // Active users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: activeUsers } = await supabase
      .from('learner_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_activity_at', sevenDaysAgo.toISOString());

    // Total certificates issued
    const { count: totalCertificates } = await supabase
      .from('certificates')
      .select('*', { count: 'exact', head: true });

    // Certificates by type
    const { data: certCounts } = await supabase
      .from('certificates')
      .select('certificate_type') as { data: Array<{ certificate_type: string }> | null };

    const certificatesByType = {
      student: certCounts?.filter(c => c.certificate_type === 'student').length || 0,
      employee: certCounts?.filter(c => c.certificate_type === 'employee').length || 0,
      owner: certCounts?.filter(c => c.certificate_type === 'owner').length || 0,
    };

    // Total AKUs completed
    const { count: totalAkusCompleted } = await supabase
      .from('aku_progress')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'verified');

    // Average struggle score
    const { data: struggleScores } = await supabase
      .from('learner_profiles')
      .select('struggle_score')
      .not('struggle_score', 'is', null);

    const avgStruggleScore = struggleScores?.length
      ? Math.round(struggleScores.reduce((sum, p) => sum + (p.struggle_score || 0), 0) / struggleScores.length)
      : 0;

    // Total learning time (in hours)
    const { data: learningTimes } = await supabase
      .from('learner_profiles')
      .select('total_learning_time');

    const totalLearningHours = Math.round(
      (learningTimes?.reduce((sum, p) => sum + (p.total_learning_time || 0), 0) || 0) / 60
    );

    // Live courses stats - using type assertion for new tables
    const { count: totalCourses } = await (supabase as any)
      .from('live_courses')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: totalSessions } = await (supabase as any)
      .from('live_sessions')
      .select('*', { count: 'exact', head: true });

    const { count: upcomingSessions } = await (supabase as any)
      .from('live_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'scheduled')
      .gte('scheduled_at', new Date().toISOString());

    // New users in period
    const { count: newUsersInPeriod } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString());

    // Daily signups for chart
    const { data: dailySignups } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    // Group by day
    const signupsByDay: Record<string, number> = {};
    dailySignups?.forEach(u => {
      if (u.created_at) {
        const day = u.created_at.split('T')[0];
        signupsByDay[day] = (signupsByDay[day] || 0) + 1;
      }
    });

    // Top performers (highest streak)
    const { data: topPerformers } = await supabase
      .from('learner_profiles')
      .select(`
        current_streak,
        total_learning_time,
        user:users!user_id (
          id,
          full_name,
          email,
          avatar_url,
          tier
        )
      `)
      .order('current_streak', { ascending: false })
      .limit(5);

    // Struggling students (high struggle score)
    const { data: strugglingStudents } = await supabase
      .from('learner_profiles')
      .select(`
        struggle_score,
        last_activity_at,
        user:users!user_id (
          id,
          full_name,
          email,
          avatar_url,
          tier
        )
      `)
      .gte('struggle_score', 70)
      .order('struggle_score', { ascending: false })
      .limit(5);

    return NextResponse.json({
      overview: {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        newUsersInPeriod: newUsersInPeriod || 0,
        totalCertificates: totalCertificates || 0,
        totalAkusCompleted: totalAkusCompleted || 0,
        totalLearningHours,
        avgStruggleScore,
      },
      courses: {
        totalCourses: totalCourses || 0,
        totalSessions: totalSessions || 0,
        upcomingSessions: upcomingSessions || 0,
      },
      breakdown: {
        usersByTier,
        certificatesByType,
      },
      trends: {
        signupsByDay,
      },
      insights: {
        topPerformers: topPerformers || [],
        strugglingStudents: strugglingStudents || [],
      },
    });
  } catch (error) {
    console.error('Admin analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
