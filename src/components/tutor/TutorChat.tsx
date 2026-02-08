'use client';

/**
 * TUTOR CHAT COMPONENT
 * Interactive AI tutor for milestone-based learning
 */

import { useState, useRef, useEffect } from 'react';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const colors = PATH_COLORS[path];

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
      <div className={`bg-gradient-to-r ${colors.primary} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <h2 className="text-white font-semibold">{PATH_NAMES[path]} Path Tutor</h2>
            <p className="text-white/80 text-sm">Milestone {currentMilestone}/10</p>
          </div>
        </div>
        <button
          onClick={() => setShowMilestones(!showMilestones)}
          className="text-white/80 hover:text-white text-sm flex items-center gap-1"
        >
          {showMilestones ? 'Hide' : 'Show'} Progress
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
        <div className={`${colors.light} border-b ${colors.border} px-4 py-3`}>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {MILESTONES[path].map((name, idx) => {
              const num = idx + 1;
              const status = milestoneStatuses.find((m) => m.number === num)?.status || 'locked';
              const isActive = num === currentMilestone;
              return (
                <div
                  key={num}
                  className={`flex items-center gap-2 px-2 py-1 rounded ${
                    isActive ? `${colors.text} font-medium` : 'text-gray-600'
                  }`}
                >
                  <span
                    className={`w-5 h-5 flex items-center justify-center text-xs rounded-full ${
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, idx) => (
          <div key={idx} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? `bg-gradient-to-r ${colors.primary} text-white`
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">{message.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
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

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={2}
            className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            className={`px-4 py-2 rounded-lg bg-gradient-to-r ${colors.primary} text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity`}
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Press Enter to send, Shift+Enter for new line</p>
      </div>
    </div>
  );
}

export default TutorChat;
