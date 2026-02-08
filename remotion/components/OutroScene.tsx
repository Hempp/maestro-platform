import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Img,
  staticFile,
} from 'remotion';
import { CountUpNumber, GradientText, SplitText, ScrambleText } from './AnimatedText';

// Custom easing functions
const easeOutExpo = (t: number): number => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeOutBack = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// Seeded random for consistent particles
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

// Particle types
type ParticleType = 'orb' | 'ring' | 'diamond' | 'dot';

interface Particle {
  id: number;
  angle: number;
  distance: number;
  size: number;
  delay: number;
  type: ParticleType;
  speed: number;
  color: string;
  orbitSpeed: number;
}

// Generate orbital particles
const generateOrbitalParticles = (count: number): Particle[] => {
  const colors = [
    'rgba(34, 211, 238, 1)',
    'rgba(59, 130, 246, 1)',
    'rgba(168, 85, 247, 1)',
    'rgba(16, 185, 129, 1)',
    'rgba(255, 255, 255, 0.8)',
  ];
  const types: ParticleType[] = ['orb', 'ring', 'diamond', 'dot'];

  return Array.from({ length: count }, (_, i) => {
    const seed = i * 456.789;
    return {
      id: i,
      angle: seededRandom(seed + 1) * Math.PI * 2,
      distance: 150 + seededRandom(seed + 2) * 350,
      size: 3 + seededRandom(seed + 3) * 8,
      delay: seededRandom(seed + 4) * 30,
      type: types[Math.floor(seededRandom(seed + 5) * types.length)],
      speed: 0.003 + seededRandom(seed + 6) * 0.008,
      color: colors[Math.floor(seededRandom(seed + 7) * colors.length)],
      orbitSpeed: 0.005 + seededRandom(seed + 8) * 0.01,
    };
  });
};

// Diamond shape component
const DiamondShape: React.FC<{ size: number; color: string; rotation: number }> = ({
  size,
  color,
  rotation,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    style={{ transform: `rotate(${rotation}deg)` }}
  >
    <path d="M12 2L22 12L12 22L2 12L12 2Z" />
  </svg>
);

// Concentric ring effect
const ConcentricRing: React.FC<{
  frame: number;
  delay: number;
  baseSize: number;
  index: number;
}> = ({ frame, delay, baseSize, index }) => {
  const progress = interpolate(frame, [delay, delay + 80], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOutExpo,
  });

  const opacity = interpolate(frame, [delay, delay + 40, delay + 80], [0, 0.3, 0.1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const size = baseSize * progress;
  const rotation = frame * 0.1 * (index % 2 === 0 ? 1 : -1);

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '40%',
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        borderRadius: '50%',
        border: `1px solid rgba(34, 211, 238, ${opacity})`,
        transform: `rotate(${rotation}deg)`,
        boxShadow: `0 0 20px rgba(34, 211, 238, ${opacity * 0.3})`,
      }}
    />
  );
};

