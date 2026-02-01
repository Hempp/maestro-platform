'use client';

/**
 * PHAZUR - Your AI Learning Coach
 * Multi-view interface: Chat, Terminal, and Sandbox
 * Adapts based on selected path: Student, Employee, or Owner
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';

type PathType = 'student' | 'employee' | 'owner' | null;
type ViewType = 'chat' | 'terminal' | 'sandbox';

interface Message {
  id: string;
  role: 'copilot' | 'user' | 'system';
  content: string;
  options?: { label: string; value: string }[];
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
    color: 'purple',
    icon: '🎓',
    gradient: 'from-purple-500 to-pink-500',
  },
  employee: {
    title: 'The Employee',
    subtitle: 'Efficiency Mastery',
    cert: 'Workflow Efficiency Lead',
    price: '$199',
    color: 'blue',
    icon: '⚡',
    gradient: 'from-blue-500 to-cyan-500',
  },
  owner: {
    title: 'The Owner',
    subtitle: 'Operations Scaling',
    cert: 'AI Operations Master',
    price: '$499',
    color: 'emerald',
    icon: '🚀',
    gradient: 'from-emerald-500 to-teal-500',
  },
};

export default function CopilotPage() {
  const [activeView, setActiveView] = useState<ViewType>('chat');
  const [selectedPath, setSelectedPath] = useState<PathType>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Initial chat welcome message
  useEffect(() => {
    if (messages.length === 0) {
      addCopilotMessage(
        "Hey! I'm **Phazur**, your AI coach. I'll guide you through your journey to AI mastery.\n\nFirst, tell me: **What brings you here today?**",
        [
          { label: '🎓 I want to build a portfolio and land a job', value: 'student' },
          { label: '⚡ I want to save time and get promoted', value: 'employee' },
          { label: '🚀 I want to scale my business with AI', value: 'owner' },
        ]
      );
    }
  }, []);

  const addCopilotMessage = (content: string, options?: { label: string; value: string }[]) => {
    const msg: Message = {
      id: Date.now().toString(),
      role: 'copilot',
      content,
      options,
    };
    setMessages(prev => [...prev, msg]);
  };

  const addUserMessage = (content: string) => {
    const msg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
    };
    setMessages(prev => [...prev, msg]);
  };

  const addTerminalLine = useCallback((type: TerminalLine['type'], content: string) => {
    setTerminalLines(prev => [...prev, { id: Date.now().toString(), type, content }]);
  }, []);

  const handlePathSelection = (path: PathType) => {
    if (!path) return;

    const pathInfo = PATH_INFO[path];
    setSelectedPath(path);
    addUserMessage(pathInfo.subtitle);

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setCurrentStep(1);

      const welcomeMessages: Record<string, string> = {
        student: `Excellent choice! You're on the path to becoming a **${pathInfo.cert}**.\n\n**Here's what we'll build together:**\n\n✅ A live, AI-enhanced portfolio website\n✅ Real projects that prove you can ship code\n✅ A blockchain-verified credential for your LinkedIn\n\n**The investment:** ${pathInfo.price} (only paid after you complete your capstone)\n\nLet me assess where you're starting from. **Have you ever used a terminal or command line before?**`,
        employee: `Smart move! You're on the path to becoming a **${pathInfo.cert}**.\n\n**Here's what we'll build together:**\n\n✅ A custom Internal Knowledge GPT for your company\n✅ Automated email workflows that save 10+ hours/week\n✅ API integrations that work while you sleep\n\n**The investment:** ${pathInfo.price} (only paid after you complete your capstone)\n\nLet me understand your current workflow. **What's the most repetitive task you do every week?**`,
        owner: `Visionary thinking! You're on the path to becoming an **${pathInfo.cert}**.\n\n**Here's what we'll build together:**\n\n✅ End-to-end autonomous sales & research chains\n✅ Multi-agent systems that replace entire departments\n✅ AI strategy that scales without scaling headcount\n\n**The investment:** ${pathInfo.price} (only paid after you complete your capstone)\n\nLet me understand your business. **What's the biggest bottleneck in your operations right now?**`,
      };

      addCopilotMessage(welcomeMessages[path]);
    }, 1500);
  };

  const handleUserResponse = () => {
    if (!inputValue.trim() || !selectedPath) return;

    addUserMessage(inputValue);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const step = currentStep + 1;
      setCurrentStep(step);

      const coachingFlow = getCoachingFlow(selectedPath, step, inputValue);
      addCopilotMessage(coachingFlow.message, coachingFlow.options);
    }, 2000);
  };

  const handleOptionClick = (value: string) => {
    if (!selectedPath && ['student', 'employee', 'owner'].includes(value)) {
      handlePathSelection(value as PathType);
      return;
    }

    // Handle view switching from chat
    if (value === 'open_terminal' || value === 'terminal_go') {
      setActiveView('terminal');
      return;
    }
    if (value === 'dashboard') {
      window.location.href = '/dashboard';
      return;
    }

    addUserMessage(value);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const step = currentStep + 1;
      setCurrentStep(step);

      const coachingFlow = getCoachingFlow(selectedPath!, step, value);
      addCopilotMessage(coachingFlow.message, coachingFlow.options);
    }, 1500);
  };

  // Terminal command handler
  const handleTerminalCommand = async (cmd: string) => {
    const command = cmd.trim().toLowerCase();
    addTerminalLine('user', `> ${cmd}`);

    if (command === 'help') {
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
        } else {
          addTerminalLine('error', `Error: ${result.error}`);
        }
      } catch {
        addTerminalLine('error', 'Failed to execute command. Check your connection.');
      } finally {
        setIsExecuting(false);
      }
      return;
    }

    addTerminalLine('error', `Command not found: ${cmd}. Type "help" for available commands.`);
  };

  const handleTerminalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && terminalInput.trim() && !isExecuting) {
      handleTerminalCommand(terminalInput);
      setTerminalInput('');
    }
  };

  // Sandbox runner
  const runSandbox = async () => {
    setIsRunning(true);
    setSandboxOutput(['Running code...']);

    // Simulate code execution with mock phazur API
    setTimeout(() => {
      const outputs: string[] = [];

      // Parse and "execute" the code (simplified simulation)
      if (sandboxCode.includes('console.log')) {
        outputs.push('> Hello from Phazur Sandbox!');
      }
      if (sandboxCode.includes('phazur.ai')) {
        outputs.push('> AI Response: AI is revolutionizing workplace efficiency and automation.');
      }

      outputs.push('');
      outputs.push('✓ Execution complete');

      setSandboxOutput(outputs);
      setIsRunning(false);
    }, 1500);
  };

  const pathInfo = selectedPath ? PATH_INFO[selectedPath] : null;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-2xl font-bold tracking-tight text-white hover:text-blue-400 transition">
              PHAZUR
            </Link>
            {selectedPath && pathInfo && (
              <span className={`px-2 py-0.5 bg-${pathInfo.color}-500/20 text-${pathInfo.color}-400 text-xs rounded-full font-mono`}>
                {pathInfo.cert.toUpperCase()}
              </span>
            )}
          </div>

          {/* View Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveView('chat')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeView === 'chat'
                  ? 'bg-cyan-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-xs font-bold">P</span>
              Chat
            </button>
            <button
              onClick={() => setActiveView('terminal')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeView === 'terminal'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="text-emerald-400 font-mono">$_</span>
              Terminal
            </button>
            <button
              onClick={() => setActiveView('sandbox')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeView === 'sandbox'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="text-purple-400">{'</>'}</span>
              Sandbox
            </button>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-400 hover:text-white transition text-sm">
              Dashboard
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content - View Dependent */}
      <main className="flex-1 flex flex-col">
        {/* Chat View */}
        {activeView === 'chat' && (
          <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4">
            <div className="flex-1 py-8 space-y-6 overflow-y-auto">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
                    {msg.role === 'copilot' && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                          <span className="text-white text-sm font-bold">P</span>
                        </div>
                        <span className="text-sm text-cyan-400 font-medium">Phazur</span>
                      </div>
                    )}

                    <div className={`rounded-2xl px-5 py-4 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-200'
                    }`}>
                      <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap">
                        {msg.content.split('**').map((part, i) =>
                          i % 2 === 1 ? <strong key={i} className="text-white font-semibold">{part}</strong> : part
                        )}
                      </div>
                    </div>

                    {msg.options && msg.options.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {msg.options.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => handleOptionClick(opt.value)}
                            className="w-full text-left px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl hover:border-cyan-500/50 hover:bg-slate-800 transition-all group"
                          >
                            <span className="text-slate-300 group-hover:text-white transition">
                              {opt.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">P</span>
                    </div>
                    <div className="flex gap-1 px-4 py-3 bg-slate-800 rounded-2xl">
                      <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {selectedPath && currentStep > 0 && (
              <div className="sticky bottom-0 py-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUserResponse()}
                    placeholder="Type your response..."
                    className="flex-1 px-5 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition"
                  />
                  <button
                    onClick={handleUserResponse}
                    disabled={!inputValue.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
                <p className="text-xs text-slate-600 text-center mt-3">
                  Phazur uses Socratic learning — guiding you to discover answers, not giving them directly
                </p>
              </div>
            )}
          </div>
        )}

        {/* Terminal View */}
        {activeView === 'terminal' && (
          <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
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
                className="flex-1 p-4 overflow-y-auto min-h-[400px]"
                onClick={() => terminalInputRef.current?.focus()}
              >
                {terminalLines.map((line) => (
                  <div key={line.id} className={`leading-relaxed ${getTerminalLineClass(line.type)}`}>
                    {line.content || '\u00A0'}
                  </div>
                ))}

                {/* Input Line */}
                <div className="flex items-center mt-2">
                  <span className="text-emerald-400 mr-2">phazur@sandbox:~$</span>
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

            {/* Terminal Help */}
            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-500">
              <span>Type <code className="px-1 py-0.5 bg-slate-800 rounded text-emerald-400">help</code> for commands</span>
              <span>•</span>
              <span>Try <code className="px-1 py-0.5 bg-slate-800 rounded text-emerald-400">ai-summarize-inbox</code></span>
              <span>•</span>
              <span>Press Enter to execute</span>
            </div>
          </div>
        )}

        {/* Sandbox View */}
        {activeView === 'sandbox' && (
          <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
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
                  className="flex-1 p-4 bg-slate-950 text-slate-200 font-mono text-sm resize-none outline-none min-h-[400px]"
                  spellCheck={false}
                />
              </div>

              {/* Output Panel */}
              <div className="flex flex-col bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
                  <span className="text-emerald-400">→</span>
                  <span className="text-slate-300 text-sm font-medium">Output</span>
                </div>
                <div className="flex-1 p-4 bg-slate-950 font-mono text-sm overflow-y-auto min-h-[400px]">
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

            {/* Sandbox Help */}
            <div className="mt-4 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
              <h3 className="text-sm font-semibold text-slate-300 mb-2">Available APIs</h3>
              <div className="grid md:grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <code className="text-purple-400">phazur.ai(prompt)</code>
                  <p className="text-slate-500 mt-1">Send a prompt to the AI</p>
                </div>
                <div>
                  <code className="text-purple-400">phazur.fetch(url)</code>
                  <p className="text-slate-500 mt-1">Fetch data from an API</p>
                </div>
                <div>
                  <code className="text-purple-400">phazur.store(key, value)</code>
                  <p className="text-slate-500 mt-1">Store data persistently</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Progress Indicator (only in chat view) */}
      {activeView === 'chat' && selectedPath && (
        <div className="border-t border-slate-800 py-4">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-500">Onboarding Progress</span>
              <span className="text-slate-400">{Math.min(currentStep * 20, 100)}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${pathInfo?.gradient || 'from-cyan-500 to-blue-500'} transition-all duration-500`}
                style={{ width: `${Math.min(currentStep * 20, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}
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

// Coaching flow logic based on path and step
function getCoachingFlow(
  path: 'student' | 'employee' | 'owner',
  step: number,
  userInput: string
): { message: string; options?: { label: string; value: string }[] } {

  const flows: Record<string, Record<number, { message: string; options?: { label: string; value: string }[] }>> = {
    student: {
      2: {
        message: `Great context! Based on what you've shared, here's your personalized roadmap:\n\n**Week 1-2: Terminal Foundations**\n→ Learn to navigate like a developer\n→ Execute your first AI commands\n\n**Week 3-4: AI-Powered Development**\n→ Build components with Claude Code\n→ Deploy your first live project\n\n**Week 5-6: Portfolio Capstone**\n→ Create your showcase site\n→ Mint your Certified AI Associate SBT\n\n**What would you like to start with?**`,
        options: [
          { label: '🖥️ Set up my development environment', value: 'setup' },
          { label: '📚 Learn terminal basics first', value: 'terminal' },
          { label: '🚀 Jump straight to building', value: 'build' },
        ],
      },
      3: {
        message: `Perfect choice! Let me set things up for you.\n\n**Your First Assignment:**\n\nSwitch to the **Terminal** tab above and type: \`ai-portfolio-starter\`\n\nThis will scaffold your portfolio project. The Socratic Tutor will guide you through each step.\n\n**Your goal:** Have a "Hello World" page live within 30 minutes.\n\n**Ready to begin?**`,
        options: [
          { label: '✅ Take me to the Terminal', value: 'terminal_go' },
          { label: '❓ I have questions first', value: 'questions' },
        ],
      },
      4: {
        message: `Excellent! Here's what happens next:\n\n1. **Click the Terminal tab** above\n2. **Run the command** I mentioned\n3. **Follow the Socratic prompts**\n4. **Try the Sandbox** to experiment with code\n\nI'll be here tracking your progress. Your dashboard will update automatically.\n\n**Remember:** You only pay the $49 certification fee AFTER you complete your capstone.\n\n🎯 **Go build something amazing!**`,
        options: [
          { label: '🖥️ Open Terminal Now', value: 'open_terminal' },
          { label: '📊 View My Dashboard', value: 'dashboard' },
        ],
      },
      5: {
        message: `🎉 **You're all set!**\n\nYour journey to becoming a Certified AI Associate has officially begun.\n\n**Use the tabs above to switch between:**\n→ **Chat** - Talk to me anytime\n→ **Terminal** - Practice AI commands\n→ **Sandbox** - Experiment with code\n\n**Pro tip:** Consistency beats intensity. 30 minutes daily is better than 5 hours on weekends.\n\n**Now go ship something!** 🚀`,
      },
    },
    employee: {
      2: {
        message: `That's a perfect pain point to automate! Here's how we'll tackle it:\n\n**Your Efficiency Roadmap:**\n\n**Week 1-2: Workflow Analysis**\n→ Map your repetitive tasks\n→ Identify automation opportunities\n\n**Week 3-4: Custom GPT Development**\n→ Build your Internal Knowledge Bot\n→ Connect to your company's data\n\n**Week 5-6: API Automation**\n→ Create email/calendar automations\n→ Deploy your Efficiency Capstone\n\n**Let's start by understanding your stack:**`,
        options: [
          { label: '📧 I mainly use Google Workspace', value: 'google' },
          { label: '🔷 I mainly use Microsoft 365', value: 'microsoft' },
          { label: '🔀 I use a mix of tools', value: 'mixed' },
        ],
      },
      3: {
        message: `Perfect! I can work with that.\n\n**Your First Automation Challenge:**\n\nSwitch to the **Terminal** tab and run: \`ai-audit-workflow\`\n\nThis will analyze your workflow and suggest the highest-impact automations.\n\n**Your goal:** Identify 3 tasks we can automate in the next 2 weeks.\n\n**Ready to audit your workflow?**`,
        options: [
          { label: '✅ Start Workflow Audit', value: 'terminal_go' },
          { label: '📊 Show me example automations first', value: 'examples' },
        ],
      },
      4: {
        message: `Here's your action plan:\n\n1. **Terminal tab** - Run the audit command\n2. **Answer the workflow questions** thoroughly\n3. **Sandbox tab** - Test automation code snippets\n4. **Pick your first automation** to build\n\n**Investment reminder:** $199 certification fee due only after capstone.\n\n💰 **ROI math:** If you save 10 hrs/week at $50/hr, the cert pays for itself in 3 days.`,
        options: [
          { label: '⚡ Open Terminal Now', value: 'open_terminal' },
          { label: '📊 View My Dashboard', value: 'dashboard' },
        ],
      },
      5: {
        message: `🎉 **You're ready to reclaim your time!**\n\nYour path to Workflow Efficiency Lead certification is set.\n\n**Use the tabs above:**\n→ **Chat** - Get guidance anytime\n→ **Terminal** - Run AI commands\n→ **Sandbox** - Build automations\n\n**Now let's start saving you 10+ hours per week!** ⚡`,
      },
    },
    owner: {
      2: {
        message: `That bottleneck is exactly what AI agents are built to solve.\n\n**Your Operations Scaling Roadmap:**\n\n**Week 1-2: Operations Audit**\n→ Map your entire business workflow\n→ Identify agent replacement opportunities\n\n**Week 3-4: Agent Development**\n→ Build your first autonomous agent\n→ Test with real business scenarios\n\n**Week 5-8: Multi-Agent Orchestration**\n→ Create agent chains that work together\n→ Deploy your Operations Capstone\n\n**First, let me understand your scale:**`,
        options: [
          { label: '👥 1-10 employees', value: 'small' },
          { label: '👥 11-50 employees', value: 'medium' },
          { label: '👥 50+ employees', value: 'large' },
        ],
      },
      3: {
        message: `Great context. Here's what successful owners at your scale typically automate first:\n\n**High-Impact Agent Opportunities:**\n\n1. **Research Agent** - Competitive analysis\n2. **Outreach Agent** - Lead qualification\n3. **Operations Agent** - Reporting, scheduling\n\nSwitch to **Terminal** and run: \`ai-competitor-scan\`\n\nSee what a Research Agent can do in 60 seconds — work that typically takes 4 hours.\n\n**Ready to see AI in action?**`,
        options: [
          { label: '🔍 Run Competitor Scan Demo', value: 'terminal_go' },
          { label: '📋 Show me the full curriculum first', value: 'curriculum' },
        ],
      },
      4: {
        message: `Here's your executive summary:\n\n**What You'll Build:**\n• Autonomous Sales Research Chain\n• Multi-Agent Customer Operations System\n• AI-Driven Strategic Dashboard\n\n**Expected Outcomes:**\n• Replace 2-4 FTE equivalent work\n• 24/7 operations without overtime\n\n**Investment:** $499 (paid only after verified capstone)\n\n**Use the tabs to explore Terminal and Sandbox!**`,
        options: [
          { label: '🚀 Open Terminal Now', value: 'open_terminal' },
          { label: '📊 View My Dashboard', value: 'dashboard' },
        ],
      },
      5: {
        message: `🎉 **You're ready to scale without scaling headcount!**\n\nYour path to AI Operations Master certification is mapped.\n\n**The tabs above are your workspace:**\n→ **Chat** - Strategy discussions with me\n→ **Terminal** - Deploy agent commands\n→ **Sandbox** - Build agent code\n\n**The future of business is AI-native. Let's build yours.** 🚀`,
      },
    },
  };

  const pathFlow = flows[path];
  if (pathFlow && pathFlow[step]) {
    return pathFlow[step];
  }

  return {
    message: `Thanks for sharing! Let me guide you to the next step.\n\n**Use the tabs above to explore:**\n• **Terminal** - Practice AI commands\n• **Sandbox** - Write and test code\n• **Chat** - Ask me anything`,
    options: [
      { label: '🖥️ Open Terminal', value: 'open_terminal' },
      { label: '📊 View Dashboard', value: 'dashboard' },
    ],
  };
}
