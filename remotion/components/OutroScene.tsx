import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from 'remotion';

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo animation
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  const logoOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  // CTA animation
  const ctaOpacity = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: 'clamp' });
  const ctaScale = spring({
    frame: frame - 40,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  // Stats animation
  const statsOpacity = interpolate(frame, [70, 90], [0, 1], { extrapolateRight: 'clamp' });

  // Pulse animation for CTA button
  const pulse = 1 + Math.sin(frame * 0.1) * 0.02;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Radial gradient background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(34, 211, 238, 0.15) 0%, transparent 60%)',
        }}
      />

      {/* Logo */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          opacity: logoOpacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: 60,
        }}
      >
        <div
          style={{
            width: 100,
            height: 100,
            marginBottom: 24,
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

        <h1
          style={{
            fontSize: 64,
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

      {/* CTA */}
      <div
        style={{
          opacity: ctaOpacity,
          transform: `scale(${ctaScale * pulse})`,
          marginBottom: 60,
        }}
      >
        <div
          style={{
            padding: '24px 60px',
            background: '#ffffff',
            borderRadius: 12,
            fontSize: 24,
            fontWeight: 600,
            color: '#0f1115',
            boxShadow: '0 20px 60px rgba(255, 255, 255, 0.2)',
          }}
        >
          Start Your Path Free
        </div>
      </div>

      {/* URL */}
      <div
        style={{
          opacity: ctaOpacity,
          fontSize: 24,
          color: '#94a3b8',
          marginBottom: 60,
        }}
      >
        phazur.com
      </div>

      {/* Stats */}
      <div
        style={{
          opacity: statsOpacity,
          display: 'flex',
          gap: 100,
        }}
      >
        {[
          { value: '3', label: 'Certification Paths' },
          { value: '10', label: 'Milestones Each' },
          { value: '$0', label: 'Until Certified' },
        ].map((stat, i) => {
          const statScale = spring({
            frame: frame - 80 - i * 8,
            fps,
            config: { damping: 15, stiffness: 100 },
          });

          return (
            <div
              key={stat.label}
              style={{
                textAlign: 'center',
                transform: `scale(${statScale})`,
              }}
            >
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 18,
                  color: '#94a3b8',
                  marginTop: 8,
                }}
              >
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
