/**
 * SIGNUP API ROUTE (Firebase)
 * Creates new user accounts with Firebase Admin SDK
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { sendWelcomeEmail } from '@/lib/email/resend';
import { rateLimit, RATE_LIMITS } from '@/lib/security';
import { Timestamp } from 'firebase-admin/firestore';

// Session expiry: 5 days
const SESSION_EXPIRY_MS = 60 * 60 * 24 * 5 * 1000;

export async function POST(request: NextRequest) {
  // Strict rate limit on auth endpoints
  const rateLimitResponse = rateLimit(request, RATE_LIMITS.auth);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { email, password, fullName, tier, idToken } = await request.json();

    // If idToken is provided, this is a client-side signup completing
    if (idToken) {
      return handleClientSignup(idToken, fullName, tier);
    }

    // Server-side signup (for API clients)
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: fullName || undefined,
    });

    // Create user profile in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email,
      fullName: fullName || null,
      avatarUrl: null,
      tier: tier || 'student',
      role: 'user',
      onboardingCompleted: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Create learner profile
    await db.collection('learnerProfiles').doc(userRecord.uid).set({
      userId: userRecord.uid,
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

    // Create a custom token for the new user
    const customToken = await auth.createCustomToken(userRecord.uid);

    // Send welcome email (async, don't block response)
    if (email) {
      sendWelcomeEmail(email, fullName).catch((err) => {
        console.error('Failed to send welcome email:', err);
      });
    }

    return NextResponse.json({
      message: 'Account created successfully',
      user: {
        id: userRecord.uid,
        email: userRecord.email,
        fullName,
        tier: tier || 'student',
      },
      customToken, // Client uses this to sign in
    });
  } catch (error) {
    console.error('Signup error:', error);

    if (error instanceof Error) {
      if (error.message.includes('email-already-exists')) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 400 }
        );
      }
      if (error.message.includes('weak-password')) {
        return NextResponse.json(
          { error: 'Password is too weak. Use at least 6 characters.' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}

/**
 * Handle signup completion from client-side Firebase Auth
 */
async function handleClientSignup(idToken: string, fullName?: string, tier?: string) {
  try {
    const auth = getAdminAuth();
    const db = getAdminDb();

    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Check if user already has a profile
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      // Create user profile
      await db.collection('users').doc(userId).set({
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

      // Send welcome email
      if (decodedToken.email) {
        sendWelcomeEmail(decodedToken.email, fullName).catch((err) => {
          console.error('Failed to send welcome email:', err);
        });
      }
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
      message: 'Account created successfully',
      user: {
        id: userId,
        email: decodedToken.email,
        fullName: fullName || decodedToken.name,
        tier: tier || 'student',
      },
    });
  } catch (error) {
    console.error('Client signup error:', error);
    return NextResponse.json(
      { error: 'Failed to complete signup' },
      { status: 500 }
    );
  }
}
