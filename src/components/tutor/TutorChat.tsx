'use client';

/**
 * TUTOR CHAT COMPONENT - Terminal Edition
 * Interactive AI tutor for milestone-based learning
 * Features: Dark terminal theme, typing indicators, keyboard shortcuts
 * Includes certification submission flow for milestone 10 completion
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAnalytics } from '@/components/providers/AnalyticsProvider';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isNew?: boolean;
}

interface MilestoneStatus {
  number: number;
  status: 'locked' | 'active' | 'submitted' | 'approved' | 'needs_revision';
}

interface TutorChatProps {
  path: 'owner' | 'employee' | 'student';
  initialMessages?: Message[];
}

interface CertificationSubmitResponse {
  success?: boolean;
  checkoutUrl?: string;
  error?: string;
  message?: string;
}

// Terminal-style color schemes for each path
const PATH_COLORS = {
  owner: {
    primary: 'from-purple-500 to-violet-600',
    accent: '#a855f7',
    accentRgb: '168, 85, 247',
    glow: 'shadow-purple-500/20',
    text: 'text-purple-400',
    textBright: 'text-purple-300',
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10',
    prompt: 'text-purple-400',
  },
  employee: {
    primary: 'from-cyan-500 to-blue-600',
    accent: '#06b6d4',
    accentRgb: '6, 182, 212',
    glow: 'shadow-cyan-500/20',
    text: 'text-cyan-400',
    textBright: 'text-cyan-300',
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/10',
    prompt: 'text-cyan-400',
  },
  student: {
    primary: 'from-emerald-500 to-green-600',
    accent: '#10b981',
    accentRgb: '16, 185, 129',
    glow: 'shadow-emerald-500/20',
    text: 'text-emerald-400',
    textBright: 'text-emerald-300',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    prompt: 'text-emerald-400',
  },
};

const PATH_NAMES = {
  owner: 'Owner',
  employee: 'Employee',
  student: 'Student',
};

const PATH_PREFIXES = {
  owner: 'maestro',
  employee: 'agent',
  student: 'scholar',
};

// Terminal typing effect hook
function useTypingEffect(text: string, isEnabled: boolean, speed: number = 15) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isEnabled) {
      setDisplayedText(text);
      setIsComplete(true);
      return;
    }

    setDisplayedText('');
    setIsComplete(false);
    let index = 0;

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, isEnabled, speed]);

  return { displayedText, isComplete };
}

// Message component with typing animation
function TerminalMessage({
  message,
  colors,
  isLatest,
  pathPrefix
}: {
  message: Message;
  colors: typeof PATH_COLORS['owner'];
  isLatest: boolean;
  pathPrefix: string;
}) {
  const shouldAnimate = message.role === 'assistant' && !!message.isNew && isLatest;
  const { displayedText, isComplete } = useTypingEffect(message.content, shouldAnimate, 8);
  const displayContent = shouldAnimate ? displayedText : message.content;

  const timestamp = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  if (message.role === 'user') {
    return (
      <div className="group animate-in fade-in slide-in-from-right-2 duration-300">
        <div className="flex items-start gap-2 sm:gap-3">
          <span className={`${colors.prompt} font-mono text-xs sm:text-sm shrink-0 opacity-60`}>
            [{timestamp}]
          </span>
          <span className="text-emerald-400 font-mono text-xs sm:text-sm shrink-0">
            user@{pathPrefix}:~$
          </span>
          <span className="text-gray-200 font-mono text-xs sm:text-sm break-words whitespace-pre-wrap">
            {message.content}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="group animate-in fade-in slide-in-from-left-2 duration-300">
      <div className="flex items-start gap-2 sm:gap-3 mb-1">
        <span className={`${colors.prompt} font-mono text-xs sm:text-sm shrink-0 opacity-60`}>
          [{timestamp}]
        </span>
        <span className={`${colors.textBright} font-mono text-xs sm:text-sm shrink-0`}>
          tutor@nexus:~$
        </span>
      </div>
      <div className={`ml-0 sm:ml-6 pl-3 border-l-2 ${colors.border} ${colors.bg} rounded-r-lg py-2 pr-3`}>
        <pre className="text-gray-300 font-mono text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed">
          {displayContent}
          {shouldAnimate && !isComplete && (
            <span className={`inline-block w-2 h-4 ${colors.bg} ml-0.5 animate-pulse`} style={{ backgroundColor: colors.accent }}>
            </span>
          )}
        </pre>
      </div>
    </div>
  );
}

export function TutorChat({ path, initialMessages = [] }: TutorChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState(1);
  const [milestoneStatuses, setMilestoneStatuses] = useState<MilestoneStatus[]>([]);
  const [showMilestones, setShowMilestones] = useState(false);
  const [isSubmittingCertification, setIsSubmittingCertification] = useState(false);
  const [certificationError, setCertificationError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'error'>('connected');
  const [showHelp, setShowHelp] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const previousMilestone = useRef(1);

  const { trackTutorMessage, trackMilestone, trackPayment, trackCertification, trackEvent } = useAnalytics();

  const colors = PATH_COLORS[path];
  const pathPrefix = PATH_PREFIXES[path];

  // Check if user is eligible for certification (completed 9 milestones, on milestone 10)
  const approvedMilestones = milestoneStatuses.filter((m) => m.status === 'approved').length;
  const isEligibleForCertification = approvedMilestones >= 9 && currentMilestone === 10;
  const hasCompletedAllMilestones = approvedMilestones === 10;

  // Clear messages handler
  const handleClear = useCallback(() => {
    setMessages([]);
    trackEvent('terminal_cleared', { path });
  }, [path, trackEvent]);

  // Auto-scroll to bottom with smooth behavior
  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + L to clear
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        handleClear();
      }
      // Ctrl/Cmd + K to focus input
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Escape to close help/milestones
      if (e.key === 'Escape') {
        setShowHelp(false);
        setShowMilestones(false);
      }
      // ? to show help (when not typing)
      if (e.key === '?' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        setShowHelp(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClear]);

  // Send initial greeting on mount
  useEffect(() => {
    if (messages.length === 0) {
      sendMessage("I'm ready to start the " + PATH_NAMES[path] + ' path!');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      isNew: true,
    };

    // Track tutor message sent
    trackTutorMessage('text');

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setConnectionStatus('connecting');

    try {
      const response = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, path }),
      });

      const data = await response.json();

      if (!response.ok) {
        setConnectionStatus('error');
        throw new Error(data.error || 'Failed to send message');
      }

      setConnectionStatus('connected');

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
        isNew: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Track milestone progress if milestone changed
      if (data.currentMilestone !== previousMilestone.current) {
        if (data.currentMilestone > previousMilestone.current) {
          // Previous milestone was completed
          trackMilestone(previousMilestone.current, 'completed', { path });
        }
        // New milestone started
        trackMilestone(data.currentMilestone, 'started', { path });
        previousMilestone.current = data.currentMilestone;
      }

      setCurrentMilestone(data.currentMilestone);
      setMilestoneStatuses(data.milestoneStatuses || []);
    } catch (error) {
      console.error('Chat error:', error);
      setConnectionStatus('error');
      const errorMessage: Message = {
        role: 'assistant',
        content: `[ERROR] Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nRetry with: /retry or press Enter to resend your message.`,
        timestamp: new Date().toISOString(),
        isNew: true,
      };
      setMessages((prev) => [...prev, errorMessage]);

      // Auto-recover connection status after 3 seconds
      setTimeout(() => setConnectionStatus('connected'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle certification submission and redirect to Stripe checkout
  const handleCertificationSubmit = async () => {
    setIsSubmittingCertification(true);
    setCertificationError(null);

    // Track payment initiated
    trackPayment('initiated', undefined, path);
    trackEvent('certification_submission_started', { path });

    try {
      const response = await fetch('/api/certification/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });

      const data: CertificationSubmitResponse = await response.json();

      if (!response.ok) {
        trackPayment('failed', undefined, path);
        throw new Error(data.error || 'Failed to submit certification');
      }

      if (data.checkoutUrl) {
        // Track successful redirect to checkout
        trackEvent('checkout_redirect', { path });
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl;
      } else {
        // Already submitted, show message
        const systemMessage: Message = {
          role: 'assistant',
          content: data.message || 'Your certification has already been submitted. Please complete the payment to receive your credential.',
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, systemMessage]);
      }
    } catch (error) {
      console.error('Certification submission error:', error);
      setCertificationError(error instanceof Error ? error.message : 'Failed to submit certification');
    } finally {
      setIsSubmittingCertification(false);
    }
  };

  const getMilestoneIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return '[x]';
      case 'active':
        return '[>]';
      case 'submitted':
        return '[~]';
      case 'needs_revision':
        return '[!]';
      default:
        return '[ ]';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'DONE';
      case 'active':
        return 'ACTIVE';
      case 'submitted':
        return 'PENDING';
      case 'needs_revision':
        return 'REVISE';
      default:
        return 'LOCKED';
    }
  };

  const MILESTONES = {
    owner: [
      'The Automation Audit',
      'Process Mapping',
      'Architecture Design',
      'Stack Selection',
      'First Agent',
      'Full System Integration',
      'Error Handling',
      'Production Deployment',
      'Cost & Performance',
      'Certification Submission',
    ],
    employee: [
      'Time Audit',
      'Quick Win Selection',
      'Tool Discovery',
      'First Automation',
      'Workflow Integration',
      'Expansion',
      'Error Proofing',
      'Documentation',
      'ROI Calculation',
      'Certification Submission',
    ],
    student: [
      'Concept Exploration',
      'Project Selection',
      'Tool Setup',
      'Prototype',
      'Iteration',
      'Deployment',
      'Documentation',
      'Polish',
      'Presentation Prep',
      'Certification Submission',
    ],
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] rounded-lg shadow-2xl overflow-hidden border border-gray-800">
      {/* Terminal Header Bar */}
      <div className="bg-[#161b22] px-3 sm:px-4 py-2 flex items-center justify-between border-b border-gray-800">
        {/* Traffic lights */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 sm:gap-2">
            <button
              onClick={handleClear}
              className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors"
              title="Clear terminal (Ctrl+L)"
            />
            <button
              onClick={() => setShowMilestones(!showMilestones)}
              className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors"
              title="Toggle milestones"
            />
            <button
              onClick={() => setShowHelp(prev => !prev)}
              className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 transition-colors"
              title="Help (?)"
            />
          </div>
          <div className="hidden sm:flex items-center gap-2 ml-4">
            <span className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              'bg-red-500'
            }`} />
            <span className="text-gray-500 text-xs font-mono">
              {connectionStatus === 'connected' ? 'connected' :
               connectionStatus === 'connecting' ? 'transmitting...' :
               'connection error'}
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="flex items-center gap-2">
          <span className={`${colors.text} font-mono text-xs sm:text-sm font-medium`}>
            NEXUS-TUTOR
          </span>
          <span className="text-gray-600 font-mono text-xs hidden sm:inline">
            v3.2.1
          </span>
        </div>

        {/* Session info */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-gray-500 font-mono text-xs hidden sm:inline">
            milestone:{currentMilestone}/10
          </span>
          <span className={`${colors.bg} ${colors.text} px-2 py-0.5 rounded font-mono text-xs uppercase`}>
            {path}
          </span>
        </div>
      </div>

      {/* Help Panel */}
      {showHelp && (
        <div className="bg-[#1c2128] border-b border-gray-800 px-3 sm:px-4 py-3 font-mono text-xs animate-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-start mb-2">
            <span className={`${colors.textBright} font-semibold`}>KEYBOARD SHORTCUTS</span>
            <button onClick={() => setShowHelp(false)} className="text-gray-500 hover:text-gray-300">
              [ESC]
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-gray-400">
            <div><span className="text-gray-300">Ctrl+L</span> Clear terminal</div>
            <div><span className="text-gray-300">Ctrl+K</span> Focus input</div>
            <div><span className="text-gray-300">Enter</span> Send message</div>
            <div><span className="text-gray-300">Shift+Enter</span> New line</div>
            <div><span className="text-gray-300">?</span> Toggle help</div>
            <div><span className="text-gray-300">Esc</span> Close panels</div>
          </div>
        </div>
      )}

      {/* Milestone Progress Panel */}
      {showMilestones && (
        <div className="bg-[#1c2128] border-b border-gray-800 px-3 sm:px-4 py-3 max-h-56 overflow-y-auto scrollbar-none animate-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center mb-2">
            <span className={`${colors.textBright} font-mono text-xs font-semibold`}>MILESTONE PROGRESS</span>
            <span className="text-gray-500 font-mono text-xs">{approvedMilestones}/10 complete</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {MILESTONES[path].map((name, idx) => {
              const num = idx + 1;
              const status = milestoneStatuses.find((m) => m.number === num)?.status || 'locked';
              const isActive = num === currentMilestone;
              return (
                <div
                  key={num}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded font-mono text-xs ${
                    isActive
                      ? `${colors.bg} ${colors.textBright}`
                      : status === 'approved'
                        ? 'text-green-400'
                        : 'text-gray-500'
                  }`}
                >
                  <span className={`shrink-0 ${
                    status === 'approved' ? 'text-green-400' :
                    status === 'active' ? colors.text :
                    status === 'needs_revision' ? 'text-amber-400' :
                    status === 'submitted' ? 'text-blue-400' :
                    'text-gray-600'
                  }`}>
                    {getMilestoneIcon(status)}
                  </span>
                  <span className="truncate flex-1">
                    {String(num).padStart(2, '0')}:{name.toLowerCase().replace(/ /g, '_')}
                  </span>
                  <span className={`text-[10px] shrink-0 ${
                    status === 'approved' ? 'text-green-500' :
                    status === 'active' ? colors.text :
                    'text-gray-600'
                  }`}>
                    {getStatusLabel(status)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages Terminal Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 overscroll-contain scrollbar-none bg-[#0d1117]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(${colors.accentRgb}, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(${colors.accentRgb}, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      >
        {/* Boot message */}
        {messages.length === 0 && !isLoading && (
          <div className="font-mono text-xs text-gray-600 animate-in fade-in duration-500">
            <div className={colors.text}>NEXUS-PRIME Terminal v3.2.1</div>
            <div className="text-gray-500 mt-1">Initializing {PATH_NAMES[path]} Path tutor session...</div>
            <div className="text-gray-600 mt-1">Type your message to begin. Press ? for help.</div>
          </div>
        )}

        {messages.map((message, idx) => (
          <TerminalMessage
            key={`${message.timestamp}-${idx}`}
            message={message}
            colors={colors}
            isLatest={idx === messages.length - 1}
            pathPrefix={pathPrefix}
          />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="flex items-start gap-2 sm:gap-3 mb-1">
              <span className={`${colors.prompt} font-mono text-xs sm:text-sm shrink-0 opacity-60`}>
                [{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}]
              </span>
              <span className={`${colors.textBright} font-mono text-xs sm:text-sm`}>
                tutor@nexus:~$
              </span>
            </div>
            <div className={`ml-0 sm:ml-6 pl-3 border-l-2 ${colors.border} ${colors.bg} rounded-r-lg py-2 pr-3`}>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full animate-bounce`} style={{ backgroundColor: colors.accent }} />
                  <span className={`w-1.5 h-1.5 rounded-full animate-bounce`} style={{ backgroundColor: colors.accent, animationDelay: '0.15s' }} />
                  <span className={`w-1.5 h-1.5 rounded-full animate-bounce`} style={{ backgroundColor: colors.accent, animationDelay: '0.3s' }} />
                </div>
                <span className={`font-mono text-xs ${colors.text}`}>processing query...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Certification Submission Banner - shows when eligible */}
      {isEligibleForCertification && !hasCompletedAllMilestones && (
        <div className="border-t border-b border-amber-500/30 bg-amber-500/10 px-3 sm:px-4 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 font-mono">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-xs">[CERTIFICATION]</span>
                <span className="text-amber-300 text-xs sm:text-sm font-semibold">
                  MILESTONE_COMPLETE: 9/10
                </span>
              </div>
              <p className="text-amber-200/80 text-xs mt-1">
                Submit final project and complete payment to receive Phazur credential.
              </p>
              {certificationError && (
                <p className="text-red-400 text-xs mt-2">
                  [ERROR] {certificationError}
                </p>
              )}
            </div>
            <button
              onClick={handleCertificationSubmit}
              disabled={isSubmittingCertification}
              className="w-full sm:w-auto px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-mono text-xs sm:text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isSubmittingCertification ? (
                <>
                  <span className="animate-spin">@</span>
                  <span>PROCESSING...</span>
                </>
              ) : (
                <>
                  <span>./submit_certification.sh</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Already Certified Banner */}
      {hasCompletedAllMilestones && (
        <div className="border-t border-b border-green-500/30 bg-green-500/10 px-3 sm:px-4 py-3">
          <div className="flex items-center gap-3 font-mono">
            <span className="text-green-400 text-lg">[x]</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-green-400 text-xs">[SUCCESS]</span>
                <span className="text-green-300 text-xs sm:text-sm font-semibold">
                  PATH_COMPLETE: ALL_MILESTONES_ACHIEVED
                </span>
              </div>
              <p className="text-green-200/70 text-xs mt-1">
                View certification status: <span className="text-green-300">/dashboard/credentials</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Input Area */}
      <div className="border-t border-gray-800 bg-[#161b22] p-3 sm:p-4 safe-area-inset-bottom">
        <div className="flex gap-2 items-end">
          {/* Prompt indicator */}
          <div className="hidden sm:flex items-center gap-1 text-xs font-mono py-3 shrink-0">
            <span className="text-emerald-400">user@{pathPrefix}</span>
            <span className="text-gray-500">:</span>
            <span className="text-blue-400">~</span>
            <span className="text-gray-500">$</span>
          </div>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command..."
            rows={1}
            className="flex-1 resize-none rounded-md border border-gray-700 bg-[#0d1117] text-gray-200 font-mono px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:border-gray-600 min-h-[48px] max-h-32 placeholder-gray-600"
            style={{
              fontSize: '16px',
              boxShadow: `0 0 0 1px rgba(${colors.accentRgb}, 0.1)`,
            }}
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            className={`min-w-[48px] min-h-[48px] px-4 py-3 rounded-md ${colors.bg} border ${colors.border} ${colors.text} font-mono text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 active:opacity-60 transition-all flex items-center justify-center shrink-0`}
            style={{
              boxShadow: `0 0 10px rgba(${colors.accentRgb}, 0.1)`,
            }}
          >
            <span className="hidden sm:inline">RUN</span>
            <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
        <div className="flex justify-between items-center mt-2">
          <p className="text-[10px] text-gray-600 font-mono hidden sm:block">
            Enter: send | Shift+Enter: newline | Ctrl+L: clear | ?: help
          </p>
          <p className="text-[10px] text-gray-600 font-mono sm:hidden">
            Enter to send | Tap [?] for help
          </p>
          <span className="text-[10px] text-gray-600 font-mono">
            {input.length > 0 && `${input.length} chars`}
          </span>
        </div>
      </div>
    </div>
  );
}

export default TutorChat;
