/**
 * REALTIME HOOK (Firebase)
 * Real-time subscriptions using Firebase Realtime Database and Firestore
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { getDatabase, ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';
import { getFirestore, collection, onSnapshot, query, where, DocumentData } from 'firebase/firestore';
import { getFirebaseApp } from '@/lib/firebase/config';

interface PresenceState {
  onlineUsers: number;
  activeInSandbox: number;
  activeInTerminal: number;
}

export function useRealtime(userId?: string) {
  const [presence, setPresence] = useState<PresenceState>({
    onlineUsers: 0,
    activeInSandbox: 0,
    activeInTerminal: 0,
  });

  useEffect(() => {
    if (!userId) return;

    const app = getFirebaseApp();
    const db = getDatabase(app);

    // Reference to this user's presence
    const userPresenceRef = ref(db, `presence/${userId}`);
    const presenceListRef = ref(db, 'presence');

    // Set user as online
    const presenceData = {
      online: true,
      lastSeen: serverTimestamp(),
      view: 'chat',
      userId,
    };

    set(userPresenceRef, presenceData);

    // Set up disconnect handler
    onDisconnect(userPresenceRef).remove();

    // Listen to all presence data
    const unsubscribe = onValue(presenceListRef, (snapshot) => {
      const data = snapshot.val() || {};
      const users = Object.values(data) as Array<{ view?: string; online?: boolean }>;
      const onlineUsers = users.filter(u => u.online).length;
      const sandbox = users.filter(u => u.online && u.view === 'sandbox').length;
      const terminal = users.filter(u => u.online && u.view === 'terminal').length;

      setPresence({
        onlineUsers,
        activeInSandbox: sandbox,
        activeInTerminal: terminal,
      });
    });

    return () => {
      unsubscribe();
      // Clean up presence on unmount
      set(userPresenceRef, null);
    };
  }, [userId]);

  const updatePresence = useCallback(async (view: 'chat' | 'terminal' | 'sandbox') => {
    if (!userId) return;

    const app = getFirebaseApp();
    const db = getDatabase(app);
    const userPresenceRef = ref(db, `presence/${userId}`);

    await set(userPresenceRef, {
      online: true,
      lastSeen: serverTimestamp(),
      view,
      userId,
    });
  }, [userId]);

  return {
    presence,
    updatePresence,
  };
}

/**
 * Hook for subscribing to Firestore document changes
 */
export function useSubscription<T extends DocumentData>(
  collectionName: string,
  filter?: { field: string; value: string }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const app = getFirebaseApp();
    const db = getFirestore(app);

    let q = query(collection(db, collectionName));

    if (filter) {
      q = query(collection(db, collectionName), where(filter.field, '==', filter.value));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as unknown as T[];
        setData(docs);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, filter?.field, filter?.value]);

  return { data, loading, error };
}
