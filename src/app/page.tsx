'use client';

/**
 * PHAZUR LANDING PAGE
 * "Stop Chatting with AI. Start Commanding It."
 * Refined UI with purposeful animations
 */

import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

// Refined animation variants - subtle and purposeful
const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const }
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const }
  },
};

// Subtle gradient background - reduced motion
function SubtleGradient() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] bg-gradient-to-br from-cyan-500/8 via-transparent to-transparent rounded-full blur-3xl" />
      <div className="absolute -bottom-1/2 -right-1/4 w-[600px] h-[600px] bg-gradient-to-tl from-violet-500/8 via-transparent to-transparent rounded-full blur-3xl" />
    </div>
  );
}

// Grid pattern for depth
function GridPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.02]">
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '64px 64px',
      }} />
    </div>
  );
}

// Stat counter - clean typography
function StatItem({ value, suffix = '', label }: { value: string; suffix?: string; label: string }) {
  return (
    <motion.div variants={staggerItem} className="text-center">
      <div className="text-xl sm:text-2xl md:text-3xl font-semibold text-white tracking-tight">
        {value}
        {suffix && <span className="text-cyan-400">{suffix}</span>}
      </div>
      <div className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 mt-1">{label}</div>
    </motion.div>
  );
}

// Feature item - simplified check
function FeatureItem({ children, color }: { children: React.ReactNode; color: 'purple' | 'blue' | 'emerald' }) {
  const checkColors = {
    purple: 'text-purple-400',
    blue: 'text-cyan-400',
    emerald: 'text-emerald-400',
  };

  return (
    <motion.div variants={staggerItem} className="flex items-start gap-3">
      <svg className={`w-5 h-5 ${checkColors[color]} flex-shrink-0 mt-0.5`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      <span className="text-slate-400 text-sm leading-relaxed">{children}</span>
    </motion.div>
  );
}

// Path card - refined styling
function PathCard({
  path,
  title,
  subtitle,
  description,
  features,
  price,
  color,
  cta,
  popular = false,
  delay = 0,
}: {
  path: string;
  title: string;
  subtitle: string;
  description: React.ReactNode;
  features: React.ReactNode[];
  price: string;
  color: 'purple' | 'blue' | 'emerald';
  cta: string;
  popular?: boolean;
  delay?: number;
}) {
  const colorClasses = {
    purple: {
      accent: 'bg-purple-500',
      text: 'text-purple-400',
      button: 'bg-purple-600 hover:bg-purple-500',
      ring: 'ring-purple-500/20',
    },
    blue: {
      accent: 'bg-cyan-500',
      text: 'text-cyan-400',
      button: 'bg-cyan-600 hover:bg-cyan-500',
      ring: 'ring-cyan-500/20',
    },
    emerald: {
      accent: 'bg-emerald-500',
      text: 'text-emerald-400',
      button: 'bg-emerald-600 hover:bg-emerald-500',
      ring: 'ring-emerald-500/20',
    },
  };

  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={`group relative bg-[#16181d] border border-slate-800/60 rounded-2xl p-5 sm:p-8 transition-all duration-300 hover:border-slate-700/80 ${
        popular ? `ring-1 ${colors.ring}` : ''
      }`}
    >
      {/* Top accent line */}
      <div className={`absolute top-0 left-8 right-8 h-px ${colors.accent} opacity-40`} />

      {popular && (
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 ${colors.accent} text-xs font-medium rounded-full text-white`}>
          Most Popular
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <span className={`text-xs font-medium uppercase tracking-wider ${colors.text}`}>{path}</span>
        <h3 className="text-xl font-semibold text-white mt-1">{title}</h3>
      </div>

      <h4 className="text-lg font-medium text-slate-200 mb-3">{subtitle}</h4>

      <p className="text-slate-500 text-sm mb-6 leading-relaxed">{description}</p>

      <motion.div className="space-y-3 mb-8" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        {features.map((feature, i) => (
          <FeatureItem key={i} color={color}>{feature}</FeatureItem>
        ))}
      </motion.div>

      <div className="pt-6 border-t border-slate-800/60">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-emerald-400 text-sm font-medium">Free to Learn</span>
            <span className="text-slate-700">•</span>
            <span className="text-slate-500 text-sm">Pay when certified</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-white">{price}</span>
            <span className="text-slate-600 text-sm">certification</span>
          </div>
        </div>

        <Link
          href="/dashboard"
          className={`block w-full py-3.5 min-h-[48px] ${colors.button} rounded-lg text-center text-sm font-medium transition-colors flex items-center justify-center`}
        >
          {cta}
        </Link>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  return (
    <div className="min-h-screen bg-[#0f1115] text-white overflow-x-hidden">
      {/* Navigation - Clean & Minimal */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/40 bg-[#0f1115]/80 backdrop-blur-xl">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Phazur" width={32} height={32} className="invert opacity-90" />
            <span className="text-base sm:text-lg font-semibold tracking-tight">PHAZUR</span>
            <span className="hidden sm:inline px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded font-mono">
              v2.0
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {[
              { label: 'About', href: '#about' },
              { label: 'Paths', href: '#paths' },
              { label: 'Teams', href: '#teams' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-slate-500 hover:text-white transition-colors text-sm"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/login"
              className="px-3 sm:px-4 py-2.5 min-h-[44px] flex items-center text-slate-400 hover:text-white text-sm transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-3 sm:px-4 py-2.5 min-h-[44px] flex items-center bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
            >
              Start Free
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section - Clean & Focused */}
        <section ref={heroRef} className="relative pt-24 sm:pt-28 pb-16 sm:pb-24 px-4 sm:px-6 min-h-[85vh] sm:min-h-[90vh] flex items-center">
          <SubtleGradient />
          <GridPattern />

          <motion.div
            style={{ opacity: heroOpacity, y: heroY }}
            className="max-w-4xl mx-auto text-center relative z-10 w-full"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-full text-[11px] sm:text-xs mb-6 sm:mb-8"
            >
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              <span className="text-slate-300">AI Operator Certification</span>
              <span className="hidden sm:inline text-slate-600">·</span>
              <span className="hidden sm:inline text-slate-500">Build. Ship. Prove.</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight mb-6 leading-[1.1]"
            >
              Stop Chatting with AI.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                Start Commanding It.
              </span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Master AI through building, not watching. Ship real projects. Earn blockchain-verified credentials employers can actually validate.{' '}
              <span className="text-slate-200">Free until you're certified.</span>
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <Link
                href="/signup"
                className="w-full sm:w-auto px-6 py-3.5 min-h-[48px] bg-white text-slate-900 hover:bg-slate-100 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                Start Free
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a
                href="#paths"
                className="w-full sm:w-auto px-6 py-3.5 min-h-[48px] text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                Explore Paths
                <span>→</span>
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="mt-12 sm:mt-20 pt-6 sm:pt-8 border-t border-slate-800/50 grid grid-cols-3 gap-4 sm:gap-8 max-w-lg mx-auto"
            >
              <StatItem value="3" label="Learning Paths" />
              <StatItem value="$0" label="Until Certified" />
              <StatItem value="100" suffix="%" label="Project-Based" />
            </motion.div>
          </motion.div>
        </section>

        {/* About Section - Innovative Learning */}
        <section id="about" className="py-12 sm:py-20 px-4 sm:px-6 border-t border-slate-800/40">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              {/* Left: Text Content */}
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <span className="text-xs font-medium uppercase tracking-wider text-cyan-400 mb-3 block">
                  A New Way to Learn
                </span>
                <h2 className="text-3xl md:text-4xl font-semibold mb-6 leading-tight">
                  Learning by Building,
                  <br />
                  <span className="text-slate-500">Not by Watching</span>
                </h2>
                <div className="space-y-4 text-slate-400 text-sm leading-relaxed">
                  <p>
                    Traditional courses teach you <em>about</em> AI. Phazur teaches you to{' '}
                    <span className="text-white">command</span> it. From day one, you&apos;re in the terminal,
                    building real projects with an AI coach guiding your every move.
                  </p>
                  <p>
                    Our Socratic approach means Phazur never just gives you the answer. It asks the right
                    questions, nudges you toward solutions, and helps you develop the{' '}
                    <span className="text-white">intuition</span> that separates prompt engineers from AI operators.
                  </p>
                  <p>
                    When you complete a path, you don&apos;t get a PDF certificate that anyone can fake.
                    You get an <span className="text-white">on-chain Soulbound Token</span> — permanent,
                    verifiable proof that you shipped real work.
                  </p>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6">
                  <Link
                    href="/dashboard"
                    className="px-5 py-3 min-h-[48px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors text-center flex items-center justify-center"
                  >
                    Try it Free
                  </Link>
                  <a href="#paths" className="py-3 min-h-[48px] text-slate-500 hover:text-slate-300 text-sm flex items-center justify-center gap-1.5 transition-colors">
                    View paths
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </a>
                </div>
              </motion.div>

              {/* Right: Visual/Features */}
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="space-y-4"
              >
                {[
                  {
                    icon: (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    ),
                    title: 'Terminal-First Learning',
                    desc: 'Skip the GUI. Learn to build from the command line like real developers and AI engineers do.',
                    color: 'text-violet-400',
                  },
                  {
                    icon: (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                      </svg>
                    ),
                    title: 'AI Coach, Not AI Crutch',
                    desc: 'Phazur uses the Socratic method — guiding you to answers through questions, building real problem-solving skills.',
                    color: 'text-cyan-400',
                  },
                  {
                    icon: (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                    ),
                    title: 'Proof That Can\'t Be Faked',
                    desc: 'Soulbound Tokens on Polygon blockchain. Your credentials are permanent, public, and verifiable by anyone.',
                    color: 'text-emerald-400',
                  },
                  {
                    icon: (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                      </svg>
                    ),
                    title: 'Pay After You Ship',
                    desc: 'No upfront cost. Complete your capstone project, then pay. We only win when you do.',
                    color: 'text-amber-400',
                  },
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
                    className="flex gap-4 p-4 bg-[#16181d] rounded-lg border border-slate-800/60 hover:border-slate-700/80 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-lg bg-slate-800/60 ${item.color} flex items-center justify-center flex-shrink-0`}>
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-200 mb-1">{item.title}</h3>
                      <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Paths Section */}
        <section id="paths" className="py-12 sm:py-20 px-4 sm:px-6 border-t border-slate-800/40">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-14"
            >
              <h2 className="text-3xl md:text-4xl font-semibold mb-3">Choose Your Path</h2>
              <p className="text-slate-500">Every path leads to a deployed project and an on-chain credential</p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <PathCard
                path="PATH A"
                title="The Student"
                subtitle="Build a Job-Ready Portfolio"
                description={
                  <>
                    Don&apos;t just say you know AI. <span className="text-white">Prove you can build with it.</span> The job
                    market cares about products, not prompts.
                  </>
                }
                features={[
                  'Build a live, AI-enhanced portfolio from the terminal',
                  'Master Claude Code to scaffold apps in minutes',
                  <>Earn <span className="text-purple-400 font-semibold">Certified AI Associate</span> SBT</>,
                ]}
                price="$49"
                color="purple"
                cta="Start Learning Free"
                delay={0}
              />

              <PathCard
                path="PATH B"
                title="The Employee"
                subtitle="Efficiency Mastery"
                description={
                  <>
                    Work <span className="text-white">10 hours less per week.</span> Build &quot;Digital Clones&quot; of your
                    routine tasks.
                  </>
                }
                features={[
                  'Create a custom Internal Knowledge GPT',
                  'Build automated email & workflow systems',
                  <>Earn <span className="text-blue-400 font-semibold">Workflow Efficiency Lead</span> SBT</>,
                ]}
                price="$199"
                color="blue"
                cta="Start Learning Free"
                popular
                delay={0.1}
              />

              <PathCard
                path="PATH C"
                title="The Owner"
                subtitle="Operations Scaling"
                description={
                  <>
                    <span className="text-white">Scale without scaling headcount.</span> Replace entire departments with AI
                    chains.
                  </>
                }
                features={[
                  'Deploy Autonomous Sales & Research Chains',
                  'Orchestrate multi-agent systems for full-scale ops',
                  <>Earn <span className="text-emerald-400 font-semibold">AI Operations Master</span> SBT</>,
                ]}
                price="$499"
                color="emerald"
                cta="Start Learning Free"
                delay={0.2}
              />
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 border-t border-slate-800/40 bg-[#0a0c0f]">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <p className="text-slate-500 text-sm uppercase tracking-wider mb-2">What Learners Say</p>
            </motion.div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {[
                {
                  quote: "Finally, an AI course that makes you build real things. I deployed my first AI workflow in week 2.",
                  name: "Marcus T.",
                  role: "Software Developer",
                  path: "Student Path",
                },
                {
                  quote: "Cut my weekly admin work by 8 hours. The automation templates alone were worth it.",
                  name: "Sarah K.",
                  role: "Operations Manager",
                  path: "Employee Path",
                },
                {
                  quote: "Built an AI sales research system that does what my intern used to do. Runs 24/7.",
                  name: "James L.",
                  role: "Startup Founder",
                  path: "Owner Path",
                },
              ].map((testimonial, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-slate-800/20 border border-slate-800/40 rounded-xl p-4 sm:p-5"
                >
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, j) => (
                      <svg key={j} className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed mb-4">"{testimonial.quote}"</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">{testimonial.name}</p>
                      <p className="text-slate-500 text-xs">{testimonial.role}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-slate-800/50 text-slate-400 rounded">
                      {testimonial.path}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Phazur Section */}
        <section id="why-phazur" className="py-12 sm:py-20 px-4 sm:px-6 bg-[#0c0e12] border-t border-slate-800/40">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-14"
            >
              <h2 className="text-3xl md:text-4xl font-semibold mb-3">Why Phazur?</h2>
              <p className="text-slate-500">We do things differently</p>
            </motion.div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {[
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  ),
                  title: 'No Quizzes',
                  desc: 'We verify your code, not your memory. Your project either works or it doesn\'t.',
                  color: 'text-rose-400',
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                    </svg>
                  ),
                  title: 'Blockchain Verified',
                  desc: 'Your certificates are Soulbound Tokens (SBTs) on Polygon. Unfakeable proof.',
                  color: 'text-violet-400',
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                    </svg>
                  ),
                  title: 'Socratic Learning',
                  desc: 'Phazur guides your thinking. Learn to solve, not just copy.',
                  color: 'text-cyan-400',
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="p-5 sm:p-6 bg-[#16181d] rounded-xl border border-slate-800/60 hover:border-slate-700/80 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg bg-slate-800/50 ${item.color} flex items-center justify-center mb-4`}>
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">{item.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Trust Signals */}
            <div className="mt-12 pt-8 border-t border-slate-800/40 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: '3 Views', sub: 'Chat · Terminal · Sandbox' },
                { value: 'GPT-4', sub: 'Powered by' },
                { value: '1:1', sub: 'Human Mentors' },
                { value: '$0', sub: 'Until You Ship' },
              ].map((item) => (
                <div key={item.value} className="text-center py-4">
                  <div className="text-xl font-semibold text-white">{item.value}</div>
                  <div className="text-xs text-slate-600 mt-1">{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Email Capture / Teams Section */}
        <section id="teams" className="py-12 sm:py-20 px-4 sm:px-6 border-t border-slate-800/40">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs mb-4">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                Team Plans Coming Soon
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold mb-3">Train Your Team on AI</h2>
              <p className="text-slate-500">Get early access to team pricing and bulk discounts.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-[#16181d] border border-slate-800/60 rounded-xl p-5 sm:p-8"
            >
              {/* Email Capture Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const email = (form.elements.namedItem('email') as HTMLInputElement).value;
                  const teamSize = (form.elements.namedItem('teamSize') as HTMLSelectElement).value;
                  // TODO: Send to API
                  console.log('Team interest:', { email, teamSize });
                  alert('Thanks! We\'ll be in touch soon.');
                  form.reset();
                }}
                className="max-w-md mx-auto"
              >
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-xs text-slate-500 mb-2">Work Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      placeholder="you@company.com"
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition"
                    />
                  </div>
                  <div>
                    <label htmlFor="teamSize" className="block text-xs text-slate-500 mb-2">Team Size</label>
                    <select
                      id="teamSize"
                      name="teamSize"
                      required
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition appearance-none cursor-pointer"
                    >
                      <option value="">Select team size</option>
                      <option value="2-5">2-5 employees</option>
                      <option value="6-15">6-15 employees</option>
                      <option value="16-50">16-50 employees</option>
                      <option value="50+">50+ employees</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3.5 min-h-[48px] bg-cyan-500 hover:bg-cyan-400 text-black font-medium rounded-lg transition"
                  >
                    Get Early Access
                  </button>
                </div>
              </form>

              {/* Team Certification Bundles */}
              <div className="mt-8 pt-6 border-t border-slate-800/60">
                <p className="text-center text-slate-500 text-sm mb-6">Popular certification bundles</p>
                <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
                  {[
                    {
                      name: 'Starter Team',
                      seats: '5 certifications',
                      price: '$1,199',
                      savings: 'Save 20%',
                      color: 'text-purple-400'
                    },
                    {
                      name: 'Growth Team',
                      seats: '15 certifications',
                      price: '$2,999',
                      savings: 'Save 33%',
                      color: 'text-cyan-400'
                    },
                    {
                      name: 'Enterprise',
                      seats: 'Unlimited',
                      price: 'Custom',
                      savings: 'Best value',
                      color: 'text-emerald-400'
                    },
                  ].map((item) => (
                    <div key={item.name} className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/40 text-center">
                      <div className={`text-xs font-medium uppercase tracking-wider ${item.color} mb-2`}>{item.name}</div>
                      <div className="text-lg font-semibold text-white">{item.price}</div>
                      <div className="text-xs text-slate-500 mt-1">{item.seats}</div>
                      <div className="text-xs text-emerald-400 mt-2">{item.savings}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Individual Note */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center text-slate-600 text-sm mt-6"
            >
              Free to learn individually. Certifications from <span className="text-white">$49</span>.
              <Link href="#paths" className="text-cyan-500 hover:text-cyan-400 ml-1">See all paths →</Link>
            </motion.p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[#0c0e12] border-t border-slate-800/40">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-4">
              Ready to Command AI?
            </h2>
            <p className="text-slate-500 mb-8">
              Start building today. Pay only after you ship real work.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 min-h-[52px] bg-white text-slate-900 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Start Your Path Free
            </Link>
          </motion.div>
        </section>
      </main>

      {/* Footer - Minimal */}
      <footer className="border-t border-slate-800/40 py-8 sm:py-10 bg-[#0a0b0e]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Phazur" width={24} height={24} className="invert opacity-80" />
              <span className="text-sm font-medium text-slate-400">PHAZUR</span>
            </div>
            <div className="flex flex-wrap gap-4 sm:gap-6 text-xs text-slate-600">
              <Link href="/dashboard" className="py-2 hover:text-slate-400 transition-colors">Dashboard</Link>
              <a href="#paths" className="py-2 hover:text-slate-400 transition-colors">Paths</a>
              <a href="#teams" className="py-2 hover:text-slate-400 transition-colors">Teams</a>
              <span className="py-2 text-slate-700">Docs (soon)</span>
            </div>
          </div>
          <div className="pt-6 border-t border-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
            <div>© 2025 Phazur. Build. Ship. Prove.</div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                Polygon
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                GPT-4
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
