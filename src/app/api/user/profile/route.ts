/**
 * USER PROFILE API
 * Manage user profile and learner data
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { Tables } from '@/lib/supabase/types';

// GET: Fetch user profile
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

    // Fetch user profile with learner data
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    // Fetch learner profile
    const { data: learnerProfile } = await supabase
      .from('learner_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Fetch progress stats
    const { data: progressData } = await supabase
      .from('aku_progress')
      .select('*')
      .eq('user_id', user.id);

    const progress = (progressData || []) as Tables<'aku_progress'>[];
    const completedAkus = progress.filter(p => p.status === 'completed' || p.status === 'verified').length;
    const totalTimeSpent = progress.reduce((sum, p) => sum + (p.time_spent || 0), 0);

    return NextResponse.json({
      user: profile,
      learner: learnerProfile,
      stats: {
        completedAkus,
        totalTimeSpent,
        totalAkus: progress.length,
      },
    });
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PATCH: Update user profile
export async function PATCH(request: NextRequest) {
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
    const { fullName, tier, walletAddress, onboardingCompleted } = body;

    // Update user profile
    const updateData = {
      full_name: fullName as string | null,
      tier: tier as 'student' | 'employee' | 'owner' | null,
      wallet_address: walletAddress as string | null,
      onboarding_completed: onboardingCompleted as boolean,
      updated_at: new Date().toISOString(),
    };
    const { data: updatedProfile, error } = await supabase
      .from('users')
      .update(updateData as never)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // Create or update learner profile if tier is set
    if (tier) {
      const learnerData = {
        user_id: user.id,
        tier: tier as 'student' | 'employee' | 'owner',
        updated_at: new Date().toISOString(),
      };
      const { error: learnerError } = await supabase
        .from('learner_profiles')
        .upsert(learnerData as never, {
          onConflict: 'user_id',
        });

      if (learnerError) {
        console.error('Learner profile error:', learnerError);
      }
    }

    return NextResponse.json({
      message: 'Profile updated',
      user: updatedProfile,
    });
  } catch (error) {
    console.error('Profile update API error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
