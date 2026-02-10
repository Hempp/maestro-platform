'use client';

/**
 * FIREBASE PRESENCE HOOK
 * Real-time user presence tracking using Firebase Realtime Database
 * with Firestore sync for queryable presence data
 *
 * @module hooks/useFirebasePresence
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  ref,
  set,
  onValue,
  onDisconnect,
  serverTimestamp as rtdbServerTimestamp,
  off,
} from 'firebase/database';
import {
  doc,
  setDoc,
  serverTimestamp as firestoreServerTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getRealtimeDb, getFirebaseDb } from '@/lib/firebase/config';

// ============================================================================
// TYPES
// ============================================================================

export type ViewType = 'chat' | 'sandbox' | 'terminal' | 'learning' | 'dashboard' | 'settings' | 'profile';

interface PresenceData {
  online: boolean;
  lastSeen: number | object;
  view: ViewType;
  userId: string;
}

interface PresenceStats {
  onlineUsers: number;
  activeInSandbox: number;
  activeInTerminal: number;
  activeInChat: number;
  activeInLearning: number;
  activeInDashboard: number;
}

interface FirestorePresence {
  id?: string;
  online: boolean;
  lastSeen: Timestamp | ReturnType<typeof firestoreServerTimestamp>;
  view: ViewType;
  userId: string;
  displayName?: string;
  photoURL?: string;
}

interface PresenceHookOptions {
  /** Initial view when presence is established */
  initialView?: ViewType;
  /** Whether to sync presence to Firestore (default: true) */
  syncToFirestore?: boolean;
  /** User display name for Firestore presence */
  displayName?: string;
  /** User photo URL for Firestore presence */
  photoURL?: string;
  /** Whether to track tab visibility changes (default: true) */
  trackVisibility?: boolean;
}

// ============================================================================
// MAIN PRESENCE HOOK
// ============================================================================

/**
 * Track user presence in real-time using Firebase Realtime Database
 * with optional sync to Firestore for querying capabilities
 *
 * @example
 * ```tsx
 * const {
 *   onlineUsers,
 *   activeInChat,
 *   currentView,
 *   updatePresence,
 *   isVisible,
 * } = useFirebasePresence(userId, {
 *   initialView: 'dashboard',
 *   syncToFirestore: true,
 *   displayName: user?.displayName,
 * });
 *
 * // Update view when navigating
 * useEffect(() => {
 *   updatePresence('chat');
 * }, [pathname]);
 * ```
 */
