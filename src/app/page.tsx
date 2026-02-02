'use client';

/**
 * PHAZUR LANDING PAGE
 * "Stop Chatting with AI. Start Commanding It."
 * Enhanced with Framer Motion animations
 */

import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

// Animation variants
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Animated gradient background component
function AnimatedGradient() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent rounded-full blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-500/10 via-transparent to-transparent rounded-full blur-3xl"
        animate={{
          x: [0, -100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

// Floating particles component
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}

// Animated stat counter
function AnimatedStat({ value, suffix = '', label }: { value: string; suffix?: string; label: string }) {
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="text-3xl md:text-4xl font-bold text-white">
        {value}
        <span className="text-cyan-400">{suffix}</span>
      </div>
      <div className="text-sm text-slate-500">{label}</div>
    </motion.div>
  );
}

// Feature item component
function FeatureItem({ children, color }: { children: React.ReactNode; color: 'purple' | 'blue' | 'emerald' }) {
  const colorClasses = {
    purple: 'bg-purple-500/20 text-purple-400',
    blue: 'bg-blue-500/20 text-blue-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
  };

  return (
    <motion.div variants={staggerItem} className="flex items-start gap-3">
      <div className={`w-6 h-6 ${colorClasses[color]} rounded flex items-center justify-center text-xs mt-0.5`}>✓</div>
      <div className="text-slate-300 text-sm">{children}</div>
    </motion.div>
  );
}

// Path card component with animations
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
      border: 'border-purple-500/50',
      hoverBorder: 'hover:border-purple-400/70',
      bg: 'bg-purple-500/20',
      text: 'text-purple-400',
      button: 'bg-purple-600 hover:bg-purple-500',
      gradient: 'from-purple-500 to-pink-500',
    },
    blue: {
      border: 'border-blue-500/50',
      hoverBorder: 'hover:border-blue-400/70',
      bg: 'bg-blue-500/20',
      text: 'text-blue-400',
      button: 'bg-blue-600 hover:bg-blue-500',
      gradient: 'from-blue-500 to-cyan-500',
    },
    emerald: {
      border: 'border-emerald-500/50',
      hoverBorder: 'hover:border-emerald-400/70',
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-400',
      button: 'bg-emerald-600 hover:bg-emerald-500',
      gradient: 'from-emerald-500 to-teal-500',
    },
  };

  const colors = colorClasses[color];
  const emoji = color === 'purple' ? '🎓' : color === 'blue' ? '⚡' : '🚀';

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -8 }}
      className={`group relative bg-gradient-to-b from-[#1a1d21] to-[#13151a] border ${
        popular ? colors.border : 'border-slate-800'
      } ${colors.hoverBorder} rounded-2xl p-8 transition-all duration-300 ${
        popular ? 'scale-[1.02] shadow-xl shadow-blue-500/10' : ''
      }`}
    >
      {popular && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-sm font-medium rounded-full"
        >
          MOST POPULAR
        </motion.div>
      )}
      <motion.div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.gradient} rounded-t-2xl ${
          popular ? '' : 'opacity-0 group-hover:opacity-100'
        } transition`}
      />

      <div className="flex items-center gap-3 mb-6">
        <motion.div
          whileHover={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.5 }}
          className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}
        >
          <span className="text-2xl">{emoji}</span>
        </motion.div>
        <div>
          <div className={`${colors.text} text-sm font-medium`}>{path}</div>
          <h3 className="text-xl font-bold">{title}</h3>
        </div>
      </div>

      <h4 className="text-2xl font-bold mb-4">{subtitle}</h4>

      <p className="text-slate-400 mb-6 leading-relaxed">{description}</p>

      <motion.div className="space-y-4 mb-8" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        {features.map((feature, i) => (
          <FeatureItem key={i} color={color}>{feature}</FeatureItem>
        ))}
      </motion.div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-2xl font-bold text-white">{price}</span>
          <span className="text-slate-500 text-sm ml-2">after capstone</span>
        </div>
      </div>

      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Link
          href="/dashboard"
          className={`block w-full py-3 ${colors.button} rounded-xl text-center font-semibold transition`}
        >
          {cta}
        </Link>
      </motion.div>
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
      {/* Navigation */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 bg-[#0f1115]/90 backdrop-blur-xl"
      >
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2">
            <Image src="/logo.png" alt="Phazur" width={36} height={36} className="invert" />
            <div className="text-2xl font-bold tracking-tight">PHAZUR</div>
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full font-mono"
            >
              v2.0
            </motion.span>
          </motion.div>
          <div className="hidden md:flex items-center gap-8">
            {[{ label: 'Paths', href: '#paths' }, { label: 'Why Phazur', href: '#why-phazur' }, { label: 'Pricing', href: '#pricing' }].map((item, i) => (
              <motion.a
                key={item.label}
                href={item.href}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                whileHover={{ y: -2, color: '#fff' }}
                className="text-slate-400 hover:text-white transition text-sm"
              >
                {item.label}
              </motion.a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link href="/login" className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium transition">
                Sign In
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/dashboard"
                className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg text-sm font-medium transition shadow-lg shadow-cyan-500/20"
              >
                Start Free
              </Link>
            </motion.div>
          </div>
        </nav>
      </motion.header>

      <main>
        {/* Hero Section */}
        <section ref={heroRef} className="relative pt-32 pb-20 px-6 min-h-screen flex items-center">
          <AnimatedGradient />
          <FloatingParticles />

          <motion.div style={{ opacity: heroOpacity, y: heroY }} className="max-w-5xl mx-auto text-center relative z-10">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm mb-8"
            >
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 bg-emerald-400 rounded-full"
              />
              <span className="text-blue-400">AI-Native Learning Lab</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Blockchain Verified Certificates</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight"
            >
              Stop Chatting with AI.
              <br />
              <motion.span
                initial={{ backgroundPosition: '0% 50%' }}
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-[length:200%_auto]"
              >
                Start Commanding It.
              </motion.span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed"
            >
              The only platform where you build real AI workflows, earn elite credentials, and mint your proof of mastery
              on the blockchain.
              <span className="text-white"> Pay nothing until you ship.</span>
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/dashboard"
                  className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl text-lg font-semibold transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-3"
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"
                  >
                    <span className="text-sm font-bold">P</span>
                  </motion.div>
                  Talk to Phazur
                </Link>
              </motion.div>
              <motion.a
                href="#paths"
                whileHover={{ scale: 1.05, borderColor: 'rgb(100 116 139)' }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 border border-slate-700 rounded-xl text-lg font-medium transition flex items-center gap-2"
              >
                Explore Paths
                <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1, repeat: Infinity }}>
                  →
                </motion.span>
              </motion.a>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
            >
              <AnimatedStat value="60" suffix="s" label="to first AI result" />
              <AnimatedStat value="$0" label="until you ship" />
              <AnimatedStat value="SBT" label="on Polygon" />
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-6 h-10 border-2 border-slate-600 rounded-full flex justify-center pt-2"
            >
              <motion.div className="w-1 h-2 bg-slate-400 rounded-full" />
            </motion.div>
          </motion.div>
        </section>

        {/* Paths Section */}
        <section id="paths" className="py-24 px-6 border-t border-slate-800/50 relative">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Choose Your Path</h2>
              <p className="text-slate-400 text-lg">Every path leads to a deployed project and an on-chain credential</p>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8">
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
        <section id="why-phazur" className="py-24 px-6 bg-gradient-to-b from-[#13151a] to-[#0f1115] border-t border-slate-800/50">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Why Phazur?</h2>
              <p className="text-slate-400 text-lg">We do things differently</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: '🚫', title: 'No Quizzes', desc: <>We verify your <span className="text-white">code</span>, not your memory. Your project either works or it doesn&apos;t.</>, bgColor: 'bg-red-500/20' },
                { icon: '⛓️', title: 'Blockchain Verified', desc: <>Your certificates are <span className="text-white">Soulbound Tokens (SBTs)</span> on Polygon. Unfakeable proof of skill.</>, bgColor: 'bg-purple-500/20' },
                { icon: '🧠', title: 'Socratic Learning', desc: <>Phazur doesn&apos;t give answers; it <span className="text-white">guides your thinking</span>. Learn to solve, not just copy.</>, bgColor: 'bg-blue-500/20' },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  whileHover={{ y: -5, boxShadow: '0 20px 40px -20px rgba(0,0,0,0.5)' }}
                  className="text-center p-8 bg-[#1a1d21] rounded-2xl border border-slate-800 hover:border-slate-700 transition-all"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                    className={`w-16 h-16 ${item.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-6`}
                  >
                    <span className="text-3xl">{item.icon}</span>
                  </motion.div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-slate-400">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Trust Signals */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
            >
              {[
                { value: '3 Views', sub: 'Chat • Terminal • Sandbox' },
                { value: 'Real AI', sub: 'Powered by GPT-4' },
                { value: '1:1', sub: 'Human Mentors' },
                { value: '$0', sub: 'Until You Ship' },
              ].map((item) => (
                <motion.div
                  key={item.value}
                  variants={staggerItem}
                  whileHover={{ scale: 1.05, borderColor: 'rgb(71 85 105)' }}
                  className="p-4 bg-[#1a1d21] rounded-xl border border-slate-800 transition-all"
                >
                  <div className="text-2xl font-bold text-white">{item.value}</div>
                  <div className="text-sm text-slate-500">{item.sub}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 px-6 border-t border-slate-800/50">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Simple Pricing</h2>
              <p className="text-slate-400 text-lg">Build first, pay later. No upfront costs.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ borderColor: 'rgb(71 85 105)' }}
              className="bg-gradient-to-b from-[#1a1d21] to-[#13151a] border border-slate-800 rounded-2xl p-8 md:p-12 transition-all"
            >
              <div className="grid md:grid-cols-3 gap-8 text-center">
                {[
                  { path: 'Student Path', price: '$49', cert: 'Certified AI Associate', colorClass: 'text-purple-400' },
                  { path: 'Employee Path', price: '$199', cert: 'Workflow Efficiency Lead', colorClass: 'text-blue-400' },
                  { path: 'Owner Path', price: '$499', cert: 'AI Operations Master', colorClass: 'text-emerald-400' },
                ].map((item, i) => (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className={`${item.colorClass} font-medium mb-2`}>{item.path}</div>
                    <div className="text-4xl font-bold text-white mb-2">{item.price}</div>
                    <div className="text-slate-500 text-sm">{item.cert}</div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="mt-10 pt-8 border-t border-slate-800"
              >
                <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
                  {['Pay only after capstone', 'Lifetime access to materials', 'On-chain certificate', '1:1 mentor support'].map(
                    (item) => (
                      <motion.div key={item} whileHover={{ color: '#fff' }} className="flex items-center gap-2 transition">
                        <span className="text-emerald-400">✓</span>
                        {item}
                      </motion.div>
                    )
                  )}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-6 bg-gradient-to-b from-[#0f1115] to-[#13151a] border-t border-slate-800/50 relative overflow-hidden">
          <AnimatedGradient />
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center relative z-10"
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold mb-6"
            >
              Ready to Command AI?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-slate-400 mb-10"
            >
              Start building today. Pay only after you ship real work.
            </motion.p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/dashboard"
                className="inline-block px-10 py-5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl text-xl font-semibold transition-all shadow-lg shadow-cyan-500/25"
              >
                Start Your Path Free
              </Link>
            </motion.div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-12 bg-[#0a0c0f]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              <div className="flex items-center gap-2 mb-4">
                <Image src="/logo.png" alt="Phazur" width={28} height={28} className="invert" />
                <span className="text-xl font-bold">PHAZUR</span>
              </div>
              <p className="text-slate-500 text-sm">AI-native learning lab with blockchain-verified credentials. Build first, pay later.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="text-sm font-semibold text-slate-300 mb-4">Certifications</div>
              <div className="space-y-2 text-sm text-slate-500">
                <div className="hover:text-purple-400 transition cursor-pointer">Certified AI Associate — $49</div>
                <div className="hover:text-blue-400 transition cursor-pointer">Workflow Efficiency Lead — $199</div>
                <div className="hover:text-emerald-400 transition cursor-pointer">AI Operations Master — $499</div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <div className="text-sm font-semibold text-slate-300 mb-4">Platform</div>
              <div className="space-y-2 text-sm text-slate-500">
                <Link href="/dashboard" className="block hover:text-cyan-400 transition">
                  Dashboard
                </Link>
                <Link href="#" className="block hover:text-white transition group relative">
                  Documentation
                  <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-xs text-slate-400 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                    Coming soon
                  </span>
                </Link>
                <Link href="#" className="block hover:text-white transition group relative">
                  API Reference
                  <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-xs text-slate-400 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                    Coming soon
                  </span>
                </Link>
              </div>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500"
          >
            <div>© 2025 Phazur. Build first, pay later.</div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="text-emerald-500">
                  ●
                </motion.span>
                Polygon Network
              </span>
              <span className="flex items-center gap-1">
                <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} className="text-blue-500">
                  ●
                </motion.span>
                GPT-4 Powered
              </span>
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}
