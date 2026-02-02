/**
 * USER PROGRESS API
 * Track learning progress through AKUs
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { Tables } from '@/lib/supabase/types';

// GET: Fetch user's progress
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch all progress records
    const { data: progressData, error } = await supabase
      .from('aku_progress')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Progress fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch progress' },
        { status: 500 }
      );
    }

    const progress = (progressData || []) as Tables<'aku_progress'>[];

    // Fetch learner profile for overall stats
    const { data: learnerProfileData } = await supabase
      .from('learner_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const learnerProfile = learnerProfileData as Tables<'learner_profiles'> | null;

    // Calculate stats
    const completed = progress.filter(p => p.status === 'completed' || p.status === 'verified');
    const inProgress = progress.filter(p => p.status === 'in_progress');
    const totalTimeSpent = progress.reduce((sum, p) => sum + (p.time_spent || 0), 0);
    const totalHintsUsed = progress.reduce((sum, p) => sum + (p.hints_used || 0), 0);
    const averageStruggleScore = completed.length > 0
      ? completed.reduce((sum, p) => sum + (p.struggle_score || 50), 0) / completed.length
      : 50;

    return NextResponse.json({
      progress,
      stats: {
        completed: completed.length,
        inProgress: inProgress.length,
        totalTimeSpent,
        totalHintsUsed,
        averageStruggleScore: Math.round(averageStruggleScore),
        currentStreak: learnerProfile?.current_streak || 0,
        longestStreak: learnerProfile?.longest_streak || 0,
      },
    });
  } catch (error) {
    console.error('Progress API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}

// POST: Update or create progress for an AKU
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      akuId,
      status,
      hintsUsed,
      timeSpent,
      struggleScore,
      workflowSnapshot,
    } = body;

    if (!akuId) {
      return NextResponse.json(
        { error: 'AKU ID is required' },
        { status: 400 }
      );
    }

    // Upsert progress record
    const updateData: Record<string, unknown> = {
      user_id: user.id,
      aku_id: akuId,
      updated_at: new Date().toISOString(),
    };

    if (status) updateData.status = status;
    if (hintsUsed !== undefined) updateData.hints_used = hintsUsed;
    if (timeSpent !== undefined) updateData.time_spent = timeSpent;
    if (struggleScore !== undefined) updateData.struggle_score = struggleScore;
    if (workflowSnapshot) updateData.workflow_snapshot = workflowSnapshot;

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }
    if (status === 'verified') {
      updateData.verified_at = new Date().toISOString();
    }

    const { data: progressResult, error } = await supabase
      .from('aku_progress')
      .upsert(updateData as never, {
        onConflict: 'user_id,aku_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Progress update error:', error);
      return NextResponse.json(
        { error: 'Failed to update progress' },
        { status: 500 }
      );
    }

    // Update streak
    await (supabase.rpc as CallableFunction)('update_streak', { p_user_id: user.id });

    return NextResponse.json({
      message: 'Progress updated',
      progress: progressResult,
    });
  } catch (error) {
    console.error('Progress update API error:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}
