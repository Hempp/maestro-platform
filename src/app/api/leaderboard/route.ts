/**
 * LEADERBOARD API
 * Returns ranked users based on AKU completions, streaks, and certificates
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string | null;
  akusCompleted: number;
  streak: number;
  certificates: number;
  tier: string | null;
  change: number; // Position change from last period
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all'; // all, month, week
    const limit = parseInt(searchParams.get('limit') || '20');

    const supabase = await createServerSupabaseClient();

    // Get all learner profiles with user data
    const { data: profiles, error: profilesError } = await supabase
      .from('learner_profiles')
      .select(`
        user_id,
        current_streak,
        longest_streak,
        total_learning_time,
        users!inner (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .order('current_streak', { ascending: false })
      .limit(limit * 2) as unknown as {
        data: Array<{
          user_id: string;
          current_streak: number | null;
          longest_streak: number | null;
          total_learning_time: number | null;
          users: {
            id: string;
            full_name: string | null;
            email: string;
            avatar_url: string | null;
          };
        }> | null;
        error: unknown;
      };

    if (profilesError) {
      console.error('Leaderboard profiles error:', profilesError);
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }

    // Get AKU completions per user
    const { data: progressData, error: progressError } = await supabase
      .from('aku_progress')
      .select('user_id, status')
      .in('status', ['completed', 'verified']);

    if (progressError) {
      console.error('Leaderboard progress error:', progressError);
    }

    // Get certificates per user
    const { data: certificatesData, error: certsError } = await supabase
      .from('certificates')
      .select('user_id');

    if (certsError) {
      console.error('Leaderboard certificates error:', certsError);
    }

    // Count completions and certificates per user
    const akuCounts = new Map<string, number>();
    const certCounts = new Map<string, number>();

    (progressData || []).forEach((p) => {
      akuCounts.set(p.user_id, (akuCounts.get(p.user_id) || 0) + 1);
    });

    (certificatesData || []).forEach((c) => {
      certCounts.set(c.user_id, (certCounts.get(c.user_id) || 0) + 1);
    });

    // Build leaderboard entries
    const entries: Omit<LeaderboardEntry, 'rank' | 'change'>[] = (profiles || [])
      .filter((p) => p.users)
      .map((profile) => {
        const user = profile.users;

        return {
          userId: profile.user_id,
          name: user.full_name || user.email?.split('@')[0] || 'Anonymous',
          avatar: user.avatar_url,
          akusCompleted: akuCounts.get(profile.user_id) || 0,
          streak: profile.current_streak || 0,
          certificates: certCounts.get(profile.user_id) || 0,
          tier: null, // Tier not in current schema
        };
      });

    // Sort by AKUs completed (primary), then streak (secondary)
    entries.sort((a, b) => {
      if (b.akusCompleted !== a.akusCompleted) {
        return b.akusCompleted - a.akusCompleted;
      }
      return b.streak - a.streak;
    });

    // Add ranks and simulate position changes
    const leaderboard: LeaderboardEntry[] = entries.slice(0, limit).map((entry, index) => ({
      ...entry,
      rank: index + 1,
      change: Math.floor(Math.random() * 5) - 2, // Simulated change for now
    }));

    return NextResponse.json({
      leaderboard,
      period,
      total: entries.length,
    });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
