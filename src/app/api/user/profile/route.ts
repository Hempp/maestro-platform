/**
 * USER PROFILE API (Firebase)
 * Manage user profile and learner data
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

// GET: Fetch user profile
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

    // Fetch user profile
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const profile = { id: userDoc.id, ...userDoc.data() };

    // Fetch learner profile
    const learnerDoc = await db.collection('learnerProfiles').doc(userId).get();
    const learnerProfile = learnerDoc.exists ? learnerDoc.data() : null;

    // Fetch progress stats
    const progressSnapshot = await db
      .collection('akuProgress')
      .where('userId', '==', userId)
      .get();

    const progress = progressSnapshot.docs.map(doc => doc.data());
    const completedAkus = progress.filter(
      p => p.status === 'completed' || p.status === 'verified'
    ).length;
    const totalTimeSpent = progress.reduce(
      (sum, p) => sum + (p.timeSpent || 0),
      0
    );

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
    const { fullName, tier, walletAddress, onboardingCompleted } = body;

    // Build update data (camelCase for Firestore)
    const updateData: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    };

    if (fullName !== undefined) updateData.fullName = fullName;
    if (tier !== undefined) updateData.tier = tier;
    if (walletAddress !== undefined) updateData.walletAddress = walletAddress;
    if (onboardingCompleted !== undefined) updateData.onboardingCompleted = onboardingCompleted;

    // Update user profile
    await db.collection('users').doc(userId).update(updateData);

    // Fetch updated profile
    const userDoc = await db.collection('users').doc(userId).get();
    const updatedProfile = { id: userDoc.id, ...userDoc.data() };

    // Create or update learner profile if tier is set
    if (tier) {
      const learnerRef = db.collection('learnerProfiles').doc(userId);
      const learnerDoc = await learnerRef.get();

      if (learnerDoc.exists) {
        await learnerRef.update({
          tier,
          updatedAt: Timestamp.now(),
        });
      } else {
        await learnerRef.set({
          userId,
          tier,
          currentPath: 'foundation',
          interactionDna: {},
          struggleScore: 50,
          totalLearningTime: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastActivityAt: null,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
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
