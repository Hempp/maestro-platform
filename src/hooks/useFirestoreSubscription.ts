'use client';

/**
 * FIRESTORE SUBSCRIPTION HOOKS
 * Generic real-time subscription hooks for Firestore documents and collections
 *
 * @module hooks/useFirestoreSubscription
 */

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  doc,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  limitToLast,
  DocumentData,
  DocumentSnapshot,
  QuerySnapshot,
  QueryConstraint,
  WhereFilterOp,
  OrderByDirection,
  Unsubscribe,
  FirestoreError,
  DocumentReference,
  Query,
  FieldPath,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase/config';

// ============================================================================
// TYPES
// ============================================================================

/**
 * State returned by subscription hooks
 */
interface SubscriptionState<T> {
  data: T | null;
  loading: boolean;
  error: FirestoreError | null;
}

/**
 * State for collection subscriptions
 */
interface CollectionState<T> {
  data: T[];
  loading: boolean;
  error: FirestoreError | null;
}

/**
 * Where constraint configuration
 */
interface WhereConstraint {
  field: string | FieldPath;
  op: WhereFilterOp;
  value: unknown;
}

/**
 * OrderBy constraint configuration
 */
interface OrderByConstraint {
  field: string | FieldPath;
  direction?: OrderByDirection;
}

/**
 * Query constraints for collection subscriptions
 */
interface QueryConstraints {
  where?: WhereConstraint[];
  orderBy?: OrderByConstraint[];
  limit?: number;
  limitToLast?: number;
  startAfter?: unknown;
  endBefore?: unknown;
}

/**
 * Options for document subscriptions
 */
interface DocSubscriptionOptions {
  /** Whether the subscription is enabled (default: true) */
  enabled?: boolean;
  /** Include metadata changes in updates */
  includeMetadataChanges?: boolean;
}

/**
 * Options for collection subscriptions
 */
