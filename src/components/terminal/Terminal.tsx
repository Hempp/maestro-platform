'use client';

/**
 * PHAZUR_OS TERMINAL
 * Interactive terminal interface with typing animation
 * Single-click entry point for Maestro platform
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface TerminalLine {
  id: string;
  type: 'system' | 'prompt' | 'user' | 'output' | 'error' | 'success' | 'progress';
  content: string;
  isTyping?: boolean;
}

interface TerminalProps {
  onCommand?: (command: string) => void;
  onGoalSelect?: (goal: 'A' | 'B' | 'C') => void;
  initialLines?: TerminalLine[];
  showProgress?: boolean;
  progressPercent?: number;
}

export default function Terminal({
  onCommand,
  onGoalSelect,
  initialLines = [],
  showProgress = true,
  progressPercent = 0,
}: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>(initialLines);
  const [currentInput, setCurrentInput] = useState('');
  const [isBooting, setIsBooting] = useState(true);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [awaitingGoal, setAwaitingGoal] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Boot sequence
  useEffect(() => {
    const bootSequence = async () => {
      const bootLines: TerminalLine[] = [
        { id: '1', type: 'system', content: '[PHAZUR_OS v2.0] Initializing...' },
        { id: '2', type: 'system', content: 'Loading AI Workflow Engine... OK' },
        { id: '3', type: 'system', content: 'Connecting to Polygon Network... OK' },
        { id: '4', type: 'system', content: 'Socratic Tutor Module... READY' },
        { id: '5', type: 'success', content: '' },
        { id: '6', type: 'success', content: '████████████████████████████████████████' },
        { id: '7', type: 'success', content: '  PHAZUR_OS v2.0 LOADED - MAESTRO READY  ' },
        { id: '8', type: 'success', content: '████████████████████████████████████████' },
        { id: '9', type: 'system', content: '' },
        { id: '10', type: 'prompt', content: 'What is your primary goal?' },
        { id: '11', type: 'system', content: '' },
        { id: '12', type: 'system', content: '  [A] New Career      - Build job-ready AI portfolio' },
        { id: '13', type: 'system', content: '  [B] Work Efficiency - Automate your 9-5 tasks' },
        { id: '14', type: 'system', content: '  [C] Scalable Business - AI operations at scale' },
        { id: '15', type: 'system', content: '' },
      ];

      for (let i = 0; i < bootLines.length; i++) {
        await new Promise(resolve => setTimeout(resolve, i < 4 ? 150 : 50));
        setLines(prev => [...prev, bootLines[i]]);
      }

      setIsBooting(false);
      setAwaitingGoal(true);
      setShowQuickStart(true);
    };

    bootSequence();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  // Focus input when terminal is clicked
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const addLine = useCallback((type: TerminalLine['type'], content: string) => {
    setLines(prev => [...prev, { id: Date.now().toString(), type, content }]);
  }, []);

  const handleGoalSelection = useCallback((goal: 'A' | 'B' | 'C') => {
    const goalMap = {
      A: { name: 'STUDENT_PATH', desc: 'Career Development Track' },
      B: { name: 'EMPLOYEE_PATH', desc: 'Efficiency Mastery Track' },
      C: { name: 'OWNER_PATH', desc: 'Business Scaling Track' },
    };

    addLine('user', `> ${goal}`);
    addLine('system', '');
    addLine('success', `[GOAL_SELECTED: ${goalMap[goal].name}]`);
    addLine('system', `Provisioning Cloud Sandbox for ${goalMap[goal].desc}...`);

    setTimeout(() => {
      addLine('success', 'Cloud Sandbox READY');
      addLine('system', '');
      addLine('prompt', 'Try your first AI command to see immediate results:');
      addLine('system', '');
      if (goal === 'A') {
        addLine('system', '  ai-summarize-inbox      - Summarize your email inbox');
        addLine('system', '  ai-portfolio-starter    - Generate portfolio template');
      } else if (goal === 'B') {
        addLine('system', '  ai-summarize-inbox      - Summarize your email inbox');
        addLine('system', '  ai-meeting-notes        - Transcribe meeting audio');
      } else {
        addLine('system', '  ai-audit-workflow       - Analyze current operations');
        addLine('system', '  ai-competitor-scan      - Quick market analysis');
      }
      addLine('system', '');
      addLine('system', 'Socratic Tutor is now ACTIVE. I will guide you with questions, not answers.');
      setAwaitingGoal(false);
    }, 800);

    onGoalSelect?.(goal);
  }, [addLine, onGoalSelect]);

  const handleCommand = useCallback((cmd: string) => {
    const command = cmd.trim().toLowerCase();

    if (awaitingGoal) {
      if (['a', 'b', 'c'].includes(command)) {
        handleGoalSelection(command.toUpperCase() as 'A' | 'B' | 'C');
        return;
      }
    }

    addLine('user', `> ${cmd}`);

    // Handle quick start commands
    if (command === 'run_student_onboarding' || command === 'a') {
      handleGoalSelection('A');
      return;
    }
    if (command === 'start_business_builder' || command === 'c') {
      handleGoalSelection('C');
      return;
    }
    if (command === 'audit_my_workflow' || command === 'b') {
      handleGoalSelection('B');
      return;
    }

    // Handle AI commands
    if (command.startsWith('ai-')) {
      addLine('system', 'Executing AI command...');
      onCommand?.(command);
      return;
    }

    // Help command
    if (command === 'help') {
      addLine('system', '');
      addLine('system', 'Available Commands:');
      addLine('system', '  A, B, or C           - Select your learning path');
      addLine('system', '  ai-summarize-inbox   - Demo: Summarize emails');
      addLine('system', '  ai-meeting-notes     - Demo: Meeting transcription');
      addLine('system', '  ai-audit-workflow    - Demo: Workflow analysis');
      addLine('system', '  help                 - Show this help');
      addLine('system', '  clear                - Clear terminal');
      addLine('system', '');
      return;
    }

    // Clear command
    if (command === 'clear') {
      setLines([]);
      return;
    }

    addLine('error', `Command not found: ${cmd}. Type "help" for available commands.`);
  }, [awaitingGoal, addLine, handleGoalSelection, onCommand]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentInput.trim()) {
      handleCommand(currentInput);
      setCurrentInput('');
    }
  };

  const quickStartButtons = [
    { cmd: 'run_student_onboarding', label: 'Career Path', color: 'purple' },
    { cmd: 'audit_my_workflow', label: 'Efficiency Path', color: 'blue' },
    { cmd: 'start_business_builder', label: 'Business Path', color: 'emerald' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Terminal Window */}
      <div
        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg overflow-hidden flex flex-col font-mono text-sm"
        onClick={focusInput}
      >
        {/* Title Bar */}
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-b border-slate-700">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="flex-1 text-center text-slate-500 text-xs">
            PHAZUR_OS v2.0 - Maestro AI Terminal
          </div>
        </div>

        {/* Terminal Content */}
        <div
          ref={terminalRef}
          className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700"
        >
          {lines.map((line) => (
            <div key={line.id} className={`leading-relaxed ${getLineClass(line.type)}`}>
              {line.content || '\u00A0'}
            </div>
          ))}

          {/* Input Line */}
          {!isBooting && (
            <div className="flex items-center mt-2">
              <span className="text-emerald-400 mr-2">maestro@phazur:~$</span>
              <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent outline-none text-white caret-emerald-400"
                autoFocus
                spellCheck={false}
                aria-label="Terminal input"
              />
              <span className="w-2 h-5 bg-emerald-400 animate-pulse" />
            </div>
          )}
        </div>
      </div>

      {/* Quick Start Buttons */}
      {showQuickStart && (
        <div className="mt-4 flex flex-wrap gap-3 justify-center">
          {quickStartButtons.map((btn) => (
            <button
              key={btn.cmd}
              onClick={() => handleCommand(btn.cmd)}
              className={`px-4 py-2 rounded-lg font-mono text-sm transition-all hover:scale-105 ${
                btn.color === 'purple'
                  ? 'bg-purple-600/20 border border-purple-500/50 text-purple-400 hover:bg-purple-600/30'
                  : btn.color === 'blue'
                  ? 'bg-blue-600/20 border border-blue-500/50 text-blue-400 hover:bg-blue-600/30'
                  : 'bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-600/30'
              }`}
            >
              [{btn.cmd}]
            </button>
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {showProgress && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Progress to SBT Certificate</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="text-xs text-slate-600 mt-1 text-center">
            Build first, pay later. Payment only after verified Capstone.
          </div>
        </div>
      )}
    </div>
  );
}

function getLineClass(type: TerminalLine['type']): string {
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
    case 'progress':
      return 'text-blue-400';
    default:
      return 'text-slate-400';
  }
}
