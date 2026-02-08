import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from 'remotion';

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo animation
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const logoOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  // Tagline animation
  const taglineY = spring({
    frame: frame - 30,
    fps,
    config: { damping: 15, stiffness: 80 },
  });
  const taglineOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: 'clamp' });

  // Subtitle animation
  const subtitleOpacity = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp' });

  // Particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    x: Math.sin(i * 0.5) * 400 + 960,
    y: Math.cos(i * 0.7) * 300 + 540,
    delay: i * 5,
    size: 4 + (i % 3) * 2,
  }));

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Floating particles */}
      {particles.map((p, i) => {
        const particleOpacity = interpolate(
          frame,
          [p.delay, p.delay + 30],
          [0, 0.6],
          { extrapolateRight: 'clamp' }
        );
        const particleY = p.y + Math.sin((frame + p.delay) * 0.05) * 20;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: p.x + Math.sin((frame + p.delay) * 0.03) * 30,
              top: particleY,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: `rgba(34, 211, 238, ${particleOpacity})`,
              boxShadow: `0 0 ${p.size * 2}px rgba(34, 211, 238, ${particleOpacity * 0.5})`,
            }}
          />
        );
      })}

      {/* Logo */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          opacity: logoOpacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Logo image */}
        <div
          style={{
            width: 120,
            height: 120,
            marginBottom: 30,
            filter: 'invert(1)',
            opacity: 0.9,
          }}
        >
          <Img
            src={staticFile('logo.png')}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </div>

        {/* Logo text */}
        <h1
          style={{
            fontSize: 80,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #ffffff 0%, #22d3ee 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
            letterSpacing: '-1px',
          }}
        >
          PHAZUR
        </h1>
      </div>

      {/* Tagline */}
      <div
        style={{
          position: 'absolute',
          top: '65%',
          opacity: taglineOpacity,
          transform: `translateY(${(1 - taglineY) * 30}px)`,
        }}
      >
        <h2
          style={{
            fontSize: 36,
            fontWeight: 600,
            color: '#e2e8f0',
            margin: 0,
            textAlign: 'center',
          }}
        >
          Stop Chatting with AI.{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Start Commanding It.
          </span>
        </h2>
      </div>

      {/* Subtitle */}
      <div
        style={{
          position: 'absolute',
          top: '75%',
          opacity: subtitleOpacity,
        }}
      >
        <p
          style={{
            fontSize: 24,
            color: '#94a3b8',
            margin: 0,
            textAlign: 'center',
          }}
        >
          AI Operator Certification Platform
        </p>
      </div>
    </AbsoluteFill>
  );
};
