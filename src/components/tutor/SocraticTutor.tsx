'use client';

/**
 * SOCRATIC TUTOR
 * AI-powered teaching assistant that:
 * - Never gives direct answers
 * - Asks guiding questions
 * - Observes sandbox in real-time
 * - Adapts to learner's style
 */

import { useState, useRef, useEffect } from 'react';
import type { TutorMessage, SandboxState, AtomicKnowledgeUnit } from '@/types';

interface SocraticTutorProps {
  messages: TutorMessage[];
  onMessageSend: (content: string) => void;
  sandboxState: SandboxState;
  aku: AtomicKnowledgeUnit;
}

export function SocraticTutor({
  messages,
  onMessageSend,
  sandboxState,
  aku,
}: SocraticTutorProps) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setIsTyping(true);

    // Send to tutor API
    try {
      const response = await fetch('/api/tutor/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          sandboxState,
          akuId: aku.id,
          conversationHistory: messages.slice(-10), // Last 10 messages
        }),
      });

      const data = await response.json();
      onMessageSend(data.response);
    } catch (error) {
      onMessageSend("I'm having trouble connecting. Let's continue - what were you trying to do?");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="h-12 border-b border-slate-800 flex items-center px-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-slate-300">AI Tutor</span>
        </div>
        <span className="ml-auto text-xs text-slate-500">
          Observing your sandbox...
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-slate-500">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-100" />
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200" />
            </div>
            <span className="text-sm">Thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sandbox Observation Panel */}
      {sandboxState.workflow.length > 0 && (
        <div className="border-t border-slate-800 p-3 bg-slate-800/50">
          <div className="text-xs text-slate-500 mb-1">I can see:</div>
          <div className="text-sm text-slate-400">
            {sandboxState.workflow.length} workflow node(s) •{' '}
            Status: <span className={getStatusColor(sandboxState.status)}>
              {sandboxState.status}
            </span>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question or describe what you're stuck on..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
        <div className="mt-2 text-xs text-slate-600">
          I won't give you the answer, but I'll help you discover it.
        </div>
      </form>
    </div>
  );
}

// Message bubble component
function MessageBubble({ message }: { message: TutorMessage }) {
  const isTutor = message.role === 'tutor';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="text-center text-xs text-slate-500 py-2">
        {message.content}
      </div>
    );
  }

  return (
    <div className={`flex ${isTutor ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isTutor
            ? 'bg-slate-800 text-slate-200'
            : 'bg-blue-600 text-white'
        }`}
      >
        {/* Parse markdown-like formatting */}
        <div className="text-sm whitespace-pre-wrap">
          {formatMessage(message.content)}
        </div>

        {message.observation && (
          <div className="mt-2 pt-2 border-t border-slate-700 text-xs text-slate-400">
            🔍 {message.observation}
          </div>
        )}

        <div className="mt-1 text-xs opacity-50">
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}

// Format message with basic markdown
function formatMessage(content: string): React.ReactNode {
  // Bold
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

// Get status color
function getStatusColor(status: SandboxState['status']): string {
  switch (status) {
    case 'idle':
      return 'text-slate-400';
    case 'building':
      return 'text-blue-400';
    case 'executing':
      return 'text-amber-400';
    case 'verifying':
      return 'text-purple-400';
    case 'complete':
      return 'text-emerald-400';
    default:
      return 'text-slate-400';
  }
}
