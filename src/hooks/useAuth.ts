/**
 * AUTH HOOK
 * Client-side authentication state management
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const supabase = getSupabaseClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        error: error?.message ?? null,
      });
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        error: null,
      });
    });

    return () => subscription.unsubscribe();
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

      // Refresh the client state
      const supabase = getSupabaseClient();
      await supabase.auth.getSession();

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
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Sign out failed');
      }

      const supabase = getSupabaseClient();
      await supabase.auth.signOut();

      setState({
        user: null,
        session: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign out failed';
      setState(prev => ({ ...prev, error: message, loading: false }));
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      setState(prev => ({ ...prev, error: error.message }));
    }
  }, []);

  const signInWithGithub = useCallback(async () => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      setState(prev => ({ ...prev, error: error.message }));
    }
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