// Floating stat card with animated numbers
const StatCard: React.FC<{
  stat: { value: string; numValue: number; prefix?: string; label: string };
  index: number;
  frame: number;
  fps: number;
}> = ({ stat, index, frame, fps }) => {
  const statScale = spring({
    frame: frame - 80 - index * 8,
    fps,
    config: { damping: 12, stiffness: 80, mass: 0.8 },
  });

  const statOpacity = interpolate(frame, [80 + index * 8, 100 + index * 8], [0, 1], {
    extrapolateRight: 'clamp',
    easing: easeOutExpo,
  });

  // Floating animation
  const floatY = Math.sin((frame + index * 20) * 0.04) * 5;
  const floatRotate = Math.sin((frame + index * 30) * 0.03) * 1;

  // Glow pulse
  const glowPulse = 0.3 + Math.sin((frame + index * 25) * 0.06) * 0.15;

  return (
    <div
      style={{
        textAlign: 'center',
        transform: `scale(${statScale}) translateY(${floatY}px) rotate(${floatRotate}deg)`,
        opacity: statOpacity,
        position: 'relative',
      }}
    >
      {/* Glow backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: -20,
          background: `radial-gradient(circle, rgba(34, 211, 238, ${glowPulse}) 0%, transparent 70%)`,
          filter: 'blur(20px)',
          borderRadius: '50%',
        }}
      />

      <div
        style={{
          fontSize: 56,
          fontWeight: 700,
          color: '#22d3ee',
          textShadow: `0 0 20px rgba(34, 211, 238, ${glowPulse}), 0 0 40px rgba(34, 211, 238, ${glowPulse * 0.5})`,
          position: 'relative',
        }}
      >
        <CountUpNumber
          endValue={stat.numValue}
          startValue={0}
          startFrame={80 + index * 8}
          duration={50}
          prefix={stat.prefix || ''}
          easing="spring"
        />
      </div>
      <div
        style={{
          fontSize: 18,
          color: '#94a3b8',
          marginTop: 8,
          position: 'relative',
        }}
      >
        <SplitText
          text={stat.label}
          splitBy="word"
          startFrame={90 + index * 8}
          staggerDelay={4}
          animation="fadeIn"
        />
      </div>
    </div>
  );
};

// Shimmer effect for CTA button
const ShimmerEffect: React.FC<{ frame: number }> = ({ frame }) => {
  const shimmerPosition = interpolate(frame % 120, [0, 120], [-100, 200], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        borderRadius: 12,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: `${shimmerPosition}%`,
          width: '30%',
          height: '100%',
          background:
            'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
          transform: 'skewX(-20deg)',
        }}
      />
    </div>
  );
};

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Generate orbital particles
  const particles = useMemo(() => generateOrbitalParticles(40), []);

  // Logo animation with enhanced spring
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 70, mass: 1 },
  });

  const logoOpacity = interpolate(frame, [0, 25], [0, 1], {
    extrapolateRight: 'clamp',
    easing: easeOutExpo,
  });

  const logoRotation = interpolate(frame, [0, 30], [-3, 0], {
    extrapolateRight: 'clamp',
    easing: easeOutBack,
  });

  // CTA animation
  const ctaOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateRight: 'clamp',
    easing: easeOutExpo,
  });

  const ctaScale = spring({
    frame: frame - 40,
    fps,
    config: { damping: 10, stiffness: 60, mass: 1.2 },
  });

  // Enhanced pulse animation for CTA button
  const pulse = 1 + Math.sin(frame * 0.08) * 0.015;
  const ctaGlow = 0.2 + Math.sin(frame * 0.06) * 0.1;

  // Background gradient animation
  const gradientAngle = frame * 0.3;
  const gradientPulse = 0.12 + Math.sin(frame * 0.02) * 0.04;

  // Logo glow
  const logoGlow = 0.4 + Math.sin(frame * 0.05) * 0.2;

  // Floating animation for logo
  const logoFloat = Math.sin(frame * 0.03) * 6;

  // URL fade and float
  const urlOpacity = interpolate(frame, [50, 70], [0, 1], {
    extrapolateRight: 'clamp',
    easing: easeOutExpo,
  });
  const urlFloat = Math.sin(frame * 0.035) * 3;

  // Render orbital particle
  const renderParticle = (p: Particle) => {
    const particleOpacity = interpolate(frame, [p.delay, p.delay + 30], [0, 0.7], {
      extrapolateRight: 'clamp',
      easing: easeOutExpo,
    });

    // Orbital movement
    const currentAngle = p.angle + frame * p.orbitSpeed;
    const wobble = Math.sin(frame * p.speed * 10) * 20;
    const currentDistance = p.distance + wobble;

    const x = 960 + Math.cos(currentAngle) * currentDistance;
    const y = 430 + Math.sin(currentAngle) * currentDistance * 0.6; // Elliptical orbit

    // Scale pulse
    const scalePulse = 1 + Math.sin((frame + p.delay) * 0.1) * 0.2;

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: x,
      top: y,
      opacity: particleOpacity,
      transform: `translate(-50%, -50%) scale(${scalePulse})`,
      pointerEvents: 'none',
    };

    if (p.type === 'orb') {
      return (
        <div
          key={p.id}
          style={{
            ...baseStyle,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, ${p.color}, transparent)`,
            boxShadow: `0 0 ${p.size * 2}px ${p.color.replace('1)', '0.4)')}`,
          }}
        />
      );
    }

    if (p.type === 'ring') {
      return (
        <div
          key={p.id}
          style={{
            ...baseStyle,
            width: p.size * 1.5,
            height: p.size * 1.5,
            borderRadius: '50%',
            border: `1px solid ${p.color}`,
            boxShadow: `0 0 ${p.size}px ${p.color.replace('1)', '0.3)')}`,
          }}
        />
      );
    }

    if (p.type === 'diamond') {
      return (
        <div key={p.id} style={baseStyle}>
          <DiamondShape size={p.size} color={p.color} rotation={(frame + p.delay) * 0.5} />
        </div>
      );
    }

    // Dot particles
    return (
      <div
        key={p.id}
        style={{
          ...baseStyle,
          width: p.size * 0.5,
          height: p.size * 0.5,
          borderRadius: '50%',
          background: p.color,
        }}
      />
    );
  };

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Animated radial gradient background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 70% 50% at 50% 40%, rgba(34, 211, 238, ${gradientPulse}) 0%, transparent 60%)`,
        }}
      />

      {/* Secondary gradient accent */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 50% 30% at 70% 60%, rgba(168, 85, 247, ${gradientPulse * 0.4}) 0%, transparent 50%)`,
        }}
      />

      {/* Rotating gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: -200,
          background: `conic-gradient(from ${gradientAngle}deg at 50% 50%, transparent, rgba(34, 211, 238, 0.03), transparent, rgba(168, 85, 247, 0.03), transparent)`,
        }}
      />

      {/* Concentric rings */}
      {[0, 1, 2, 3, 4].map((i) => (
        <ConcentricRing
          key={i}
          frame={frame}
          delay={5 + i * 10}
          baseSize={200 + i * 150}
          index={i}
        />
      ))}

      {/* Orbital particles */}
      {particles.map(renderParticle)}

      {/* Logo */}
      <div
        style={{
          transform: `scale(${logoScale}) rotate(${logoRotation}deg) translateY(${logoFloat}px)`,
          opacity: logoOpacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: 60,
          position: 'relative',
        }}
      >
        {/* Logo glow backdrop */}
        <div
          style={{
            position: 'absolute',
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(34, 211, 238, ${logoGlow}) 0%, transparent 70%)`,
            filter: 'blur(30px)',
            top: -30,
          }}
        />

        <div
          style={{
            width: 100,
            height: 100,
            marginBottom: 24,
            filter: 'invert(1)',
            opacity: 0.95,
            position: 'relative',
          }}
        >
          <Img
            src={staticFile('logo.png')}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: `drop-shadow(0 0 20px rgba(34, 211, 238, ${logoGlow}))`,
            }}
          />
        </div>

        <h1
          style={{
            fontSize: 64,
            fontWeight: 700,
            margin: 0,
            letterSpacing: '-1px',
            filter: `drop-shadow(0 0 25px rgba(34, 211, 238, ${logoGlow * 0.5}))`,
            position: 'relative',
          }}
        >
          <GradientText
            text="PHAZUR"
            startFrame={0}
            colors={['#ffffff', '#22d3ee', '#3b82f6', '#ffffff']}
            speed={1.5}
            angle={135}
          />
        </h1>
      </div>

      {/* CTA Button */}
      <div
        style={{
          opacity: ctaOpacity,
          transform: `scale(${ctaScale * pulse})`,
          marginBottom: 60,
          position: 'relative',
        }}
      >
        {/* Button glow */}
        <div
          style={{
            position: 'absolute',
            inset: -15,
            background: `radial-gradient(ellipse at center, rgba(255, 255, 255, ${ctaGlow}) 0%, transparent 70%)`,
            filter: 'blur(15px)',
            borderRadius: 20,
          }}
        />

        <div
          style={{
            padding: '24px 60px',
            background: '#ffffff',
            borderRadius: 12,
            fontSize: 24,
            fontWeight: 600,
            color: '#0f1115',
            boxShadow: `0 20px 60px rgba(255, 255, 255, ${0.15 + ctaGlow})`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <ShimmerEffect frame={frame} />
          <span style={{ position: 'relative', zIndex: 1 }}>Start Your Path Free</span>
        </div>
      </div>

      {/* URL with scramble reveal */}
      <div
        style={{
          fontSize: 24,
          color: '#94a3b8',
          marginBottom: 60,
          transform: `translateY(${urlFloat}px)`,
          letterSpacing: '1px',
        }}
      >
        <ScrambleText
          text="phazur.com"
          startFrame={50}
          scrambleDuration={30}
          characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.com"
          style={{
            color: '#22d3ee',
            textShadow: '0 0 10px rgba(34, 211, 238, 0.5)',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'flex',
          gap: 100,
        }}
      >
        {[
          { value: '3', numValue: 3, label: 'Certification Paths' },
          { value: '10', numValue: 10, label: 'Milestones Each' },
          { value: '$0', numValue: 0, prefix: '$', label: 'Until Certified' },
        ].map((stat, i) => (
          <StatCard key={stat.label} stat={stat} index={i} frame={frame} fps={fps} />
        ))}
      </div>

      {/* Bottom accent particles */}
      {[0, 1, 2, 3, 4].map((i) => {
        const particleDelay = 100 + i * 5;
        const particleOpacity = interpolate(frame, [particleDelay, particleDelay + 20], [0, 0.5], {
          extrapolateRight: 'clamp',
        });
        const particlePulse = 1 + Math.sin((frame + i * 20) * 0.1) * 0.3;
        const x = 560 + i * 200;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              bottom: 40,
              left: x,
              width: 4 * particlePulse,
              height: 4 * particlePulse,
              borderRadius: '50%',
              background: 'rgba(34, 211, 238, 0.8)',
              boxShadow: '0 0 10px rgba(34, 211, 238, 0.5)',
              opacity: particleOpacity,
            }}
          />
        );
      })}

      {/* Animated line at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 30,
          width: interpolate(frame, [110, 140], [0, 600], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: easeOutExpo,
          }),
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.4), transparent)',
          boxShadow: '0 0 15px rgba(34, 211, 238, 0.2)',
        }}
      />
    </AbsoluteFill>
  );
};
