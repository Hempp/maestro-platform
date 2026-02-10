'use client';

/**
 * LEARNING PAGE (Firebase)
 * Main interface for milestone-based learning with AI tutor
 */

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirebaseApp } from '@/lib/firebase/config';
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

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const app = getFirebaseApp();
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Redirect to dashboard if not authenticated
        router.push('/dashboard');
        return;
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <button
                onClick={() => router.push('/dashboard')}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-gray-700 active:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl sm:text-2xl flex-shrink-0">{info.icon}</span>
                <div className="min-w-0">
                  <h1 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{info.title}</h1>
                  <p className="text-[10px] sm:text-xs text-gray-500">{info.duration} • 10 milestones</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <span className="text-[10px] sm:text-sm text-gray-500 hidden xs:block">Pay ${info.price} after cert</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Full height with proper mobile keyboard handling */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-2 sm:px-4 py-2 sm:py-4">
        <div className="flex-1 min-h-0">
          <TutorChat path={path} />
        </div>
      </main>
    </div>
  );
}
