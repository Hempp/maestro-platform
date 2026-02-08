import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

// Terminal icon
const TerminalIcon = () => (
  <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

// Chat/AI Coach icon
const AICoachIcon = () => (
  <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
  </svg>
);

// Shield/Blockchain icon
const BlockchainIcon = () => (
  <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

// Currency/Pay icon
const PayIcon = () => (
  <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
  </svg>
);

const features = [
  {
    title: 'Terminal-First Learning',
    description: 'Skip the GUI. Learn to build from the command line like real developers do.',
    icon: <TerminalIcon />,
    color: '#a855f7', // purple
    gradient: 'linear-gradient(135deg, #a855f7, #6366f1)',
  },
  {
    title: 'AI Coach (Socratic)',
    description: 'Phazur guides your thinking through questions, not just giving answers.',
    icon: <AICoachIcon />,
    color: '#22d3ee', // cyan
    gradient: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
  },
  {
    title: 'Blockchain Verified',
    description: 'Soulbound Tokens on Polygon. Your credentials are permanent and unfakeable.',
    icon: <BlockchainIcon />,
    color: '#10b981', // emerald
    gradient: 'linear-gradient(135deg, #10b981, #22d3ee)',
  },
  {
    title: 'Pay After You Ship',
    description: 'Free to learn. Pay only when you complete your capstone project.',
    icon: <PayIcon />,
    color: '#f59e0b', // amber
    gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
  },
];

export const FeaturesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(frame, [0, 20], [30, 0], { extrapolateRight: 'clamp' });

  // Subtitle animation
  const subtitleOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: 80,
      }}
    >
      {/* Animated background grid lines */}
      {[...Array(8)].map((_, i) => {
        const lineDelay = i * 8;
        const lineOpacity = interpolate(
          frame,
          [lineDelay, lineDelay + 20],
          [0, 0.04],
          { extrapolateRight: 'clamp' }
        );
        const lineX = 200 + i * 200;

        return (
          <div
            key={`v-${i}`}
            style={{
              position: 'absolute',
              left: lineX,
              top: 0,
              bottom: 0,
              width: 1,
              background: `linear-gradient(180deg, transparent, ${features[i % 4].color}, transparent)`,
              opacity: lineOpacity,
            }}
          />
        );
      })}

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontSize: 56,
            fontWeight: 600,
            color: '#ffffff',
            margin: 0,
          }}
        >
          Key Features
        </h2>
        <p
          style={{
            fontSize: 24,
            color: '#94a3b8',
            marginTop: 16,
            opacity: subtitleOpacity,
          }}
        >
          What makes Phazur different
        </p>
      </div>

      {/* Feature cards - 2x2 grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 36,
          marginTop: 100,
          maxWidth: 1200,
        }}
      >
        {features.map((feature, index) => {
          // Calculate grid position for animation direction
          const row = Math.floor(index / 2);
          const col = index % 2;
          const xDirection = col === 0 ? -1 : 1;
          const yDirection = row === 0 ? -1 : 1;

          const cardDelay = 30 + index * 15;

          // Slide animation
          const cardX = interpolate(
            frame,
            [cardDelay, cardDelay + 25],
            [xDirection * 200, 0],
            { extrapolateRight: 'clamp' }
          );

          const cardY = interpolate(
            frame,
            [cardDelay, cardDelay + 25],
            [yDirection * 100, 0],
            { extrapolateRight: 'clamp' }
          );

          const cardOpacity = interpolate(
            frame,
            [cardDelay, cardDelay + 20],
            [0, 1],
            { extrapolateRight: 'clamp' }
          );

          const cardScale = spring({
            frame: frame - cardDelay,
            fps,
            config: { damping: 12, stiffness: 80 },
          });

          // Icon animation
          const iconDelay = cardDelay + 15;
          const iconScale = spring({
            frame: frame - iconDelay,
            fps,
            config: { damping: 10, stiffness: 120 },
          });

          const iconRotate = interpolate(
            frame,
            [iconDelay, iconDelay + 20],
            [-180, 0],
            { extrapolateRight: 'clamp' }
          );

          // Glow pulse
          const glowIntensity = 0.2 + Math.sin((frame + index * 20) * 0.06) * 0.1;

          return (
            <div
              key={feature.title}
              style={{
                width: 500,
                padding: 40,
                background: 'rgba(22, 24, 29, 0.95)',
                borderRadius: 20,
                border: `1px solid ${feature.color}30`,
                transform: `translateX(${cardX}px) translateY(${cardY}px) scale(${cardScale})`,
                opacity: cardOpacity,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Background glow */}
              <div
                style={{
                  position: 'absolute',
                  top: -50,
                  left: -50,
                  width: 200,
                  height: 200,
                  background: `radial-gradient(circle, ${feature.color}${Math.round(glowIntensity * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
                  filter: 'blur(40px)',
                }}
              />

              {/* Top accent line */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 40,
                  right: 40,
                  height: 2,
                  background: feature.gradient,
                  opacity: 0.6,
                }}
              />

              <div
                style={{
                  display: 'flex',
                  gap: 24,
                  alignItems: 'flex-start',
                  position: 'relative',
                }}
              >
                {/* Icon container */}
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 16,
                    background: `${feature.color}15`,
                    border: `2px solid ${feature.color}40`,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: feature.color,
                    flexShrink: 0,
                    transform: `scale(${iconScale}) rotate(${iconRotate}deg)`,
                    boxShadow: `0 8px 32px ${feature.color}30`,
                  }}
                >
                  {feature.icon}
                </div>

                {/* Text content */}
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontSize: 26,
                      fontWeight: 600,
                      color: '#ffffff',
                      margin: 0,
                      marginBottom: 12,
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 17,
                      color: '#94a3b8',
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {feature.description}
                  </p>
                </div>
              </div>

              {/* Decorative corner element */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 16,
                  right: 16,
                  width: 40,
                  height: 40,
                  borderRight: `2px solid ${feature.color}20`,
                  borderBottom: `2px solid ${feature.color}20`,
                  borderRadius: '0 0 8px 0',
                }}
              />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
