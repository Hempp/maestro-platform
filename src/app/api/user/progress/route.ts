/**
 * USER PROGRESS API (Firebase)
 * Track learning progress through AKUs
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

// GET: Fetch user's progress
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

    // Fetch all progress records
    const progressSnapshot = await db
      .collection('akuProgress')
      .where('userId', '==', userId)
      .orderBy('updatedAt', 'desc')
      .get();

    interface ProgressDoc {
      id: string;
      status: string;
      timeSpent?: number;
      hintsUsed?: number;
      struggleScore?: number;
      [key: string]: unknown;
    }

    const progress: ProgressDoc[] = progressSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as ProgressDoc));

    // Fetch learner profile for overall stats
    const learnerDoc = await db.collection('learnerProfiles').doc(userId).get();
    const learnerProfile = learnerDoc.exists ? learnerDoc.data() : null;

    // Calculate stats
    const completed = progress.filter(
      p => p.status === 'completed' || p.status === 'verified'
    );
    const inProgress = progress.filter(p => p.status === 'in_progress');
    const totalTimeSpent = progress.reduce(
      (sum, p) => sum + (p.timeSpent || 0),
      0
    );
    const totalHintsUsed = progress.reduce(
      (sum, p) => sum + (p.hintsUsed || 0),
      0
    );
    const averageStruggleScore =
      completed.length > 0
        ? completed.reduce((sum, p) => sum + (p.struggleScore || 50), 0) /
          completed.length
        : 50;

    return NextResponse.json({
      progress,
      stats: {
        completed: completed.length,
        inProgress: inProgress.length,
        totalTimeSpent,
        totalHintsUsed,
        averageStruggleScore: Math.round(averageStruggleScore),
        currentStreak: learnerProfile?.currentStreak || 0,
        longestStreak: learnerProfile?.longestStreak || 0,
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

    const body = await request.json();
    const { akuId, status, hintsUsed, timeSpent, struggleScore, workflowSnapshot } =
      body;

    if (!akuId) {
      return NextResponse.json(
        { error: 'AKU ID is required' },
        { status: 400 }
      );
    }

    // Build update data (camelCase for Firestore)
    const updateData: Record<string, unknown> = {
      userId,
      akuId,
      updatedAt: Timestamp.now(),
    };

    if (status) updateData.status = status;
    if (hintsUsed !== undefined) updateData.hintsUsed = hintsUsed;
    if (timeSpent !== undefined) updateData.timeSpent = timeSpent;
    if (struggleScore !== undefined) updateData.struggleScore = struggleScore;
    if (workflowSnapshot) updateData.workflowSnapshot = workflowSnapshot;

    if (status === 'completed') {
      updateData.completedAt = Timestamp.now();
    }
    if (status === 'verified') {
      updateData.verifiedAt = Timestamp.now();
    }

    // Find existing progress doc or create new one
    const existingQuery = await db
      .collection('akuProgress')
      .where('userId', '==', userId)
      .where('akuId', '==', akuId)
      .limit(1)
      .get();

    let progressDoc;
    if (!existingQuery.empty) {
      // Update existing
      const docRef = existingQuery.docs[0].ref;
      await docRef.update(updateData);
      const updated = await docRef.get();
      progressDoc = { id: updated.id, ...updated.data() };
    } else {
      // Create new
      const newDoc = await db.collection('akuProgress').add({
        ...updateData,
        attempts: 1,
        createdAt: Timestamp.now(),
      });
      const created = await newDoc.get();
      progressDoc = { id: created.id, ...created.data() };
    }

    // Update streak in learner profile
    await updateStreak(db, userId);

    return NextResponse.json({
      message: 'Progress updated',
      progress: progressDoc,
    });
  } catch (error) {
    console.error('Progress update API error:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}

/**
 * Update user's learning streak
 * Replaces the Supabase RPC function
 */
async function updateStreak(
  db: FirebaseFirestore.Firestore,
  userId: string
): Promise<void> {
  const learnerRef = db.collection('learnerProfiles').doc(userId);
  const learnerDoc = await learnerRef.get();

  if (!learnerDoc.exists) {
    return;
  }

  const learnerData = learnerDoc.data()!;
  const lastActivity = learnerData.lastActivityAt?.toDate() || null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let currentStreak = learnerData.currentStreak || 0;
  let longestStreak = learnerData.longestStreak || 0;

  if (lastActivity) {
    const lastActivityDate = new Date(
      lastActivity.getFullYear(),
      lastActivity.getMonth(),
      lastActivity.getDate()
    );
    const daysDiff = Math.floor(
      (today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 0) {
      // Same day, no change to streak
    } else if (daysDiff === 1) {
      // Consecutive day, increment streak
      currentStreak++;
    } else {
      // Streak broken, reset to 1
      currentStreak = 1;
    }
  } else {
    // First activity
    currentStreak = 1;
  }

  // Update longest streak if current is higher
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  await learnerRef.update({
    currentStreak,
    longestStreak,
    lastActivityAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}
