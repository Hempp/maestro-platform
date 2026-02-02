'use client';

/**
 * PHAZUR LANDING PAGE
 * "Stop Chatting with AI. Start Commanding It."
 */

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0f1115] text-white">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 bg-[#0f1115]/90 backdrop-blur-xl">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold tracking-tight">PHAZUR</div>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full font-mono">
              v2.0
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#paths" className="text-slate-400 hover:text-white transition text-sm">
              Paths
            </a>
            <a href="#why" className="text-slate-400 hover:text-white transition text-sm">
              Why Phazur
            </a>
            <a href="#pricing" className="text-slate-400 hover:text-white transition text-sm">
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium transition"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg text-sm font-medium transition"
            >
              Start Free
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm mb-8">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-blue-400">AI-Native Learning Lab</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Blockchain Verified Certificates</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
              Stop Chatting with AI.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                Start Commanding It.
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed">
              The only platform where you build real AI workflows,
              earn elite credentials, and mint your proof of mastery on the blockchain.
              <span className="text-white"> Pay nothing until you ship.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl text-lg font-semibold transition-all hover:scale-105 shadow-lg shadow-cyan-500/25 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <span className="text-sm font-bold">P</span>
                </div>
                Talk to Phazur
              </Link>
              <a
                href="#paths"
                className="px-8 py-4 border border-slate-700 hover:border-slate-500 rounded-xl text-lg font-medium transition flex items-center gap-2"
              >
                Explore Paths
                <span className="text-slate-500">→</span>
              </a>
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
        <section id="paths" className="py-24 px-6 border-t border-slate-800/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Choose Your Path</h2>
              <p className="text-slate-400 text-lg">Every path leads to a deployed project and an on-chain credential</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Path 1: Student */}
              <div className="group relative bg-gradient-to-b from-[#1a1d21] to-[#13151a] border border-slate-800 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-2xl opacity-0 group-hover:opacity-100 transition" />

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🎓</span>
                  </div>
                  <div>
                    <div className="text-purple-400 text-sm font-medium">PATH A</div>
                    <h3 className="text-xl font-bold">The Student</h3>
                  </div>
                </div>

                <h4 className="text-2xl font-bold mb-4">Build a Job-Ready Portfolio</h4>

                <p className="text-slate-400 mb-6 leading-relaxed">
                  Don't just say you know AI. <span className="text-white">Prove you can build with it.</span>
                  The job market cares about products, not prompts.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500/20 rounded flex items-center justify-center text-purple-400 text-xs mt-0.5">✓</div>
                    <div className="text-slate-300 text-sm">Build a live, AI-enhanced portfolio from the terminal</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500/20 rounded flex items-center justify-center text-purple-400 text-xs mt-0.5">✓</div>
                    <div className="text-slate-300 text-sm">Master Claude Code to scaffold apps in minutes</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500/20 rounded flex items-center justify-center text-purple-400 text-xs mt-0.5">✓</div>
                    <div className="text-slate-300 text-sm">Earn <span className="text-purple-400 font-semibold">Certified AI Associate</span> SBT</div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold text-white">$49</span>
                    <span className="text-slate-500 text-sm ml-2">after capstone</span>
                  </div>
                </div>

                <Link
                  href="/dashboard"
                  className="block w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-center font-semibold transition"
                >
                  Start Building Free
                </Link>
              </div>

              {/* Path 2: Employee */}
              <div className="group relative bg-gradient-to-b from-[#1a1d21] to-[#13151a] border border-blue-500/50 rounded-2xl p-8 hover:border-blue-400/70 transition-all duration-300 scale-[1.02] shadow-xl shadow-blue-500/10">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-sm font-medium rounded-full">
                  MOST POPULAR
                </div>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-t-2xl" />

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div>
                    <div className="text-blue-400 text-sm font-medium">PATH B</div>
                    <h3 className="text-xl font-bold">The Employee</h3>
                  </div>
                </div>

                <h4 className="text-2xl font-bold mb-4">Efficiency Mastery</h4>

                <p className="text-slate-400 mb-6 leading-relaxed">
                  Work <span className="text-white">10 hours less per week.</span>
                  Build "Digital Clones" of your routine tasks.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded flex items-center justify-center text-blue-400 text-xs mt-0.5">✓</div>
                    <div className="text-slate-300 text-sm">Create a custom Internal Knowledge GPT</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded flex items-center justify-center text-blue-400 text-xs mt-0.5">✓</div>
                    <div className="text-slate-300 text-sm">Build automated email & workflow systems</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded flex items-center justify-center text-blue-400 text-xs mt-0.5">✓</div>
                    <div className="text-slate-300 text-sm">Earn <span className="text-blue-400 font-semibold">Workflow Efficiency Lead</span> SBT</div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold text-white">$199</span>
                    <span className="text-slate-500 text-sm ml-2">after capstone</span>
                  </div>
                </div>

                <Link
                  href="/dashboard"
                  className="block w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-center font-semibold transition"
                >
                  Reclaim My Time
                </Link>
              </div>

              {/* Path 3: Owner */}
              <div className="group relative bg-gradient-to-b from-[#1a1d21] to-[#13151a] border border-slate-800 rounded-2xl p-8 hover:border-emerald-500/50 transition-all duration-300">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-2xl opacity-0 group-hover:opacity-100 transition" />

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <div>
                    <div className="text-emerald-400 text-sm font-medium">PATH C</div>
                    <h3 className="text-xl font-bold">The Owner</h3>
                  </div>
                </div>

                <h4 className="text-2xl font-bold mb-4">Operations Scaling</h4>

                <p className="text-slate-400 mb-6 leading-relaxed">
                  <span className="text-white">Scale without scaling headcount.</span>
                  Replace entire departments with AI chains.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-emerald-500/20 rounded flex items-center justify-center text-emerald-400 text-xs mt-0.5">✓</div>
                    <div className="text-slate-300 text-sm">Deploy Autonomous Sales & Research Chains</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-emerald-500/20 rounded flex items-center justify-center text-emerald-400 text-xs mt-0.5">✓</div>
                    <div className="text-slate-300 text-sm">Orchestrate multi-agent systems for full-scale ops</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-emerald-500/20 rounded flex items-center justify-center text-emerald-400 text-xs mt-0.5">✓</div>
                    <div className="text-slate-300 text-sm">Earn <span className="text-emerald-400 font-semibold">AI Operations Master</span> SBT</div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold text-white">$499</span>
                    <span className="text-slate-500 text-sm ml-2">after capstone</span>
                  </div>
                </div>

                <Link
                  href="/dashboard"
                  className="block w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-center font-semibold transition"
                >
                  Automate My Business
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Why Phazur Section */}
        <section id="why" className="py-24 px-6 bg-gradient-to-b from-[#13151a] to-[#0f1115] border-t border-slate-800/50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Why Phazur?</h2>
              <p className="text-slate-400 text-lg">We do things differently</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* No Quizzes */}
              <div className="text-center p-8 bg-[#1a1d21] rounded-2xl border border-slate-800">
                <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">🚫</span>
                </div>
                <h3 className="text-xl font-bold mb-3">No Quizzes</h3>
                <p className="text-slate-400">
                  We verify your <span className="text-white">code</span>, not your memory.
                  Your project either works or it doesn't.
                </p>
              </div>

              {/* Blockchain Verified */}
              <div className="text-center p-8 bg-[#1a1d21] rounded-2xl border border-slate-800">
                <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">⛓️</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Blockchain Verified</h3>
                <p className="text-slate-400">
                  Your certificates are <span className="text-white">Soulbound Tokens (SBTs)</span> on Polygon.
                  Unfakeable proof of skill.
                </p>
              </div>

              {/* Socratic Learning */}
              <div className="text-center p-8 bg-[#1a1d21] rounded-2xl border border-slate-800">
                <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">🧠</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Socratic Learning</h3>
                <p className="text-slate-400">
                  Phazur doesn't give answers; it <span className="text-white">guides your thinking</span>.
                  Learn to solve, not just copy.
                </p>
              </div>
            </div>

            {/* Trust Signals */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="p-4 bg-[#1a1d21] rounded-xl border border-slate-800">
                <div className="text-2xl font-bold text-white">3 Views</div>
                <div className="text-sm text-slate-500">Chat • Terminal • Sandbox</div>
              </div>
              <div className="p-4 bg-[#1a1d21] rounded-xl border border-slate-800">
                <div className="text-2xl font-bold text-white">Real AI</div>
                <div className="text-sm text-slate-500">Powered by GPT-4</div>
              </div>
              <div className="p-4 bg-[#1a1d21] rounded-xl border border-slate-800">
                <div className="text-2xl font-bold text-white">1:1</div>
                <div className="text-sm text-slate-500">Human Mentors</div>
              </div>
              <div className="p-4 bg-[#1a1d21] rounded-xl border border-slate-800">
                <div className="text-2xl font-bold text-white">$0</div>
                <div className="text-sm text-slate-500">Until You Ship</div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 px-6 border-t border-slate-800/50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Simple Pricing</h2>
              <p className="text-slate-400 text-lg">Build first, pay later. No upfront costs.</p>
            </div>

            <div className="bg-gradient-to-b from-[#1a1d21] to-[#13151a] border border-slate-800 rounded-2xl p-8 md:p-12">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-purple-400 font-medium mb-2">Student Path</div>
                  <div className="text-4xl font-bold text-white mb-2">$49</div>
                  <div className="text-slate-500 text-sm">Certified AI Associate</div>
                </div>
                <div>
                  <div className="text-blue-400 font-medium mb-2">Employee Path</div>
                  <div className="text-4xl font-bold text-white mb-2">$199</div>
                  <div className="text-slate-500 text-sm">Workflow Efficiency Lead</div>
                </div>
                <div>
                  <div className="text-emerald-400 font-medium mb-2">Owner Path</div>
                  <div className="text-4xl font-bold text-white mb-2">$499</div>
                  <div className="text-slate-500 text-sm">AI Operations Master</div>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-slate-800">
                <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span>
                    Pay only after capstone
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span>
                    Lifetime access to materials
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span>
                    On-chain certificate
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span>
                    1:1 mentor support
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-6 bg-gradient-to-b from-[#0f1115] to-[#13151a] border-t border-slate-800/50">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Command AI?
            </h2>
            <p className="text-xl text-slate-400 mb-10">
              Start building today. Pay only after you ship real work.
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-10 py-5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl text-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-cyan-500/25"
            >
              Start Your Path Free
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-12 bg-[#0a0c0f]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="text-xl font-bold mb-4">PHAZUR</div>
              <p className="text-slate-500 text-sm">
                AI-native learning lab with blockchain-verified credentials.
                Build first, pay later.
              </p>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-300 mb-4">Certifications</div>
              <div className="space-y-2 text-sm text-slate-500">
                <div className="hover:text-purple-400 transition cursor-pointer">Certified AI Associate — $49</div>
                <div className="hover:text-blue-400 transition cursor-pointer">Workflow Efficiency Lead — $199</div>
                <div className="hover:text-emerald-400 transition cursor-pointer">AI Operations Master — $499</div>
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-300 mb-4">Platform</div>
              <div className="space-y-2 text-sm text-slate-500">
                <Link href="/dashboard" className="block hover:text-cyan-400 transition">Dashboard</Link>
                <Link href="#" className="block hover:text-white transition group relative">
                  Documentation
                  <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-xs text-slate-400 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">Coming soon</span>
                </Link>
                <Link href="#" className="block hover:text-white transition group relative">
                  API Reference
                  <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-xs text-slate-400 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">Coming soon</span>
                </Link>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <div>© 2025 Phazur. Build first, pay later.</div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="text-emerald-500">●</span>
                Polygon Network
              </span>
              <span className="flex items-center gap-1">
                <span className="text-blue-500">●</span>
                GPT-4 Powered
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
