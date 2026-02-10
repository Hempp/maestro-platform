/**
 * FIREBASE LIBRARY EXPORTS
 * Centralized exports for Firebase utilities
 */

// Client-side
export { getFirebaseApp, getFirebaseAuth, getFirebaseDb, getRealtimeDb } from './config';

// Server-side (Admin SDK)
export {
  getAdminAuth,
  getAdminDb,
  verifyIdToken,
  createSessionCookie,
  verifySessionCookie,
  getUserById,
} from './admin';

// Collections & Data Access
export * from './collections';
