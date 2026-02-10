/**
 * FIREBASE SESSION MANAGEMENT API
 * Creates and manages session cookies for Firebase Auth
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

// Session cookie expiration (5 days)
const SESSION_EXPIRY_MS = 60 * 60 * 24 * 5 * 1000;

/**
 * POST - Create session cookie from ID token
 */
export async function POST(request: NextRequest) {
  try {
    const { idToken, fullName, tier } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'ID token required' }, { status: 400 });
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Create session cookie
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRY_MS,
    });

    // Check if user profile exists, create if not
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // Create new user profile
      await userRef.set({
        email: decodedToken.email,
        fullName: fullName || decodedToken.name || null,
        avatarUrl: decodedToken.picture || null,
        tier: tier || 'student',
        role: 'user',
        onboardingCompleted: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Create learner profile
      await db.collection('learnerProfiles').doc(userId).set({
        userId,
        tier: tier || 'student',
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

    // Set the session cookie
    const cookieStore = await cookies();
    cookieStore.set('session', sessionCookie, {
      maxAge: SESSION_EXPIRY_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({
      success: true,
      userId,
      isNewUser: !userDoc.exists,
    });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 401 }
    );
  }
}

/**
 * GET - Verify current session
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const auth = getAdminAuth();
    const decodedClaims = await auth.verifySessionCookie(session, true);

    // Get user data
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(decodedClaims.uid).get();

    return NextResponse.json({
      authenticated: true,
      userId: decodedClaims.uid,
      email: decodedClaims.email,
      user: userDoc.exists ? userDoc.data() : null,
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

/**
 * DELETE - Sign out and clear session
 */
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (session) {
      // Revoke the session (optional - invalidates all sessions for this user)
      const auth = getAdminAuth();
      try {
        const decodedClaims = await auth.verifySessionCookie(session);
        await auth.revokeRefreshTokens(decodedClaims.uid);
      } catch {
        // Session might already be invalid
      }
    }

    // Clear the cookie
    cookieStore.delete('session');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json({ error: 'Failed to sign out' }, { status: 500 });
  }
}
