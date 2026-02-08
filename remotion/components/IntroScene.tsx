import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Img,
  staticFile,
  Easing,
} from 'remotion';
import { TypewriterText, SplitText } from './AnimatedText';

// Custom easing functions for smoother animations
const easeOutExpo = (t: number): number => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeInOutQuart = (t: number): number =>
  t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
const easeOutBack = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

// Seeded random for consistent particle generation
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

// Particle types for variety
type ParticleType = 'orb' | 'star' | 'sparkle' | 'dust';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  type: ParticleType;
  speed: number;
  amplitude: number;
  phase: number;
  color: string;
  layer: number; // For parallax effect (1=back, 3=front)
}

// Generate particles with variety
const generateParticles = (count: number): Particle[] => {
  const colors = [
    'rgba(34, 211, 238, 1)', // cyan
    'rgba(59, 130, 246, 1)', // blue
    'rgba(168, 85, 247, 1)', // purple
    'rgba(236, 72, 153, 1)', // pink
    'rgba(255, 255, 255, 1)', // white
  ];

  const types: ParticleType[] = ['orb', 'star', 'sparkle', 'dust'];

  return Array.from({ length: count }, (_, i) => {
    const seed = i * 123.456;
    const layer = Math.floor(seededRandom(seed + 1) * 3) + 1;
    const type = types[Math.floor(seededRandom(seed + 2) * types.length)];

    return {
      id: i,
      x: seededRandom(seed + 3) * 1920,
      y: seededRandom(seed + 4) * 1080,
      size: type === 'dust' ? 2 + seededRandom(seed + 5) * 3 : 4 + seededRandom(seed + 5) * 8,
      delay: seededRandom(seed + 6) * 40,
      type,
      speed: 0.02 + seededRandom(seed + 7) * 0.04,
      amplitude: 15 + seededRandom(seed + 8) * 30,
      phase: seededRandom(seed + 9) * Math.PI * 2,
      color: colors[Math.floor(seededRandom(seed + 10) * colors.length)],
      layer,
    };
  });
};

// Light ray component
const LightRay: React.FC<{
  angle: number;
  frame: number;
  delay: number;
  length: number;
  width: number;
}> = ({ angle, frame, delay, length, width }) => {
  const rayOpacity = interpolate(frame, [delay, delay + 40, delay + 80], [0, 0.15, 0.08], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const rayLength = interpolate(frame, [delay, delay + 60], [0, length], {
    extrapolateRight: 'clamp',
    easing: easeOutExpo,
  });

  // Subtle pulsing
  const pulse = 1 + Math.sin((frame + delay) * 0.03) * 0.2;

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: width,
        height: rayLength * pulse,
        background: `linear-gradient(to bottom, rgba(34, 211, 238, ${rayOpacity}), transparent)`,
        transformOrigin: 'top center',
        transform: `rotate(${angle}deg) translateX(-50%)`,
        filter: 'blur(8px)',
      }}
    />
  );
};

// Star particle shape
const StarShape: React.FC<{ size: number; color: string; rotation: number }> = ({
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
    <path d="M12 0L14.59 8.41L23 12L14.59 15.59L12 24L9.41 15.59L1 12L9.41 8.41L12 0Z" />
  </svg>
);

// Sparkle particle shape
const SparkleShape: React.FC<{ size: number; color: string; rotation: number }> = ({
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
    <path d="M12 0L13 11L24 12L13 13L12 24L11 13L0 12L11 11L12 0Z" />
  </svg>
);

// Parallax background layer
const ParallaxLayer: React.FC<{
  frame: number;
  layer: number;
  children: React.ReactNode;
}> = ({ frame, layer, children }) => {
  // Different movement speeds based on layer depth
  const parallaxSpeed = layer === 1 ? 0.1 : layer === 2 ? 0.3 : 0.5;
  const translateY = Math.sin(frame * 0.01) * 10 * parallaxSpeed;
  const translateX = Math.cos(frame * 0.008) * 5 * parallaxSpeed;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        transform: `translate(${translateX}px, ${translateY}px)`,
        opacity: layer === 1 ? 0.4 : layer === 2 ? 0.6 : 1,
      }}
    >
      {children}
    </div>
  );
};

// Glow ring effect
const GlowRing: React.FC<{ frame: number; delay: number; size: number }> = ({
  frame,
  delay,
  size,
}) => {
  const ringProgress = interpolate(frame, [delay, delay + 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOutExpo,
  });

  const ringOpacity = interpolate(frame, [delay, delay + 30, delay + 60], [0, 0.4, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const currentSize = size * ringProgress;

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '45%',
        width: currentSize,
        height: currentSize,
        marginLeft: -currentSize / 2,
        marginTop: -currentSize / 2,
        borderRadius: '50%',
        border: `2px solid rgba(34, 211, 238, ${ringOpacity})`,
        boxShadow: `0 0 30px rgba(34, 211, 238, ${ringOpacity * 0.5}), inset 0 0 30px rgba(34, 211, 238, ${ringOpacity * 0.3})`,
      }}
    />
  );
};

