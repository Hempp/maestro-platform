/**
 * FIRESTORE COLLECTIONS & DATA ACCESS
 * Type-safe Firestore operations
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentReference,
  QueryConstraint,
  writeBatch,
} from 'firebase/firestore';
import { getFirebaseDb } from './config';
import type {
  FirestoreUser,
  FirestoreLearnerProfile,
  FirestoreAkuProgress,
  FirestoreChatSession,
  FirestoreCertificate,
  FirestoreSubscription,
} from '@/types/firestore.types';

// ============================================================================
// COLLECTION REFERENCES
// ============================================================================

export const usersCollection = () => collection(getFirebaseDb(), 'users');
export const learnerProfilesCollection = () => collection(getFirebaseDb(), 'learnerProfiles');
export const akuProgressCollection = () => collection(getFirebaseDb(), 'akuProgress');
export const chatSessionsCollection = () => collection(getFirebaseDb(), 'chatSessions');
export const certificatesCollection = () => collection(getFirebaseDb(), 'certificates');
export const subscriptionsCollection = () => collection(getFirebaseDb(), 'subscriptions');
export const paymentsCollection = () => collection(getFirebaseDb(), 'payments');
export const notificationsCollection = () => collection(getFirebaseDb(), 'notifications');

// ============================================================================
// USER OPERATIONS
// ============================================================================

export async function getUser(userId: string): Promise<FirestoreUser | null> {
  const docRef = doc(usersCollection(), userId);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? (snapshot.data() as FirestoreUser) : null;
}

export async function createUser(userId: string, data: Partial<FirestoreUser>): Promise<void> {
  const docRef = doc(usersCollection(), userId);
  await setDoc(docRef, {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function updateUser(userId: string, data: Partial<FirestoreUser>): Promise<void> {
  const docRef = doc(usersCollection(), userId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

// ============================================================================
// LEARNER PROFILE OPERATIONS
// ============================================================================

export async function getLearnerProfile(userId: string): Promise<FirestoreLearnerProfile | null> {
  const docRef = doc(learnerProfilesCollection(), userId);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? (snapshot.data() as FirestoreLearnerProfile) : null;
}

export async function createLearnerProfile(userId: string, data: Partial<FirestoreLearnerProfile>): Promise<void> {
  const docRef = doc(learnerProfilesCollection(), userId);
  await setDoc(docRef, {
    userId,
    tier: 'student',
    currentPath: 'foundation',
    interactionDna: {},
    struggleScore: 50,
    totalLearningTime: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActivityAt: null,
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function updateLearnerProfile(userId: string, data: Partial<FirestoreLearnerProfile>): Promise<void> {
  const docRef = doc(learnerProfilesCollection(), userId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

// ============================================================================
// AKU PROGRESS OPERATIONS
// ============================================================================

export async function getUserProgress(userId: string): Promise<(FirestoreAkuProgress & { id: string })[]> {
  const q = query(akuProgressCollection(), where('userId', '==', userId), orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FirestoreAkuProgress & { id: string }));
}

export async function getAkuProgress(userId: string, akuId: string): Promise<FirestoreAkuProgress | null> {
  const q = query(akuProgressCollection(), where('userId', '==', userId), where('akuId', '==', akuId), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as FirestoreAkuProgress;
}

export async function upsertAkuProgress(userId: string, akuId: string, data: Partial<FirestoreAkuProgress>): Promise<void> {
  const existing = await getAkuProgress(userId, akuId);
  const docRef = existing ? doc(akuProgressCollection(), existing.id) : doc(akuProgressCollection());

  if (existing) {
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } else {
    await setDoc(docRef, {
      userId,
      akuId,
      status: 'not_started',
      hintsUsed: 0,
      attempts: 0,
      timeSpent: 0,
      struggleScore: 50,
      completedAt: null,
      verifiedAt: null,
      workflowSnapshot: null,
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
}

// ============================================================================
// CERTIFICATE OPERATIONS
// ============================================================================

export async function getCertificate(certificateId: string): Promise<FirestoreCertificate | null> {
  const docRef = doc(certificatesCollection(), certificateId);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? (snapshot.data() as FirestoreCertificate) : null;
}

export async function getUserCertificates(userId: string): Promise<(FirestoreCertificate & { id: string })[]> {
  const q = query(certificatesCollection(), where('userId', '==', userId), orderBy('issuedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FirestoreCertificate & { id: string }));
}

export async function createCertificate(data: Omit<FirestoreCertificate, 'createdAt' | 'updatedAt'>): Promise<string> {
  const docRef = doc(certificatesCollection());
  await setDoc(docRef, {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

// ============================================================================
// SUBSCRIPTION OPERATIONS
// ============================================================================

export async function getSubscription(userId: string): Promise<FirestoreSubscription | null> {
  const q = query(
    subscriptionsCollection(),
    where('userId', '==', userId),
    where('status', 'in', ['active', 'trialing']),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as FirestoreSubscription;
}

export async function createSubscription(data: Omit<FirestoreSubscription, 'createdAt' | 'updatedAt'>): Promise<string> {
  const docRef = doc(subscriptionsCollection());
  await setDoc(docRef, {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateSubscription(subscriptionId: string, data: Partial<FirestoreSubscription>): Promise<void> {
  const docRef = doc(subscriptionsCollection(), subscriptionId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

export function createBatch() {
  return writeBatch(getFirebaseDb());
}

// ============================================================================
// QUERY HELPERS
// ============================================================================

export async function queryCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[]
): Promise<(T & { id: string })[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T & { id: string }));
}
