'use client';

/**
 * FIREBASE AUTH HOOK
 * Client-side authentication state management
 */

import { useEffect, useState, useCallback } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase/config';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
  tier?: string;
}

export function useFirebaseAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Listen for auth state changes
  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get fresh ID token and create session cookie
        const idToken = await user.getIdToken();
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
      }
      setState({ user, loading: false, error: null });
    });

    return () => unsubscribe();
  }, []);

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);

      // Create session cookie
      const idToken = await result.user.getIdToken();
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      setState({ user: result.user, loading: false, error: null });
      return result.user;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw error;
    }
  }, []);

  /**
   * Sign up with email and password
   */
  const signUp = useCallback(async ({ email, password, fullName, tier }: SignUpData) => {
    const auth = getFirebaseAuth();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Update profile with display name
      if (fullName) {
        await updateProfile(result.user, { displayName: fullName });
      }

      // Create session cookie and user profile
      const idToken = await result.user.getIdToken();
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, fullName, tier }),
      });

      setState({ user: result.user, loading: false, error: null });
      return result.user;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign up failed';
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw error;
    }
  }, []);

  /**
   * Sign in with Google
   */
  const signInWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);

      // Create session cookie
      const idToken = await result.user.getIdToken();
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          fullName: result.user.displayName,
        }),
      });

      setState({ user: result.user, loading: false, error: null });
      return result.user;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google sign in failed';
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw error;
    }
  }, []);

  /**
   * Sign in with GitHub
   */
  const signInWithGithub = useCallback(async () => {
    const auth = getFirebaseAuth();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const provider = new GithubAuthProvider();

      const result = await signInWithPopup(auth, provider);

      // Create session cookie
      const idToken = await result.user.getIdToken();
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          fullName: result.user.displayName,
        }),
      });

      setState({ user: result.user, loading: false, error: null });
      return result.user;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'GitHub sign in failed';
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw error;
    }
  }, []);

  /**
   * Sign out
   */
  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth();

    try {
      await firebaseSignOut(auth);

      // Clear session cookie
      await fetch('/api/auth/session', { method: 'DELETE' });

      setState({ user: null, loading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign out failed';
      setState((prev) => ({ ...prev, error: message }));
      throw error;
    }
  }, []);

  /**
   * Send password reset email
   */
  const resetPassword = useCallback(async (email: string) => {
    const auth = getFirebaseAuth();

    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  }, []);

  /**
   * Get current ID token (for API calls)
   */
  const getIdToken = useCallback(async () => {
    if (!state.user) return null;
    return state.user.getIdToken();
  }, [state.user]);

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithGithub,
    resetPassword,
    getIdToken,
  };
}
