import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero Section */}
      <header className="border-b border-slate-800">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tight">MAESTRO</div>
          <div className="flex items-center gap-6">
            <Link href="/learn" className="text-slate-400 hover:text-white transition">
              Learn
            </Link>
            <Link href="/dashboard" className="text-slate-400 hover:text-white transition">
              Dashboard
            </Link>
            <Link href="/verify" className="text-slate-400 hover:text-white transition">
              Verify
            </Link>
            <Link
              href="/learn?tier=student"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 py-24 text-center">
          <div className="inline-block px-4 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-sm mb-6">
            Blockchain-Verified Mastery
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Master AI Workflows.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              Prove It On-Chain.
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Don't just learn AI—deploy it. Our Socratic platform guides you through building
            real AI workflows, then mints your mastery as a Soulbound Token on Polygon.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/onboard"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-lg text-lg font-medium transition"
            >
              Start Your Path
            </Link>
            <Link
              href="/verify"
              className="px-8 py-4 border border-slate-700 hover:border-slate-600 rounded-lg text-lg font-medium transition"
            >
              Verify a Certificate
            </Link>
          </div>
        </section>

        {/* How It Works */}
        <section className="border-t border-slate-800 py-24">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-16">How Maestro Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center text-2xl mb-4">
                  🎓
                </div>
                <h3 className="text-xl font-semibold mb-2">Learn by Doing</h3>
                <p className="text-slate-400">
                  No passive videos. Our AI tutor guides you through building real
                  AI workflows in a live sandbox—asking questions, never giving answers.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center text-2xl mb-4">
                  🔬
                </div>
                <h3 className="text-xl font-semibold mb-2">Deploy to Verify</h3>
                <p className="text-slate-400">
                  You don't pass by clicking "Submit." You pass when your workflow
                  actually runs. We verify execution, not just completion.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center text-2xl mb-4">
                  ⛓️
                </div>
                <h3 className="text-xl font-semibold mb-2">Mint Your Mastery</h3>
                <p className="text-slate-400">
                  Upon verification, we mint a Soulbound Token to your wallet.
                  Non-transferable. Employer-verifiable. Permanently yours.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What Makes Us Different */}
        <section className="border-t border-slate-800 py-24 bg-gradient-to-b from-slate-950 to-slate-900">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-4">
              What AI-Only Platforms <span className="text-red-400">Ignore</span>
            </h2>
            <p className="text-slate-400 text-center mb-16 max-w-2xl mx-auto">
              We solve the problems other platforms pretend don't exist
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Hybrid Support */}
              <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-xl">
                    🤝
                  </div>
                  <h3 className="font-semibold">Hybrid Support System</h3>
                </div>
                <p className="text-slate-400 text-sm mb-3">
                  AI handles routine queries. Complex issues escalate to human advisors within 2 hours.
                </p>
                <div className="text-xs text-blue-400">AI + Human, not AI vs Human</div>
              </div>

              {/* Beginner Mode */}
              <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-xl">
                    💡
                  </div>
                  <h3 className="font-semibold">Foundation Mode</h3>
                </div>
                <p className="text-slate-400 text-sm mb-3">
                  Every concept explains the "why" before the "how." Real-world examples, not abstract theory.
                </p>
                <div className="text-xs text-purple-400">Understanding, not just steps</div>
              </div>

              {/* Blockchain Certs */}
              <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-xl">
                    ⛓️
                  </div>
                  <h3 className="font-semibold">On-Chain Credentials</h3>
                </div>
                <p className="text-slate-400 text-sm mb-3">
                  Tamper-proof certificates on Polygon. Employers verify instantly—no middleman needed.
                </p>
                <div className="text-xs text-emerald-400">Unfakeable proof of skills</div>
              </div>

              {/* Adaptive Pacing */}
              <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 transition">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center text-xl">
                    ⏰
                  </div>
                  <h3 className="font-semibold">Adaptive Pacing</h3>
                </div>
                <p className="text-slate-400 text-sm mb-3">
                  Working 40+ hours? We adjust your workload automatically. Learning fits YOUR life.
                </p>
                <div className="text-xs text-amber-400">No burnout, sustainable progress</div>
              </div>

              {/* Mentor Check-ins */}
              <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 hover:border-pink-500/50 transition">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center text-xl">
                    👤
                  </div>
                  <h3 className="font-semibold">Weekly Mentor Calls</h3>
                </div>
                <p className="text-slate-400 text-sm mb-3">
                  Scheduled 1:1 check-ins with human mentors. We prevent dropout, not just record it.
                </p>
                <div className="text-xs text-pink-400">Real humans who care</div>
              </div>

              {/* Progress Dashboard */}
              <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 transition">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center text-xl">
                    📊
                  </div>
                  <h3 className="font-semibold">Full Transparency</h3>
                </div>
                <p className="text-slate-400 text-sm mb-3">
                  Track everything in real-time: streak, competencies, estimated completion. No hidden metrics.
                </p>
                <div className="text-xs text-cyan-400">Your data, your dashboard</div>
              </div>
            </div>
          </div>
        </section>

        {/* Business Tiers */}
        <section className="border-t border-slate-800 py-24 bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-4">Choose Your Path</h2>
            <p className="text-slate-400 text-center mb-16 max-w-2xl mx-auto">
              Every path leads to a deployed AI workflow and an on-chain certificate
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Student */}
              <div className="p-8 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition">
                <div className="text-purple-400 text-sm font-medium mb-2">FOR STUDENTS</div>
                <h3 className="text-2xl font-bold mb-2">Job-Ready Portfolio</h3>
                <p className="text-slate-400 mb-6">
                  Build proof you can do the work of a junior dev or marketer
                </p>
                <div className="text-slate-500 text-sm mb-4">Capstone Project:</div>
                <div className="text-white font-medium">AI-Enhanced Portfolio Website</div>
              </div>
              {/* Employee */}
              <div className="p-8 rounded-xl bg-slate-950 border border-blue-500/50 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-xs rounded-full">
                  MOST POPULAR
                </div>
                <div className="text-blue-400 text-sm font-medium mb-2">FOR EMPLOYEES</div>
                <h3 className="text-2xl font-bold mb-2">Efficiency Mastery</h3>
                <p className="text-slate-400 mb-6">
                  Automate your specific 9-5 tasks with custom AI workflows
                </p>
                <div className="text-slate-500 text-sm mb-4">Capstone Project:</div>
                <div className="text-white font-medium">Custom GPT for Internal Docs</div>
              </div>
              {/* Owner */}
              <div className="p-8 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition">
                <div className="text-emerald-400 text-sm font-medium mb-2">FOR OWNERS</div>
                <h3 className="text-2xl font-bold mb-2">Operations Scaling</h3>
                <p className="text-slate-400 mb-6">
                  Replace manual labor with automated AI chains
                </p>
                <div className="text-slate-500 text-sm mb-4">Capstone Project:</div>
                <div className="text-white font-medium">AI Operations Manual</div>
              </div>
            </div>
          </div>
        </section>

        {/* SBT Preview */}
        <section className="border-t border-slate-800 py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">
                  Your Certificate is Unfakeable
                </h2>
                <p className="text-slate-400 mb-6">
                  Traditional certificates can be forged. Maestro certificates are
                  Soulbound Tokens on Polygon—permanently tied to your wallet,
                  verifiable by any employer in seconds.
                </p>
                <ul className="space-y-3 text-slate-300">
                  <li className="flex items-center gap-3">
                    <span className="text-emerald-400">✓</span>
                    <span>The exact workflow you built</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-emerald-400">✓</span>
                    <span>Your "Struggle Score" (how much help you needed)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-emerald-400">✓</span>
                    <span>Timestamped deployment record</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-emerald-400">✓</span>
                    <span>Non-transferable (truly yours)</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 border border-slate-700">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl mb-4" />
                  <div className="text-xl font-bold mb-1">Maestro Mastery</div>
                  <div className="text-slate-400 text-sm mb-4">Employee Efficiency Path</div>
                  <div className="border-t border-slate-700 pt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Struggle Score</span>
                      <span className="text-emerald-400">23 (Elite)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">AKUs Completed</span>
                      <span>8/8</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Verified</span>
                      <span>Jan 2025</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-slate-800 py-24 bg-gradient-to-b from-slate-900 to-slate-950">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-6">
              Stop Learning. Start Building.
            </h2>
            <p className="text-xl text-slate-400 mb-10">
              Your first workflow is waiting. Our AI tutor won't give you the answers—
              it'll guide you to discover them yourself.
            </p>
            <Link
              href="/onboard"
              className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-lg text-lg font-medium transition"
            >
              Begin Your Mastery Path
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-xl font-bold mb-4">MAESTRO</div>
              <p className="text-slate-500 text-sm">
                AI workflow mastery with blockchain-verified credentials.
              </p>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-300 mb-4">Learn</div>
              <div className="space-y-2 text-sm text-slate-500">
                <Link href="/learn?tier=student" className="block hover:text-white transition">Student Path</Link>
                <Link href="/learn?tier=employee" className="block hover:text-white transition">Employee Path</Link>
                <Link href="/learn?tier=owner" className="block hover:text-white transition">Owner Path</Link>
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-300 mb-4">Platform</div>
              <div className="space-y-2 text-sm text-slate-500">
                <Link href="/dashboard" className="block hover:text-white transition">Dashboard</Link>
                <Link href="/verify" className="block hover:text-white transition">Verify Certificate</Link>
                <Link href="/learn?mode=foundation" className="block hover:text-white transition">Foundation Mode</Link>
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-300 mb-4">Compliance</div>
              <div className="space-y-2 text-sm text-slate-500">
                <Link href="/accessibility" className="block hover:text-white transition">Accessibility (WCAG 2.1)</Link>
                <Link href="/privacy" className="block hover:text-white transition">Privacy (FERPA-aligned)</Link>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 flex items-center justify-between text-sm text-slate-500">
            <div>© 2025 Maestro. Built for builders.</div>
            <div className="flex items-center gap-4">
              <span className="text-emerald-500">●</span>
              <span>WCAG 2.1 AA Compliant</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