export function useFirebasePresence(
  userId: string | undefined,
  options: PresenceHookOptions = {}
) {
  const {
    initialView = 'dashboard',
    syncToFirestore = true,
    displayName,
    photoURL,
    trackVisibility = true,
  } = options;

  const [presence, setPresence] = useState<PresenceStats>({
    onlineUsers: 0,
    activeInSandbox: 0,
    activeInTerminal: 0,
    activeInChat: 0,
    activeInLearning: 0,
    activeInDashboard: 0,
  });
  const [currentView, setCurrentView] = useState<ViewType>(initialView);
  const [isVisible, setIsVisible] = useState(true);

  // Refs for stable callbacks
  const currentViewRef = useRef<ViewType>(initialView);
  const userIdRef = useRef(userId);

  // Update refs when values change
  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  /**
   * Sync presence data to Firestore for querying
   */
  const syncPresenceToFirestore = useCallback(
    async (online: boolean, view: ViewType) => {
      if (!syncToFirestore || !userId) return;

      try {
        const firestoreDb = getFirebaseDb();
        const presenceDocRef = doc(firestoreDb, 'presence', userId);

        const presenceData: FirestorePresence = {
          online,
          lastSeen: firestoreServerTimestamp(),
          view,
          userId,
          ...(displayName && { displayName }),
          ...(photoURL && { photoURL }),
        };

        await setDoc(presenceDocRef, presenceData, { merge: true });
      } catch (error) {
        console.error('Error syncing presence to Firestore:', error);
      }
    },
    [userId, syncToFirestore, displayName, photoURL]
  );

  /**
   * Update user's presence view
   */
  const updatePresence = useCallback(
    async (view: ViewType) => {
      if (!userId) return;

      const db = getRealtimeDb();
      const userStatusRef = ref(db, `presence/${userId}`);

      try {
        await set(userStatusRef, {
          online: true,
          lastSeen: rtdbServerTimestamp(),
          view,
          userId,
        });
        setCurrentView(view);

        // Sync to Firestore
        if (syncToFirestore) {
          await syncPresenceToFirestore(true, view);
        }
      } catch (error) {
        console.error('Error updating presence:', error);
      }
    },
    [userId, syncToFirestore, syncPresenceToFirestore]
  );

  /**
   * Handle visibility change (tab focus/blur)
   */
  const handleVisibilityChange = useCallback(() => {
    const visible = document.visibilityState === 'visible';
    setIsVisible(visible);

    if (!userIdRef.current) return;

    const db = getRealtimeDb();
    const userStatusRef = ref(db, `presence/${userIdRef.current}`);

    if (visible) {
      // Tab is now visible - set online
      set(userStatusRef, {
        online: true,
        lastSeen: rtdbServerTimestamp(),
        view: currentViewRef.current,
        userId: userIdRef.current,
      });

      if (syncToFirestore) {
        syncPresenceToFirestore(true, currentViewRef.current);
      }
    } else {
      // Tab is hidden - mark as away but still connected
      set(userStatusRef, {
        online: false,
        lastSeen: rtdbServerTimestamp(),
        view: currentViewRef.current,
        userId: userIdRef.current,
      });

      if (syncToFirestore) {
        syncPresenceToFirestore(false, currentViewRef.current);
      }
    }
  }, [syncToFirestore, syncPresenceToFirestore]);

  /**
   * Set up presence tracking
   */
  useEffect(() => {
    if (!userId) return;

    const db = getRealtimeDb();
    const userStatusRef = ref(db, `presence/${userId}`);
    const connectedRef = ref(db, '.info/connected');
    const allPresenceRef = ref(db, 'presence');

    // Handle connection state
    const handleConnected = onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === true) {
        // Set online status
        set(userStatusRef, {
          online: true,
          lastSeen: rtdbServerTimestamp(),
          view: currentView,
          userId,
        });

        // Set up disconnect handler
        onDisconnect(userStatusRef).set({
          online: false,
          lastSeen: rtdbServerTimestamp(),
          view: currentView,
          userId,
        });

        // Sync to Firestore
        if (syncToFirestore) {
          syncPresenceToFirestore(true, currentView);
        }
      }
    });

    // Listen to all presence changes
    const handlePresenceSync = onValue(allPresenceRef, (snapshot) => {
      const data = snapshot.val() || {};
      const users = Object.values(data) as PresenceData[];

      const onlineUsers = users.filter((u) => u.online).length;
      const activeInSandbox = users.filter((u) => u.online && u.view === 'sandbox').length;
      const activeInTerminal = users.filter((u) => u.online && u.view === 'terminal').length;
      const activeInChat = users.filter((u) => u.online && u.view === 'chat').length;
      const activeInLearning = users.filter((u) => u.online && u.view === 'learning').length;
      const activeInDashboard = users.filter((u) => u.online && u.view === 'dashboard').length;

      setPresence({
        onlineUsers,
        activeInSandbox,
        activeInTerminal,
        activeInChat,
        activeInLearning,
        activeInDashboard,
      });
    });

    // Set up visibility tracking
    if (trackVisibility && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    // Cleanup
    return () => {
      off(connectedRef);
      off(allPresenceRef);

      // Remove visibility listener
      if (trackVisibility && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }

      // Set offline status on unmount
      set(userStatusRef, {
        online: false,
        lastSeen: rtdbServerTimestamp(),
        view: currentView,
        userId,
      });

      // Sync offline to Firestore
      if (syncToFirestore) {
        syncPresenceToFirestore(false, currentView);
      }
    };
  }, [userId, currentView, syncToFirestore, trackVisibility, handleVisibilityChange, syncPresenceToFirestore]);

  return {
    ...presence,
    currentView,
    isVisible,
    updatePresence,
  };
}

// ============================================================================
// LIGHTWEIGHT PRESENCE UPDATE HOOK
// ============================================================================

