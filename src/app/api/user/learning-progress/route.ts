/**
 * LEARNING PROGRESS API (Firebase)
 * Fetch user's milestone progress for the learning path dashboard integration
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { getMilestones } from '@/lib/curriculum/milestones';
import type { TierType } from '@/types/firestore.types';

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
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    // Verify session and get user
    const decodedClaims = await auth.verifySessionCookie(session, true);
    const userId = decodedClaims.uid;

    // Fetch user's milestone progress for all paths
    const milestoneSnapshot = await db
      .collection('userMilestones')
      .where('userId', '==', userId)
      .orderBy('path')
      .orderBy('milestoneNumber')
      .get();

    interface MilestoneDoc {
      id: string;
      path: string;
      milestoneNumber: number;
      status: string;
      submittedAt?: { toDate?: () => Date };
      approvedAt?: { toDate?: () => Date };
    }

    const milestoneData: MilestoneDoc[] = milestoneSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as MilestoneDoc));

    // Fetch tutor conversation for current milestone
    const conversationSnapshot = await db
      .collection('tutorConversations')
      .where('userId', '==', userId)
      .get();

    const conversationData = conversationSnapshot.docs.map(doc => doc.data());

    // Group milestones by path
    const pathGroups: Record<string, MilestoneDoc[]> = {};
    const conversations: Record<string, number> = {};

    for (const milestone of milestoneData) {
      const path = milestone.path;
      if (!pathGroups[path]) {
        pathGroups[path] = [];
      }
      pathGroups[path].push(milestone);
    }

    for (const conv of conversationData) {
      conversations[conv.path as string] = conv.currentMilestone ?? 1;
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
      const curriculumMilestones = getMilestones(pathKey as TierType);

      if (pathMilestones.length > 0) {
        const completedCount = pathMilestones.filter(
          m => m.status === 'approved'
        ).length;

        const activeMilestone = pathMilestones.find(
          m =>
            m.status === 'active' ||
            m.status === 'submitted' ||
            m.status === 'needs_revision'
        );
        const currentMilestoneNum =
          activeMilestone?.milestoneNumber ||
          conversations[pathKey] ||
          Math.min(completedCount + 1, 10);

        const currentMilestoneData = curriculumMilestones.find(
          m => m.number === currentMilestoneNum
        );

        const milestones: MilestoneProgress[] = curriculumMilestones.map(cm => {
          const userMilestone = pathMilestones.find(
            m => m.milestoneNumber === cm.number
          );
          return {
            number: cm.number,
            title: cm.title,
            goal: cm.goal,
            status: (userMilestone?.status ||
              'locked') as MilestoneProgress['status'],
            submittedAt: userMilestone?.submittedAt?.toDate?.()?.toISOString() ?? undefined,
            approvedAt: userMilestone?.approvedAt?.toDate?.()?.toISOString() ?? undefined,
          };
        });

        allPaths[pathKey] = {
          path: pathKey,
          pathTitle: pathTitles[pathKey],
          currentMilestone: currentMilestoneNum as number,
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
      const score =
        pathProgress.completedMilestones +
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
