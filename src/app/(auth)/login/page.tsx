'use client';

/**
 * LOGIN PAGE
 * Enhanced auth interface with social login, remember me, and smooth transitions
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAnalytics } from '@/components/providers/AnalyticsProvider';
import { getAuth, signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { getFirebaseApp } from '@/lib/firebase/config';

// Form validation types
interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { trackEvent, identifyUser } = useAnalytics();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'github' | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  });

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('phazur_remembered_email');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  // Email validation
  const validateEmail = useCallback((value: string): string | undefined => {
    if (!value) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return undefined;
  }, []);

  // Password validation
  const validatePassword = useCallback((value: string): string | undefined => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    return undefined;
  }, []);

  // Handle field blur for validation
  const handleBlur = (field: 'email' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'email') {
      setErrors((prev) => ({ ...prev, email: validateEmail(email) }));
    } else {
      setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
    }
  };

  // Handle OAuth login
  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setSocialLoading(provider);
    setErrors({});

    trackEvent('login_started', { method: provider });

    try {
      const app = getFirebaseApp();
      const auth = getAuth(app);
      const authProvider = provider === 'google'
        ? new GoogleAuthProvider()
        : new GithubAuthProvider();

      const result = await signInWithPopup(auth, authProvider);
      const idToken = await result.user.getIdToken();

      // Create session cookie via API
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create session');
      }

      trackEvent('login_completed', { method: provider });
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect with ' + provider;
      trackEvent('login_error', { error: message, method: provider });
      setErrors({ general: message });
      setSocialLoading(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      setTouched({ email: true, password: true });
      return;
    }

    setIsLoading(true);
    setErrors({});

    trackEvent('login_started', { method: 'email' });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        trackEvent('login_error', { error: data.error });
        throw new Error(data.error || 'Login failed');
      }

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('phazur_remembered_email', email);
      } else {
        localStorage.removeItem('phazur_remembered_email');
      }

      // Track successful login and identify user
      trackEvent('login_completed', { method: 'email' });
      if (data.user?.id) {
        identifyUser(data.user.id, {
          email,
          tier: data.user.tier,
          role: data.user.role,
        });
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Login failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = !validateEmail(email) && !validatePassword(password);

  return (
    <div className="min-h-screen bg-[#0f1115] flex items-center justify-center px-4 py-8">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-950/20 via-[#0f1115] to-slate-950/20 pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fadeIn">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block group">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-xl group-hover:bg-emerald-500/30 transition-all duration-300 rounded-full" />
              <Image
                src="/logo.png"
                alt="Phazur"
                width={56}
                height={56}
                className="mx-auto mb-4 invert relative z-10 group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </Link>
          <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
          <p className="text-slate-400 mt-2">Sign in to continue your journey</p>
        </div>

        {/* OAuth Buttons - Moved to top for faster access */}
        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={() => handleOAuthLogin('google')}
            disabled={!!socialLoading || isLoading}
            aria-label="Continue with Google"
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 text-gray-800 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1115] group"
          >
            {socialLoading === 'google' ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" aria-hidden="true" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => handleOAuthLogin('github')}
            disabled={!!socialLoading || isLoading}
            aria-label="Continue with GitHub"
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#24292e] hover:bg-[#2f363d] text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1115] group"
          >
            {socialLoading === 'github' ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            )}
            Continue with GitHub
          </button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700/50" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-[#0f1115] text-slate-500">or continue with email</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General Error */}
          {errors.general && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl animate-shake">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-400 text-sm">{errors.general}</p>
              </div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
              Email
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (touched.email) {
                    setErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) }));
                  }
                }}
                onBlur={() => handleBlur('email')}
                required
                autoComplete="email"
                aria-invalid={touched.email && !!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className={`w-full px-4 py-3 bg-[#1a1d21] border rounded-xl text-white placeholder-slate-500 focus:outline-none transition-all duration-200 ${
                  touched.email && errors.email
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-slate-700/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                }`}
                placeholder="you@example.com"
              />
              {email && !errors.email && touched.email && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
            {touched.email && errors.email && (
              <p id="email-error" className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                </svg>
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (touched.password) {
                    setErrors((prev) => ({ ...prev, password: validatePassword(e.target.value) }));
                  }
                }}
                onBlur={() => handleBlur('password')}
                required
                autoComplete="current-password"
                aria-invalid={touched.password && !!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                className={`w-full px-4 py-3 pr-12 bg-[#1a1d21] border rounded-xl text-white placeholder-slate-500 focus:outline-none transition-all duration-200 ${
                  touched.password && errors.password
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-slate-700/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                }`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {touched.password && errors.password && (
              <p id="password-error" className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                </svg>
                {errors.password}
              </p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-[#1a1d21] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
            />
            <label htmlFor="remember-me" className="ml-2 text-sm text-slate-400 cursor-pointer select-none">
              Remember me for 30 days
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !!socialLoading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1115] shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/30"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-slate-400">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
            >
              Create one now
            </Link>
          </p>
        </div>

        {/* Security Note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Protected by enterprise-grade security</span>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
