'use client';

/**
 * NOTIFICATIONS HOOK
 * Real-time notification listener with mark-as-read functionality
 *
 * @module hooks/useNotifications
 */

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
  FirestoreError,
  getDoc,
  deleteDoc,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase/config';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Notification types
 */
export type NotificationType =
  | 'system'
  | 'achievement'
  | 'message'
  | 'mention'
  | 'comment'
  | 'like'
  | 'follow'
  | 'share'
  | 'reminder'
  | 'alert'
  | 'update';

/**
 * Notification priority levels
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Notification data structure
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Timestamp;
  readAt?: Timestamp;
  priority?: NotificationPriority;
  /** Link to navigate to when clicked */
  actionUrl?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** ID of related entity (e.g., post, comment, user) */
  relatedId?: string;
  /** Type of related entity */
  relatedType?: string;
  /** Avatar or icon URL */
  imageUrl?: string;
  /** Sender information (for messages, mentions, etc.) */
  sender?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

/**
 * Hook state
 */
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: FirestoreError | null;
}

/**
 * Hook options
 */
interface NotificationOptions {
  /** Maximum number of notifications to fetch (default: 50) */
  limit?: number;
  /** Whether to only fetch unread notifications (default: false) */
  unreadOnly?: boolean;
  /** Filter by notification type */
  types?: NotificationType[];
  /** Whether the subscription is enabled (default: true) */
  enabled?: boolean;
}

// ============================================================================
// MAIN NOTIFICATIONS HOOK
// ============================================================================

/**
 * Subscribe to user notifications in real-time
 *
 * @example
 * ```tsx
 * const {
 *   notifications,
 *   unreadCount,
 *   loading,
 *   markAsRead,
 *   markAllAsRead,
 *   deleteNotification,
 * } = useNotifications(userId);
 *
 * // Mark single notification as read
 * await markAsRead('notification-id');
 *
 * // Mark all as read
 * await markAllAsRead();
 * ```
 */
export function useNotifications(
  userId: string | null | undefined,
  options: NotificationOptions = {}
) {
  const {
    limit: maxNotifications = 50,
    unreadOnly = false,
    types,
    enabled = true,
  } = options;

  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    loading: true,
    error: null,
  });

  // Track mounted state
  const mountedRef = useRef(true);

  // Memoize types array for dependency comparison
  const serializedTypes = useMemo(
    () => (types ? JSON.stringify(types.sort()) : ''),
    [types]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Set up real-time notification subscription
   */
  useEffect(() => {
    if (!enabled || !userId) {
      setState({
        notifications: [],
        unreadCount: 0,
        loading: false,
        error: null,
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    const db = getFirebaseDb();
    const notificationsRef = collection(db, 'users', userId, 'notifications');

    // Build query constraints
    const constraints: Parameters<typeof query>[1][] = [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(maxNotifications),
    ];

    // Add unread filter if specified
    if (unreadOnly) {
      constraints.unshift(where('read', '==', false));
    }

    // Add type filter if specified
    if (types && types.length > 0) {
      constraints.unshift(where('type', 'in', types));
    }

    const notificationsQuery = query(notificationsRef, ...constraints);

    const unsubscribe: Unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        if (!mountedRef.current) return;

        const notifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Notification[];

        const unreadCount = notifications.filter((n) => !n.read).length;

        setState({
          notifications,
          unreadCount,
          loading: false,
          error: null,
        });
      },
      (error: FirestoreError) => {
        if (!mountedRef.current) return;
        console.error('Notification subscription error:', error);
        setState({
          notifications: [],
          unreadCount: 0,
          loading: false,
          error,
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId, enabled, maxNotifications, unreadOnly, serializedTypes]);

  /**
   * Mark a single notification as read
   */
  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!userId) return;

      try {
        const db = getFirebaseDb();
        const notificationRef = doc(
          db,
          'users',
          userId,
          'notifications',
          notificationId
        );

        await updateDoc(notificationRef, {
          read: true,
          readAt: serverTimestamp(),
        });

        // Optimistically update local state
        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, prev.unreadCount - 1),
        }));
      } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }
    },
    [userId]
  );

  /**
   * Mark multiple notifications as read
   */
  const markMultipleAsRead = useCallback(
    async (notificationIds: string[]) => {
      if (!userId || notificationIds.length === 0) return;

      try {
        const db = getFirebaseDb();
        const batch = writeBatch(db);

        for (const id of notificationIds) {
          const notificationRef = doc(db, 'users', userId, 'notifications', id);
          batch.update(notificationRef, {
            read: true,
            readAt: serverTimestamp(),
          });
        }

        await batch.commit();

        // Optimistically update local state
        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.map((n) =>
            notificationIds.includes(n.id) ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(
            0,
            prev.unreadCount - notificationIds.length
          ),
        }));
      } catch (error) {
        console.error('Error marking notifications as read:', error);
        throw error;
      }
    },
    [userId]
  );

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    const unreadIds = state.notifications
      .filter((n) => !n.read)
      .map((n) => n.id);

    if (unreadIds.length === 0) return;

    await markMultipleAsRead(unreadIds);
  }, [userId, state.notifications, markMultipleAsRead]);

  /**
   * Delete a notification
   */
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!userId) return;

      try {
        const db = getFirebaseDb();
        const notificationRef = doc(
          db,
          'users',
          userId,
          'notifications',
          notificationId
        );

        // Check if notification was unread before deleting
        const notificationDoc = await getDoc(notificationRef);
        const wasUnread = notificationDoc.exists() && !notificationDoc.data()?.read;

        await deleteDoc(notificationRef);

        // Optimistically update local state
        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.filter((n) => n.id !== notificationId),
          unreadCount: wasUnread ? Math.max(0, prev.unreadCount - 1) : prev.unreadCount,
        }));
      } catch (error) {
        console.error('Error deleting notification:', error);
        throw error;
      }
    },
    [userId]
  );

  /**
   * Delete multiple notifications
   */
  const deleteMultiple = useCallback(
    async (notificationIds: string[]) => {
      if (!userId || notificationIds.length === 0) return;

      try {
        const db = getFirebaseDb();
        const batch = writeBatch(db);

        // Count unread notifications being deleted
        let unreadCount = 0;
        for (const id of notificationIds) {
          const notification = state.notifications.find((n) => n.id === id);
          if (notification && !notification.read) {
            unreadCount++;
          }
          const notificationRef = doc(db, 'users', userId, 'notifications', id);
          batch.delete(notificationRef);
        }

        await batch.commit();

        // Optimistically update local state
        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.filter(
            (n) => !notificationIds.includes(n.id)
          ),
          unreadCount: Math.max(0, prev.unreadCount - unreadCount),
        }));
      } catch (error) {
        console.error('Error deleting notifications:', error);
        throw error;
      }
    },
    [userId, state.notifications]
  );

  /**
   * Clear all notifications
   */
  const clearAll = useCallback(async () => {
    if (!userId) return;

    const allIds = state.notifications.map((n) => n.id);
    if (allIds.length === 0) return;

    await deleteMultiple(allIds);
  }, [userId, state.notifications, deleteMultiple]);

  return {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    loading: state.loading,
    error: state.error,
    markAsRead,
    markMultipleAsRead,
    markAllAsRead,
    deleteNotification,
    deleteMultiple,
    clearAll,
    /** Check if there are any unread notifications */
    hasUnread: state.unreadCount > 0,
  };
}

