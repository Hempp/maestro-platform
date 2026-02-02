'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function TestSignupPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const testEmail = 'admin@test.com';
  const testPassword = 'Admin123!';

  async function handleSignup() {
    setStatus('loading');
    const supabase = createClient();

    try {
      // Try to sign up
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: { full_name: 'Test Admin' }
        }
      });

      if (error) {
        // If user exists, try to sign in
        if (error.message.includes('already registered')) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: testPassword,
          });

          if (signInError) {
            setStatus('error');
            setMessage(`Sign in failed: ${signInError.message}`);
            return;
          }

          setStatus('success');
          setMessage('Logged in! Redirecting to make-admin...');
          setTimeout(() => router.push('/make-admin'), 1500);
          return;
        }

        setStatus('error');
        setMessage(error.message);
        return;
      }

      if (data.user) {
        setStatus('success');
        setMessage('Account created! Redirecting to make-admin...');
        setTimeout(() => router.push('/make-admin'), 1500);
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Failed');
    }
  }

  async function handleSignIn() {
    setStatus('loading');
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (error) {
      setStatus('error');
      setMessage(`Sign in failed: ${error.message}`);
      return;
    }

    setStatus('success');
    setMessage('Logged in! Redirecting to make-admin...');
    setTimeout(() => router.push('/make-admin'), 1500);
  }

  return (
    <div className="min-h-screen bg-[#1a1d21] flex items-center justify-center p-4">
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Test Admin Setup</h1>

        <div className="bg-slate-700/50 rounded-lg p-4 mb-6 text-left">
          <p className="text-slate-300 text-sm mb-2">Test Credentials:</p>
          <p className="text-cyan-400 font-mono text-sm">Email: {testEmail}</p>
          <p className="text-cyan-400 font-mono text-sm">Password: {testPassword}</p>
        </div>

        {status === 'idle' && (
          <div className="space-y-3">
            <button
              onClick={handleSignup}
              className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition"
            >
              Create Test Account
            </button>
            <button
              onClick={handleSignIn}
              className="w-full py-3 px-4 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded-lg transition"
            >
              Sign In (if already created)
            </button>
          </div>
        )}

        {status === 'loading' && (
          <div className="text-slate-400">Processing...</div>
        )}

        {status === 'success' && (
          <div className="text-green-400">{message}</div>
        )}

        {status === 'error' && (
          <div className="text-red-400">{message}</div>
        )}
      </div>
    </div>
  );
}
