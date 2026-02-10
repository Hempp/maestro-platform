/**
 * AUTH HOOK (Firebase)
 * Client-side authentication state management using Firebase
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAuth, onAuthStateChanged, signOut as firebaseSignOut, User } from 'firebase/auth';
import { getFirebaseApp } from '@/lib/firebase/config';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const app = getFirebaseApp();
    const auth = getAuth(app);

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setState({
        user,
        loading: false,
        error: null,
      });
    }, (error) => {
      setState({
        user: null,
        loading: false,
        error: error.message,
      });
    });

    return () => unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sign up failed');
      }

      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign up failed';
      setState(prev => ({ ...prev, error: message, loading: false }));
      throw error;
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sign in failed');
      }

      // Auth state will be updated by onAuthStateChanged listener
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      setState(prev => ({ ...prev, error: message, loading: false }));
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      // Call logout API to clear session cookie
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Sign out failed');
      }

      // Sign out from Firebase client
      const app = getFirebaseApp();
      const auth = getAuth(app);
      await firebaseSignOut(auth);

      setState({
        user: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign out failed';
      setState(prev => ({ ...prev, error: message, loading: false }));
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    // OAuth is handled by the login page with popup flow
    // This redirects to the login page with OAuth intent
    window.location.href = '/login?provider=google';
  }, []);

  const signInWithGithub = useCallback(async () => {
    // OAuth is handled by the login page with popup flow
    window.location.href = '/login?provider=github';
  }, []);

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    signInWithGithub,
  };
}
