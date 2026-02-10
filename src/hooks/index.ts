/**
 * HOOKS INDEX
 * Centralized exports for React hooks
 */

// Authentication
export { useAuth } from './useAuth';
export { useFirebaseAuth } from './useFirebaseAuth';

// Chat & Messaging
export { useChat } from './useChat';

// Progress & Learning
export { useProgress } from './useProgress';

// Real-time (Supabase legacy)
export { useRealtime, useSubscription } from './useRealtime';

// Firebase Real-time Subscriptions
export {
  useFirestoreDoc,
  useFirestoreCollection,
  useFirestoreDocs,
  useRealtimeDoc,
  useRealtimeCollection,
  type SubscriptionState,
  type CollectionState,
  type WhereConstraint,
  type OrderByConstraint,
  type QueryConstraints,
  type DocSubscriptionOptions,
  type CollectionSubscriptionOptions,
} from './useFirestoreSubscription';

// Firebase Presence
export {
  useFirebasePresence,
  usePresenceUpdate,
  useOnlineUsers,
  type ViewType,
  type PresenceData,
  type PresenceStats,
  type FirestorePresence,
  type PresenceHookOptions,
} from './useFirebasePresence';

// Notifications
export {
  useNotifications,
  useUnreadNotificationCount,
  useNotificationsByType,
  type Notification,
  type NotificationType,
  type NotificationPriority,
  type NotificationState,
  type NotificationOptions,
} from './useNotifications';

// Feature Access & Subscription
export { useFeatureAccess } from './useFeatureAccess';
export { useSubscription as useUserSubscription } from './useSubscription';

// Usage Tracking
export { useUsageTracking } from './useUsageTracking';
