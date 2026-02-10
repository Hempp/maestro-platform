/**
 * FIREBASE ADMIN SDK
 * Server-side Firebase operations (API routes, webhooks)
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;

/**
 * Initialize Firebase Admin SDK (singleton)
 */
function initializeFirebaseAdmin(): App {
  if (!adminApp) {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      adminApp = existingApps[0];
    } else {
      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      });
    }
  }
  return adminApp;
}

/**
 * Get Firebase Admin Auth instance
 * Used for: verifying tokens, creating session cookies, managing users
 */
export function getAdminAuth(): Auth {
  if (!adminAuth) {
    initializeFirebaseAdmin();
    adminAuth = getAuth();
  }
  return adminAuth;
}

/**
 * Get Firebase Admin Firestore instance
 * Used for: server-side database operations (bypasses security rules)
 */
export function getAdminDb(): Firestore {
  if (!adminDb) {
    initializeFirebaseAdmin();
    adminDb = getFirestore();
  }
  return adminDb;
}

/**
 * Verify a Firebase ID token
 */
export async function verifyIdToken(idToken: string) {
  const auth = getAdminAuth();
  return auth.verifyIdToken(idToken);
}

/**
 * Create a session cookie from an ID token
 */
export async function createSessionCookie(idToken: string, expiresIn: number = 60 * 60 * 24 * 5 * 1000) {
  const auth = getAdminAuth();
  return auth.createSessionCookie(idToken, { expiresIn });
}

/**
 * Verify a session cookie
 */
export async function verifySessionCookie(sessionCookie: string, checkRevoked = true) {
  const auth = getAdminAuth();
  return auth.verifySessionCookie(sessionCookie, checkRevoked);
}

/**
 * Get user by ID
 */
export async function getUserById(uid: string) {
  const auth = getAdminAuth();
  return auth.getUser(uid);
}
