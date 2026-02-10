'use client';

/**
 * SIGNUP PAGE
 * Enhanced registration with password strength indicator, social login, and smooth transitions
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAnalytics } from '@/components/providers/AnalyticsProvider';
import { getAuth, signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { getFirebaseApp } from '@/lib/firebase/config';

// Form validation types
interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  general?: string;
}

interface TouchedFields {
  fullName: boolean;
  email: boolean;
  password: boolean;
}

// Password strength calculation
interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  bgColor: string;
  requirements: {
    label: string;
    met: boolean;
  }[];
}

function calculatePasswordStrength(password: string): PasswordStrength {
  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains number', met: /[0-9]/.test(password) },
    { label: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const score = requirements.filter((r) => r.met).length;

  if (score === 0) {
    return { score: 0, label: 'Very weak', color: 'text-red-400', bgColor: 'bg-red-500', requirements };
  } else if (score <= 2) {
    return { score: 1, label: 'Weak', color: 'text-orange-400', bgColor: 'bg-orange-500', requirements };
  } else if (score <= 3) {
    return { score: 2, label: 'Fair', color: 'text-yellow-400', bgColor: 'bg-yellow-500', requirements };
  } else if (score === 4) {
    return { score: 3, label: 'Good', color: 'text-lime-400', bgColor: 'bg-lime-500', requirements };
  } else {
    return { score: 4, label: 'Strong', color: 'text-emerald-400', bgColor: 'bg-emerald-500', requirements };
  }
}

export default function SignupPage() {
  const router = useRouter();
  const { trackSignup, trackEvent, identifyUser } = useAnalytics();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'github' | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({
    fullName: false,
    email: false,
    password: false,
  });
  const [success, setSuccess] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  // Calculate password strength
  const passwordStrength = useMemo(() => calculatePasswordStrength(password), [password]);

  // Validation functions
  const validateFullName = useCallback((value: string): string | undefined => {
    if (!value.trim()) return 'Full name is required';
    if (value.trim().length < 2) return 'Name must be at least 2 characters';
    return undefined;
  }, []);

  const validateEmail = useCallback((value: string): string | undefined => {
    if (!value) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return undefined;
  }, []);

  const validatePassword = useCallback((value: string): string | undefined => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    return undefined;
  }, []);

  // Handle field blur for validation
  const handleBlur = (field: keyof TouchedFields) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    switch (field) {
      case 'fullName':
        setErrors((prev) => ({ ...prev, fullName: validateFullName(fullName) }));
        break;
      case 'email':
        setErrors((prev) => ({ ...prev, email: validateEmail(email) }));
        break;
      case 'password':
        setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
        setShowPasswordRequirements(false);
        break;
    }
  };

  // Handle OAuth signup
  const handleOAuthSignup = async (provider: 'google' | 'github') => {
    setSocialLoading(provider);
    setErrors({});

    trackEvent('signup_started', { method: provider });

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

      trackSignup('unknown', provider);
      if (result.user?.uid) {
        identifyUser(result.user.uid, { email: result.user.email || '' });
      }

      router.push('/onboarding');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect with ' + provider;
      trackEvent('signup_error', { error: message, method: provider });
      setErrors({ general: message });
      setSocialLoading(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const nameError = validateFullName(fullName);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (nameError || emailError || passwordError) {
      setErrors({ fullName: nameError, email: emailError, password: passwordError });
      setTouched({ fullName: true, email: true, password: true });
      return;
    }

    setIsLoading(true);
    setErrors({});

    trackEvent('signup_started', { method: 'email' });

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      });

      const data = await response.json();

      if (!response.ok) {
        trackEvent('signup_error', { error: data.error });
        throw new Error(data.error || 'Signup failed');
      }

      // Track successful signup and identify user
      trackSignup('unknown', 'email');
      if (data.user?.id) {
        identifyUser(data.user.id, { email, name: fullName });
      }

      setSuccess(true);
      // Redirect to onboarding after a short delay
      setTimeout(() => {
        router.push('/onboarding');
        router.refresh();
      }, 2000);
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Signup failed' });
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center px-4">
        <div className="fixed inset-0 bg-gradient-to-br from-emerald-950/20 via-[#0f1115] to-slate-950/20 pointer-events-none" />
        <div className="w-full max-w-md text-center relative z-10 animate-fadeIn">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-emerald-500/30 blur-2xl rounded-full" />
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center relative z-10 ring-4 ring-emerald-500/20">
              <svg className="w-10 h-10 text-emerald-400 animate-checkmark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">Account Created!</h1>
          <p className="text-slate-400 mb-4">Welcome to Phazur, {fullName.split(' ')[0]}!</p>
          <div className="flex items-center justify-center gap-2 text-emerald-400">
            <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Setting up your workspace...</span>
          </div>
        </div>
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes checkmark {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); opacity: 1; }
          }
          .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
          .animate-checkmark { animation: checkmark 0.5s ease-out 0.2s both; }
        `}</style>
      </div>
    );
  }

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
          <h1 className="text-2xl font-semibold text-white">Create your account</h1>
          <p className="text-slate-400 mt-2">Start your AI mastery journey today</p>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={() => handleOAuthSignup('google')}
            disabled={!!socialLoading || isLoading}
            aria-label="Continue with Google"
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 text-gray-800 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1115]"
          >
            {socialLoading === 'google' ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" aria-hidden="true" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => handleOAuthSignup('github')}
            disabled={!!socialLoading || isLoading}
            aria-label="Continue with GitHub"
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#24292e] hover:bg-[#2f363d] text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1115]"
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

          {/* Full Name Field */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-slate-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (touched.fullName) {
                    setErrors((prev) => ({ ...prev, fullName: validateFullName(e.target.value) }));
                  }
                }}
                onBlur={() => handleBlur('fullName')}
                required
                autoComplete="name"
                aria-invalid={touched.fullName && !!errors.fullName}
                aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                className={`w-full px-4 py-3 bg-[#1a1d21] border rounded-xl text-white placeholder-slate-500 focus:outline-none transition-all duration-200 ${
                  touched.fullName && errors.fullName
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-slate-700/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                }`}
                placeholder="John Doe"
              />
              {fullName && !errors.fullName && touched.fullName && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
            {touched.fullName && errors.fullName && (
              <p id="fullName-error" className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                </svg>
                {errors.fullName}
              </p>
            )}
          </div>

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

          {/* Password Field with Strength Indicator */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
              Password
            </label>
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
                onFocus={() => setShowPasswordRequirements(true)}
                onBlur={() => handleBlur('password')}
                required
                minLength={6}
                autoComplete="new-password"
                aria-invalid={touched.password && !!errors.password}
                aria-describedby={errors.password ? 'password-error' : 'password-requirements'}
                className={`w-full px-4 py-3 pr-12 bg-[#1a1d21] border rounded-xl text-white placeholder-slate-500 focus:outline-none transition-all duration-200 ${
                  touched.password && errors.password
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-slate-700/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                }`}
                placeholder="Create a strong password"
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

            {/* Password Strength Indicator */}
            {password && (
              <div className="mt-3 space-y-2">
                {/* Strength Bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.bgColor}`}
                      style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${passwordStrength.color}`}>
                    {passwordStrength.label}
                  </span>
                </div>

                {/* Requirements Checklist */}
                {showPasswordRequirements && (
                  <div id="password-requirements" className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/30 animate-slideDown">
                    <p className="text-xs text-slate-400 mb-2">Password requirements:</p>
                    <ul className="space-y-1">
                      {passwordStrength.requirements.map((req, index) => (
                        <li
                          key={index}
                          className={`flex items-center gap-2 text-xs transition-colors duration-200 ${
                            req.met ? 'text-emerald-400' : 'text-slate-500'
                          }`}
                        >
                          {req.met ? (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" strokeWidth={2} />
                            </svg>
                          )}
                          {req.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {touched.password && errors.password && (
              <p id="password-error" className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                </svg>
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !!socialLoading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1115] shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/30 mt-6"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Terms */}
        <p className="mt-4 text-xs text-slate-500 text-center">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="text-slate-400 hover:text-slate-300 underline underline-offset-2">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-slate-400 hover:text-slate-300 underline underline-offset-2">
            Privacy Policy
          </Link>
        </p>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>

        {/* Security Note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Your data is encrypted and secure</span>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-shake { animation: shake 0.3s ease-in-out; }
        .animate-slideDown { animation: slideDown 0.2s ease-out; }
      `}</style>
    </div>
  );
}
