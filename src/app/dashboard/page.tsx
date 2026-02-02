'use client';

/**
 * PHAZUR DASHBOARD
 * Clean chat interface inspired by reference design
 * Multi-bubble messages, checkered avatar, suggestion pills
 * Connected to real backend via hooks
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { useProgress } from '@/hooks/useProgress';
import { useRealtime } from '@/hooks/useRealtime';

type PathType = 'student' | 'employee' | 'owner' | null;
type ViewType = 'chat' | 'terminal' | 'sandbox';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string[]; // Array of paragraphs for multi-bubble
  suggestions?: string[];
}

interface TerminalLine {
  id: string;
  type: 'system' | 'prompt' | 'user' | 'output' | 'error' | 'success';
  content: string;
}

const PATH_INFO = {
  student: {
    title: 'The Student',
    subtitle: 'Build a Job-Ready Portfolio',
    cert: 'Certified AI Associate',
    price: '$49',
  },
  employee: {
    title: 'The Employee',
    subtitle: 'Efficiency Mastery',
    cert: 'Workflow Efficiency Lead',
    price: '$199',
  },
  owner: {
    title: 'The Owner',
    subtitle: 'Operations Scaling',
    cert: 'AI Operations Master',
    price: '$499',
  },
};

// Checkered avatar component
function CheckeredAvatar() {
  return (
    <div className="w-10 h-10 rounded-lg bg-slate-800 p-1.5 flex-shrink-0">
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

// Sidebar icons
function SidebarIcon({ icon, active = false, label }: { icon: React.ReactNode; active?: boolean; label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
        active ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
      }`}
    >
      {icon}
    </button>
  );
}

export default function DashboardPage() {
  const [activeView, setActiveView] = useState<ViewType>('chat');
  const [selectedPath, setSelectedPath] = useState<PathType>(null);
  const [currentStep, setCurrentStep] = useState(0);
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
  const { stats } = useProgress();
  const { presence, updatePresence } = useRealtime(user?.id);

  // Local UI state
  const [inputValue, setInputValue] = useState('');
  const [localTyping, setLocalTyping] = useState(false);
  const isTyping = chatLoading || localTyping;

  // Terminal state
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [terminalInput, setTerminalInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInputRef = useRef<HTMLInputElement>(null);

  // Sandbox state
  const [sandboxCode, setSandboxCode] = useState(`// Welcome to the Phazur Sandbox!
// Write your code here and click "Run" to execute

async function main() {
  console.log("Hello from Phazur Sandbox!");

  // Try an AI command
  const result = await phazur.ai("Summarize this in one sentence: AI is transforming how we work.");
  console.log("AI Response:", result);
}

main();`);
  const [sandboxOutput, setSandboxOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Scroll terminal to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  // Initialize terminal
  useEffect(() => {
    if (terminalLines.length === 0) {
      setTerminalLines([
        { id: '1', type: 'system', content: '[PHAZUR_OS v2.0] Terminal Ready' },
        { id: '2', type: 'system', content: 'Type "help" for available commands' },
        { id: '3', type: 'system', content: '' },
      ]);
    }
  }, [terminalLines.length]);

  // Update presence when view changes
  useEffect(() => {
    if (user?.id) {
      updatePresence(activeView === 'terminal' ? 'terminal' : activeView === 'sandbox' ? 'sandbox' : 'chat');
    }
  }, [activeView, user?.id, updatePresence]);

  // Initial chat welcome message
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
          "🎓 I want to build a portfolio",
          "⚡ I want to save time at work",
          "🚀 I want to scale my business",
        ]
      );
    }
  }, [authLoading, messages.length, addLocalMessage]);

  // Helper to add assistant messages locally (for onboarding flow)
  const addAssistantMessage = useCallback((content: string[], suggestionList?: string[]) => {
    addLocalMessage('assistant', content, suggestionList);
  }, [addLocalMessage]);

  // Helper to add user messages locally
  const addUserMessage = useCallback((content: string) => {
    addLocalMessage('user', [content]);
  }, [addLocalMessage]);

  const addTerminalLine = useCallback((type: TerminalLine['type'], content: string) => {
    setTerminalLines(prev => [...prev, { id: Date.now().toString(), type, content }]);
  }, []);

  const handleSuggestionClick = (suggestion: string) => {
    // Detect path from suggestion
    if (suggestion.includes('portfolio')) {
      handlePathSelection('student', suggestion);
    } else if (suggestion.includes('save time') || suggestion.includes('work')) {
      handlePathSelection('employee', suggestion);
    } else if (suggestion.includes('scale') || suggestion.includes('business')) {
      handlePathSelection('owner', suggestion);
    } else {
      // Generic suggestion handling
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
            "✅ A live, AI-enhanced portfolio website\n✅ Real projects that prove you can ship code\n✅ A blockchain-verified credential for LinkedIn",
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
            "✅ A custom Internal Knowledge GPT for your company\n✅ Automated email workflows that save 10+ hours/week\n✅ API integrations that work while you sleep",
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
            "✅ End-to-end autonomous sales & research chains\n✅ Multi-agent systems that replace entire departments\n✅ AI strategy that scales without scaling headcount",
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

    // During onboarding flow (steps 1-4), use local responses
    if (currentStep < 5 && selectedPath) {
      const step = currentStep + 1;
      setCurrentStep(step);

      // Simulate typing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

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
          "I had trouble processing that. Let me try again.",
          "Could you rephrase your question?",
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

  // Save terminal command to history
  const saveTerminalHistory = useCallback(async (command: string, output: string, status: 'success' | 'error') => {
    try {
      await fetch('/api/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, output, status }),
      });
    } catch {
      // Silent fail
    }
  }, []);

  // Terminal command handler
  const handleTerminalCommand = async (cmd: string) => {
    const command = cmd.trim().toLowerCase();
    addTerminalLine('user', `> ${cmd}`);

    if (command === 'help') {
      const helpText = `Available Commands:
  ai-summarize-inbox    - Demo: AI email summarization
  ai-meeting-notes      - Demo: Meeting transcription
  ai-audit-workflow     - Demo: Workflow analysis
  ai-portfolio-starter  - Demo: Portfolio scaffolding
  ai-competitor-scan    - Demo: Market analysis
  clear                 - Clear terminal
  help                  - Show this help`;
      addTerminalLine('system', '');
      addTerminalLine('system', 'Available Commands:');
      addTerminalLine('system', '  ai-summarize-inbox    - Demo: AI email summarization');
      addTerminalLine('system', '  ai-meeting-notes      - Demo: Meeting transcription');
      addTerminalLine('system', '  ai-audit-workflow     - Demo: Workflow analysis');
      addTerminalLine('system', '  ai-portfolio-starter  - Demo: Portfolio scaffolding');
      addTerminalLine('system', '  ai-competitor-scan    - Demo: Market analysis');
      addTerminalLine('system', '  clear                 - Clear terminal');
      addTerminalLine('system', '  help                  - Show this help');
      addTerminalLine('system', '');
      saveTerminalHistory(cmd, helpText, 'success');
      return;
    }

    if (command === 'clear') {
      setTerminalLines([
        { id: Date.now().toString(), type: 'system', content: '[PHAZUR_OS v2.0] Terminal Cleared' },
      ]);
      return;
    }

    if (command.startsWith('ai-')) {
      setIsExecuting(true);
      addTerminalLine('system', 'Executing AI command...');

      try {
        const response = await fetch('/api/instant-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command }),
        });
        const result = await response.json();

        if (result.success) {
          addTerminalLine('success', '');
          addTerminalLine('success', '─── AI Response ───');
          result.result.split('\n').forEach((line: string) => {
            addTerminalLine('output', line);
          });
          addTerminalLine('success', '───────────────────');
          saveTerminalHistory(cmd, result.result, 'success');
        } else {
          addTerminalLine('error', `Error: ${result.error}`);
          saveTerminalHistory(cmd, result.error || 'Error', 'error');
        }
      } catch {
        addTerminalLine('error', 'Failed to execute command. Check your connection.');
        saveTerminalHistory(cmd, 'Connection failed', 'error');
      } finally {
        setIsExecuting(false);
      }
      return;
    }

    addTerminalLine('error', `Command not found: ${cmd}. Type "help" for available commands.`);
    saveTerminalHistory(cmd, 'Command not found', 'error');
  };

  const handleTerminalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && terminalInput.trim() && !isExecuting) {
      handleTerminalCommand(terminalInput);
      setTerminalInput('');
    }
  };

  // Sandbox runner - connected to real API
  const runSandbox = async () => {
    setIsRunning(true);
    setSandboxOutput(['Running code...']);

    try {
      const response = await fetch('/api/sandbox/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: sandboxCode,
          userId: user?.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSandboxOutput(result.output);
      } else {
        setSandboxOutput([
          '✗ Error:',
          result.error || 'Unknown error occurred',
          '',
          'Check your code and try again.',
        ]);
      }
    } catch (error) {
      setSandboxOutput([
        '✗ Connection Error:',
        error instanceof Error ? error.message : 'Failed to connect to sandbox',
        '',
        'Please check your connection.',
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-screen bg-[#1a1d21] flex">
      {/* Left Sidebar - Minimal Icons */}
      <aside className="w-16 border-r border-slate-800/50 flex flex-col items-center py-4 gap-2">
        <Link href="/" className="mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
            <span className="text-white text-xs font-bold">P</span>
          </div>
        </Link>

        <SidebarIcon
          active={activeView === 'chat'}
          label="Chat"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
        />

        <SidebarIcon
          label="Home"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          }
        />

        <SidebarIcon
          label="Modules"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />

        <SidebarIcon
          label="Progress"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />

        <div className="flex-1" />

        <SidebarIcon
          label="Help"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <SidebarIcon
          label="Settings"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />

        {/* User avatar at bottom */}
        <div className="mt-2 w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-medium" title={user?.email || 'Guest'}>
          {user?.email?.charAt(0).toUpperCase() || 'G'}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* Status bar */}
        {presence.onlineUsers > 0 && (
          <div className="absolute top-4 left-20 flex items-center gap-2 text-xs text-slate-500 z-50">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            {presence.onlineUsers} online
            {stats && stats.completed > 0 && (
              <span className="ml-2 text-slate-600">• {stats.completed} AKUs completed</span>
            )}
          </div>
        )}

        {/* View Tabs (top right area) */}
        <div className="absolute top-4 right-4 flex items-center gap-1 z-50">
          <button
            onClick={() => setActiveView('chat')}
            className={`p-2 rounded-lg transition ${
              activeView === 'chat'
                ? 'bg-slate-700 text-white'
                : 'text-slate-500 hover:text-white hover:bg-slate-800'
            }`}
            title="Chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
          <button
            onClick={() => setActiveView('terminal')}
            className={`p-2 rounded-lg transition ${
              activeView === 'terminal'
                ? 'bg-slate-700 text-white'
                : 'text-slate-500 hover:text-white hover:bg-slate-800'
            }`}
            title="Terminal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => setActiveView('sandbox')}
            className={`p-2 rounded-lg transition ${
              activeView === 'sandbox'
                ? 'bg-slate-700 text-white'
                : 'text-slate-500 hover:text-white hover:bg-slate-800'
            }`}
            title="Sandbox"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>
        </div>

        {/* Chat View */}
        {activeView === 'chat' && (
          <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-8">
              {messages.map((msg) => (
                <div key={msg.id} className="mb-8">
                  {msg.role === 'assistant' ? (
                    <div className="flex gap-4">
                      <CheckeredAvatar />
                      <div className="flex-1 space-y-3">
                        {msg.content.map((paragraph, i) => (
                          <div
                            key={i}
                            className="bg-[#2a2d32] text-slate-200 px-4 py-3 rounded-2xl rounded-tl-md max-w-fit"
                          >
                            <p className="whitespace-pre-wrap leading-relaxed">{paragraph}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <button className="bg-[#4a5c4a] hover:bg-[#5a6c5a] text-white px-5 py-2.5 rounded-full transition">
                        {msg.content[0]}
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-4 mb-8">
                  <CheckeredAvatar />
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

            {/* Suggestion Pills & Input */}
            <div className="px-6 pb-6">
              {/* Suggestion pills - horizontal scroll */}
              {messages.length > 0 && (messages[messages.length - 1].suggestions || suggestions.length > 0) && !isTyping && (
                <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
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

              {/* Input area */}
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Phazur..."
                  rows={1}
                  className="w-full px-5 py-4 pr-14 bg-[#2a2d32] border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-slate-600 resize-none"
                />
                <button
                  onClick={() => handleUserResponse()}
                  disabled={!inputValue.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Terminal View */}
        {activeView === 'terminal' && (
          <div className="flex-1 p-6">
            <div className="h-full bg-slate-950 border border-slate-700 rounded-xl overflow-hidden flex flex-col font-mono text-sm">
              {/* Terminal Title Bar */}
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-b border-slate-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 text-center text-slate-500 text-xs">
                  PHAZUR_OS v2.0 - Terminal
                </div>
                {isExecuting && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    Executing...
                  </div>
                )}
              </div>

              {/* Terminal Content */}
              <div
                ref={terminalRef}
                className="flex-1 p-4 overflow-y-auto"
                onClick={() => terminalInputRef.current?.focus()}
              >
                {terminalLines.map((line) => (
                  <div key={line.id} className={`leading-relaxed ${getTerminalLineClass(line.type)}`}>
                    {line.content || '\u00A0'}
                  </div>
                ))}

                <div className="flex items-center mt-2">
                  <span className="text-emerald-400 mr-2">phazur@ai:~$</span>
                  <input
                    ref={terminalInputRef}
                    type="text"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    onKeyDown={handleTerminalKeyDown}
                    disabled={isExecuting}
                    className="flex-1 bg-transparent outline-none text-white caret-emerald-400 disabled:opacity-50"
                    autoFocus
                    spellCheck={false}
                  />
                  <span className="w-2 h-5 bg-emerald-400 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sandbox View */}
        {activeView === 'sandbox' && (
          <div className="flex-1 p-6">
            <div className="grid lg:grid-cols-2 gap-6 h-full">
              {/* Code Editor */}
              <div className="flex flex-col bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400 font-mono text-sm">{'</>'}</span>
                    <span className="text-slate-300 text-sm font-medium">Code Editor</span>
                  </div>
                  <button
                    onClick={runSandbox}
                    disabled={isRunning}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {isRunning ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <span>▶</span>
                        Run Code
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  value={sandboxCode}
                  onChange={(e) => setSandboxCode(e.target.value)}
                  className="flex-1 p-4 bg-slate-950 text-slate-200 font-mono text-sm resize-none outline-none"
                  spellCheck={false}
                />
              </div>

              {/* Output Panel */}
              <div className="flex flex-col bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
                  <span className="text-emerald-400">→</span>
                  <span className="text-slate-300 text-sm font-medium">Output</span>
                </div>
                <div className="flex-1 p-4 bg-slate-950 font-mono text-sm overflow-y-auto">
                  {sandboxOutput.length === 0 ? (
                    <div className="text-slate-500">
                      Click "Run Code" to see output here...
                    </div>
                  ) : (
                    sandboxOutput.map((line, i) => (
                      <div
                        key={i}
                        className={`leading-relaxed ${
                          line.startsWith('>')
                            ? 'text-emerald-400'
                            : line.startsWith('✓')
                            ? 'text-emerald-400'
                            : line.startsWith('✗')
                            ? 'text-red-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {line || '\u00A0'}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function getTerminalLineClass(type: TerminalLine['type']): string {
  switch (type) {
    case 'system':
      return 'text-slate-400';
    case 'prompt':
      return 'text-cyan-400 font-semibold';
    case 'user':
      return 'text-white';
    case 'output':
      return 'text-slate-300';
    case 'error':
      return 'text-red-400';
    case 'success':
      return 'text-emerald-400';
    default:
      return 'text-slate-400';
  }
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
        "🎓 I want to build a portfolio",
        "⚡ I want to save time at work",
        "🚀 I want to scale my business",
      ],
    };
  }

  const flows: Record<string, Record<number, { content: string[]; suggestions?: string[] }>> = {
    student: {
      2: {
        content: [
          "Perfect! That helps me understand where you're starting from.",
          "Here's your personalized roadmap:",
          "Week 1-2: Terminal Foundations\n→ Learn to navigate like a developer\n→ Execute your first AI commands",
          "Week 3-4: AI-Powered Development\n→ Build components with Claude Code\n→ Deploy your first live project",
          "Week 5-6: Portfolio Capstone\n→ Create your showcase site\n→ Mint your Certified AI Associate SBT",
          "What would you like to start with?",
        ],
        suggestions: [
          "Set up my environment",
          "Learn terminal basics",
          "Jump to building",
        ],
      },
      3: {
        content: [
          "Great choice!",
          "Switch to the Terminal tab and type: ai-portfolio-starter",
          "This will scaffold your portfolio project. I'll guide you through each step.",
          "Your goal: Have a 'Hello World' page live within 30 minutes.",
          "Ready to begin?",
        ],
        suggestions: [
          "Let's try FAFSA now",
          "I want to wait for now",
          "Can you send me the link?",
          "How long does it take?",
        ],
      },
      4: {
        content: [
          "Yes, you can start your FAFSA later if you want.",
          "Just remember: you'll need to complete it to move forward and keep your scholarship chance.",
          "Whenever you're ready, I can walk you through the FAFSA step and give you the link. Want to stop for now, or try the FAFSA today?",
        ],
        suggestions: [
          "Let's try FAFSA now",
          "I want to wait for now",
          "Can you send me the link?",
          "How long does it take?",
        ],
      },
    },
    employee: {
      2: {
        content: [
          "That's a perfect pain point to automate!",
          "Based on what you shared, here's your efficiency roadmap:",
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
          "Perfect! I can work with that.",
          "Switch to the Terminal tab and run: ai-audit-workflow",
          "This will analyze your workflow and suggest the highest-impact automations.",
          "Your goal: Identify 3 tasks we can automate in the next 2 weeks.",
        ],
        suggestions: [
          "Start Workflow Audit",
          "Show me examples first",
        ],
      },
    },
    owner: {
      2: {
        content: [
          "That bottleneck is exactly what AI agents are built to solve.",
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
          "Switch to Terminal and run: ai-competitor-scan",
          "See what a Research Agent can do in 60 seconds — work that typically takes 4 hours.",
        ],
        suggestions: [
          "Run Competitor Scan Demo",
          "Show me the curriculum",
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
      "Thanks for sharing!",
      "Use the tabs above to explore:",
      "• Terminal - Practice AI commands\n• Sandbox - Write and test code\n• Chat - Ask me anything",
    ],
    suggestions: [
      "Open Terminal",
      "Open Sandbox",
    ],
  };
}
