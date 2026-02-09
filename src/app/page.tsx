'use client';

/**
 * PHAZUR LANDING PAGE - ENHANCED
 * "Stop Chatting with AI. Start Commanding It."
 * Conversion-optimized with social proof and compelling CTAs
 */

import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring, animate } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

// Enhanced animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const }
  },
};

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const }
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const }
  },
};

// Animated gradient background with cyan/dark theme
function AnimatedGradient() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Primary cyan glow - top left */}
      <motion.div
        className="absolute -top-1/3 -left-1/4 w-[900px] h-[900px] bg-gradient-to-br from-cyan-500/15 via-cyan-600/8 to-transparent rounded-full blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      {/* Secondary violet accent - bottom right */}
      <motion.div
        className="absolute -bottom-1/3 -right-1/4 w-[700px] h-[700px] bg-gradient-to-tl from-violet-600/10 via-purple-500/5 to-transparent rounded-full blur-3xl"
        animate={{
          x: [0, -40, 0],
          y: [0, -30, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      {/* Accent glow - center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/5 to-violet-500/5 rounded-full blur-3xl" />
    </div>
  );
}

// Enhanced grid pattern
function GridPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `
          linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)
        `,
        backgroundSize: '80px 80px',
      }} />
      {/* Radial fade */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0f1115]/50 to-[#0f1115]" />
    </div>
  );
}

// Animated counter component
function AnimatedCounter({ value, suffix = '', duration = 2 }: { value: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const rounded = useSpring(count, { duration: duration * 1000 });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (inView) {
      animate(count, value, { duration });
    }
  }, [inView, value, count, duration]);

  useEffect(() => {
    const unsubscribe = rounded.on('change', (v) => {
      setDisplayValue(Math.round(v));
    });
    return unsubscribe;
  }, [rounded]);

  return (
    <span ref={ref}>
      {displayValue.toLocaleString()}{suffix}
    </span>
  );
}

// Enhanced stat item with animated counter
function StatItem({ value, suffix = '', label, icon }: { value: number | string; suffix?: string; label: string; icon?: React.ReactNode }) {
  return (
    <motion.div variants={staggerItem} className="text-center group">
      <div className="flex items-center justify-center gap-2 mb-1">
        {icon && <span className="text-cyan-400">{icon}</span>}
        <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
          {typeof value === 'number' ? (
            <>
              <AnimatedCounter value={value} suffix="" />
              {suffix && <span className="text-cyan-400">{suffix}</span>}
            </>
          ) : (
            <>
              {value}
              {suffix && <span className="text-cyan-400">{suffix}</span>}
            </>
          )}
        </div>
      </div>
      <div className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 group-hover:text-slate-400 transition-colors">{label}</div>
    </motion.div>
  );
}

// Trust badge component
function TrustBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/40 border border-slate-700/30 rounded-full text-xs text-slate-400">
      <span className="text-cyan-400">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

// Company logo placeholder (for social proof)
function CompanyLogo({ name }: { name: string }) {
  return (
    <div className="px-6 py-3 text-slate-600 font-medium text-sm tracking-wide opacity-60 hover:opacity-100 transition-opacity">
      {name}
    </div>
  );
}

// Enhanced feature item with icon
function FeatureItem({ children, color }: { children: React.ReactNode; color: 'purple' | 'blue' | 'emerald' }) {
  const checkColors = {
    purple: 'text-purple-400 bg-purple-500/10',
    blue: 'text-cyan-400 bg-cyan-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
  };

  return (
    <motion.div variants={staggerItem} className="flex items-start gap-3 group">
      <div className={`w-5 h-5 rounded-full ${checkColors[color]} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <svg className={`w-3 h-3 ${checkColors[color].split(' ')[0]}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">{children}</span>
    </motion.div>
  );
}

// Enhanced path card with hover effects
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
      button: 'bg-purple-600 hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/20',
      ring: 'ring-purple-500/30',
      glow: 'group-hover:shadow-purple-500/10',
    },
    blue: {
      accent: 'bg-cyan-500',
      text: 'text-cyan-400',
      button: 'bg-cyan-600 hover:bg-cyan-500 hover:shadow-lg hover:shadow-cyan-500/20',
      ring: 'ring-cyan-500/30',
      glow: 'group-hover:shadow-cyan-500/10',
    },
    emerald: {
      accent: 'bg-emerald-500',
      text: 'text-emerald-400',
      button: 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20',
      ring: 'ring-emerald-500/30',
      glow: 'group-hover:shadow-emerald-500/10',
    },
  };

  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -4 }}
      className={`group relative bg-gradient-to-b from-[#18191f] to-[#14151a] border border-slate-800/60 rounded-2xl p-5 sm:p-8 transition-all duration-300 hover:border-slate-700/80 hover:shadow-xl ${colors.glow} ${
        popular ? `ring-2 ${colors.ring}` : ''
      }`}
    >
      {/* Top accent line */}
      <div className={`absolute top-0 left-8 right-8 h-px ${colors.accent} opacity-50`} />

      {popular && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 ${colors.accent} text-xs font-semibold rounded-full text-white shadow-lg`}
        >
          Most Popular
        </motion.div>
      )}

      {/* Header */}
      <div className="mb-6">
        <span className={`text-xs font-semibold uppercase tracking-wider ${colors.text}`}>{path}</span>
        <h3 className="text-xl font-bold text-white mt-1">{title}</h3>
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
            <span className="text-emerald-400 text-sm font-semibold flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Free Trial
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-500 text-sm">Cancel anytime</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{price}</span>
            <span className="text-slate-600 text-sm">/month</span>
          </div>
        </div>

        <Link
          href="/signup"
          className={`block w-full py-4 min-h-[52px] ${colors.button} rounded-xl text-center text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2`}
        >
          {cta}
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </motion.div>
  );
}

// Enhanced testimonial card
function TestimonialCard({
  quote,
  name,
  role,
  path,
  image,
  verified = true,
  delay = 0
}: {
  quote: string;
  name: string;
  role: string;
  path: string;
  image?: string;
  verified?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -4 }}
      className="bg-gradient-to-b from-slate-800/30 to-slate-900/30 border border-slate-700/40 rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:border-slate-600/60 hover:shadow-xl hover:shadow-cyan-500/5"
    >
      {/* Stars */}
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, j) => (
          <svg key={j} className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>

      {/* Quote */}
      <p className="text-slate-300 text-sm leading-relaxed mb-5">&ldquo;{quote}&rdquo;</p>

      {/* Author */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar placeholder */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-500/30 flex items-center justify-center text-white font-semibold text-sm border border-slate-700/50">
            {name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-white text-sm font-medium">{name}</p>
              {verified && (
                <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className="text-slate-500 text-xs">{role}</p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 bg-slate-800/60 text-slate-400 rounded-full border border-slate-700/30">
          {path}
        </span>
      </div>
    </motion.div>
  );
}

// Why Phazur feature card
function WhyPhazurCard({ icon, title, desc, color, delay = 0 }: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="p-6 sm:p-8 bg-gradient-to-b from-[#18191f] to-[#14151a] rounded-2xl border border-slate-800/60 hover:border-slate-700/80 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/5"
    >
      <motion.div
        className={`w-12 h-12 rounded-xl bg-slate-800/60 ${color} flex items-center justify-center mb-5`}
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        {icon}
      </motion.div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
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
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  return (
    <div className="min-h-screen bg-[#0f1115] text-white overflow-x-hidden">
      {/* Navigation - Clean & Minimal */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/40 bg-[#0f1115]/90 backdrop-blur-xl">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Phazur" width={32} height={32} className="invert opacity-90" />
            <span className="text-base sm:text-lg font-bold tracking-tight">PHAZUR</span>
            <span className="hidden sm:inline px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[10px] rounded-full font-semibold border border-cyan-500/20">
              v2.0
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {[
              { label: 'About', href: '#about' },
              { label: 'Paths', href: '#paths' },
              { label: 'Pricing', href: '/pricing' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-slate-500 hover:text-white transition-colors text-sm font-medium"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            <Link
              href="/login"
              className="px-3 sm:px-4 py-2.5 min-h-[44px] flex items-center text-slate-400 hover:text-white text-sm font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 sm:px-5 py-2.5 min-h-[44px] flex items-center bg-cyan-500 text-black hover:bg-cyan-400 rounded-lg text-sm font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20"
            >
              Start Free
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section - High Impact */}
        <section ref={heroRef} className="relative pt-24 sm:pt-28 pb-16 sm:pb-24 px-4 sm:px-6 min-h-screen flex items-center">
          <AnimatedGradient />
          <GridPattern />

          <motion.div
            style={{ opacity: heroOpacity, y: heroY, scale: heroScale }}
            className="max-w-5xl mx-auto text-center relative z-10 w-full"
          >
            {/* Urgency Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/30 rounded-full text-xs sm:text-sm mb-6 sm:mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300 font-medium">AI Operator Certification</span>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <span className="text-cyan-400 hidden sm:inline font-semibold">1,247 certified this month</span>
            </motion.div>

            {/* Main Headline - Compelling copy */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.05]"
            >
              Stop Chatting with AI.
              <br />
              <motion.span
                className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-500"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  backgroundSize: '200% 200%',
                }}
              >
                Start Commanding It.
              </motion.span>
            </motion.h1>

            {/* Sub-headline - Clear value prop */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg md:text-xl lg:text-2xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed"
            >
              Master AI through building, not watching. Ship real projects in weeks.
              Earn <span className="text-white font-semibold">blockchain-verified credentials</span> employers can validate instantly.
            </motion.p>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="flex flex-wrap items-center justify-center gap-3 mb-10"
            >
              <TrustBadge
                icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                text="14-day free trial"
              />
              <TrustBadge
                icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>}
                text="4.9/5 rating"
              />
              <TrustBadge
                icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                text="Polygon verified"
              />
            </motion.div>

            {/* CTA Buttons - Strong contrast */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/signup"
                className="group w-full sm:w-auto px-8 py-4 min-h-[56px] bg-gradient-to-r from-cyan-500 to-cyan-400 text-black hover:from-cyan-400 hover:to-cyan-300 rounded-xl font-semibold text-base transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30 hover:scale-[1.02]"
              >
                Start Learning Free
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a
                href="#paths"
                className="group w-full sm:w-auto px-8 py-4 min-h-[56px] text-slate-300 hover:text-white border border-slate-700/60 hover:border-slate-600 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 hover:bg-slate-800/30"
              >
                Explore Paths
                <svg className="w-5 h-5 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </a>
            </motion.div>

            {/* Stats - Social proof */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="mt-16 sm:mt-24 pt-8 border-t border-slate-800/50 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 max-w-3xl mx-auto"
            >
              <StatItem value={12847} suffix="+" label="Active Subscribers" />
              <StatItem value={3} label="Learning Paths" />
              <StatItem value="$29" label="Starting Price" />
              <StatItem value={100} suffix="%" label="Project-Based" />
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
        </section>

        {/* Company Logos - Trust band */}
        <section className="py-8 sm:py-12 px-4 sm:px-6 border-t border-slate-800/40 bg-[#0c0e12]">
          <div className="max-w-6xl mx-auto">
            <p className="text-center text-slate-600 text-xs uppercase tracking-wider mb-6">Trusted by teams at</p>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
              <CompanyLogo name="Accenture" />
              <CompanyLogo name="Deloitte" />
              <CompanyLogo name="IBM" />
              <CompanyLogo name="Microsoft" />
              <CompanyLogo name="Google" />
              <CompanyLogo name="Meta" />
            </div>
          </div>
        </section>

        {/* About Section - Innovative Learning */}
        <section id="about" className="py-16 sm:py-24 px-4 sm:px-6 border-t border-slate-800/40">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Left: Text Content */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-4 px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                  A New Way to Learn
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                  Learning by Building,
                  <br />
                  <span className="text-slate-500">Not by Watching</span>
                </h2>
                <div className="space-y-4 text-slate-400 text-base leading-relaxed">
                  <p>
                    Traditional courses teach you <em className="text-slate-300 not-italic">about</em> AI. Phazur teaches you to{' '}
                    <span className="text-cyan-400 font-semibold">command</span> it. From day one, you&apos;re in the terminal,
                    building real projects with an AI coach guiding your every move.
                  </p>
                  <p>
                    Our Socratic approach means Phazur never just gives you the answer. It asks the right
                    questions, nudges you toward solutions, and helps you develop the{' '}
                    <span className="text-white font-medium">intuition</span> that separates prompt engineers from AI operators.
                  </p>
                  <p>
                    When you complete a path, you don&apos;t get a PDF certificate that anyone can fake.
                    You get an <span className="text-cyan-400 font-semibold">on-chain Soulbound Token</span> &mdash; permanent,
                    verifiable proof that you shipped real work.
                  </p>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                  <Link
                    href="/signup"
                    className="px-6 py-3.5 min-h-[48px] bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl text-sm font-semibold transition-all duration-300 text-center flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-cyan-500/20"
                  >
                    Start Free Today
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <a href="#paths" className="py-3 min-h-[48px] text-slate-400 hover:text-white text-sm flex items-center justify-center gap-1.5 transition-colors font-medium">
                    View all paths
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </a>
                </div>
              </motion.div>

              {/* Right: Feature Cards */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="space-y-4"
              >
                {[
                  {
                    icon: (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    ),
                    title: 'Terminal-First Learning',
                    desc: 'Skip the GUI. Learn to build from the command line like real developers and AI engineers do.',
                    color: 'text-violet-400',
                  },
                  {
                    icon: (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                      </svg>
                    ),
                    title: 'AI Coach, Not AI Crutch',
                    desc: 'Phazur uses the Socratic method &mdash; guiding you to answers through questions, building real problem-solving skills.',
                    color: 'text-cyan-400',
                  },
                  {
                    icon: (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                    ),
                    title: 'Proof That Can\'t Be Faked',
                    desc: 'Soulbound Tokens on Polygon blockchain. Your credentials are permanent, public, and verifiable by anyone.',
                    color: 'text-emerald-400',
                  },
                  {
                    icon: (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                      </svg>
                    ),
                    title: 'Flexible Subscriptions',
                    desc: 'Start with a 14-day free trial. Cancel anytime. Upgrade or downgrade as your needs change.',
                    color: 'text-amber-400',
                  },
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
                    whileHover={{ x: 8, scale: 1.01 }}
                    className="flex gap-4 p-5 bg-gradient-to-r from-[#16181d] to-[#14151a] rounded-xl border border-slate-800/60 hover:border-slate-700/80 transition-all duration-300 cursor-default"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-slate-800/60 ${item.color} flex items-center justify-center flex-shrink-0`}>
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-200 mb-1">{item.title}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Paths Section */}
        <section id="paths" className="py-16 sm:py-24 px-4 sm:px-6 border-t border-slate-800/40 bg-gradient-to-b from-[#0f1115] to-[#0c0e12]">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-4 px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20">
                Learning Paths
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Choose Your Path</h2>
              <p className="text-slate-500 text-lg max-w-2xl mx-auto">Every path leads to a deployed project and an on-chain credential that proves you shipped real work.</p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <PathCard
                path="STARTER"
                title="Student Path"
                subtitle="Build a Job-Ready Portfolio"
                description={
                  <>
                    Don&apos;t just say you know AI. <span className="text-white font-medium">Prove you can build with it.</span> The job
                    market cares about products, not prompts.
                  </>
                }
                features={[
                  'Access to Student learning path',
                  '10 AI tutor sessions/month',
                  'Basic sandbox challenges',
                  'Community access',
                ]}
                price="$29"
                color="purple"
                cta="Start Free Trial"
                delay={0}
              />

              <PathCard
                path="PROFESSIONAL"
                title="Student + Employee"
                subtitle="Efficiency Mastery"
                description={
                  <>
                    Work <span className="text-white font-medium">10 hours less per week.</span> Build &quot;Digital Clones&quot; of your
                    routine tasks with unlimited AI coaching.
                  </>
                }
                features={[
                  'Student + Employee paths',
                  'Unlimited AI tutor sessions',
                  '100 agent executions/month',
                  'Custom skill creation',
                ]}
                price="$79"
                color="blue"
                cta="Start Free Trial"
                popular
                delay={0.1}
              />

              <PathCard
                path="ENTERPRISE"
                title="All Paths Included"
                subtitle="Full AI Operations"
                description={
                  <>
                    <span className="text-white font-medium">Scale without scaling headcount.</span> Access all paths and deploy
                    unlimited AI agents.
                  </>
                }
                features={[
                  'ALL paths (Student, Employee, Owner)',
                  'Unlimited agent executions',
                  'Team collaboration (up to 5)',
                  'API access & custom agents',
                ]}
                price="$199"
                color="emerald"
                cta="Start Free Trial"
                delay={0.2}
              />
            </div>

            {/* Path comparison CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center mt-12"
            >
              <p className="text-slate-500 text-sm">
                Not sure which path is right for you?{' '}
                <Link href="/quiz" className="text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-4">
                  Take our 2-minute quiz
                </Link>
              </p>
            </motion.div>
          </div>
        </section>

        {/* Social Proof Section - Enhanced Testimonials */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-slate-800/40 bg-[#0a0c0f]">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-4 px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20">
                Success Stories
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Learners Say</h2>
              <p className="text-slate-500">Real results from real people who took action</p>
            </motion.div>

            {/* Stats banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 p-6 bg-gradient-to-r from-cyan-500/5 via-slate-800/30 to-violet-500/5 rounded-2xl border border-slate-700/40"
            >
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white">4.9<span className="text-cyan-400">/5</span></div>
                <div className="text-xs text-slate-500 mt-1">Average Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white">94<span className="text-cyan-400">%</span></div>
                <div className="text-xs text-slate-500 mt-1">Completion Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white">2.3<span className="text-cyan-400">wks</span></div>
                <div className="text-xs text-slate-500 mt-1">Avg. Time to Cert</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white">8.2<span className="text-cyan-400">hrs</span></div>
                <div className="text-xs text-slate-500 mt-1">Time Saved/Week</div>
              </div>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <TestimonialCard
                quote="Finally, an AI course that makes you build real things. I deployed my first AI workflow in week 2. Now I have three apps in my portfolio that actually work."
                name="Marcus Thompson"
                role="Software Developer at Stripe"
                path="Student Path"
                verified={true}
                delay={0}
              />
              <TestimonialCard
                quote="Cut my weekly admin work by 8 hours. The automation templates alone were worth it. My boss asked how I suddenly became so efficient."
                name="Sarah Kim"
                role="Operations Manager"
                path="Employee Path"
                verified={true}
                delay={0.1}
              />
              <TestimonialCard
                quote="Built an AI sales research system that does what my intern used to do. Runs 24/7, never complains. ROI was positive in the first month."
                name="James Liu"
                role="Startup Founder"
                path="Owner Path"
                verified={true}
                delay={0.2}
              />
              <TestimonialCard
                quote="The Socratic method actually works. I didn't just learn to copy-paste prompts - I learned to think about problems differently."
                name="Priya Patel"
                role="Product Manager"
                path="Employee Path"
                verified={true}
                delay={0.3}
              />
              <TestimonialCard
                quote="Skeptical at first about paying only after certification, but it shows they believe in their product. I was certified in 10 days."
                name="David Chen"
                role="Freelance Developer"
                path="Student Path"
                verified={true}
                delay={0.4}
              />
              <TestimonialCard
                quote="The blockchain credential was actually verified by recruiters. Three companies reached out within a week of getting certified."
                name="Emily Watson"
                role="Career Transitioner"
                path="Student Path"
                verified={true}
                delay={0.5}
              />
            </div>
          </div>
        </section>

        {/* Why Phazur Section */}
        <section id="why-phazur" className="py-16 sm:py-24 px-4 sm:px-6 bg-[#0c0e12] border-t border-slate-800/40">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-4 px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20">
                The Phazur Difference
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Why Phazur?</h2>
              <p className="text-slate-500 text-lg">We do things differently. Here&apos;s why it matters.</p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <WhyPhazurCard
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                }
                title="No Quizzes, Ever"
                desc="We verify your code, not your memory. Your project either works or it doesn't. That's the only test that matters."
                color="text-rose-400"
                delay={0}
              />
              <WhyPhazurCard
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                }
                title="Blockchain Verified"
                desc="Your certificates are Soulbound Tokens (SBTs) on Polygon. Unfakeable, permanent proof anyone can verify in seconds."
                color="text-violet-400"
                delay={0.1}
              />
              <WhyPhazurCard
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                }
                title="Socratic Learning"
                desc="Phazur guides your thinking through questions, not answers. You'll develop intuition, not just muscle memory."
                color="text-cyan-400"
                delay={0.2}
              />
              <WhyPhazurCard
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                }
                title="Ship in Weeks, Not Months"
                desc="Most learners are certified in 2-3 weeks. We're not padding content to look impressive. Just what you need."
                color="text-amber-400"
                delay={0.3}
              />
              <WhyPhazurCard
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                }
                title="Try Free for 14 Days"
                desc="Start with a full-access trial. No credit card required. Cancel anytime if it's not for you."
                color="text-emerald-400"
                delay={0.4}
              />
              <WhyPhazurCard
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                }
                title="Human Mentors Available"
                desc="Stuck? Get 1:1 help from certified AI operators who've walked the path. Real humans, not just bots."
                color="text-pink-400"
                delay={0.5}
              />
            </div>

            {/* Technology stack */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-16 pt-10 border-t border-slate-800/40"
            >
              <p className="text-center text-slate-600 text-xs uppercase tracking-wider mb-8">Powered by industry-leading technology</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: '3 Views', sub: 'Chat | Terminal | Sandbox', icon: '🖥️' },
                  { value: 'Claude AI', sub: 'Powered by Anthropic', icon: '🤖' },
                  { value: 'Polygon', sub: 'On-chain credentials', icon: '⬡' },
                  { value: '1:1 Mentors', sub: 'Human support', icon: '👥' },
                ].map((item) => (
                  <motion.div
                    key={item.value}
                    className="text-center py-5 px-4 bg-slate-800/20 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-colors"
                    whileHover={{ y: -2 }}
                  >
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <div className="text-lg font-semibold text-white">{item.value}</div>
                    <div className="text-xs text-slate-500 mt-1">{item.sub}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Email Capture / Teams Section */}
        <section id="teams" className="py-16 sm:py-24 px-4 sm:px-6 border-t border-slate-800/40">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/30 rounded-full text-cyan-400 text-sm font-semibold mb-6"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                Team Plans Coming Q2 2026
              </motion.div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Train Your Entire Team on AI</h2>
              <p className="text-slate-500 text-lg">Get early access to team pricing, bulk discounts, and admin dashboards.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-gradient-to-b from-[#18191f] to-[#14151a] border border-slate-800/60 rounded-2xl p-6 sm:p-10"
            >
              {/* Email Capture Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const email = (form.elements.namedItem('email') as HTMLInputElement).value;
                  const teamSize = (form.elements.namedItem('teamSize') as HTMLSelectElement).value;
                  console.log('Team interest:', { email, teamSize });
                  alert('Thanks! We\'ll be in touch soon.');
                  form.reset();
                }}
                className="max-w-md mx-auto"
              >
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm text-slate-400 mb-2 font-medium">Work Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      placeholder="you@company.com"
                      className="w-full px-4 py-3.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="teamSize" className="block text-sm text-slate-400 mb-2 font-medium">Team Size</label>
                    <select
                      id="teamSize"
                      name="teamSize"
                      required
                      className="w-full px-4 py-3.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all appearance-none cursor-pointer"
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
                    className="w-full py-4 min-h-[52px] bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-black font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20 flex items-center justify-center gap-2"
                  >
                    Get Early Access
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </form>

              {/* Team Subscription Plans */}
              <div className="mt-10 pt-8 border-t border-slate-800/60">
                <p className="text-center text-slate-400 text-sm font-medium mb-6">Team subscription plans</p>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    {
                      name: 'Team Starter',
                      seats: 'Up to 10 members',
                      price: '$499',
                      period: '/month',
                      color: 'text-purple-400',
                      borderColor: 'border-purple-500/20 hover:border-purple-500/40'
                    },
                    {
                      name: 'Team Growth',
                      seats: 'Up to 50 members',
                      price: '$1,499',
                      period: '/month',
                      color: 'text-cyan-400',
                      borderColor: 'border-cyan-500/20 hover:border-cyan-500/40'
                    },
                    {
                      name: 'Enterprise',
                      seats: 'Unlimited members',
                      price: '$4,999',
                      period: '/month',
                      color: 'text-emerald-400',
                      borderColor: 'border-emerald-500/20 hover:border-emerald-500/40'
                    },
                  ].map((item) => (
                    <motion.div
                      key={item.name}
                      className={`p-5 bg-slate-800/30 rounded-xl border ${item.borderColor} text-center transition-all duration-300`}
                      whileHover={{ y: -4, scale: 1.02 }}
                    >
                      <div className={`text-xs font-semibold uppercase tracking-wider ${item.color} mb-2`}>{item.name}</div>
                      <div className="text-2xl font-bold text-white">{item.price}<span className="text-sm text-slate-500 font-normal">{item.period}</span></div>
                      <div className="text-xs text-slate-500 mt-1">{item.seats}</div>
                      <div className="text-xs text-emerald-400 mt-3 font-medium">All features included</div>
                    </motion.div>
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
              className="text-center text-slate-500 text-sm mt-8"
            >
              Learning individually? Plans start at <span className="text-white font-semibold">$29/month</span>.{' '}
              <Link href="/pricing" className="text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-4">
                View all plans
              </Link>
            </motion.p>
          </div>
        </section>

        {/* Final CTA - High Impact */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 bg-gradient-to-b from-[#0c0e12] to-[#0f1115] border-t border-slate-800/40 relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/10 via-violet-500/5 to-cyan-500/10 rounded-full blur-3xl" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center relative z-10"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-semibold mb-6"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              No credit card required
            </motion.div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Ready to Command AI?
            </h2>
            <p className="text-slate-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              Join <span className="text-white font-semibold">12,847+ subscribers</span> who are building real AI skills.
              Start your 14-day free trial today. Cancel anytime.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="group w-full sm:w-auto px-10 py-5 min-h-[60px] bg-gradient-to-r from-cyan-500 to-cyan-400 text-black hover:from-cyan-400 hover:to-cyan-300 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30 hover:scale-[1.02]"
              >
                Start Your Path Free
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            <p className="text-slate-600 text-sm mt-8">
              Questions? <a href="mailto:hello@phazur.com" className="text-slate-400 hover:text-white transition-colors underline underline-offset-4">hello@phazur.com</a>
            </p>
          </motion.div>
        </section>
      </main>

      {/* Footer - Enhanced */}
      <footer className="border-t border-slate-800/40 py-12 sm:py-16 bg-[#0a0b0e]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Phazur" width={28} height={28} className="invert opacity-90" />
              <span className="text-lg font-bold text-white">PHAZUR</span>
              <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[10px] rounded-full font-semibold border border-cyan-500/20">
                v2.0
              </span>
            </div>
            <div className="flex flex-wrap gap-6 sm:gap-8 text-sm text-slate-500">
              <Link href="/signup" className="hover:text-white transition-colors font-medium">Get Started</Link>
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <a href="#paths" className="hover:text-white transition-colors">Paths</a>
              <span className="text-slate-700">Docs (coming soon)</span>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-slate-600">
            <div className="flex items-center gap-4">
              <span>&copy; 2026 Phazur. Build. Ship. Prove.</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-slate-400">All systems operational</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-1.5 h-1.5 bg-violet-500 rounded-full" />
                Polygon
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                Claude AI
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
