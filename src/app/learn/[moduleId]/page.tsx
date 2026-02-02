'use client';

/**
 * MODULE DETAIL PAGE
 * Displays lessons and content for a specific module
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'interactive' | 'quiz';
  completed: boolean;
}

// Module data (would come from API in production)
const MODULE_DATA: Record<string, { title: string; description: string; lessons: Lesson[] }> = {
  'foundation-1': {
    title: 'Terminal Foundations',
    description: 'Master the command line and developer tools',
    lessons: [
      { id: '1', title: 'Introduction to the Terminal', duration: '10 min', type: 'video', completed: false },
      { id: '2', title: 'Navigating the File System', duration: '15 min', type: 'interactive', completed: false },
      { id: '3', title: 'Working with Files & Directories', duration: '20 min', type: 'interactive', completed: false },
      { id: '4', title: 'Command Line Shortcuts', duration: '10 min', type: 'video', completed: false },
      { id: '5', title: 'Environment Variables', duration: '15 min', type: 'video', completed: false },
      { id: '6', title: 'Package Managers (npm, brew)', duration: '20 min', type: 'interactive', completed: false },
      { id: '7', title: 'Shell Scripting Basics', duration: '15 min', type: 'interactive', completed: false },
      { id: '8', title: 'Module Quiz', duration: '15 min', type: 'quiz', completed: false },
    ],
  },
  'workflow-1': {
    title: 'Workflow Analysis',
    description: 'Identify automation opportunities in your daily work',
    lessons: [
      { id: '1', title: 'Mapping Your Daily Tasks', duration: '15 min', type: 'interactive', completed: false },
      { id: '2', title: 'Identifying Repetitive Patterns', duration: '10 min', type: 'video', completed: false },
      { id: '3', title: 'Time Tracking & Analysis', duration: '20 min', type: 'interactive', completed: false },
      { id: '4', title: 'Prioritizing Automation Targets', duration: '15 min', type: 'video', completed: false },
      { id: '5', title: 'ROI Calculation Framework', duration: '15 min', type: 'interactive', completed: false },
      { id: '6', title: 'Module Quiz', duration: '10 min', type: 'quiz', completed: false },
    ],
  },
  'ops-audit-1': {
    title: 'Operations Audit',
    description: 'Map your business workflows comprehensively',
    lessons: [
      { id: '1', title: 'Business Process Overview', duration: '15 min', type: 'video', completed: false },
      { id: '2', title: 'Documenting Current Workflows', duration: '25 min', type: 'interactive', completed: false },
      { id: '3', title: 'Identifying Bottlenecks', duration: '20 min', type: 'interactive', completed: false },
      { id: '4', title: 'Team Interview Techniques', duration: '15 min', type: 'video', completed: false },
      { id: '5', title: 'Creating Process Maps', duration: '20 min', type: 'interactive', completed: false },
      { id: '6', title: 'Module Quiz', duration: '10 min', type: 'quiz', completed: false },
    ],
  },
};

function LessonItem({ lesson, index, onStart }: { lesson: Lesson; index: number; onStart: () => void }) {
  const typeIcons = {
    video: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    interactive: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
    ),
    quiz: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  };

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-lg border transition cursor-pointer ${
        lesson.completed
          ? 'bg-slate-800/20 border-slate-800/40'
          : 'bg-slate-800/30 border-slate-800/60 hover:border-slate-700'
      }`}
      onClick={onStart}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${
        lesson.completed ? 'bg-slate-700 text-slate-400' : 'bg-slate-800 text-slate-500'
      }`}>
        {lesson.completed ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          index + 1
        )}
      </div>

      <div className="flex-1">
        <h3 className="text-sm font-medium text-slate-300">{lesson.title}</h3>
        <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-600">
          <span className="flex items-center gap-1">
            {typeIcons[lesson.type]}
            {lesson.type.charAt(0).toUpperCase() + lesson.type.slice(1)}
          </span>
          <span>{lesson.duration}</span>
        </div>
      </div>

      <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}

export default function ModulePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const moduleId = params.moduleId as string;

  const [moduleData, setModuleData] = useState<typeof MODULE_DATA[string] | null>(null);
  const [currentLesson, setCurrentLesson] = useState<number | null>(null);

  useEffect(() => {
    // Get module data (would be API call in production)
    const data = MODULE_DATA[moduleId];
    if (data) {
      setModuleData(data);
    }
  }, [moduleId]);

  const handleStartLesson = (index: number) => {
    setCurrentLesson(index);
    // In production, this would navigate to the lesson content
  };

  if (!moduleData) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-slate-800/60 flex items-center justify-center">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm mb-4">Module not found</p>
          <Link href="/learn" className="text-cyan-500/80 hover:text-cyan-400 text-xs">
            Back to Learning Paths
          </Link>
        </div>
      </div>
    );
  }

  const completedCount = moduleData.lessons.filter(l => l.completed).length;
  const progress = Math.round((completedCount / moduleData.lessons.length) * 100);

  return (
    <div className="min-h-screen bg-[#0f1115]">
      {/* Header */}
      <header className="border-b border-slate-800/40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Phazur" width={24} height={24} className="invert opacity-80" />
            <span className="text-slate-200 font-medium text-sm">Phazur</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/learn" className="text-slate-500 hover:text-slate-300 transition text-xs">
              All Paths
            </Link>
            {user && (
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-medium">
                {user.email?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Back Link */}
        <Link href="/learn" className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-400 text-xs mb-6">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to paths
        </Link>

        {/* Module Header */}
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-slate-200 mb-1">{moduleData.title}</h1>
          <p className="text-slate-500 text-sm">{moduleData.description}</p>
        </div>

        {/* Progress */}
        <div className="mb-8 p-4 bg-slate-800/30 rounded-lg border border-slate-800/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-xs">{completedCount} of {moduleData.lessons.length} lessons completed</span>
            <span className="text-slate-400 text-sm font-medium">{progress}%</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500/60 rounded-full transition-all"
              style={{ width: `${Math.max(progress, 2)}%` }}
            />
          </div>
        </div>

        {/* Lessons List */}
        <div className="space-y-2">
          {moduleData.lessons.map((lesson, index) => (
            <LessonItem
              key={lesson.id}
              lesson={lesson}
              index={index}
              onStart={() => handleStartLesson(index)}
            />
          ))}
        </div>

        {/* Continue Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => handleStartLesson(completedCount)}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition"
          >
            {completedCount === 0 ? 'Start Module' : completedCount < moduleData.lessons.length ? 'Continue Learning' : 'Review Module'}
          </button>
        </div>
      </main>
    </div>
  );
}
