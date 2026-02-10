'use client';

/**
 * FIREBASE PRESENCE HOOK
 * Real-time user presence tracking using Firebase Realtime Database
 */

import { useEffect, useState, useCallback } from 'react';
import {
  ref,
  set,
  onValue,
  onDisconnect,
  serverTimestamp,
  off,
} from 'firebase/database';
import { getRealtimeDb } from '@/lib/firebase/config';

type ViewType = 'chat' | 'sandbox' | 'terminal' | 'learning' | 'dashboard';

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
}

export function useFirebasePresence(userId: string | undefined) {
  const [presence, setPresence] = useState<PresenceStats>({
    onlineUsers: 0,
    activeInSandbox: 0,
    activeInTerminal: 0,
    activeInChat: 0,
  });
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');

  // Update user's presence
  const updatePresence = useCallback(
    async (view: ViewType) => {
      if (!userId) return;

      const db = getRealtimeDb();
      const userStatusRef = ref(db, `presence/${userId}`);

      try {
        await set(userStatusRef, {
          online: true,
          lastSeen: serverTimestamp(),
          view,
          userId,
        });
        setCurrentView(view);
      } catch (error) {
        console.error('Error updating presence:', error);
      }
    },
    [userId]
  );

  // Set up presence tracking
  useEffect(() => {
    if (!userId) return;

    const db = getRealtimeDb();
    const userStatusRef = ref(db, `presence/${userId}`);
    const connectedRef = ref(db, '.info/connected');
    const allPresenceRef = ref(db, 'presence');

    // Handle connection state
    const connectedUnsubscribe = onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === true) {
        // Set online status
        set(userStatusRef, {
          online: true,
          lastSeen: serverTimestamp(),
          view: currentView,
          userId,
        });

        // Set up disconnect handler
        onDisconnect(userStatusRef).set({
          online: false,
          lastSeen: serverTimestamp(),
          view: currentView,
          userId,
        });
      }
    });

    // Listen to all presence changes
    const presenceUnsubscribe = onValue(allPresenceRef, (snapshot) => {
      const data = snapshot.val() || {};
      const users = Object.values(data) as PresenceData[];

      const onlineUsers = users.filter((u) => u.online).length;
      const activeInSandbox = users.filter((u) => u.online && u.view === 'sandbox').length;
      const activeInTerminal = users.filter((u) => u.online && u.view === 'terminal').length;
      const activeInChat = users.filter((u) => u.online && u.view === 'chat').length;

      setPresence({
        onlineUsers,
        activeInSandbox,
        activeInTerminal,
        activeInChat,
      });
    });

    // Cleanup
    return () => {
      off(connectedRef);
      off(allPresenceRef);

      // Set offline status on unmount
      set(userStatusRef, {
        online: false,
        lastSeen: serverTimestamp(),
        view: currentView,
        userId,
      });
    };
  }, [userId, currentView]);

  return {
    ...presence,
    currentView,
    updatePresence,
  };
}

/**
 * Lightweight hook just for updating presence
 * Use when you don't need to listen to all users
 */
export function usePresenceUpdate(userId: string | undefined) {
  const updatePresence = useCallback(
    async (view: ViewType) => {
      if (!userId) return;

      const db = getRealtimeDb();
      const userStatusRef = ref(db, `presence/${userId}`);

      try {
        await set(userStatusRef, {
          online: true,
          lastSeen: serverTimestamp(),
          view,
          userId,
        });
      } catch (error) {
        console.error('Error updating presence:', error);
      }
    },
    [userId]
  );

  return { updatePresence };
}
