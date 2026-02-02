'use client';

/**
 * PHAZUR DASHBOARD
 * 3-panel layout: Progress sidebar | Chat | Quick actions
 * AI Coach with full OpenAI integration
 * Progress tracking and certificates display
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { useProgress } from '@/hooks/useProgress';
import { useRealtime } from '@/hooks/useRealtime';

type PathType = 'student' | 'employee' | 'owner' | null;

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
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10',
      bgIcon: 'bg-emerald-500/20',
    },
  },
  employee: {
    title: 'The Employee',
    subtitle: 'Efficiency Mastery',
    cert: 'Workflow Efficiency Lead',
    price: '$199',
    requiredAkus: 15,
    styles: {
      border: 'border-blue-500/30',
      bg: 'bg-blue-500/10',
      bgIcon: 'bg-blue-500/20',
    },
  },
  owner: {
    title: 'The Owner',
    subtitle: 'Operations Scaling',
    cert: 'AI Operations Master',
    price: '$499',
    requiredAkus: 20,
    styles: {
      border: 'border-purple-500/30',
      bg: 'bg-purple-500/10',
      bgIcon: 'bg-purple-500/20',
    },
  },
};

// Checkered avatar component
function CheckeredAvatar({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  return (
    <div className={`${sizeClass} rounded-lg bg-slate-800 p-1.5 flex-shrink-0`}>
      <div className="grid grid-cols-4 gap-0.5 w-full h-full">
        {[...Array(16)].map((_, i) => (
          <div
            key={i}
            className={`rounded-[1px] ${
              (Math.floor(i / 4) + i) % 2 === 0 ? 'bg-slate-600' : 'bg-slate-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// Progress ring component
function ProgressRing({ progress, size = 60, strokeWidth = 6 }: { progress: number; size?: number; strokeWidth?: number }) {
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
        className="text-slate-700"
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
        className="text-emerald-500 transition-all duration-500"
      />
    </svg>
  );
}

// Navigation item component
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
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active
        ? 'bg-slate-700/80 text-white'
        : locked
          ? 'text-slate-600 cursor-not-allowed'
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
    }`}>
      <span className="w-6 h-6 flex items-center justify-center">{icon}</span>
      <span className="font-medium text-sm flex-1">{label}</span>
      {locked && (
        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

// Certificate card component
function CertificateCard({
  name,
  designation,
  earned,
  progress,
  required,
  color = 'emerald'
}: {
  name: string;
  designation: string;
  earned: boolean;
  progress: number;
  required: number;
  color?: string;
}) {
  const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  };
  const colors = colorClasses[color] || colorClasses.emerald;

  return (
    <div className={`p-3 rounded-lg border ${earned ? colors.border : 'border-slate-700'} ${earned ? colors.bg : 'bg-slate-800/50'}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className={`text-sm font-medium ${earned ? colors.text : 'text-slate-300'}`}>{name}</h4>
          <p className="text-xs text-slate-500">{designation}</p>
        </div>
        {earned ? (
          <div className={`w-6 h-6 rounded-full ${colors.bg} flex items-center justify-center`}>
            <svg className={`w-4 h-4 ${colors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : (
          <span className="text-xs text-slate-500">{progress}/{required} AKUs</span>
        )}
      </div>
      {!earned && (
        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.bg.replace('/10', '')} rounded-full transition-all duration-500`}
            style={{ width: `${Math.min((progress / required) * 100, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [selectedPath, setSelectedPath] = useState<PathType>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showProgressPanel, setShowProgressPanel] = useState(true);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Backend hooks
  const { user, loading: authLoading } = useAuth();
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

  // Check if certificate is earned
  const hasCertificate = (type: string) => certificates.some(c => c.certificate_type === type);

  return (
    <div className="h-screen bg-[#1a1d21] flex overflow-hidden">
      {/* Left Sidebar - Expanded Navigation */}
      <aside className="w-56 border-r border-slate-800/50 flex flex-col bg-[#1a1d21] flex-shrink-0">
        {/* Logo */}
        <div className="p-4 mb-2">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <span className="text-white font-semibold text-lg">Phazur</span>
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="px-3 space-y-1">
          <NavItem
            active
            label="Home"
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
          <NavItem
            label="Services"
            onClick={() => setShowProgressPanel(!showProgressPanel)}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
        </nav>

        {/* Divider */}
        <div className="mx-4 my-4 border-t border-slate-800/50" />

        {/* Course & Community Features */}
        <nav className="px-3 space-y-1">
          <NavItem
            locked
            label="Live Courses"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            }
          />
          <NavItem
            locked
            label="Course Finder"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
          <NavItem
            locked
            label="Community Feed"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            }
          />
          <NavItem
            locked
            label="Projects"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            }
          />
          <NavItem
            locked
            label="Discussions"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            }
          />
          <NavItem
            locked
            label="Leaderboards"
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
        <div className="p-4 border-t border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-medium">
              {user?.email?.charAt(0).toUpperCase() || 'G'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.email || 'Guest'}</p>
              <p className="text-slate-500 text-xs">{selectedPath ? PATH_INFO[selectedPath].title : 'Choose a path'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Progress Panel */}
      {showProgressPanel && (
        <aside className="w-72 border-r border-slate-800/50 flex flex-col bg-[#1e2227] flex-shrink-0 overflow-y-auto">
          {/* Progress Header */}
          <div className="p-4 border-b border-slate-800/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Your Progress</h2>
              <button
                onClick={() => setShowProgressPanel(false)}
                className="text-slate-500 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Progress Ring */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <ProgressRing progress={progressPercent} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{Math.round(progressPercent)}%</span>
                </div>
              </div>
              <div>
                <p className="text-white font-medium">{completedAkus} AKUs</p>
                <p className="text-slate-500 text-sm">of {targetAkus} completed</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="p-4 border-b border-slate-800/50">
            <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-3">Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  </svg>
                  <span className="text-xl font-bold text-white">{stats?.currentStreak || 0}</span>
                </div>
                <p className="text-slate-500 text-xs">Day Streak</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xl font-bold text-white">{Math.round((stats?.totalTimeSpent || 0) / 60)}h</span>
                </div>
                <p className="text-slate-500 text-xs">Time Invested</p>
              </div>
            </div>
          </div>

          {/* Current Path */}
          {selectedPath && (
            <div className="p-4 border-b border-slate-800/50">
              <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-3">Current Path</h3>
              <div className={`p-3 rounded-lg border ${PATH_INFO[selectedPath].styles.border} ${PATH_INFO[selectedPath].styles.bg}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${PATH_INFO[selectedPath].styles.bgIcon} flex items-center justify-center`}>
                    {selectedPath === 'student' && <span className="text-lg">🎓</span>}
                    {selectedPath === 'employee' && <span className="text-lg">⚡</span>}
                    {selectedPath === 'owner' && <span className="text-lg">🚀</span>}
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm">{PATH_INFO[selectedPath].title}</h4>
                    <p className="text-slate-500 text-xs">{PATH_INFO[selectedPath].subtitle}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Certificates */}
          <div className="p-4 flex-1">
            <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-3">Certificates</h3>
            <div className="space-y-3">
              <CertificateCard
                name="Certified AI Associate"
                designation="Proof of Readiness"
                earned={hasCertificate('student')}
                progress={completedAkus}
                required={10}
                color="emerald"
              />
              <CertificateCard
                name="Workflow Efficiency Lead"
                designation="Proof of ROI"
                earned={hasCertificate('employee')}
                progress={completedAkus}
                required={15}
                color="blue"
              />
              <CertificateCard
                name="AI Operations Master"
                designation="Proof of Scalability"
                earned={hasCertificate('owner')}
                progress={completedAkus}
                required={20}
                color="purple"
              />
            </div>
          </div>

          {/* Online indicator */}
          {presence.onlineUsers > 0 && (
            <div className="p-4 border-t border-slate-800/50">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                {presence.onlineUsers} learners online
              </div>
            </div>
          )}
        </aside>
      )}

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <CheckeredAvatar size="sm" />
            <div>
              <h1 className="text-white font-semibold">Phazur AI Coach</h1>
              <p className="text-slate-500 text-xs">
                {selectedPath ? `${PATH_INFO[selectedPath].title} Path` : 'Choose your path to begin'}
              </p>
            </div>
          </div>

          {!showProgressPanel && (
            <button
              onClick={() => setShowProgressPanel(true)}
              className="px-3 py-1.5 text-sm text-slate-400 hover:text-white bg-slate-800 rounded-lg transition"
            >
              Show Progress
            </button>
          )}
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-2xl mx-auto">
            {messages.map((msg) => (
              <div key={msg.id} className="mb-6">
                {msg.role === 'assistant' ? (
                  <div className="flex gap-3">
                    <CheckeredAvatar size="sm" />
                    <div className="flex-1 space-y-2">
                      {msg.content.map((paragraph, i) => (
                        <div
                          key={i}
                          className="bg-[#2a2d32] text-slate-200 px-4 py-3 rounded-2xl rounded-tl-md max-w-fit"
                        >
                          <p className="whitespace-pre-wrap leading-relaxed text-sm">{paragraph}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-md max-w-xs">
                      <p className="text-sm">{msg.content[0]}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 mb-6">
                <CheckeredAvatar size="sm" />
                <div className="bg-[#2a2d32] px-4 py-3 rounded-2xl rounded-tl-md">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="px-6 pb-6">
          <div className="max-w-2xl mx-auto">
            {/* Suggestion pills */}
            {messages.length > 0 && (messages[messages.length - 1].suggestions || suggestions.length > 0) && !isTyping && (
              <div className="mb-3 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {(messages[messages.length - 1].suggestions || suggestions)?.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="flex-shrink-0 px-4 py-2 bg-[#2a2d32] hover:bg-[#3a3d42] text-slate-300 text-sm rounded-full border border-slate-700 hover:border-slate-600 transition whitespace-nowrap"
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
                placeholder="Message Phazur..."
                rows={1}
                className="w-full px-4 py-3 pr-12 bg-[#2a2d32] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 resize-none text-sm"
              />
              <button
                onClick={() => handleUserResponse()}
                disabled={!inputValue.trim() || isTyping}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-emerald-400 disabled:opacity-30 disabled:hover:text-slate-400 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>
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