// Floating element wrapper for micro-interactions
const FloatingElement: React.FC<{
  children: React.ReactNode;
  frame: number;
  delay: number;
  amplitude?: number;
  speed?: number;
}> = ({ children, frame, delay, amplitude = 8, speed = 0.04 }) => {
  const floatY = Math.sin((frame - delay) * speed) * amplitude;
  const floatX = Math.cos((frame - delay) * speed * 0.7) * (amplitude * 0.3);
  const floatRotate = Math.sin((frame - delay) * speed * 0.5) * 1;

  return (
    <div
      style={{
        transform: `translate(${floatX}px, ${floatY}px) rotate(${floatRotate}deg)`,
      }}
    >
      {children}
    </div>
  );
};

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Generate particles once
  const particles = useMemo(() => generateParticles(50), []);

  // Logo animation with enhanced spring
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 8, stiffness: 60, mass: 1.2 },
  });

  const logoOpacity = interpolate(frame, [0, 25], [0, 1], {
    extrapolateRight: 'clamp',
    easing: easeOutExpo,
  });

  // Logo rotation for entrance
  const logoRotation = interpolate(frame, [0, 30], [-5, 0], {
    extrapolateRight: 'clamp',
    easing: easeOutBack,
  });

  // Tagline animation with stagger
  const taglineProgress = spring({
    frame: frame - 35,
    fps,
    config: { damping: 12, stiffness: 70, mass: 0.8 },
  });

  const taglineOpacity = interpolate(frame, [35, 55], [0, 1], {
    extrapolateRight: 'clamp',
    easing: easeOutExpo,
  });

  const taglineBlur = interpolate(frame, [35, 55], [10, 0], {
    extrapolateRight: 'clamp',
  });

  // Subtitle animation
  const subtitleOpacity = interpolate(frame, [65, 90], [0, 1], {
    extrapolateRight: 'clamp',
    easing: easeInOutQuart,
  });

  const subtitleY = interpolate(frame, [65, 90], [20, 0], {
    extrapolateRight: 'clamp',
    easing: easeOutBack,
  });

  // Background gradient pulse
  const gradientPulse = 0.15 + Math.sin(frame * 0.02) * 0.05;

  // Text color animation
  const textHue = interpolate(frame, [0, 150], [185, 195], {
    extrapolateRight: 'extend',
  });

  // Logo glow intensity
  const glowIntensity = 0.4 + Math.sin(frame * 0.05) * 0.2;

  // Group particles by layer for parallax
  const particlesByLayer = useMemo(() => {
    return {
      1: particles.filter((p) => p.layer === 1),
      2: particles.filter((p) => p.layer === 2),
      3: particles.filter((p) => p.layer === 3),
    };
  }, [particles]);

  // Render a single particle
  const renderParticle = (p: Particle) => {
    const particleOpacity = interpolate(frame, [p.delay, p.delay + 30], [0, 0.8], {
      extrapolateRight: 'clamp',
      easing: easeOutExpo,
    });

    // More organic movement
    const particleY = p.y + Math.sin((frame + p.phase) * p.speed) * p.amplitude;
    const particleX = p.x + Math.cos((frame + p.phase) * p.speed * 0.7) * (p.amplitude * 0.5);

    // Subtle scale pulsing
    const particleScale = 1 + Math.sin((frame + p.delay) * 0.08) * 0.15;

    // Rotation for stars and sparkles
    const rotation = (frame + p.delay) * 0.5;

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: particleX,
      top: particleY,
      opacity: particleOpacity,
      transform: `scale(${particleScale})`,
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
            boxShadow: `0 0 ${p.size * 2}px ${p.color.replace('1)', '0.5)')}`,
            filter: `blur(${p.layer === 1 ? 2 : 0}px)`,
          }}
        />
      );
    }

    if (p.type === 'star') {
      return (
        <div key={p.id} style={baseStyle}>
          <StarShape size={p.size} color={p.color} rotation={rotation} />
        </div>
      );
    }

    if (p.type === 'sparkle') {
      return (
        <div key={p.id} style={baseStyle}>
          <SparkleShape size={p.size} color={p.color} rotation={rotation * 2} />
        </div>
      );
    }

    // Dust particles
    return (
      <div
        key={p.id}
        style={{
          ...baseStyle,
          width: p.size,
          height: p.size,
          borderRadius: '50%',
          background: p.color,
          filter: 'blur(1px)',
        }}
      />
    );
  };

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Animated radial gradient background overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 80% 60% at 50% 40%, rgba(34, 211, 238, ${gradientPulse}) 0%, transparent 60%)`,
        }}
      />

      {/* Secondary gradient for depth */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 60% 40% at 30% 70%, rgba(168, 85, 247, ${gradientPulse * 0.5}) 0%, transparent 50%)`,
        }}
      />

      {/* Light rays */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
        <LightRay
          key={angle}
          angle={angle}
          frame={frame}
          delay={5 + i * 3}
          length={600 + (i % 3) * 100}
          width={80 + (i % 2) * 40}
        />
      ))}

      {/* Glow rings expanding from center */}
      <GlowRing frame={frame} delay={10} size={400} />
      <GlowRing frame={frame} delay={25} size={600} />
      <GlowRing frame={frame} delay={40} size={800} />

      {/* Parallax particle layers */}
      <ParallaxLayer frame={frame} layer={1}>
        {particlesByLayer[1].map(renderParticle)}
      </ParallaxLayer>

      <ParallaxLayer frame={frame} layer={2}>
        {particlesByLayer[2].map(renderParticle)}
      </ParallaxLayer>

      <ParallaxLayer frame={frame} layer={3}>
        {particlesByLayer[3].map(renderParticle)}
      </ParallaxLayer>

      {/* Logo with enhanced effects */}
      <FloatingElement frame={frame} delay={0} amplitude={6} speed={0.03}>
        <div
          style={{
            transform: `scale(${logoScale}) rotate(${logoRotation}deg)`,
            opacity: logoOpacity,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          {/* Logo glow backdrop */}
          <div
            style={{
              position: 'absolute',
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(34, 211, 238, ${glowIntensity}) 0%, transparent 70%)`,
              filter: 'blur(40px)',
              top: -40,
            }}
          />

          {/* Logo image */}
          <div
            style={{
              width: 120,
              height: 120,
              marginBottom: 30,
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
                filter: `drop-shadow(0 0 20px rgba(34, 211, 238, ${glowIntensity}))`,
              }}
            />
          </div>

          {/* Logo text */}
          <h1
            style={{
              fontSize: 80,
              fontWeight: 700,
              color: '#ffffff',
              margin: 0,
              letterSpacing: '-1px',
              textShadow: `0 0 30px rgba(34, 211, 238, ${glowIntensity * 0.5}), 0 0 60px rgba(34, 211, 238, ${glowIntensity * 0.3})`,
            }}
          >
            PHAZUR
          </h1>
        </div>
      </FloatingElement>

      {/* Tagline with typewriter effect */}
      <div
        style={{
          position: 'absolute',
          top: '65%',
          opacity: taglineOpacity,
          transform: `translateY(${(1 - taglineProgress) * 30}px)`,
          filter: `blur(${taglineBlur}px)`,
        }}
      >
        <FloatingElement frame={frame} delay={35} amplitude={4} speed={0.025}>
          <h2
            style={{
              fontSize: 36,
              fontWeight: 600,
              color: '#e2e8f0',
              margin: 0,
              textAlign: 'center',
            }}
          >
            <TypewriterText
              text="Stop Chatting with AI. "
              startFrame={35}
              charsPerFrame={0.8}
              cursorBlink={false}
              cursorColor="transparent"
            />
            <TypewriterText
              text="Start Commanding It."
              startFrame={60}
              charsPerFrame={0.8}
              cursorBlink={false}
              cursorColor="transparent"
              style={{
                color: '#22d3ee',
                textShadow: '0 0 20px rgba(34, 211, 238, 0.5)',
              }}
            />
          </h2>
        </FloatingElement>
      </div>

      {/* Subtitle with split text animation */}
      <div
        style={{
          position: 'absolute',
          top: '75%',
          transform: `translateY(${subtitleY}px)`,
        }}
      >
        <FloatingElement frame={frame} delay={65} amplitude={3} speed={0.02}>
          <p
            style={{
              fontSize: 24,
              color: '#94a3b8',
              margin: 0,
              textAlign: 'center',
              letterSpacing: '0.5px',
            }}
          >
            <SplitText
              text="AI Operator Certification Platform"
              splitBy="word"
              startFrame={75}
              staggerDelay={4}
              animation="fadeUp"
            />
          </p>
        </FloatingElement>
      </div>

      {/* Bottom accent line */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          width: interpolate(frame, [80, 120], [0, 400], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: easeOutExpo,
          }),
          height: 2,
          background: `linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.5), transparent)`,
          boxShadow: '0 0 20px rgba(34, 211, 238, 0.3)',
        }}
      />

      {/* Corner accent particles */}
      {[
        { x: 100, y: 100 },
        { x: 1820, y: 100 },
        { x: 100, y: 980 },
        { x: 1820, y: 980 },
      ].map((pos, i) => {
        const cornerOpacity = interpolate(frame, [90 + i * 5, 110 + i * 5], [0, 0.4], {
          extrapolateRight: 'clamp',
        });
        const cornerPulse = 1 + Math.sin((frame + i * 30) * 0.08) * 0.3;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: pos.x,
              top: pos.y,
              width: 6 * cornerPulse,
              height: 6 * cornerPulse,
              borderRadius: '50%',
              background: 'rgba(34, 211, 238, 0.8)',
              boxShadow: '0 0 15px rgba(34, 211, 238, 0.6)',
              opacity: cornerOpacity,
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
