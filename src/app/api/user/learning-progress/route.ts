/**
 * LEARNING PROGRESS API
 * Fetch user's milestone progress for the learning path dashboard integration
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getMilestones } from '@/lib/curriculum/milestones';

export interface MilestoneProgress {
  number: number;
  title: string;
  goal: string;
  status: 'locked' | 'active' | 'submitted' | 'approved' | 'needs_revision';
  submittedAt?: string;
  approvedAt?: string;
}

export interface LearningProgress {
  path: 'student' | 'employee' | 'owner' | null;
  pathTitle: string;
  currentMilestone: number;
  currentMilestoneTitle: string;
  completedMilestones: number;
  totalMilestones: number;
  progressPercent: number;
  milestones: MilestoneProgress[];
  isEligibleForCertification: boolean;
}

// GET: Fetch user's learning progress
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

    // Fetch user's milestone progress for all paths
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: milestoneData, error: milestoneError } = await (supabase as any)
      .from('user_milestones')
      .select('*')
      .eq('user_id', user.id)
      .order('path')
      .order('milestone_number');

    if (milestoneError) {
      console.error('Milestone fetch error:', milestoneError);
      // Return empty progress if table doesn't exist or other error
      return NextResponse.json({
        progress: null,
        allPaths: {}
      });
    }

    // Fetch tutor conversation for current milestone
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: conversationData } = await (supabase as any)
      .from('tutor_conversations')
      .select('path, current_milestone')
      .eq('user_id', user.id);

    // Group milestones by path
    const pathGroups: Record<string, typeof milestoneData> = {};
    const conversations: Record<string, number> = {};

    if (milestoneData) {
      for (const milestone of milestoneData) {
        if (!pathGroups[milestone.path]) {
          pathGroups[milestone.path] = [];
        }
        pathGroups[milestone.path].push(milestone);
      }
    }

    if (conversationData) {
      for (const conv of conversationData) {
        conversations[conv.path] = conv.current_milestone;
      }
    }

    // Build progress for each path
    const pathTitles: Record<string, string> = {
      student: 'The Student',
      employee: 'The Employee',
      owner: 'The Owner',
    };

    const allPaths: Record<string, LearningProgress> = {};

    for (const pathKey of ['student', 'employee', 'owner'] as const) {
      const pathMilestones = pathGroups[pathKey] || [];
      const curriculumMilestones = getMilestones(pathKey);

      if (pathMilestones.length > 0) {
        const completedCount = pathMilestones.filter(
          (m: { status: string }) => m.status === 'approved'
        ).length;

        const activeMilestone = pathMilestones.find(
          (m: { status: string; milestone_number: number }) => m.status === 'active' || m.status === 'submitted' || m.status === 'needs_revision'
        );
        const currentMilestoneNum = activeMilestone?.milestone_number ||
          conversations[pathKey] ||
          Math.min(completedCount + 1, 10);

        const currentMilestoneData = curriculumMilestones.find(
          m => m.number === currentMilestoneNum
        );

        const milestones: MilestoneProgress[] = curriculumMilestones.map(cm => {
          const userMilestone = pathMilestones.find((m: { milestone_number: number; status: string; submitted_at?: string; approved_at?: string }) => m.milestone_number === cm.number);
          return {
            number: cm.number,
            title: cm.title,
            goal: cm.goal,
            status: userMilestone?.status || 'locked',
            submittedAt: userMilestone?.submitted_at,
            approvedAt: userMilestone?.approved_at,
          };
        });

        allPaths[pathKey] = {
          path: pathKey,
          pathTitle: pathTitles[pathKey],
          currentMilestone: currentMilestoneNum,
          currentMilestoneTitle: currentMilestoneData?.title || 'Unknown',
          completedMilestones: completedCount,
          totalMilestones: 10,
          progressPercent: Math.round((completedCount / 10) * 100),
          milestones,
          isEligibleForCertification: completedCount >= 9,
        };
      }
    }

    // Determine primary path (most recent or most progress)
    let primaryPath: LearningProgress | null = null;
    let maxProgress = -1;

    for (const pathKey of Object.keys(allPaths)) {
      const pathProgress = allPaths[pathKey];
      // Prefer active paths, then by progress
      const score = pathProgress.completedMilestones +
        (pathProgress.milestones.some(m => m.status === 'active') ? 100 : 0);
      if (score > maxProgress) {
        maxProgress = score;
        primaryPath = pathProgress;
      }
    }

    return NextResponse.json({
      progress: primaryPath,
      allPaths,
    });
  } catch (error) {
    console.error('Learning progress API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning progress' },
      { status: 500 }
    );
  }
}