/**
 * Lightweight hook for updating presence without listening to all users
 * Use when you don't need to display online user counts
 *
 * @example
 * ```tsx
 * const { updatePresence, setOffline } = usePresenceUpdate(userId);
 *
 * // Update view
 * updatePresence('sandbox');
 *
 * // Manually set offline (e.g., before navigation)
 * setOffline();
 * ```
 */
export function usePresenceUpdate(
  userId: string | undefined,
  options: Omit<PresenceHookOptions, 'initialView'> = {}
) {
  const { syncToFirestore = true, displayName, photoURL } = options;

  const updatePresence = useCallback(
    async (view: ViewType) => {
      if (!userId) return;

      const db = getRealtimeDb();
      const userStatusRef = ref(db, `presence/${userId}`);

      try {
        await set(userStatusRef, {
          online: true,
          lastSeen: rtdbServerTimestamp(),
          view,
          userId,
        });

        // Sync to Firestore
        if (syncToFirestore) {
          const firestoreDb = getFirebaseDb();
          const presenceDocRef = doc(firestoreDb, 'presence', userId);

          await setDoc(
            presenceDocRef,
            {
              online: true,
              lastSeen: firestoreServerTimestamp(),
              view,
              userId,
              ...(displayName && { displayName }),
              ...(photoURL && { photoURL }),
            },
            { merge: true }
          );
        }
      } catch (error) {
        console.error('Error updating presence:', error);
      }
    },
    [userId, syncToFirestore, displayName, photoURL]
  );

  const setOffline = useCallback(async () => {
    if (!userId) return;

    const db = getRealtimeDb();
    const userStatusRef = ref(db, `presence/${userId}`);

    try {
      await set(userStatusRef, {
        online: false,
        lastSeen: rtdbServerTimestamp(),
        view: 'dashboard',
        userId,
      });

      if (syncToFirestore) {
        const firestoreDb = getFirebaseDb();
        const presenceDocRef = doc(firestoreDb, 'presence', userId);

        await setDoc(
          presenceDocRef,
          {
            online: false,
            lastSeen: firestoreServerTimestamp(),
            view: 'dashboard',
            userId,
          },
          { merge: true }
        );
      }
    } catch (error) {
      console.error('Error setting offline:', error);
    }
  }, [userId, syncToFirestore]);

  return { updatePresence, setOffline };
}

// ============================================================================
// ONLINE USERS QUERY HOOK
// ============================================================================

/**
 * Query online users from Firestore (for UI display)
 * This uses Firestore instead of RTDB for better querying capabilities
 *
 * @example
 * ```tsx
 * const { onlineUsers, loading } = useOnlineUsers({ limit: 10 });
 *
 * return (
 *   <div>
 *     {onlineUsers.map(user => (
 *       <Avatar key={user.id} src={user.photoURL} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useOnlineUsers(options: { limit?: number } = {}) {
  const { limit: maxUsers = 50 } = options;

  const [onlineUsers, setOnlineUsers] = useState<FirestorePresence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Import dynamically to avoid SSR issues
    const setupSubscription = async () => {
      try {
        const { collection, query, where, orderBy, limit, onSnapshot } = await import(
          'firebase/firestore'
        );
        const firestoreDb = getFirebaseDb();

        const presenceQuery = query(
          collection(firestoreDb, 'presence'),
          where('online', '==', true),
          orderBy('lastSeen', 'desc'),
          limit(maxUsers)
        );

        const unsubscribe = onSnapshot(
          presenceQuery,
          (snapshot) => {
            const users = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as FirestorePresence[];

            setOnlineUsers(users);
            setLoading(false);
          },
          (err) => {
            console.error('Error fetching online users:', err);
            setError(err);
            setLoading(false);
          }
        );

        return unsubscribe;
      } catch (err) {
        console.error('Error setting up online users subscription:', err);
        setError(err as Error);
        setLoading(false);
        return () => {};
      }
    };

    let unsubscribe: (() => void) | undefined;

    setupSubscription().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [maxUsers]);

  return { onlineUsers, loading, error };
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { PresenceData, PresenceStats, FirestorePresence, PresenceHookOptions };
