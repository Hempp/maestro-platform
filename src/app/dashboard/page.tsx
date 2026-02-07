'use client';

/**
 * PHAZUR DASHBOARD
 * 3-panel layout: Progress sidebar | Chat | Quick actions
 * AI Coach with full OpenAI integration
 * Progress tracking and certificates display
 */

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { useProgress } from '@/hooks/useProgress';
import { useRealtime } from '@/hooks/useRealtime';

type PathType = 'student' | 'employee' | 'owner' | null;
type ViewType = 'home' | 'live-courses';

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

// Navigation item component - clean minimal with collapse support
function NavItem({
  icon,
  label,
  active = false,
  locked = false,
  href,
  onClick,
  collapsed = false
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  locked?: boolean;
  href?: string;
  onClick?: () => void;
  collapsed?: boolean;
}) {
  const content = (
    <div
      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
        active
          ? 'bg-slate-800/80 text-white'
          : locked
            ? 'text-slate-700 cursor-not-allowed'
            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
      } ${collapsed ? 'justify-center' : ''}`}
      title={collapsed ? label : undefined}
    >
      <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">{icon}</span>
      {!collapsed && <span className="text-sm flex-1">{label}</span>}
      {!collapsed && locked && (
        <svg className="w-3.5 h-3.5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )}
      {/* Tooltip on hover when collapsed */}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none">
          {label}
        </div>
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

// Video result interface
interface VideoResult {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration?: string;
  viewCount?: string;
  url: string;
}

// Video Card component - supports real YouTube thumbnails
function VideoCard({
  video,
  isPlaying = false,
  onClick,
}: {
  video: VideoResult;
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
      <div className="relative w-20 h-12 bg-slate-800 rounded flex-shrink-0 overflow-hidden">
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition">
          {isPlaying ? (
            <div className="w-4 h-4 border-2 border-white rounded-sm" />
          ) : (
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </div>
        {video.duration && (
          <span className="absolute bottom-0.5 right-0.5 px-1 bg-black/80 text-[9px] text-white rounded">
            {video.duration}
          </span>
        )}
      </div>
      <div className="flex-1 text-left min-w-0">
        <h4 className={`text-xs font-medium line-clamp-2 ${isPlaying ? 'text-cyan-400' : 'text-slate-300'}`}>
          {video.title}
        </h4>
        <p className="text-[10px] text-slate-600 mt-0.5 truncate">{video.channelTitle}</p>
        {video.viewCount && (
          <p className="text-[10px] text-slate-700">{video.viewCount}</p>
        )}
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
  const [playingVideo, setPlayingVideo] = useState<VideoResult | null>(null);
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [videoSource, setVideoSource] = useState<'youtube' | 'mock'>('mock');

  // Fetch videos from API when path or step changes
  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/tutor/videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: selectedPath,
            step: currentStep,
            maxResults: 5,
          }),
        });
        const data = await response.json();
        setVideos(data.videos || []);
        setVideoSource(data.source || 'mock');
      } catch (error) {
        console.error('Failed to fetch videos:', error);
        setVideos([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, [selectedPath, currentStep]);

  // Determine current topic based on messages and step
  const getCurrentTopic = () => {
    if (!selectedPath) return 'Getting Started';
    if (currentStep < 2) return 'Introduction & Setup';
    if (currentStep < 4) return 'Core Concepts';
    return 'Building Projects';
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
        <CollapsibleSection title={`Videos ${videoSource === 'youtube' ? '' : '(Demo)'}`} defaultOpen={true}>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin" />
            </div>
          ) : videos.length > 0 ? (
            <div className="space-y-1">
              {videos.slice(0, 4).map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  isPlaying={playingVideo?.id === video.id}
                  onClick={() => setPlayingVideo(playingVideo?.id === video.id ? null : video)}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-600 text-center py-4">No videos found</p>
          )}
          {videos.length > 4 && (
            <button className="w-full mt-2 text-[10px] text-cyan-500/70 hover:text-cyan-400 transition">
              View all {videos.length} videos →
            </button>
          )}
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

      {/* Video Player - YouTube Embed */}
      {playingVideo && (
        <div className="border-t border-slate-800/40 p-3 bg-slate-900/50">
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-2">
            {playingVideo.url && playingVideo.url !== '#' ? (
              <iframe
                src={`https://www.youtube.com/embed/${playingVideo.id}?autoplay=1&rel=0`}
                title={playingVideo.title}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-12 h-12 text-slate-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-slate-500">Demo Video</p>
                  <p className="text-[10px] text-slate-600 mt-1">Add YouTube API key to enable</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-300 font-medium line-clamp-2">{playingVideo.title}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{playingVideo.channelTitle}</p>
            </div>
            <button
              onClick={() => setPlayingVideo(null)}
              className="p-1 text-slate-600 hover:text-slate-400 transition flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {playingVideo.url && playingVideo.url !== '#' && (
            <a
              href={playingVideo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 mt-2 text-[10px] text-cyan-500/70 hover:text-cyan-400 transition"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in YouTube
            </a>
          )}
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

