/**
 * MILESTONE APPROVAL API (Firebase)
 * Called by the tutor when a milestone is completed
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    // Verify session and get user
    const decodedClaims = await auth.verifySessionCookie(session, true);
    const userId = decodedClaims.uid;

    const body = await request.json();
    const { path, milestoneNumber, feedback } = body as {
      path: 'owner' | 'employee' | 'student';
      milestoneNumber: number;
      feedback?: string;
    };

    if (!path || !milestoneNumber) {
      return NextResponse.json({ error: 'Path and milestone number are required' }, { status: 400 });
    }

    // Find and approve current milestone
    const currentMilestoneQuery = await db
      .collection('userMilestones')
      .where('userId', '==', userId)
      .where('path', '==', path)
      .where('milestoneNumber', '==', milestoneNumber)
      .limit(1)
      .get();

    if (currentMilestoneQuery.empty) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    await currentMilestoneQuery.docs[0].ref.update({
      status: 'approved',
      feedback: feedback || null,
      approvedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Unlock next milestone (if exists and is currently locked)
    const nextMilestoneQuery = await db
      .collection('userMilestones')
      .where('userId', '==', userId)
      .where('path', '==', path)
      .where('milestoneNumber', '==', milestoneNumber + 1)
      .where('status', '==', 'locked')
      .limit(1)
      .get();

    if (!nextMilestoneQuery.empty) {
      await nextMilestoneQuery.docs[0].ref.update({
        status: 'active',
        updatedAt: Timestamp.now(),
      });
    }

    // Update conversation's current milestone
    const conversationQuery = await db
      .collection('tutorConversations')
      .where('userId', '==', userId)
      .where('path', '==', path)
      .limit(1)
      .get();

    if (!conversationQuery.empty) {
      await conversationQuery.docs[0].ref.update({
        currentMilestone: Math.min(milestoneNumber + 1, 10),
        updatedAt: Timestamp.now(),
      });
    }

    // Get updated progress
    const milestonesQuery = await db
      .collection('userMilestones')
      .where('userId', '==', userId)
      .where('path', '==', path)
      .get();

    const approvedCount = milestonesQuery.docs.filter(
      doc => doc.data().status === 'approved'
    ).length;

    const progress = {
      total_milestones: 10,
      approved_milestones: approvedCount,
      completion_percentage: (approvedCount / 10) * 100,
    };

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error('Milestone approval error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
