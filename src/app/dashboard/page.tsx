'use client';

/**
 * PHAZUR DASHBOARD
 * 3-panel layout: Progress sidebar | Chat | Quick actions
 * AI Coach with full OpenAI integration
 * Progress tracking and certificates display
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { useProgress } from '@/hooks/useProgress';
import { useRealtime } from '@/hooks/useRealtime';

type PathType = 'student' | 'employee' | 'owner' | null;
type ViewType = 'home' | 'live-courses' | 'community' | 'projects' | 'discussions' | 'leaderboards';

interface Certificate {
  id: string;
  certificate_type: string;
  issued_at: string;
  metadata: {
    certificationName: string;
    designation: string;
    akusCompleted: number;
  };
}

const PATH_INFO = {
  student: {
    title: 'The Student',
    subtitle: 'Build a Job-Ready Portfolio',
    cert: 'Certified AI Associate',
    price: '$49',
    requiredAkus: 10,
    styles: {
      border: 'border-purple-500/20',
      bg: 'bg-purple-500/5',
      bgIcon: 'bg-purple-500/10',
      text: 'text-purple-400',
    },
  },
  employee: {
    title: 'The Employee',
    subtitle: 'Efficiency Mastery',
    cert: 'Workflow Efficiency Lead',
    price: '$199',
    requiredAkus: 15,
    styles: {
      border: 'border-cyan-500/20',
      bg: 'bg-cyan-500/5',
      bgIcon: 'bg-cyan-500/10',
      text: 'text-cyan-400',
    },
  },
  owner: {
    title: 'The Owner',
    subtitle: 'Operations Scaling',
    cert: 'AI Operations Master',
    price: '$499',
    requiredAkus: 20,
    styles: {
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/5',
      bgIcon: 'bg-emerald-500/10',
      text: 'text-emerald-400',
    },
  },
};

// AI Avatar component - clean minimal design
function AIAvatar({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9';
  return (
    <div className={`${sizeClass} rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center flex-shrink-0`}>
      <span className="text-slate-400 font-medium text-sm">P</span>
    </div>
  );
}

// Progress ring component - subtle styling
function ProgressRing({ progress, size = 56, strokeWidth = 5 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-slate-800"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-cyan-500 transition-all duration-300"
      />
    </svg>
  );
}

// Navigation item component - clean minimal
function NavItem({
  icon,
  label,
  active = false,
  locked = false,
  href,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  locked?: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
      active
        ? 'bg-slate-800/80 text-white'
        : locked
          ? 'text-slate-700 cursor-not-allowed'
          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
    }`}>
      <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
      <span className="text-sm flex-1">{label}</span>
      {locked && (
        <svg className="w-3.5 h-3.5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )}
    </div>
  );

  if (href && !locked) {
    return <Link href={href}>{content}</Link>;
  }

  return (
    <button onClick={locked ? undefined : onClick} className="w-full text-left" disabled={locked}>
      {content}
    </button>
  );
}

// Certificate card component - refined styling
function CertificateCard({
  name,
  designation,
  earned,
  progress,
  required,
  color = 'purple'
}: {
  name: string;
  designation: string;
  earned: boolean;
  progress: number;
  required: number;
  color?: string;
}) {
  const colorClasses: Record<string, { bg: string; bar: string; text: string }> = {
    purple: { bg: 'bg-purple-500/5', bar: 'bg-purple-500', text: 'text-purple-400' },
    cyan: { bg: 'bg-cyan-500/5', bar: 'bg-cyan-500', text: 'text-cyan-400' },
    emerald: { bg: 'bg-emerald-500/5', bar: 'bg-emerald-500', text: 'text-emerald-400' },
  };
  const colors = colorClasses[color] || colorClasses.purple;

  return (
    <div className={`p-3 rounded-lg border border-slate-800/60 ${earned ? colors.bg : 'bg-slate-800/30'}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className={`text-xs font-medium ${earned ? colors.text : 'text-slate-400'}`}>{name}</h4>
          <p className="text-[10px] text-slate-600 mt-0.5">{designation}</p>
        </div>
        {earned ? (
          <svg className={`w-4 h-4 ${colors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <span className="text-[10px] text-slate-600">{progress}/{required}</span>
        )}
      </div>
      {!earned && (
        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.bar} rounded-full transition-all duration-300`}
            style={{ width: `${Math.min((progress / required) * 100, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

// Collapsible Section component
function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-800/40 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-slate-800/20 hover:bg-slate-800/30 transition"
      >
        <span className="text-sm font-medium text-slate-300">{title}</span>
        <svg
          className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="p-3 bg-slate-900/20">{children}</div>}
    </div>
  );
}

// Progress Checkpoint component
function ProgressCheckpoint({
  completed,
  current,
  label,
  isLast = false,
}: {
  completed: boolean;
  current: boolean;
  label: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex items-center">
      <div className="flex flex-col items-center">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
            completed
              ? 'bg-slate-700 border-slate-600'
              : current
              ? 'bg-cyan-500/20 border-cyan-500'
              : 'bg-slate-800/50 border-slate-700'
          }`}
        >
          {completed ? (
            <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : current ? (
            <div className="w-2 h-2 bg-cyan-500 rounded-full" />
          ) : (
            <div className="w-2 h-2 bg-slate-700 rounded-full" />
          )}
        </div>
        {!isLast && (
          <div className={`w-0.5 h-4 ${completed ? 'bg-slate-600' : 'bg-slate-800'}`} />
        )}
      </div>
      <span className={`ml-3 text-xs ${current ? 'text-cyan-400' : completed ? 'text-slate-400' : 'text-slate-600'}`}>
        {label}
      </span>
    </div>
  );
}

// Video Card component
function VideoCard({
  title,
  duration,
  thumbnail,
  isPlaying = false,
  onClick,
}: {
  title: string;
  duration: string;
  thumbnail: string;
  isPlaying?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 p-2 rounded-lg transition ${
        isPlaying ? 'bg-cyan-500/10 border border-cyan-500/30' : 'hover:bg-slate-800/40'
      }`}
    >
      <div className="relative w-16 h-10 bg-slate-800 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
        <span className="text-lg">{thumbnail}</span>
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          {isPlaying ? (
            <div className="w-3 h-3 border-2 border-white rounded-sm" />
          ) : (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </div>
      </div>
      <div className="flex-1 text-left">
        <h4 className={`text-xs font-medium ${isPlaying ? 'text-cyan-400' : 'text-slate-300'}`}>{title}</h4>
        <p className="text-[10px] text-slate-600 mt-0.5">{duration}</p>
      </div>
    </button>
  );
}

// Tutor Sidebar component
function TutorSidebar({
  currentStep,
  selectedPath,
  messages,
  onClose,
}: {
  currentStep: number;
  selectedPath: 'student' | 'employee' | 'owner' | null;
  messages: Array<{ role: string; content: string[] }>;
  onClose: () => void;
}) {
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  // Determine current topic based on messages and step
  const getCurrentTopic = () => {
    if (!selectedPath) return 'Getting Started';
    if (currentStep < 2) return 'Introduction & Setup';
    if (currentStep < 4) return 'Core Concepts';
    return 'Building Projects';
  };

  // Get contextual videos based on path and progress
  const getRelevantVideos = () => {
    const baseVideos = [
      { id: '1', title: 'Terminal Basics', duration: '5:32', thumbnail: '💻' },
      { id: '2', title: 'Your First Command', duration: '3:45', thumbnail: '⌨️' },
      { id: '3', title: 'File Navigation', duration: '4:18', thumbnail: '📁' },
    ];

    if (selectedPath === 'student') {
      return [
        ...baseVideos,
        { id: '4', title: 'Portfolio Setup', duration: '8:21', thumbnail: '🎨' },
        { id: '5', title: 'Deploy to Vercel', duration: '6:15', thumbnail: '🚀' },
      ];
    } else if (selectedPath === 'employee') {
      return [
        { id: '1', title: 'Workflow Analysis', duration: '6:42', thumbnail: '📊' },
        { id: '2', title: 'Building GPTs', duration: '9:15', thumbnail: '🤖' },
        { id: '3', title: 'Email Automation', duration: '7:33', thumbnail: '📧' },
        { id: '4', title: 'API Basics', duration: '5:48', thumbnail: '🔗' },
      ];
    } else if (selectedPath === 'owner') {
      return [
        { id: '1', title: 'Operations Mapping', duration: '8:12', thumbnail: '🗺️' },
        { id: '2', title: 'Agent Architecture', duration: '11:45', thumbnail: '🏗️' },
        { id: '3', title: 'Multi-Agent Setup', duration: '14:22', thumbnail: '🔄' },
        { id: '4', title: 'Scaling Systems', duration: '9:38', thumbnail: '📈' },
      ];
    }

    return baseVideos;
  };

  // Get progress steps based on path
  const getProgressSteps = () => {
    if (selectedPath === 'student') {
      return ['Welcome', 'Terminal Setup', 'First Commands', 'Build Project', 'Deploy'];
    } else if (selectedPath === 'employee') {
      return ['Assessment', 'Workflow Map', 'Build GPT', 'Automations', 'Report'];
    } else if (selectedPath === 'owner') {
      return ['Audit', 'Agent Design', 'Build Agent', 'Orchestrate', 'Deploy'];
    }
    return ['Start', 'Learn', 'Build', 'Ship'];
  };

  const progressSteps = getProgressSteps();
  const videos = getRelevantVideos();

  return (
    <aside className="w-72 border-l border-slate-800/40 flex flex-col bg-[#0f1115] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/40">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-cyan-500/20 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="text-sm font-medium text-slate-300">Tutor</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-600 hover:text-slate-400 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Progress Section */}
        <CollapsibleSection title="Progress" defaultOpen={true}>
          <div className="space-y-0">
            {progressSteps.map((step, index) => (
              <ProgressCheckpoint
                key={step}
                completed={index < currentStep}
                current={index === currentStep}
                label={step}
                isLast={index === progressSteps.length - 1}
              />
            ))}
          </div>
          <p className="text-[10px] text-slate-600 mt-3">
            Track your progress through the learning path.
          </p>
        </CollapsibleSection>

        {/* Current Topic */}
        <div className="flex items-center justify-between p-3 bg-slate-800/30 border border-slate-800/40 rounded-lg">
          <div>
            <p className="text-[10px] text-slate-600 uppercase tracking-wider">Current Topic</p>
            <p className="text-sm font-medium text-slate-300">{getCurrentTopic()}</p>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* Relevant Videos */}
        <CollapsibleSection title="Videos" defaultOpen={true}>
          <div className="space-y-1">
            {videos.slice(0, 4).map((video) => (
              <VideoCard
                key={video.id}
                title={video.title}
                duration={video.duration}
                thumbnail={video.thumbnail}
                isPlaying={playingVideo === video.id}
                onClick={() => setPlayingVideo(playingVideo === video.id ? null : video.id)}
              />
            ))}
          </div>
          <button className="w-full mt-2 text-[10px] text-cyan-500/70 hover:text-cyan-400 transition">
            View all videos →
          </button>
        </CollapsibleSection>

        {/* Context / Resources */}
        <CollapsibleSection title="Context" defaultOpen={false}>
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-slate-800/30 rounded">
              <div className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-400">Getting Started Guide</p>
                <p className="text-[10px] text-slate-600">PDF • 2.4 MB</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-slate-800/30 rounded">
              <div className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-400">Documentation</p>
                <p className="text-[10px] text-slate-600">External link</p>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-600 mt-3">
            Resources related to your current task.
          </p>
        </CollapsibleSection>
      </div>

      {/* Video Player Preview (when playing) */}
      {playingVideo && (
        <div className="border-t border-slate-800/40 p-3 bg-slate-900/50">
          <div className="relative aspect-video bg-slate-800 rounded-lg overflow-hidden mb-2">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="text-3xl mb-2 block">
                  {videos.find(v => v.id === playingVideo)?.thumbnail}
                </span>
                <p className="text-xs text-slate-400">Video Player</p>
              </div>
            </div>
            {/* Playback controls */}
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center gap-2">
                <button className="text-white">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                </button>
                <div className="flex-1 h-1 bg-slate-700 rounded-full">
                  <div className="w-1/3 h-full bg-cyan-500 rounded-full" />
                </div>
                <span className="text-[10px] text-slate-400">1:24</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-300 font-medium">
            {videos.find(v => v.id === playingVideo)?.title}
          </p>
        </div>
      )}
    </aside>
  );
}