interface CollectionSubscriptionOptions extends DocSubscriptionOptions {
  /** Query constraints */
  constraints?: QueryConstraints;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert constraint config to Firestore QueryConstraint array
 */
function buildQueryConstraints(constraints: QueryConstraints): QueryConstraint[] {
  const queryConstraints: QueryConstraint[] = [];

  // Add where clauses
  if (constraints.where) {
    for (const w of constraints.where) {
      queryConstraints.push(where(w.field, w.op, w.value));
    }
  }

  // Add orderBy clauses
  if (constraints.orderBy) {
    for (const o of constraints.orderBy) {
      queryConstraints.push(orderBy(o.field, o.direction));
    }
  }

  // Add pagination
  if (constraints.startAfter !== undefined) {
    queryConstraints.push(startAfter(constraints.startAfter));
  }

  if (constraints.endBefore !== undefined) {
    queryConstraints.push(endBefore(constraints.endBefore));
  }

  // Add limits
  if (constraints.limit) {
    queryConstraints.push(limit(constraints.limit));
  }

  if (constraints.limitToLast) {
    queryConstraints.push(limitToLast(constraints.limitToLast));
  }

  return queryConstraints;
}

/**
 * Serialize constraints for dependency comparison
 */
function serializeConstraints(constraints?: QueryConstraints): string {
  if (!constraints) return '';
  return JSON.stringify(constraints);
}

// ============================================================================
// DOCUMENT SUBSCRIPTION HOOK
// ============================================================================

/**
 * Subscribe to a single Firestore document in real-time
 *
 * @example
 * ```tsx
 * // Simple document subscription
 * const { data: user, loading, error } = useFirestoreDoc<User>('users/abc123');
 *
 * // Conditional subscription
 * const { data } = useFirestoreDoc<Profile>(`profiles/${userId}`, { enabled: !!userId });
 * ```
 *
 * @param path - Document path (e.g., 'users/abc123' or 'teams/xyz/members/123')
 * @param options - Subscription options
 * @returns Subscription state with data, loading, and error
 */
export function useFirestoreDoc<T = DocumentData>(
  path: string | null | undefined,
  options: DocSubscriptionOptions = {}
): SubscriptionState<T> {
  const { enabled = true, includeMetadataChanges = false } = options;

  const [state, setState] = useState<SubscriptionState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  // Track if component is mounted
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Skip if disabled or no path
    if (!enabled || !path) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    const db = getFirebaseDb();
    const docRef = doc(db, path) as DocumentReference<T>;

    const unsubscribe: Unsubscribe = onSnapshot(
      docRef,
      { includeMetadataChanges },
      (snapshot: DocumentSnapshot<T>) => {
        if (!mountedRef.current) return;

        if (snapshot.exists()) {
          setState({
            data: { id: snapshot.id, ...snapshot.data() } as T,
            loading: false,
            error: null,
          });
        } else {
          setState({
            data: null,
            loading: false,
            error: null,
          });
        }
      },
      (error: FirestoreError) => {
        if (!mountedRef.current) return;
        console.error(`Firestore subscription error for ${path}:`, error);
        setState({
          data: null,
          loading: false,
          error,
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [path, enabled, includeMetadataChanges]);

  return state;
}

// ============================================================================
// COLLECTION SUBSCRIPTION HOOK
// ============================================================================

/**
 * Subscribe to a Firestore collection with optional query constraints
 *
 * @example
 * ```tsx
 * // Simple collection subscription
 * const { data: users, loading } = useFirestoreCollection<User>('users');
 *
 * // With query constraints
 * const { data: activeUsers } = useFirestoreCollection<User>('users', {
 *   constraints: {
 *     where: [{ field: 'status', op: '==', value: 'active' }],
 *     orderBy: [{ field: 'createdAt', direction: 'desc' }],
 *     limit: 50,
 *   },
 * });
 *
 * // Nested collection
 * const { data: messages } = useFirestoreCollection<Message>(`chats/${chatId}/messages`, {
 *   constraints: {
 *     orderBy: [{ field: 'timestamp', direction: 'asc' }],
 *     limit: 100,
 *   },
 *   enabled: !!chatId,
 * });
 * ```
 *
 * @param path - Collection path (e.g., 'users' or 'teams/xyz/members')
 * @param options - Subscription options including query constraints
 * @returns Subscription state with data array, loading, and error
 */
export function useFirestoreCollection<T = DocumentData>(
  path: string | null | undefined,
  options: CollectionSubscriptionOptions = {}
): CollectionState<T> {
  const { enabled = true, constraints, includeMetadataChanges = false } = options;

  const [state, setState] = useState<CollectionState<T>>({
    data: [],
    loading: true,
    error: null,
  });

  // Track if component is mounted
  const mountedRef = useRef(true);

  // Memoize serialized constraints for dependency comparison
  const serializedConstraints = useMemo(
    () => serializeConstraints(constraints),
    [constraints]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Skip if disabled or no path
    if (!enabled || !path) {
      setState({ data: [], loading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    const db = getFirebaseDb();
    const collectionRef = collection(db, path);

    // Build query with constraints
    let queryRef: Query<DocumentData>;
    if (constraints) {
      const queryConstraints = buildQueryConstraints(constraints);
      queryRef = query(collectionRef, ...queryConstraints);
    } else {
      queryRef = query(collectionRef);
    }

    const unsubscribe: Unsubscribe = onSnapshot(
      queryRef,
      { includeMetadataChanges },
      (snapshot: QuerySnapshot<DocumentData>) => {
        if (!mountedRef.current) return;

        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];

        setState({
          data: docs,
          loading: false,
          error: null,
        });
      },
      (error: FirestoreError) => {
        if (!mountedRef.current) return;
        console.error(`Firestore collection subscription error for ${path}:`, error);
        setState({
          data: [],
          loading: false,
          error,
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [path, enabled, serializedConstraints, includeMetadataChanges]);

  return state;
}

// ============================================================================
// COMBINED EXPORTS (Aliases for convenience)
// ============================================================================

/**
 * Alias for useFirestoreDoc for more explicit naming
 */
export const useRealtimeDoc = useFirestoreDoc;

/**
 * Alias for useFirestoreCollection for more explicit naming
 */
export const useRealtimeCollection = useFirestoreCollection;

// ============================================================================
// ADVANCED: MULTI-DOCUMENT SUBSCRIPTION
// ============================================================================

/**
 * Subscribe to multiple documents by their IDs
 *
 * @example
 * ```tsx
 * const userIds = ['user1', 'user2', 'user3'];
 * const { data: users, loading } = useFirestoreDocs<User>('users', userIds);
 * ```
 *
 * @param collectionPath - Base collection path
 * @param ids - Array of document IDs to subscribe to
 * @param options - Subscription options
 * @returns Subscription state with data array
 */
export function useFirestoreDocs<T = DocumentData>(
  collectionPath: string | null | undefined,
  ids: string[],
  options: DocSubscriptionOptions = {}
): CollectionState<T> {
  const { enabled = true, includeMetadataChanges = false } = options;

  const [state, setState] = useState<CollectionState<T>>({
    data: [],
    loading: true,
    error: null,
  });

  // Track mounted state
  const mountedRef = useRef(true);

  // Track current data by ID
  const dataMapRef = useRef<Map<string, T>>(new Map());

  // Serialize IDs for dependency comparison
  const serializedIds = useMemo(() => JSON.stringify(ids.sort()), [ids]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Skip if disabled or no path
    if (!enabled || !collectionPath || ids.length === 0) {
      setState({ data: [], loading: false, error: null });
      dataMapRef.current.clear();
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    dataMapRef.current.clear();

    const db = getFirebaseDb();
    const unsubscribes: Unsubscribe[] = [];

    // Subscribe to each document
    for (const id of ids) {
      const docRef = doc(db, collectionPath, id) as DocumentReference<T>;

      const unsubscribe = onSnapshot(
        docRef,
        { includeMetadataChanges },
        (snapshot: DocumentSnapshot<T>) => {
          if (!mountedRef.current) return;

          if (snapshot.exists()) {
            dataMapRef.current.set(id, {
              id: snapshot.id,
              ...snapshot.data(),
            } as T);
          } else {
            dataMapRef.current.delete(id);
          }

          // Update state with current data
          setState({
            data: Array.from(dataMapRef.current.values()),
            loading: false,
            error: null,
          });
        },
        (error: FirestoreError) => {
          if (!mountedRef.current) return;
          console.error(`Firestore doc subscription error for ${collectionPath}/${id}:`, error);
          setState((prev) => ({
            ...prev,
            loading: false,
            error,
          }));
        }
      );

      unsubscribes.push(unsubscribe);
    }

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [collectionPath, serializedIds, enabled, includeMetadataChanges]);

  return state;
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  SubscriptionState,
  CollectionState,
  WhereConstraint,
  OrderByConstraint,
  QueryConstraints,
  DocSubscriptionOptions,
  CollectionSubscriptionOptions,
};