// ============================================================================
// UNREAD COUNT ONLY HOOK
// ============================================================================

/**
 * Lightweight hook that only tracks unread notification count
 * Use when you only need to show a badge count
 *
 * @example
 * ```tsx
 * const { unreadCount, loading } = useUnreadNotificationCount(userId);
 *
 * return (
 *   <Badge count={unreadCount}>
 *     <BellIcon />
 *   </Badge>
 * );
 * ```
 */
export function useUnreadNotificationCount(
  userId: string | null | undefined,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;

  // Initialize loading based on whether we can actually fetch
  const canFetch = enabled && !!userId;
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(canFetch);
  const [error, setError] = useState<FirestoreError | null>(null);

  // Track mounted state
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Skip subscription if disabled or no userId
    if (!enabled || !userId) {
      return;
    }

    const db = getFirebaseDb();
    const notificationsRef = collection(db, 'users', userId, 'notifications');

    const unreadQuery = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(
      unreadQuery,
      (snapshot) => {
        if (!mountedRef.current) return;
        setUnreadCount(snapshot.size);
        setLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        if (!mountedRef.current) return;
        console.error('Unread count subscription error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId, enabled]);

  // When disabled or no userId, return zero count and not loading
  const effectiveLoading = canFetch ? loading : false;
  const effectiveCount = canFetch ? unreadCount : 0;

  return { unreadCount: effectiveCount, loading: effectiveLoading, error, hasUnread: effectiveCount > 0 };
}

// ============================================================================
// NOTIFICATION BY TYPE HOOK
// ============================================================================

/**
 * Subscribe to notifications of a specific type
 *
 * @example
 * ```tsx
 * const { notifications: messages } = useNotificationsByType(userId, 'message');
 * const { notifications: mentions } = useNotificationsByType(userId, 'mention');
 * ```
 */
export function useNotificationsByType(
  userId: string | null | undefined,
  type: NotificationType,
  options: Omit<NotificationOptions, 'types'> = {}
) {
  return useNotifications(userId, {
    ...options,
    types: [type],
  });
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  NotificationState,
  NotificationOptions,
};
