'use client';

/**
 * LEARNING PAGE
 * Main interface for milestone-based learning with AI tutor
 */

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import TutorChat from '@/components/tutor/TutorChat';

type PathType = 'owner' | 'employee' | 'student';

const PATH_INFO = {
  owner: {
    title: 'Owner Path',
    subtitle: 'Build AI systems that replace entire business functions',
    price: 499,
    duration: '4 weeks',
    icon: '🏢',
  },
  employee: {
    title: 'Employee Path',
    subtitle: 'Create automations that save 10+ hours weekly',
    price: 199,
    duration: '3 weeks',
    icon: '💼',
  },
  student: {
    title: 'Student Path',
    subtitle: 'Build a portfolio project with verified credentials',
    price: 49,
    duration: '2-3 weeks',
    icon: '🎓',
  },
};

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();
  const path = params.path as PathType;

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
    setIsLoading(false);
  };

  // Validate path
  if (!['owner', 'employee', 'student'].includes(path)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Invalid Path</h1>
          <p className="text-gray-600 mt-2">Please select a valid learning path.</p>
          <button onClick={() => router.push('/dashboard')} className="mt-4 text-indigo-600 hover:underline">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const info = PATH_INFO[path];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">{info.icon}</div>
          <h1 className="text-2xl font-bold text-gray-900">{info.title}</h1>
          <p className="text-gray-600 mt-2">{info.subtitle}</p>
          <div className="mt-6 space-y-4">
            <button
              onClick={() => router.push('/signup')}
              className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Sign Up Free to Start
            </button>
            <button
              onClick={() => router.push('/login')}
              className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Already have an account? Log in
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Free to learn. Pay ${info.price} only after certification.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{info.icon}</span>
                <div>
                  <h1 className="font-semibold text-gray-900">{info.title}</h1>
                  <p className="text-xs text-gray-500">{info.duration} • 10 milestones</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Pay ${info.price} after certification</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="h-[calc(100vh-140px)]">
          <TutorChat path={path} />
        </div>
      </main>
    </div>
  );
}
