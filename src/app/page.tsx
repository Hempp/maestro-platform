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
      <div className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
        {value}
        {suffix && <span className="text-cyan-400">{suffix}</span>}
      </div>
      <div className="text-xs uppercase tracking-wider text-slate-500 mt-1">{label}</div>
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
      className={`group relative bg-[#16181d] border border-slate-800/60 rounded-2xl p-8 transition-all duration-300 hover:border-slate-700/80 ${
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
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-2xl font-semibold text-white">{price}</span>
          <span className="text-slate-600 text-sm">after capstone</span>
        </div>

        <Link
          href="/dashboard"
          className={`block w-full py-3 ${colors.button} rounded-lg text-center text-sm font-medium transition-colors`}
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
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Phazur" width={32} height={32} className="invert opacity-90" />
            <span className="text-lg font-semibold tracking-tight">PHAZUR</span>
            <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded font-mono">
              v2.0
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {[
              { label: 'Paths', href: '#paths' },
              { label: 'Why Phazur', href: '#why-phazur' },
              { label: 'Pricing', href: '#pricing' },
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

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section - Clean & Focused */}
        <section ref={heroRef} className="relative pt-28 pb-24 px-6 min-h-[90vh] flex items-center">
          <SubtleGradient />
          <GridPattern />

          <motion.div
            style={{ opacity: heroOpacity, y: heroY }}
            className="max-w-4xl mx-auto text-center relative z-10"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-full text-xs mb-8"
            >
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              <span className="text-slate-300">AI-Native Learning Lab</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500">Blockchain Verified</span>
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
              Build real AI workflows, earn elite credentials, and mint your proof of mastery on-chain.{' '}
              <span className="text-slate-200">Pay nothing until you ship.</span>
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-white text-slate-900 hover:bg-slate-100 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <span className="w-5 h-5 bg-slate-900 text-white rounded text-xs flex items-center justify-center font-bold">P</span>
                Start Building
              </Link>
              <a
                href="#paths"
                className="px-6 py-3 text-slate-400 hover:text-white transition-colors flex items-center gap-2"
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
              className="mt-20 pt-8 border-t border-slate-800/50 grid grid-cols-3 gap-8 max-w-lg mx-auto"
            >
              <StatItem value="60" suffix="s" label="First result" />
              <StatItem value="$0" label="Until ship" />
              <StatItem value="SBT" label="On-chain" />
            </motion.div>
          </motion.div>
        </section>

        {/* Paths Section */}
        <section id="paths" className="py-20 px-6 border-t border-slate-800/40">
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

            <div className="grid lg:grid-cols-3 gap-6">
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
                cta="Start Building Free"
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
                cta="Reclaim My Time"
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
                cta="Automate My Business"
                delay={0.2}
              />
            </div>
          </div>
        </section>

        {/* Why Phazur Section */}
        <section id="why-phazur" className="py-20 px-6 bg-[#0c0e12] border-t border-slate-800/40">
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

            <div className="grid md:grid-cols-3 gap-6">
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
                  className="p-6 bg-[#16181d] rounded-xl border border-slate-800/60 hover:border-slate-700/80 transition-colors"
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

        {/* Pricing Section */}
        <section id="pricing" className="py-20 px-6 border-t border-slate-800/40">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-semibold mb-3">Simple Pricing</h2>
              <p className="text-slate-500">Build first, pay later. No upfront costs.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-[#16181d] border border-slate-800/60 rounded-xl p-8"
            >
              <div className="grid md:grid-cols-3 gap-6 text-center">
                {[
                  { path: 'Student', price: '$49', cert: 'AI Associate', color: 'text-purple-400' },
                  { path: 'Employee', price: '$199', cert: 'Efficiency Lead', color: 'text-cyan-400' },
                  { path: 'Owner', price: '$499', cert: 'Ops Master', color: 'text-emerald-400' },
                ].map((item) => (
                  <div key={item.path} className="py-4">
                    <div className={`text-xs uppercase tracking-wider ${item.color} mb-2`}>{item.path}</div>
                    <div className="text-3xl font-semibold text-white">{item.price}</div>
                    <div className="text-slate-600 text-xs mt-1">{item.cert}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800/60">
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
                  {['Pay after capstone', 'Lifetime access', 'On-chain cert', '1:1 mentors'].map((item) => (
                    <div key={item} className="flex items-center gap-1.5">
                      <span className="text-emerald-500">✓</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-6 bg-[#0c0e12] border-t border-slate-800/40">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">
              Ready to Command AI?
            </h2>
            <p className="text-slate-500 mb-8">
              Start building today. Pay only after you ship real work.
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-8 py-3.5 bg-white text-slate-900 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Start Your Path Free
            </Link>
          </motion.div>
        </section>
      </main>

      {/* Footer - Minimal */}
      <footer className="border-t border-slate-800/40 py-10 bg-[#0a0b0e]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-8">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Phazur" width={24} height={24} className="invert opacity-80" />
              <span className="text-sm font-medium text-slate-400">PHAZUR</span>
            </div>
            <div className="flex flex-wrap gap-6 text-xs text-slate-600">
              <Link href="/dashboard" className="hover:text-slate-400 transition-colors">Dashboard</Link>
              <a href="#paths" className="hover:text-slate-400 transition-colors">Paths</a>
              <a href="#pricing" className="hover:text-slate-400 transition-colors">Pricing</a>
              <span className="text-slate-700">Docs (soon)</span>
            </div>
          </div>
          <div className="pt-6 border-t border-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
            <div>© 2025 Phazur. Build first, pay later.</div>
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
