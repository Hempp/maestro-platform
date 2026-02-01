'use client';

/**
 * PHAZUR ACADEMY LANDING PAGE
 * "Stop Chatting with AI. Start Commanding It."
 */

import Link from 'next/link';
import { useState } from 'react';
import AuthButtons from '@/components/terminal/AuthButtons';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold tracking-tight">PHAZUR</div>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full font-mono">
              ACADEMY
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#paths" className="text-slate-400 hover:text-white transition text-sm">
              Paths
            </a>
            <a href="#why" className="text-slate-400 hover:text-white transition text-sm">
              Why Phazur
            </a>
            <Link href="/verify" className="text-slate-400 hover:text-white transition text-sm">
              Verify
            </Link>
            <Link href="/dashboard" className="text-slate-400 hover:text-white transition text-sm">
              Dashboard
            </Link>
          </div>
          <AuthButtons compact onAuthSuccess={() => setIsAuthenticated(true)} />
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm mb-8">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-blue-400">AI-Native Laboratory</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">Blockchain Verified</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
              Stop Chatting with AI.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400">
                Start Commanding It.
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed">
              The only AI-native laboratory where you build real-world workflows,
              earn elite skills, and mint your proof of mastery on the blockchain.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/learn?tier=student"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl text-lg font-semibold transition-all hover:scale-105 shadow-lg shadow-blue-500/25"
              >
                Start Building for Free
              </Link>
              <Link
                href="/terminal"
                className="px-8 py-4 border border-slate-700 hover:border-slate-500 rounded-xl text-lg font-medium transition group flex items-center gap-2"
              >
                <span className="text-emerald-400 font-mono">$</span>
                Open Terminal
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div>
                <div className="text-3xl font-bold text-white">60s</div>
                <div className="text-sm text-slate-500">to first AI result</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-emerald-400">$0</div>
                <div className="text-sm text-slate-500">until you ship</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-400">SBT</div>
                <div className="text-sm text-slate-500">on Polygon</div>
              </div>
            </div>
          </div>
        </section>

        {/* Paths Section */}
        <section id="paths" className="py-24 px-6 border-t border-slate-800">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Choose Your Path</h2>
              <p className="text-slate-400 text-lg">Every path leads to a deployed project and an on-chain credential</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Path 1: Student */}
              <div className="group relative bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-2xl opacity-0 group-hover:opacity-100 transition" />

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🎓</span>
                  </div>
                  <div>
                    <div className="text-purple-400 text-sm font-medium">PATH 1</div>
                    <h3 className="text-xl font-bold">The Student</h3>
                  </div>
                </div>

                <h4 className="text-2xl font-bold mb-4">Build a Job-Ready Portfolio</h4>

                <p className="text-slate-400 mb-6 leading-relaxed">
                  "Don't just say you know AI. <span className="text-white">Prove you can build with it.</span>"
                  The job market doesn't care about your prompts; it cares about your products.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500/20 rounded flex items-center justify-center text-purple-400 text-sm mt-0.5">P</div>
                    <div>
                      <div className="text-sm text-slate-500">THE PROJECT</div>
                      <div className="text-white">Build a live, AI-enhanced portfolio site from the terminal.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500/20 rounded flex items-center justify-center text-purple-400 text-sm mt-0.5">S</div>
                    <div>
                      <div className="text-sm text-slate-500">THE SKILL</div>
                      <div className="text-white">Master Claude Code and Vibe Coding to scaffold apps in minutes.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500/20 rounded flex items-center justify-center text-purple-400 text-sm mt-0.5">O</div>
                    <div>
                      <div className="text-sm text-slate-500">THE OUTCOME</div>
                      <div className="text-white">A verifiable link to your work and a <span className="text-purple-400 font-semibold">Certified AI Associate</span> SBT for your LinkedIn.</div>
                    </div>
                  </div>
                </div>

                <Link
                  href="/learn?tier=student"
                  className="block w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-center font-semibold transition"
                >
                  Start Building for Free
                </Link>
              </div>

              {/* Path 2: Employee */}
              <div className="group relative bg-gradient-to-b from-slate-900 to-slate-950 border border-blue-500/50 rounded-2xl p-8 hover:border-blue-400/70 transition-all duration-300 scale-[1.02] shadow-xl shadow-blue-500/10">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-sm font-medium rounded-full">
                  MOST POPULAR
                </div>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-t-2xl" />

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div>
                    <div className="text-blue-400 text-sm font-medium">PATH 2</div>
                    <h3 className="text-xl font-bold">The Employee</h3>
                  </div>
                </div>

                <h4 className="text-2xl font-bold mb-4">Efficiency Mastery</h4>

                <p className="text-slate-400 mb-6 leading-relaxed">
                  "Work <span className="text-white">10 hours less per week.</span> Let AI handle the busywork."
                  Learn to build "Digital Clones" of your routine tasks.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded flex items-center justify-center text-blue-400 text-sm mt-0.5">P</div>
                    <div>
                      <div className="text-sm text-slate-500">THE PROJECT</div>
                      <div className="text-white">Create a custom Internal Knowledge GPT and automated email architect.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded flex items-center justify-center text-blue-400 text-sm mt-0.5">S</div>
                    <div>
                      <div className="text-sm text-slate-500">THE SKILL</div>
                      <div className="text-white">Integrate Google Workspace APIs and Agentic Workflows into your stack.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded flex items-center justify-center text-blue-400 text-sm mt-0.5">O</div>
                    <div>
                      <div className="text-sm text-slate-500">THE OUTCOME</div>
                      <div className="text-white">An automated 9-to-5 and the <span className="text-blue-400 font-semibold">Workflow Efficiency Lead</span> credential.</div>
                    </div>
                  </div>
                </div>

                <Link
                  href="/learn?tier=employee"
                  className="block w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-center font-semibold transition"
                >
                  Reclaim My Time
                </Link>
              </div>

              {/* Path 3: Owner */}
              <div className="group relative bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-8 hover:border-emerald-500/50 transition-all duration-300">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-2xl opacity-0 group-hover:opacity-100 transition" />

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <div>
                    <div className="text-emerald-400 text-sm font-medium">PATH 3</div>
                    <h3 className="text-xl font-bold">The Owner</h3>
                  </div>
                </div>

                <h4 className="text-2xl font-bold mb-4">Operations Scaling</h4>

                <p className="text-slate-400 mb-6 leading-relaxed">
                  "<span className="text-white">Scale your business without scaling your headcount.</span>"
                  Replace entire departments with autonomous AI chains.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-emerald-500/20 rounded flex items-center justify-center text-emerald-400 text-sm mt-0.5">P</div>
                    <div>
                      <div className="text-sm text-slate-500">THE PROJECT</div>
                      <div className="text-white">Deploy an end-to-end Autonomous Sales & Research Chain.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-emerald-500/20 rounded flex items-center justify-center text-emerald-400 text-sm mt-0.5">S</div>
                    <div>
                      <div className="text-sm text-slate-500">THE SKILL</div>
                      <div className="text-white">Orchestrate multi-agent systems and API Plugins for full-scale ops.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-emerald-500/20 rounded flex items-center justify-center text-emerald-400 text-sm mt-0.5">O</div>
                    <div>
                      <div className="text-sm text-slate-500">THE OUTCOME</div>
                      <div className="text-white">A self-running business engine and the <span className="text-emerald-400 font-semibold">AI Operations Master</span> seal.</div>
                    </div>
                  </div>
                </div>

                <Link
                  href="/learn?tier=owner"
                  className="block w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-center font-semibold transition"
                >
                  Automate My Business
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Why Phazur Section */}
        <section id="why" className="py-24 px-6 bg-gradient-to-b from-slate-900 to-slate-950 border-t border-slate-800">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Why Phazur Academy?</h2>
              <p className="text-slate-400 text-lg">We do things differently</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* No Quizzes */}
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">🚫</span>
                </div>
                <h3 className="text-xl font-bold mb-3">No Quizzes</h3>
                <p className="text-slate-400">
                  We verify your <span className="text-white">code</span>, not your memory.
                  Your project either works or it doesn't. No multiple choice.
                </p>
              </div>

              {/* Blockchain Verified */}
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">⛓️</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Blockchain Verified</h3>
                <p className="text-slate-400">
                  Your certificates are tamper-proof <span className="text-white">Soulbound Tokens (SBTs)</span> on the Polygon ledger.
                  Unfakeable proof.
                </p>
              </div>

              {/* Socratic Learning */}
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">🧠</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Socratic Learning</h3>
                <p className="text-slate-400">
                  Our AI doesn't give answers; it <span className="text-white">builds your brain</span>.
                  Learn to think, not just copy.
                </p>
              </div>
            </div>

            {/* Additional Trust Signals */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                <div className="text-2xl font-bold text-white">1:1</div>
                <div className="text-sm text-slate-500">Human Mentors</div>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                <div className="text-2xl font-bold text-white">2hr</div>
                <div className="text-sm text-slate-500">Support Response</div>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                <div className="text-2xl font-bold text-white">WCAG</div>
                <div className="text-sm text-slate-500">2.1 AA Compliant</div>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                <div className="text-2xl font-bold text-white">$0</div>
                <div className="text-sm text-slate-500">Until You Ship</div>
              </div>
            </div>
          </div>
        </section>

        {/* Micro-Credentials */}
        <section className="py-24 px-6 border-t border-slate-800">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Earn Skill Badges</h2>
              <p className="text-slate-400">Stack micro-credentials as you master specialized tools</p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-3 px-5 py-3 bg-slate-900 border border-slate-700 rounded-xl">
                <span className="text-2xl">⌨️</span>
                <div>
                  <div className="font-semibold text-white">Claude Code Commander</div>
                  <div className="text-sm text-slate-500">Terminal mastery</div>
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 bg-slate-900 border border-slate-700 rounded-xl">
                <span className="text-2xl">🔌</span>
                <div>
                  <div className="font-semibold text-white">API Integrator Pro</div>
                  <div className="text-sm text-slate-500">Plugin development</div>
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 bg-slate-900 border border-slate-700 rounded-xl">
                <span className="text-2xl">🤖</span>
                <div>
                  <div className="font-semibold text-white">Agentic Orchestrator</div>
                  <div className="text-sm text-slate-500">Multi-agent systems</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-6 bg-gradient-to-b from-slate-950 to-slate-900 border-t border-slate-800">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Command AI?
            </h2>
            <p className="text-xl text-slate-400 mb-10">
              Build first. Pay later. Your certificate is minted only after you ship real work.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/learn"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl text-lg font-semibold transition-all hover:scale-105 shadow-lg shadow-blue-500/25"
              >
                Start Your Path
              </Link>
              <Link
                href="/verify"
                className="px-8 py-4 border border-slate-700 hover:border-slate-500 rounded-xl text-lg font-medium transition"
              >
                Verify a Certificate
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-xl font-bold mb-4">PHAZUR</div>
              <p className="text-slate-500 text-sm">
                AI-native laboratory with blockchain-verified credentials.
              </p>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-300 mb-4">Paths</div>
              <div className="space-y-2 text-sm text-slate-500">
                <Link href="/learn?tier=student" className="block hover:text-white transition">Certified AI Associate</Link>
                <Link href="/learn?tier=employee" className="block hover:text-white transition">Workflow Efficiency Lead</Link>
                <Link href="/learn?tier=owner" className="block hover:text-white transition">AI Operations Master</Link>
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-300 mb-4">Platform</div>
              <div className="space-y-2 text-sm text-slate-500">
                <Link href="/terminal" className="block hover:text-white transition">Terminal</Link>
                <Link href="/dashboard" className="block hover:text-white transition">Dashboard</Link>
                <Link href="/verify" className="block hover:text-white transition">Verify Certificate</Link>
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-300 mb-4">Compliance</div>
              <div className="space-y-2 text-sm text-slate-500">
                <Link href="/accessibility" className="block hover:text-white transition">Accessibility (WCAG 2.1)</Link>
                <Link href="/privacy" className="block hover:text-white transition">Privacy Policy</Link>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <div>© 2025 Phazur Academy. Build first, pay later.</div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="text-emerald-500">●</span>
                Polygon Network
              </span>
              <span className="flex items-center gap-1">
                <span className="text-blue-500">●</span>
                WCAG 2.1 AA
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