// Live Courses View
function LiveCoursesView() {
  const upcomingCourses = [
    {
      id: '1',
      title: 'Terminal Mastery Workshop',
      instructor: 'Alex Chen',
      date: 'Feb 5, 2026',
      time: '2:00 PM EST',
      spots: 12,
      level: 'Beginner',
    },
    {
      id: '2',
      title: 'Building AI Agents from Scratch',
      instructor: 'Sarah Park',
      date: 'Feb 8, 2026',
      time: '11:00 AM EST',
      spots: 8,
      level: 'Advanced',
    },
    {
      id: '3',
      title: 'API Integration Deep Dive',
      instructor: 'Marcus Johnson',
      date: 'Feb 12, 2026',
      time: '3:00 PM EST',
      spots: 20,
      level: 'Intermediate',
    },
  ];

  const liveCourse = {
    title: 'Claude Code: Advanced Techniques',
    instructor: 'Dr. Maya Rodriguez',
    viewers: 156,
    started: '45 min ago',
  };

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold text-white mb-6">Live Courses</h1>

        {/* Live Now Banner */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400/75 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500/80"></span>
              </span>
              <span className="text-red-400/80 font-medium text-xs uppercase tracking-wide">Live</span>
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium text-sm">{liveCourse.title}</h3>
              <p className="text-slate-500 text-xs">{liveCourse.instructor} · {liveCourse.viewers} watching</p>
            </div>
            <button className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition">
              Join
            </button>
          </div>
        </div>

        {/* Upcoming Schedule */}
        <h2 className="text-sm font-medium text-slate-400 mb-3">Upcoming Sessions</h2>
        <div className="space-y-2">
          {upcomingCourses.map((course) => (
            <div key={course.id} className="bg-slate-800/30 border border-slate-800/40 rounded-lg p-4 hover:bg-slate-800/50 transition">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-white font-medium text-sm">{course.title}</h3>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      course.level === 'Beginner' ? 'bg-slate-700/50 text-slate-400' :
                      course.level === 'Intermediate' ? 'bg-slate-700/50 text-slate-400' :
                      'bg-slate-700/50 text-slate-400'
                    }`}>
                      {course.level}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs">{course.instructor}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-600">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {course.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {course.time}
                    </span>
                    <span>{course.spots} spots</span>
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition">
                  Reserve
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Calendar Preview */}
        <div className="mt-6 p-4 bg-slate-800/20 border border-slate-800/40 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-slate-300 font-medium text-sm">February 2026</h3>
            <div className="flex gap-1">
              <button className="p-1 text-slate-600 hover:text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="p-1 text-slate-600 hover:text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-slate-600 py-1.5">{day}</div>
            ))}
            {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
              <div
                key={day}
                className={`py-1.5 rounded ${
                  [5, 8, 12].includes(day)
                    ? 'bg-cyan-500/10 text-cyan-400/80'
                    : day === 1
                    ? 'bg-slate-700/30 text-slate-400'
                    : 'text-slate-600 hover:bg-slate-800/40'
                }`}
              >
                {day}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Community Feed View
function CommunityFeedView() {
  const posts = [
    {
      id: '1',
      author: { name: 'Alex Chen', handle: '@alexchen', avatar: 'A', verified: true },
      content: 'Just deployed my first AI agent! It handles customer support tickets and has already saved 20+ hours this week.',
      timestamp: '2h',
      likes: 45,
      comments: 12,
      badges: ['AI Operations Master'],
    },
    {
      id: '2',
      author: { name: 'Sarah Park', handle: '@sarahpark', avatar: 'S', verified: true },
      content: 'Completed the Terminal Foundations module! Here\'s my portfolio site I built with Claude Code assistance.',
      timestamp: '4h',
      likes: 89,
      comments: 23,
      badges: ['Certified AI Associate'],
    },
    {
      id: '3',
      author: { name: 'Marcus Johnson', handle: '@marcusj', avatar: 'M', verified: false },
      content: 'Question for the community: What API integrations have been most valuable for your workflow automations?',
      timestamp: '6h',
      likes: 32,
      comments: 47,
      badges: [],
    },
  ];

  return (
    <div className="flex h-full">
      {/* Main Feed */}
      <div className="flex-1 border-r border-slate-800/40 overflow-y-auto">
        <div className="sticky top-0 bg-[#0f1115]/95 backdrop-blur-sm border-b border-slate-800/40 px-6 py-4 z-10">
          <h1 className="text-lg font-semibold text-white">Community</h1>
        </div>

        {/* Compose */}
        <div className="px-6 py-4 border-b border-slate-800/40">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 text-sm font-medium flex-shrink-0">
              G
            </div>
            <div className="flex-1">
              <textarea
                placeholder="Share your progress..."
                className="w-full bg-transparent text-white placeholder-slate-600 resize-none focus:outline-none text-sm"
                rows={2}
              />
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/40">
                <div className="flex gap-1">
                  <button className="p-1.5 text-slate-600 hover:text-slate-400 rounded transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button className="p-1.5 text-slate-600 hover:text-slate-400 rounded transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </button>
                </div>
                <button className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition">
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts */}
        {posts.map((post) => (
          <div key={post.id} className="px-6 py-4 border-b border-slate-800/40 hover:bg-slate-800/10 transition">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 text-sm font-medium flex-shrink-0">
                {post.author.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="font-medium text-slate-300">{post.author.name}</span>
                  {post.author.verified && (
                    <svg className="w-3 h-3 text-cyan-500/70" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  )}
                  <span className="text-slate-600">{post.author.handle}</span>
                  <span className="text-slate-700">·</span>
                  <span className="text-slate-600">{post.timestamp}</span>
                </div>
                {post.badges.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {post.badges.map((badge, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 bg-slate-800/60 text-slate-500 rounded">
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-slate-300 mt-2 text-sm leading-relaxed">{post.content}</p>
                <div className="flex items-center gap-4 mt-2">
                  <button className="flex items-center gap-1.5 text-slate-600 hover:text-slate-400 transition text-xs">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {post.comments}
                  </button>
                  <button className="flex items-center gap-1.5 text-slate-600 hover:text-slate-400 transition text-xs">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {post.likes}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trending Sidebar */}
      <div className="w-64 p-4 overflow-y-auto hidden lg:block">
        <div className="bg-slate-800/20 border border-slate-800/40 rounded-lg p-3 mb-3">
          <h3 className="text-slate-400 font-medium text-xs mb-2">Trending</h3>
          <div className="space-y-2">
            {['#ClaudeCode', '#AIAutomation', '#Portfolio'].map((tag) => (
              <div key={tag} className="text-slate-500 hover:text-slate-300 cursor-pointer text-xs">
                {tag}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-800/20 border border-slate-800/40 rounded-lg p-3">
          <h3 className="text-slate-400 font-medium text-xs mb-2">Top Earners</h3>
          <div className="space-y-2">
            {[
              { name: 'Alex Chen', akus: 12 },
              { name: 'Sarah Park', akus: 10 },
              { name: 'Emily Rodriguez', akus: 8 },
            ].map((user, i) => (
              <div key={user.name} className="flex items-center gap-2 text-xs">
                <span className="text-slate-700 w-3">{i + 1}.</span>
                <div className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center text-slate-500 text-[10px]">
                  {user.name[0]}
                </div>
                <span className="text-slate-500 flex-1">{user.name}</span>
                <span className="text-slate-600">{user.akus}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Projects View
function ProjectsView() {
  const projects = [
    {
      id: '1',
      title: 'AI-Powered Portfolio',
      description: 'Personal portfolio website built with Next.js',
      status: 'completed',
      progress: 100,
      tech: ['Next.js', 'Tailwind', 'Vercel'],
      lastUpdated: '2 days ago',
    },
    {
      id: '2',
      title: 'Email Automation Bot',
      description: 'Automated email responses using GPT-4',
      status: 'in-progress',
      progress: 65,
      tech: ['Python', 'OpenAI', 'Gmail API'],
      lastUpdated: '5 hours ago',
    },
    {
      id: '3',
      title: 'Customer Support Agent',
      description: 'Multi-agent system for support tickets',
      status: 'in-progress',
      progress: 30,
      tech: ['Claude', 'Supabase', 'Next.js'],
      lastUpdated: '1 day ago',
    },
  ];

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-white">Projects</h1>
          <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            New
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-800/30 border border-slate-800/40 rounded-lg p-3">
            <div className="text-lg font-semibold text-white">3</div>
            <div className="text-slate-600 text-xs">Total</div>
          </div>
          <div className="bg-slate-800/30 border border-slate-800/40 rounded-lg p-3">
            <div className="text-lg font-semibold text-slate-400">1</div>
            <div className="text-slate-600 text-xs">Completed</div>
          </div>
          <div className="bg-slate-800/30 border border-slate-800/40 rounded-lg p-3">
            <div className="text-lg font-semibold text-slate-400">2</div>
            <div className="text-slate-600 text-xs">In Progress</div>
          </div>
        </div>

        {/* Project Cards */}
        <div className="space-y-2">
          {projects.map((project) => (
            <div key={project.id} className="bg-slate-800/30 border border-slate-800/40 rounded-lg p-4 hover:bg-slate-800/50 transition">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-white font-medium text-sm">{project.title}</h3>
                  <p className="text-slate-500 text-xs mt-0.5">{project.description}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                  project.status === 'completed'
                    ? 'bg-slate-700/50 text-slate-400'
                    : 'bg-slate-700/50 text-slate-500'
                }`}>
                  {project.status === 'completed' ? 'Done' : 'Active'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {project.tech.map((t) => (
                  <span key={t} className="px-1.5 py-0.5 bg-slate-800/60 text-slate-500 rounded text-[10px]">
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500/60 rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
                <span className="text-slate-600 text-[10px]">{project.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Discussions View
function DiscussionsView() {
  const discussions = [
    {
      id: '1',
      title: 'Best practices for prompt engineering?',
      author: 'Alex Chen',
      replies: 23,
      views: 156,
      lastReply: '10 min ago',
      tags: ['AI', 'Tips'],
      pinned: true,
    },
    {
      id: '2',
      title: 'How to handle API rate limits',
      author: 'Sarah Park',
      replies: 15,
      views: 89,
      lastReply: '1 hour ago',
      tags: ['API'],
      pinned: false,
    },
    {
      id: '3',
      title: 'Showcase: My first automation',
      author: 'Marcus Johnson',
      replies: 8,
      views: 45,
      lastReply: '3 hours ago',
      tags: ['Showcase'],
      pinned: false,
    },
  ];

  const categories = [
    { name: 'General', count: 45 },
    { name: 'Help', count: 23 },
    { name: 'Showcase', count: 12 },
    { name: 'Resources', count: 8 },
  ];

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-semibold text-white">Discussions</h1>
              <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition">
                New
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-2 bg-slate-800/30 border border-slate-800/40 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-slate-700 text-sm"
              />
            </div>

            {/* Discussion List */}
            <div className="space-y-2">
              {discussions.map((discussion) => (
                <div key={discussion.id} className="bg-slate-800/30 border border-slate-800/40 rounded-lg p-3 hover:bg-slate-800/50 transition cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 text-sm font-medium flex-shrink-0">
                      {discussion.author[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {discussion.pinned && (
                          <svg className="w-3 h-3 text-cyan-500/70" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16 4v8l2 2v2h-6v6l-1 1-1-1v-6H4v-2l2-2V4c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2z" />
                          </svg>
                        )}
                        <h3 className="text-slate-300 font-medium text-sm">{discussion.title}</h3>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {discussion.tags.map((tag) => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-slate-800/60 text-slate-600 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-600">
                        <span>{discussion.author}</span>
                        <span>{discussion.replies} replies</span>
                        <span>{discussion.views} views</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Categories Sidebar */}
      <div className="w-52 border-l border-slate-800/40 p-4 overflow-y-auto hidden lg:block">
        <h3 className="text-slate-500 font-medium text-xs mb-2">Categories</h3>
        <div className="space-y-0.5">
          {categories.map((cat) => (
            <button key={cat.name} className="w-full flex items-center justify-between px-2 py-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800/30 rounded transition text-xs">
              <span>{cat.name}</span>
              <span className="text-slate-700">{cat.count}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Leaderboards View
function LeaderboardsView() {
  const leaderboard = [
    { rank: 1, name: 'Alex Chen', akus: 47, streak: 21, change: 0 },
    { rank: 2, name: 'Sarah Park', akus: 42, streak: 18, change: 1 },
    { rank: 3, name: 'Emily Rodriguez', akus: 38, streak: 15, change: -1 },
    { rank: 4, name: 'Marcus Johnson', akus: 35, streak: 12, change: 2 },
    { rank: 5, name: 'Jordan Lee', akus: 32, streak: 10, change: 0 },
    { rank: 6, name: 'Taylor Kim', akus: 28, streak: 8, change: -2 },
    { rank: 7, name: 'Morgan Davis', akus: 25, streak: 7, change: 1 },
    { rank: 8, name: 'Casey Wilson', akus: 22, streak: 5, change: 0 },
  ];

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold text-white mb-6">Leaderboard</h1>

        {/* Filters */}
        <div className="flex gap-1 mb-6">
          {['All Time', 'Month', 'Week'].map((filter, i) => (
            <button
              key={filter}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                i === 0
                  ? 'bg-slate-800 text-slate-300'
                  : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Top 3 */}
        <div className="flex items-end justify-center gap-6 mb-8">
          {/* 2nd Place */}
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 text-sm font-medium mb-1.5">
              S
            </div>
            <span className="text-slate-400 text-xs">{leaderboard[1].name}</span>
            <span className="text-slate-600 text-[10px]">{leaderboard[1].akus} AKUs</span>
            <div className="w-16 h-12 bg-slate-800/40 rounded-t mt-2 flex items-center justify-center">
              <span className="text-lg font-semibold text-slate-600">2</span>
            </div>
          </div>
          {/* 1st Place */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 font-medium mb-1.5">
              A
            </div>
            <span className="text-slate-300 text-xs font-medium">{leaderboard[0].name}</span>
            <span className="text-slate-500 text-[10px]">{leaderboard[0].akus} AKUs</span>
            <div className="w-20 h-16 bg-slate-800/50 rounded-t mt-2 flex items-center justify-center">
              <span className="text-xl font-semibold text-slate-500">1</span>
            </div>
          </div>
          {/* 3rd Place */}
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 text-sm font-medium mb-1.5">
              E
            </div>
            <span className="text-slate-500 text-xs">{leaderboard[2].name}</span>
            <span className="text-slate-600 text-[10px]">{leaderboard[2].akus} AKUs</span>
            <div className="w-14 h-8 bg-slate-800/30 rounded-t mt-2 flex items-center justify-center">
              <span className="text-base font-semibold text-slate-600">3</span>
            </div>
          </div>
        </div>

        {/* Full Leaderboard */}
        <div className="bg-slate-800/20 border border-slate-800/40 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800/40">
                <th className="text-left py-2.5 px-4 text-slate-600 font-medium text-[10px] uppercase tracking-wider">Rank</th>
                <th className="text-left py-2.5 px-4 text-slate-600 font-medium text-[10px] uppercase tracking-wider">User</th>
                <th className="text-right py-2.5 px-4 text-slate-600 font-medium text-[10px] uppercase tracking-wider">AKUs</th>
                <th className="text-right py-2.5 px-4 text-slate-600 font-medium text-[10px] uppercase tracking-wider">Streak</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((user) => (
                <tr key={user.rank} className="border-b border-slate-800/30 last:border-0 hover:bg-slate-800/20 transition">
                  <td className="py-2.5 px-4">
                    <span className="text-slate-500 text-xs">#{user.rank}</span>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-slate-500 text-[10px] font-medium">
                        {user.name[0]}
                      </div>
                      <span className="text-slate-400 text-xs">{user.name}</span>
                      {user.change !== 0 && (
                        <span className={`text-[10px] ${user.change > 0 ? 'text-slate-600' : 'text-slate-600'}`}>
                          {user.change > 0 ? '+' : ''}{user.change}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-400 text-xs">{user.akus}</td>
                  <td className="py-2.5 px-4 text-right text-slate-600 text-xs">{user.streak}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [selectedPath, setSelectedPath] = useState<PathType>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showProgressPanel, setShowProgressPanel] = useState(true);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [activeView, setActiveView] = useState<ViewType>('home');
  const [chatViewMode, setChatViewMode] = useState<'chat' | 'terminal'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const terminalInputRef = useRef<HTMLInputElement>(null);

  // Backend hooks
  const { user, loading: authLoading } = useAuth();

  // Free message limit before requiring auth
  const FREE_MESSAGE_LIMIT = 3;
  const {
    messages,
    isLoading: chatLoading,
    suggestions,
    sendMessage,
    addLocalMessage,
  } = useChat({ tier: selectedPath || undefined });
  const { stats, progress: akuProgress } = useProgress();
  const { presence, updatePresence } = useRealtime(user?.id);

  // Local UI state
  const [inputValue, setInputValue] = useState('');
  const [localTyping, setLocalTyping] = useState(false);
  const isTyping = chatLoading || localTyping;

  // Fetch certificates
  useEffect(() => {
    async function fetchCertificates() {
      try {
        const response = await fetch('/api/certificates');
        if (response.ok) {
          const data = await response.json();
          setCertificates(data.certificates || []);
        }
      } catch (error) {
        console.error('Failed to fetch certificates:', error);
      }
    }
    if (user) {
      fetchCertificates();
    }
  }, [user]);

  // Scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update presence
  useEffect(() => {
    if (user?.id) {
      updatePresence('chat');
    }
  }, [user?.id, updatePresence]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0 && !authLoading) {
      addLocalMessage(
        'assistant',
        [
          "Hey! I'm Phazur, your AI coach.",
          "I'll guide you through your journey to AI mastery — using questions to help you discover the answers, not just giving them to you.",
          "First, tell me: What brings you here today?",
        ],
        [
          "I want to build a portfolio",
          "I want to save time at work",
          "I want to scale my business",
        ]
      );
    }
  }, [authLoading, messages.length, addLocalMessage]);

  // Helper to add assistant messages
  const addAssistantMessage = useCallback((content: string[], suggestionList?: string[]) => {
    addLocalMessage('assistant', content, suggestionList);
  }, [addLocalMessage]);

  // Helper to add user messages
  const addUserMessage = useCallback((content: string) => {
    addLocalMessage('user', [content]);
  }, [addLocalMessage]);

  const handleSuggestionClick = (suggestion: string) => {
    if (suggestion.includes('portfolio')) {
      handlePathSelection('student', suggestion);
    } else if (suggestion.includes('save time') || suggestion.includes('work')) {
      handlePathSelection('employee', suggestion);
    } else if (suggestion.includes('scale') || suggestion.includes('business')) {
      handlePathSelection('owner', suggestion);
    } else {
      handleUserResponse(suggestion);
    }
  };

  const handlePathSelection = (path: PathType, displayText: string) => {
    if (!path) return;

    const pathInfo = PATH_INFO[path];
    setSelectedPath(path);
    addUserMessage(displayText);

    setLocalTyping(true);
    setTimeout(() => {
      setLocalTyping(false);
      setCurrentStep(1);

      const welcomeMessages: Record<string, { content: string[]; suggestions: string[] }> = {
        student: {
          content: [
            `Great choice! You're on the path to becoming a ${pathInfo.cert}.`,
            "Here's what we'll build together:",
            "A live, AI-enhanced portfolio website\nReal projects that prove you can ship code\nA blockchain-verified credential for LinkedIn",
            `The investment: ${pathInfo.price} — only paid after you complete your capstone.`,
            "Let me assess where you're starting from. Have you ever used a terminal or command line before?",
          ],
          suggestions: [
            "Yes, I'm comfortable with terminal",
            "I've tried it but need practice",
            "No, I'm completely new to this",
          ],
        },
        employee: {
          content: [
            `Smart move! You're on the path to becoming a ${pathInfo.cert}.`,
            "Here's what we'll build together:",
            "A custom Internal Knowledge GPT for your company\nAutomated email workflows that save 10+ hours/week\nAPI integrations that work while you sleep",
            `The investment: ${pathInfo.price} — only paid after you complete your capstone.`,
            "What's the most repetitive task you do every week?",
          ],
          suggestions: [
            "Email management and responses",
            "Data entry and reports",
            "Meeting scheduling and notes",
            "Something else",
          ],
        },
        owner: {
          content: [
            `Visionary thinking! You're on the path to becoming an ${pathInfo.cert}.`,
            "Here's what we'll build together:",
            "End-to-end autonomous sales & research chains\nMulti-agent systems that replace entire departments\nAI strategy that scales without scaling headcount",
            `The investment: ${pathInfo.price} — only paid after you complete your capstone.`,
            "What's the biggest bottleneck in your operations right now?",
          ],
          suggestions: [
            "Lead generation and outreach",
            "Customer support volume",
            "Manual research and analysis",
            "Something else",
          ],
        },
      };

      const welcome = welcomeMessages[path];
      addAssistantMessage(welcome.content, welcome.suggestions);
    }, 1500);
  };

  const handleUserResponse = async (text?: string) => {
    const content = text || inputValue.trim();
    if (!content) return;

    addUserMessage(content);
    setInputValue('');

    // During onboarding flow, use local responses
    if (currentStep < 5 && selectedPath) {
      const step = currentStep + 1;
      setCurrentStep(step);
      setLocalTyping(true);

      await new Promise(resolve => setTimeout(resolve, 1500));
      setLocalTyping(false);

      const response = getCoachingResponse(selectedPath, step, content);
      addAssistantMessage(response.content, response.suggestions);
    } else {
      // After onboarding, use real AI API
      try {
        await sendMessage(content);
        setCurrentStep(prev => prev + 1);
      } catch (error) {
        console.error('Chat error:', error);
        addAssistantMessage([
          "I had trouble connecting. Let me try a different approach.",
          "What specific topic would you like to explore?",
        ], [
          "Terminal basics",
          "AI-powered coding",
          "Building automations",
        ]);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserResponse();
    }
  };

  // Calculate progress percentage
  const completedAkus = stats?.completed || 0;
  const targetAkus = selectedPath ? PATH_INFO[selectedPath].requiredAkus : 10;
  const progressPercent = Math.min((completedAkus / targetAkus) * 100, 100);

  // Count user messages for auth gate
  const userMessageCount = messages.filter(msg => msg.role === 'user').length;
  const requiresAuth = !user && userMessageCount >= FREE_MESSAGE_LIMIT;

  // Check if certificate is earned
  const hasCertificate = (type: string) => certificates.some(c => c.certificate_type === type);

  return (
    <div className="h-screen bg-[#0f1115] flex overflow-hidden">
      {/* Left Sidebar - Clean Navigation */}
      <aside className="w-52 border-r border-slate-800/40 flex flex-col bg-[#0f1115] flex-shrink-0">
        {/* Logo */}
        <div className="px-4 py-5">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Phazur" width={28} height={28} className="invert opacity-80" />
            <span className="text-white font-medium">Phazur</span>
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="px-3 space-y-0.5">
          <NavItem
            active={activeView === 'home'}
            label="Home"
            onClick={() => setActiveView('home')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            }
          />
          <NavItem
            label="Learn"
            href="/learn"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
          />
        </nav>

        {/* Divider */}
        <div className="mx-4 my-3 border-t border-slate-800/40" />

        {/* Course & Community Features */}
        <nav className="px-3 space-y-0.5">
          <NavItem
            active={activeView === 'live-courses'}
            label="Live Courses"
            onClick={() => setActiveView('live-courses')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            }
          />
          <NavItem
            active={activeView === 'community'}
            label="Community Feed"
            onClick={() => setActiveView('community')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            }
          />
          <NavItem
            active={activeView === 'projects'}
            label="Projects"
            onClick={() => setActiveView('projects')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            }
          />
          <NavItem
            active={activeView === 'discussions'}
            label="Discussions"
            onClick={() => setActiveView('discussions')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            }
          />
          <NavItem
            active={activeView === 'leaderboards'}
            label="Leaderboards"
            onClick={() => setActiveView('leaderboards')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            }
          />
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User Profile */}
        <div className="p-4 border-t border-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 text-sm font-medium">
              {user?.email?.charAt(0).toUpperCase() || 'G'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-300 text-xs font-medium truncate">{user?.email || 'Guest'}</p>
              <p className="text-slate-600 text-[10px]">{selectedPath ? PATH_INFO[selectedPath].title : 'Choose path'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {activeView === 'home' ? (
          <>
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-3 border-b border-slate-800/40">
              <div className="flex items-center gap-2.5">
                <AIAvatar size="sm" />
                <div>
                  <h1 className="text-slate-200 font-medium text-sm">Phazur</h1>
                  <p className="text-slate-600 text-[10px]">
                    {selectedPath ? PATH_INFO[selectedPath].title : 'Choose path'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-800/50 rounded-lg p-0.5">
                  <button
                    onClick={() => setChatViewMode('chat')}
                    className={`px-2.5 py-1 text-xs rounded-md transition ${
                      chatViewMode === 'chat'
                        ? 'bg-slate-700 text-slate-200'
                        : 'text-slate-500 hover:text-slate-400'
                    }`}
                    title="Chat view"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setChatViewMode('terminal')}
                    className={`px-2.5 py-1 text-xs rounded-md transition ${
                      chatViewMode === 'terminal'
                        ? 'bg-slate-700 text-slate-200'
                        : 'text-slate-500 hover:text-slate-400'
                    }`}
                    title="Terminal view"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>

                {!showProgressPanel && (
                  <button
                    onClick={() => setShowProgressPanel(true)}
                    className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-400 bg-slate-800/50 rounded transition flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Tutor
                  </button>
                )}
              </div>
            </header>

            {/* Messages */}
            <div className={`flex-1 overflow-y-auto ${chatViewMode === 'terminal' ? 'bg-[#0a0c0f]' : ''}`}>
              {chatViewMode === 'chat' ? (
                /* Chat View */
                <div className="px-6 py-4">
                  <div className="max-w-2xl mx-auto">
                    {messages.map((msg) => (
                      <div key={msg.id} className="mb-4">
                        {msg.role === 'assistant' ? (
                          <div className="flex gap-2.5">
                            <AIAvatar size="sm" />
                            <div className="flex-1 space-y-1.5">
                              {msg.content.map((paragraph, i) => (
                                <div
                                  key={i}
                                  className="bg-slate-800/40 text-slate-300 px-3.5 py-2.5 rounded-lg rounded-tl-sm max-w-fit"
                                >
                                  <p className="whitespace-pre-wrap leading-relaxed text-sm">{paragraph}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <div className="bg-slate-700/60 text-slate-200 px-3.5 py-2 rounded-lg rounded-tr-sm max-w-xs">
                              <p className="text-sm">{msg.content[0]}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex gap-2.5 mb-4">
                        <AIAvatar size="sm" />
                        <div className="bg-slate-800/40 px-3.5 py-2.5 rounded-lg rounded-tl-sm">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </div>
              ) : (
                /* Terminal View */
                <div className="p-4 font-mono text-sm">
                  {/* Terminal Header */}
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800/40">
                    <div className="flex gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-red-500/60" />
                      <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                      <span className="w-3 h-3 rounded-full bg-green-500/60" />
                    </div>
                    <span className="text-slate-600 text-xs ml-2">phazur@coach ~ {selectedPath ? `/${selectedPath}` : ''}</span>
                  </div>

                  {/* Terminal Messages */}
                  <div className="space-y-3">
                    {messages.map((msg, msgIndex) => (
                      <div key={msg.id}>
                        {msg.role === 'assistant' ? (
                          <div className="space-y-1">
                            <div className="flex items-start gap-2">
                              <span className="text-cyan-400 select-none">phazur$</span>
                              <span className="text-slate-500 text-xs">#{msgIndex + 1}</span>
                            </div>
                            {msg.content.map((paragraph, i) => (
                              <p key={i} className="text-slate-300 pl-[4.5rem] whitespace-pre-wrap leading-relaxed">
                                {paragraph}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <span className="text-emerald-400 select-none">user$</span>
                            <span className="text-slate-200">{msg.content[0]}</span>
                          </div>
                        )}
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-400 select-none">phazur$</span>
                        <span className="text-slate-500 animate-pulse">_</span>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className={`px-6 pb-4 ${chatViewMode === 'terminal' ? 'bg-[#0a0c0f]' : ''}`}>
              <div className={chatViewMode === 'terminal' ? '' : 'max-w-2xl mx-auto'}>
                {requiresAuth ? (
                  /* Auth Gate - Show after 3 messages for unauthenticated users */
                  <div className={`p-4 ${chatViewMode === 'terminal' ? 'bg-slate-900/50 border-slate-800/40' : 'bg-slate-800/30 border-slate-800/60'} border rounded-lg`}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-slate-200 mb-1">Sign in to continue</h3>
                        <p className="text-xs text-slate-500 mb-4">
                          Create a free account to unlock unlimited conversations with Phazur and track your learning progress.
                        </p>
                        <div className="flex items-center gap-2">
                          <Link
                            href="/login"
                            className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors"
                          >
                            Sign In
                          </Link>
                          <Link
                            href="/login?signup=true"
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                          >
                            Create Account
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : chatViewMode === 'terminal' ? (
                  /* Terminal Input */
                  <div className="font-mono">
                    {/* Terminal Suggestions */}
                    {messages.length > 0 && (messages[messages.length - 1].suggestions || suggestions.length > 0) && !isTyping && (
                      <div className="mb-2 flex gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                        <span className="text-slate-600 select-none">hints:</span>
                        {(messages[messages.length - 1].suggestions || suggestions)?.map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="text-cyan-500/70 hover:text-cyan-400 transition whitespace-nowrap"
                          >
                            [{i + 1}] {suggestion}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Terminal Input Line */}
                    <div className="flex items-center gap-2 border-t border-slate-800/40 pt-3">
                      <span className="text-emerald-400 select-none">user$</span>
                      <input
                        ref={terminalInputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleUserResponse();
                          }
                        }}
                        placeholder="type your message..."
                        className="flex-1 bg-transparent text-slate-200 placeholder-slate-700 focus:outline-none text-sm"
                        disabled={isTyping}
                      />
                      <button
                        onClick={() => handleUserResponse()}
                        disabled={!inputValue.trim() || isTyping}
                        className="text-slate-600 hover:text-slate-400 disabled:opacity-30 transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Suggestion pills */}
                    {messages.length > 0 && (messages[messages.length - 1].suggestions || suggestions.length > 0) && !isTyping && (
                      <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {(messages[messages.length - 1].suggestions || suggestions)?.map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="flex-shrink-0 px-3 py-1.5 bg-slate-800/40 hover:bg-slate-800/60 text-slate-400 text-xs rounded-lg border border-slate-800/60 hover:border-slate-700 transition whitespace-nowrap"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Input */}
                    <div className="relative">
                      <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Message..."
                        rows={1}
                        className="w-full px-3.5 py-2.5 pr-10 bg-slate-800/40 border border-slate-800/60 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-700 resize-none text-sm"
                      />
                      <button
                        onClick={() => handleUserResponse()}
                        disabled={!inputValue.trim() || isTyping}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-600 hover:text-slate-400 disabled:opacity-30 disabled:hover:text-slate-600 transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        ) : activeView === 'live-courses' ? (
          <LiveCoursesView />
        ) : activeView === 'community' ? (
          <CommunityFeedView />
        ) : activeView === 'projects' ? (
          <ProjectsView />
        ) : activeView === 'discussions' ? (
          <DiscussionsView />
        ) : activeView === 'leaderboards' ? (
          <LeaderboardsView />
        ) : null}
      </main>

      {/* Tutor Sidebar - Right Side */}
      {showProgressPanel && (
        <TutorSidebar
          currentStep={currentStep}
          selectedPath={selectedPath}
          messages={messages}
          onClose={() => setShowProgressPanel(false)}
        />
      )}
    </div>
  );
}

// Coaching flow logic
function getCoachingResponse(
  path: PathType,
  step: number,
  userInput: string
): { content: string[]; suggestions?: string[] } {
  if (!path) {
    return {
      content: ["Let's get started! What's your primary goal?"],
      suggestions: [
        "I want to build a portfolio",
        "I want to save time at work",
        "I want to scale my business",
      ],
    };
  }

  const flows: Record<string, Record<number, { content: string[]; suggestions?: string[] }>> = {
    student: {
      2: {
        content: [
          "That helps me understand where you're starting from.",
          "Here's your personalized roadmap:",
          "Week 1-2: Terminal Foundations\n→ Learn to navigate like a developer\n→ Execute your first AI commands",
          "Week 3-4: AI-Powered Development\n→ Build components with AI assistance\n→ Deploy your first live project",
          "Week 5-6: Portfolio Capstone\n→ Create your showcase site\n→ Earn your Certified AI Associate credential",
          "What would you like to start with?",
        ],
        suggestions: [
          "Set up my environment",
          "Learn the basics first",
          "Jump straight to building",
        ],
      },
      3: {
        content: [
          "Great choice! Let's get you set up.",
          "First, let me ask you a few quick questions to personalize your experience.",
          "Do you have any prior coding experience?",
        ],
        suggestions: [
          "Yes, I've coded before",
          "Some basic HTML/CSS",
          "Completely new to coding",
        ],
      },
      4: {
        content: [
          "Perfect! I'll tailor the curriculum to your level.",
          "Now, what type of portfolio project interests you most?",
        ],
        suggestions: [
          "Personal website",
          "Project showcase",
          "Blog/writing portfolio",
        ],
      },
    },
    employee: {
      2: {
        content: [
          "That's a perfect pain point to automate!",
          "Here's your efficiency roadmap:",
          "Week 1-2: Workflow Analysis\n→ Map your repetitive tasks\n→ Identify automation opportunities",
          "Week 3-4: Custom GPT Development\n→ Build your Internal Knowledge Bot\n→ Connect to your company's data",
          "Week 5-6: API Automation\n→ Create email/calendar automations\n→ Deploy your Efficiency Capstone",
          "What's your current tech stack?",
        ],
        suggestions: [
          "Google Workspace",
          "Microsoft 365",
          "Mix of tools",
        ],
      },
      3: {
        content: [
          "I can work with that.",
          "What would have the biggest impact on your daily workflow?",
        ],
        suggestions: [
          "Email automation",
          "Meeting summaries",
          "Report generation",
        ],
      },
    },
    owner: {
      2: {
        content: [
          "That bottleneck is exactly what AI agents solve.",
          "Here's your operations scaling roadmap:",
          "Week 1-2: Operations Audit\n→ Map your entire business workflow\n→ Identify agent replacement opportunities",
          "Week 3-4: Agent Development\n→ Build your first autonomous agent\n→ Test with real business scenarios",
          "Week 5-8: Multi-Agent Orchestration\n→ Create agent chains that work together\n→ Deploy your Operations Capstone",
          "How many people are on your team?",
        ],
        suggestions: [
          "1-10 employees",
          "11-50 employees",
          "50+ employees",
        ],
      },
      3: {
        content: [
          "Great context!",
          "Here's what successful owners at your scale typically automate first:",
          "1. Research Agent - Competitive analysis\n2. Outreach Agent - Lead qualification\n3. Operations Agent - Reporting, scheduling",
          "Which area would have the biggest impact?",
        ],
        suggestions: [
          "Research automation",
          "Sales/outreach",
          "Operations",
        ],
      },
    },
  };

  const pathFlow = flows[path];
  if (pathFlow && pathFlow[step]) {
    return pathFlow[step];
  }

  return {
    content: [
      "You're making great progress!",
      "Keep chatting with me to continue your learning journey. I'm here to help you master AI workflows.",
    ],
    suggestions: [
      "What's my next step?",
      "Show me a challenge",
      "Explain a concept",
    ],
  };
}
