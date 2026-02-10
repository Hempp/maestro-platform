/**
 * AUTH CALLBACK ROUTE (Firebase)
 * Handles OAuth redirects - with Firebase, OAuth is typically
 * handled client-side via popup/redirect. This route is kept
 * for backwards compatibility and custom OAuth flows.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

// Session expiry: 5 days
const SESSION_EXPIRY_MS = 60 * 60 * 24 * 5 * 1000;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const idToken = searchParams.get('idToken');
  const next = searchParams.get('next') ?? '/dashboard';
  const error = searchParams.get('error');

  // Handle error from OAuth provider
  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`);
  }

  // If no token, redirect to login
  if (!idToken) {
    return NextResponse.redirect(`${origin}/login`);
  }

  try {
    const auth = getAdminAuth();
    const db = getAdminDb();

    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Check/create user profile
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      // First-time OAuth user - create profile
      await db.collection('users').doc(userId).set({
        email: decodedToken.email,
        fullName: decodedToken.name || null,
        avatarUrl: decodedToken.picture || null,
        tier: 'student',
        role: 'user',
        onboardingCompleted: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Create learner profile
      await db.collection('learnerProfiles').doc(userId).set({
        userId,
        tier: 'student',
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

    // Create session cookie
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRY_MS,
    });

    const cookieStore = await cookies();
    cookieStore.set('session', sessionCookie, {
      maxAge: SESSION_EXPIRY_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.redirect(`${origin}${next}`);
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }
}

/**
 * POST - Handle callback via POST (for custom implementations)
 */
export async function POST(request: NextRequest) {
  try {
    const { idToken, next = '/dashboard' } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token required' },
        { status: 400 }
      );
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Check/create user profile
    const userDoc = await db.collection('users').doc(userId).get();
    let isNewUser = false;

    if (!userDoc.exists) {
      isNewUser = true;
      await db.collection('users').doc(userId).set({
        email: decodedToken.email,
        fullName: decodedToken.name || null,
        avatarUrl: decodedToken.picture || null,
        tier: 'student',
        role: 'user',
        onboardingCompleted: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      await db.collection('learnerProfiles').doc(userId).set({
        userId,
        tier: 'student',
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

    // Create session cookie
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRY_MS,
    });

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
      redirectTo: isNewUser ? '/onboarding' : next,
      isNewUser,
    });
  } catch (error) {
    console.error('Callback POST error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}
