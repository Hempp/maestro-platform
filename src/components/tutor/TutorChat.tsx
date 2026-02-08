'use client';

/**
 * TUTOR CHAT COMPONENT
 * Interactive AI tutor for milestone-based learning
 * Includes certification submission flow for milestone 10 completion
 */

import { useState, useRef, useEffect } from 'react';
import { useAnalytics } from '@/components/providers/AnalyticsProvider';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
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

const PATH_COLORS = {
  owner: {
    primary: 'from-purple-600 to-indigo-600',
    light: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  employee: {
    primary: 'from-blue-600 to-cyan-600',
    light: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  student: {
    primary: 'from-green-600 to-emerald-600',
    light: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
};

const PATH_NAMES = {
  owner: 'Owner',
  employee: 'Employee',
  student: 'Student',
};

export function TutorChat({ path, initialMessages = [] }: TutorChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState(1);
  const [milestoneStatuses, setMilestoneStatuses] = useState<MilestoneStatus[]>([]);
  const [showMilestones, setShowMilestones] = useState(false);
  const [isSubmittingCertification, setIsSubmittingCertification] = useState(false);
  const [certificationError, setCertificationError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const previousMilestone = useRef(1);

  const { trackTutorMessage, trackMilestone, trackPayment, trackCertification, trackEvent } = useAnalytics();

  const colors = PATH_COLORS[path];

  // Check if user is eligible for certification (completed 9 milestones, on milestone 10)
  const approvedMilestones = milestoneStatuses.filter((m) => m.status === 'approved').length;
  const isEligibleForCertification = approvedMilestones >= 9 && currentMilestone === 10;
  const hasCompletedAllMilestones = approvedMilestones === 10;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    };

    // Track tutor message sent
    trackTutorMessage('text');

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, path }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
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
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
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
        return '✓';
      case 'active':
        return '→';
      case 'submitted':
        return '⏳';
      case 'needs_revision':
        return '!';
      default:
        return '○';
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
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${colors.primary} px-3 sm:px-4 py-3 flex items-center justify-between gap-2`}>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-lg sm:text-xl">🤖</span>
          </div>
          <div className="min-w-0">
            <h2 className="text-white font-semibold text-sm sm:text-base truncate">{PATH_NAMES[path]} Path Tutor</h2>
            <p className="text-white/80 text-xs sm:text-sm">Milestone {currentMilestone}/10</p>
          </div>
        </div>
        <button
          onClick={() => setShowMilestones(!showMilestones)}
          className="min-h-[44px] min-w-[44px] sm:min-w-0 px-2 sm:px-3 text-white/80 hover:text-white text-xs sm:text-sm flex items-center justify-center gap-1 flex-shrink-0 active:bg-white/10 rounded-lg transition-colors"
        >
          <span className="hidden sm:inline">{showMilestones ? 'Hide' : 'Show'} Progress</span>
          <span className="sm:hidden">{showMilestones ? 'Hide' : 'Show'}</span>
          <svg
            className={`w-4 h-4 transition-transform ${showMilestones ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Milestone Progress Panel */}
      {showMilestones && (
        <div className={`${colors.light} border-b ${colors.border} px-3 sm:px-4 py-3 max-h-48 overflow-y-auto`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs sm:text-sm">
            {MILESTONES[path].map((name, idx) => {
              const num = idx + 1;
              const status = milestoneStatuses.find((m) => m.number === num)?.status || 'locked';
              const isActive = num === currentMilestone;
              return (
                <div
                  key={num}
                  className={`flex items-center gap-2 px-2 py-1.5 sm:py-1 rounded ${
                    isActive ? `${colors.text} font-medium` : 'text-gray-600'
                  }`}
                >
                  <span
                    className={`w-5 h-5 flex items-center justify-center text-xs rounded-full flex-shrink-0 ${
                      status === 'approved'
                        ? 'bg-green-500 text-white'
                        : status === 'active'
                          ? `bg-gradient-to-r ${colors.primary} text-white`
                          : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {getMilestoneIcon(status)}
                  </span>
                  <span className="truncate">
                    {num}. {name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 overscroll-contain">
        {messages.map((message, idx) => (
          <div key={idx} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] sm:max-w-[80%] rounded-lg px-3 sm:px-4 py-2 ${
                message.role === 'user'
                  ? `bg-gradient-to-r ${colors.primary} text-white`
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-3 sm:px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  />
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  />
                </div>
                <span className="text-sm text-gray-500">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Certification Submission Banner - shows when eligible */}
      {isEligibleForCertification && !hasCompletedAllMilestones && (
        <div className="border-t border-b bg-gradient-to-r from-amber-50 to-yellow-50 px-3 sm:px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 text-sm sm:text-base">
                Ready for Certification!
              </h3>
              <p className="text-amber-700 text-xs sm:text-sm mt-1">
                You've completed 9 milestones. Submit your final project and complete payment to receive your official Phazur credential.
              </p>
              {certificationError && (
                <p className="text-red-600 text-xs sm:text-sm mt-2">
                  {certificationError}
                </p>
              )}
            </div>
            <button
              onClick={handleCertificationSubmit}
              disabled={isSubmittingCertification}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isSubmittingCertification ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Submit for Certification</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Already Certified Banner */}
      {hasCompletedAllMilestones && (
        <div className="border-t border-b bg-gradient-to-r from-green-50 to-emerald-50 px-3 sm:px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-green-900 text-sm sm:text-base">
                Path Complete!
              </h3>
              <p className="text-green-700 text-xs sm:text-sm">
                You've completed all milestones. View your certification status in your dashboard.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Input - optimized for mobile keyboard */}
      <div className="border-t p-3 sm:p-4 bg-white safe-area-inset-bottom">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            className="flex-1 resize-none rounded-lg border border-gray-300 px-3 sm:px-4 py-3 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[48px] max-h-32"
            disabled={isLoading}
            style={{ fontSize: '16px' }} // Prevents iOS zoom on focus
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            className={`min-w-[48px] min-h-[48px] px-4 py-3 rounded-lg bg-gradient-to-r ${colors.primary} text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:opacity-80 transition-opacity flex items-center justify-center flex-shrink-0`}
          >
            <span className="hidden sm:inline">Send</span>
            <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 hidden sm:block">Press Enter to send, Shift+Enter for new line</p>
      </div>
    </div>
  );
}

export default TutorChat;
