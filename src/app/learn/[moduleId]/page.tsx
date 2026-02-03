'use client';

/**
 * MODULE DETAIL PAGE
 * Project-based learning with AI-assisted project work
 * No quizzes - real deliverables with AI guidance
 */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface Project {
  id: string;
  title: string;
  description: string;
  deliverable: string;
  estimatedTime: string;
  skills: string[];
  aiPromptContext: string;
}

interface Module {
  id: string;
  title: string;
  description: string;
  duration: number;
  order: number;
  tier: 'student' | 'employee' | 'owner';
  category: string;
  whyItMatters: string;
  conceptContent: string;
  realWorldExample: string;
  project: Project;
  prerequisites: string[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function ModulePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const moduleId = params.moduleId as string;
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [module, setModule] = useState<Module | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Learning state
  const [currentStep, setCurrentStep] = useState<'learn' | 'project' | 'complete'>('learn');
  const [showProject, setShowProject] = useState(false);

  // AI Chat state for project work
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [projectStarted, setProjectStarted] = useState(false);

  // Determine tier from moduleId prefix
  const getTierFromModuleId = (id: string): 'student' | 'employee' | 'owner' => {
    if (id.startsWith('student-')) return 'student';
    if (id.startsWith('employee-')) return 'employee';
    if (id.startsWith('owner-')) return 'owner';
    return 'student';
  };

  // Fetch module data
  useEffect(() => {
    async function fetchModule() {
      setIsLoading(true);
      setError(null);

      try {
        const tier = getTierFromModuleId(moduleId);
        const response = await fetch(`/api/curriculum?tier=${tier}&moduleId=${moduleId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Module not found');
          } else {
            throw new Error('Failed to fetch module');
          }
          return;
        }

        const data = await response.json();
        setModule(data.module);
      } catch (err) {
        console.error('Failed to fetch module:', err);
        setError('Unable to load module. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    if (moduleId) {
      fetchModule();
    }
  }, [moduleId]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Start project with AI
  const startProject = () => {
    setProjectStarted(true);
    setShowProject(true);

    if (module) {
      // Initial AI message to guide the project
      setChatMessages([
        {
          role: 'assistant',
          content: `Let's work on your project: **${module.project.title}**

${module.project.description}

**What you'll create:** ${module.project.deliverable}

**Skills you'll practice:** ${module.project.skills.join(', ')}

**Estimated time:** ${module.project.estimatedTime}

Ready to begin? Tell me a bit about yourself and what you'd like to focus on, and I'll help you create something meaningful.`,
        },
      ]);
    }
  };

  // Send message to AI
  const sendMessage = async () => {
    if (!chatInput.trim() || isAiThinking || !module) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsAiThinking(true);

    try {
      const response = await fetch('/api/tutor/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: module.project.aiPromptContext,
          moduleTitle: module.title,
          projectTitle: module.project.title,
          history: chatMessages.slice(-10), // Send last 10 messages for context
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setChatMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        // Fallback response if API fails
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `I understand you're working on ${module.project.title}. Let me help you break this down into manageable steps. What specific aspect would you like to focus on first?`,
          },
        ]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "I'm having trouble connecting right now, but let's continue working on your project. What questions do you have about the deliverable?",
        },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Mark module as complete
  const completeModule = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          akuId: moduleId,
          status: 'completed',
        }),
      });

      setCurrentStep('complete');
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  // Render markdown-like content
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      // Headers
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <h3 key={i} className="text-slate-200 font-medium mt-4 mb-2">
            {line.replace(/\*\*/g, '')}
          </h3>
        );
      }
      // Bold text
      if (line.includes('**')) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} className="text-slate-400 text-sm mb-2">
            {parts.map((part, j) => (j % 2 === 1 ? <strong key={j} className="text-slate-300">{part}</strong> : part))}
          </p>
        );
      }
      // List items
      if (line.startsWith('- ')) {
        return (
          <li key={i} className="text-slate-400 text-sm ml-4 mb-1">
            {line.substring(2)}
          </li>
        );
      }
      // Numbered items
      if (/^\d+\.\s/.test(line)) {
        return (
          <li key={i} className="text-slate-400 text-sm ml-4 mb-1 list-decimal">
            {line.replace(/^\d+\.\s/, '')}
          </li>
        );
      }
      // Code blocks
      if (line.startsWith('```')) {
        return null;
      }
      // Regular paragraphs
      if (line.trim()) {
        return (
          <p key={i} className="text-slate-400 text-sm mb-2">
            {line}
          </p>
        );
      }
      return <div key={i} className="h-2" />;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading module...</p>
        </div>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-slate-800/60 flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-slate-400 text-sm mb-4">{error || 'Module not found'}</p>
          <Link href="/learn" className="text-cyan-400 hover:text-cyan-300 text-xs underline">
            Back to Learning Paths
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1115]">
      {/* Header */}
      <header className="border-b border-slate-800/40 sticky top-0 bg-[#0f1115]/95 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Phazur" width={24} height={24} className="invert opacity-80" />
            </Link>
            <div className="h-4 w-px bg-slate-800" />
            <Link href="/learn" className="text-slate-500 hover:text-slate-300 transition text-xs">
              All Paths
            </Link>
          </div>

          {user && (
            <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-medium">
              {user.email?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Module Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/60 text-slate-500 uppercase tracking-wider">
              {module.category}
            </span>
            <span className="text-[10px] text-slate-600">Module {module.order}</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-200 mb-2">{module.title}</h1>
          <p className="text-slate-500 text-sm">{module.description}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Learning Content */}
            {!showProject && (
              <>
                {/* Why It Matters */}
                <div className="p-6 bg-gradient-to-br from-cyan-500/10 to-slate-800/30 rounded-lg border border-cyan-500/20">
                  <h2 className="text-sm font-medium text-cyan-400 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Why This Matters
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed">{module.whyItMatters}</p>
                </div>

                {/* Core Concepts */}
                <div className="p-6 bg-slate-800/30 rounded-lg border border-slate-800/40">
                  <h2 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    Core Concepts
                  </h2>
                  <div className="prose prose-sm prose-invert max-w-none">{renderContent(module.conceptContent)}</div>
                </div>

                {/* Real World Example */}
                <div className="p-6 bg-slate-800/30 rounded-lg border border-slate-800/40">
                  <h2 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Real World Example
                  </h2>
                  <p className="text-slate-400 text-sm leading-relaxed italic">&ldquo;{module.realWorldExample}&rdquo;</p>
                </div>

                {/* Start Project Button */}
                <div className="flex justify-center pt-4">
                  <button
                    onClick={startProject}
                    className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Start Your Project
                  </button>
                </div>
              </>
            )}

            {/* Project Work Area with AI Chat */}
            {showProject && (
              <div className="bg-slate-800/30 rounded-lg border border-slate-800/40 overflow-hidden">
                {/* Project Header */}
                <div className="p-4 border-b border-slate-800/40 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-medium text-slate-300">{module.project.title}</h2>
                    <p className="text-slate-600 text-xs mt-0.5">Work with AI to complete your project</p>
                  </div>
                  <button
                    onClick={() => setShowProject(false)}
                    className="text-slate-500 hover:text-slate-300 text-xs"
                  >
                    View Lesson
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="h-[400px] overflow-y-auto p-4 space-y-4">
                  {chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] p-3 rounded-lg text-sm ${
                          message.role === 'user'
                            ? 'bg-cyan-500/20 text-cyan-100'
                            : 'bg-slate-800/60 text-slate-300'
                        }`}
                      >
                        <div className="prose prose-sm prose-invert max-w-none">
                          {renderContent(message.content)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isAiThinking && (
                    <div className="flex justify-start">
                      <div className="bg-slate-800/60 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                          <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse" />
                          <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse delay-75" />
                          <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse delay-150" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-slate-800/40">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="Ask a question or share your progress..."
                      className="flex-1 px-4 py-2.5 bg-slate-900/60 border border-slate-700/50 rounded-lg text-slate-300 text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!chatInput.trim() || isAiThinking}
                      className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg text-sm font-medium transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Project Info */}
            <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-800/40">
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Your Project</h3>
              <h4 className="text-sm font-medium text-slate-200 mb-2">{module.project.title}</h4>
              <p className="text-slate-500 text-xs mb-4">{module.project.description}</p>

              <div className="space-y-3 mb-4">
                <div>
                  <span className="text-[10px] text-slate-600 uppercase tracking-wider">Deliverable</span>
                  <p className="text-slate-400 text-xs mt-0.5">{module.project.deliverable}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-600 uppercase tracking-wider">Time</span>
                  <p className="text-slate-400 text-xs mt-0.5">{module.project.estimatedTime}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-600 uppercase tracking-wider">Skills</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {module.project.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/60 text-slate-500"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-800/40">
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Progress</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      projectStarted ? 'bg-green-500/80' : 'bg-slate-700'
                    }`}
                  >
                    {projectStarted && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-xs ${projectStarted ? 'text-slate-300' : 'text-slate-600'}`}>
                    Read the lesson
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      projectStarted ? 'bg-cyan-500/80' : 'bg-slate-700'
                    }`}
                  >
                    {projectStarted ? (
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    ) : null}
                  </div>
                  <span className={`text-xs ${projectStarted ? 'text-slate-300' : 'text-slate-600'}`}>
                    Complete the project
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-slate-700" />
                  <span className="text-xs text-slate-600">Mark complete</span>
                </div>
              </div>
            </div>

            {/* Complete Button */}
            {projectStarted && chatMessages.length > 2 && (
              <button
                onClick={completeModule}
                className="w-full py-3 bg-green-500/80 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Complete Module
              </button>
            )}

            {/* Not logged in */}
            {!user && (
              <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-800/40 text-center">
                <p className="text-slate-500 text-xs mb-2">Sign in to save your progress</p>
                <Link
                  href="/login"
                  className="text-cyan-400 hover:text-cyan-300 text-xs font-medium"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Completion Modal */}
        {currentStep === 'complete' && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-xl p-8 max-w-md w-full text-center border border-slate-800">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-200 mb-2">Module Complete!</h2>
              <p className="text-slate-400 text-sm mb-6">
                You&apos;ve completed <span className="text-slate-200">{module.title}</span> and added{' '}
                <span className="text-cyan-400">{module.project.title}</span> to your portfolio.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/learn"
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition"
                >
                  Back to Paths
                </Link>
                <Link
                  href="/dashboard"
                  className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg text-sm font-medium transition"
                >
                  View Dashboard
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
