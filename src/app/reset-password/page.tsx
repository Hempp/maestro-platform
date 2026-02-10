'use client';

/**
 * RESET PASSWORD PAGE (Firebase)
 * Allows users to set a new password after clicking reset link
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getAuth, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { getFirebaseApp } from '@/lib/firebase/config';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  // Verify the reset code on mount
  useEffect(() => {
    if (!oobCode) {
      setError('Invalid or missing reset link. Please request a new password reset.');
      setIsVerifying(false);
      return;
    }

    const app = getFirebaseApp();
    const auth = getAuth(app);

    verifyPasswordResetCode(auth, oobCode)
      .then((userEmail) => {
        setEmail(userEmail);
        setIsVerifying(false);
      })
      .catch(() => {
        setError('This password reset link has expired or is invalid. Please request a new one.');
        setIsVerifying(false);
      });
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!oobCode) {
      setError('Invalid reset link');
      return;
    }

    setIsLoading(true);

    try {
      const app = getFirebaseApp();
      const auth = getAuth(app);

      await confirmPasswordReset(auth, oobCode, password);

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset password';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto" />
          <p className="text-slate-400 mt-4">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-800/30 rounded-xl p-8 border border-slate-800/60 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-xl font-semibold text-white mb-2">Password Reset Successful</h1>
            <p className="text-slate-400 mb-6">
              Your password has been updated. Redirecting to login...
            </p>

            <Link
              href="/login"
              className="text-cyan-400 hover:text-cyan-300 text-sm"
            >
              Go to Login Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1115] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <h1 className="text-2xl font-bold text-white">PHAZUR</h1>
          </Link>
          <h2 className="text-xl font-semibold text-white mb-2">Reset Your Password</h2>
          <p className="text-slate-400 text-sm">
            {email ? `Enter a new password for ${email}` : 'Enter your new password below'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-slate-800/30 rounded-xl p-8 border border-slate-800/60">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                required
                minLength={8}
                disabled={!!error && !email}
              />
              <p className="mt-1 text-xs text-slate-500">Minimum 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                required
                disabled={!!error && !email}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || (!!error && !email)}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-slate-400 hover:text-white text-sm">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