function DashboardContent() {
  const searchParams = useSearchParams();
  const moduleParam = searchParams.get('module');

  const [selectedPath, setSelectedPath] = useState<PathType>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showProgressPanel, setShowProgressPanel] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [activeView, setActiveView] = useState<ViewType>('home');
  const [chatViewMode, setChatViewMode] = useState<'chat' | 'terminal'>('chat');
  const [moduleInitialized, setModuleInitialized] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
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

  // Load sidebar collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dashboardSidebarCollapsed');
    if (saved !== null) {
      setSidebarCollapsed(saved === 'true');
    }
  }, []);

  // Toggle sidebar collapsed state
  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('dashboardSidebarCollapsed', String(newState));
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

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

  // Initialize chat with module context if module param is present
  useEffect(() => {
    async function initModuleChat() {
      if (!moduleParam || moduleInitialized || authLoading) return;

      // Determine tier from module ID
      let tier: 'student' | 'employee' | 'owner' = 'student';
      if (moduleParam.startsWith('employee-')) tier = 'employee';
      else if (moduleParam.startsWith('owner-')) tier = 'owner';

      try {
        const response = await fetch(`/api/curriculum?tier=${tier}&moduleId=${moduleParam}`);
        if (response.ok) {
          const data = await response.json();
          const module = data.module;

          if (module) {
            // Set the path based on module tier
            setSelectedPath(tier);
            setModuleInitialized(true);

            // Initialize chat with module project context
            addLocalMessage(
              'assistant',
              [
                `Let's work on: **${module.title}**`,
                module.whyItMatters,
                `**Your Project:** ${module.project.title}`,
                module.project.description,
                `**What you'll create:** ${module.project.deliverable}`,
                `Ready to begin? Tell me about yourself and what you'd like to focus on.`,
              ],
              [
                "Let's start from the beginning",
                "I have some experience with this",
                "Help me understand the concepts first",
              ]
            );
            return;
          }
        }
      } catch (error) {
        console.error('Failed to load module:', error);
      }

      // Fallback to normal welcome if module load fails
      setModuleInitialized(true);
    }

    initModuleChat();
  }, [moduleParam, moduleInitialized, authLoading, addLocalMessage]);

  // Initial welcome message (only if no module param)
  useEffect(() => {
    if (messages.length === 0 && !authLoading && !moduleParam) {
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
  }, [authLoading, messages.length, addLocalMessage, moduleParam]);

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
      {/* Left Sidebar - Collapsible Navigation */}
      <aside className={`border-r border-slate-800/40 flex flex-col bg-[#0f1115] flex-shrink-0 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'w-16' : 'w-52'
      }`}>
        {/* Logo */}
        <div className={`py-5 ${sidebarCollapsed ? 'px-2 flex justify-center' : 'px-4'}`}>
          <Link href="/" className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-2.5'}`}>
            <Image src="/logo.png" alt="Phazur" width={28} height={28} className="invert opacity-80 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-white font-medium">Phazur</span>}
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className={`space-y-0.5 ${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
          <NavItem
            active={activeView === 'home'}
            label="Home"
            onClick={() => setActiveView('home')}
            collapsed={sidebarCollapsed}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            }
          />
          <NavItem
            label="Learn"
            href="/learn"
            collapsed={sidebarCollapsed}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
          />
        </nav>

        {/* Divider */}
        <div className={`my-3 border-t border-slate-800/40 ${sidebarCollapsed ? 'mx-2' : 'mx-4'}`} />

        {/* Course & Community Features */}
        <nav className={`space-y-0.5 ${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
          <NavItem
            active={activeView === 'live-courses'}
            label="Live Courses"
            onClick={() => setActiveView('live-courses')}
            collapsed={sidebarCollapsed}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            }
          />
                  </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Settings Nav Item */}
        <nav className={`space-y-0.5 ${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
          <NavItem
            label="Settings"
            href="/dashboard/settings"
            collapsed={sidebarCollapsed}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
        </nav>

        {/* Collapse Toggle */}
        <div className={`pb-2 ${sidebarCollapsed ? 'px-2 flex justify-center' : 'px-3'}`}>
          <button
            onClick={toggleSidebar}
            className={`flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 rounded-lg transition-all w-full ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            {!sidebarCollapsed && <span className="text-xs">Collapse</span>}
          </button>
        </div>

        {/* User Profile with Dropdown */}
        <div className={`p-4 border-t border-slate-800/40 ${sidebarCollapsed ? 'px-2' : ''} relative`} ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`w-full rounded-lg hover:bg-slate-800/50 transition-colors ${sidebarCollapsed ? 'p-1' : 'p-2 -m-2'}`}
          >
            {sidebarCollapsed ? (
              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 text-sm font-medium">
                  {user?.email?.charAt(0).toUpperCase() || 'G'}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 text-sm font-medium flex-shrink-0">
                  {user?.email?.charAt(0).toUpperCase() || 'G'}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-slate-300 text-xs font-medium truncate">{user?.email || 'Guest'}</p>
                  <p className="text-slate-600 text-[10px]">{selectedPath ? PATH_INFO[selectedPath].title : 'Choose path'}</p>
                </div>
                <svg className={`w-4 h-4 text-slate-500 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            )}
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className={`absolute ${sidebarCollapsed ? 'left-full ml-2 bottom-0' : 'bottom-full left-0 right-0 mb-2'} bg-slate-900 border border-slate-700/50 rounded-lg shadow-xl overflow-hidden z-50`}>
              <div className="p-3 border-b border-slate-800/50">
                <p className="text-slate-300 text-sm font-medium truncate">{user?.email || 'Guest'}</p>
                <p className="text-slate-500 text-xs mt-0.5">{selectedPath ? PATH_INFO[selectedPath].title : 'No path selected'}</p>
              </div>
              <div className="p-1">
                <Link
                  href="/dashboard/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm">Settings</span>
                </Link>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm">Profile</span>
                </Link>
                <div className="my-1 border-t border-slate-800/50"></div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors w-full"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-sm">Sign out</span>
                </button>
              </div>
            </div>
          )}
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

// Wrapper with Suspense for useSearchParams
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
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
