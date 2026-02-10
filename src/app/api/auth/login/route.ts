/**
 * LOGIN API ROUTE (Firebase)
 * Verifies ID token and creates session cookie
 *
 * Note: With Firebase, actual sign-in happens client-side.
 * This route receives the ID token and creates a server session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { rateLimit, RATE_LIMITS } from '@/lib/security';
import { Timestamp } from 'firebase-admin/firestore';

// Session expiry: 5 days
const SESSION_EXPIRY_MS = 60 * 60 * 24 * 5 * 1000;

export async function POST(request: NextRequest) {
  // Strict rate limit on auth endpoints to prevent brute force
  const rateLimitResponse = rateLimit(request, RATE_LIMITS.auth);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
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

    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    let userData = userDoc.exists ? userDoc.data() : null;

    // If user doesn't exist in Firestore, create profile
    if (!userData) {
      userData = {
        email: decodedToken.email,
        fullName: decodedToken.name || null,
        avatarUrl: decodedToken.picture || null,
        tier: 'student',
        role: 'user',
        onboardingCompleted: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      await db.collection('users').doc(userId).set(userData);

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
    } else {
      // Update last login
      await db.collection('users').doc(userId).update({
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
      message: 'Login successful',
      user: {
        id: userId,
        email: decodedToken.email,
        ...userData,
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    if (error instanceof Error && error.message.includes('expired')) {
      return NextResponse.json(
        { error: 'Token expired. Please sign in again.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 401 }
    );
  }
}
