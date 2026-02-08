import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

const paths = [
  {
    name: 'The Student',
    path: 'PATH A',
    description: 'Certified AI Associate',
    color: '#a855f7',
    price: '$49',
    icon: (
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    ),
  },
  {
    name: 'The Employee',
    path: 'PATH B',
    description: 'Workflow Efficiency Lead',
    color: '#22d3ee',
    price: '$199',
    icon: (
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
      </svg>
    ),
  },
  {
    name: 'The Owner',
    path: 'PATH C',
    description: 'AI Operations Master',
    color: '#10b981',
    price: '$499',
    icon: (
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
      </svg>
    ),
  },
];

export const PathsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(frame, [0, 20], [30, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: 80,
      }}
    >
      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 100,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <h2
          style={{
            fontSize: 56,
            fontWeight: 600,
            color: '#ffffff',
            margin: 0,
            textAlign: 'center',
          }}
        >
          Choose Your Path
        </h2>
        <p
          style={{
            fontSize: 24,
            color: '#94a3b8',
            marginTop: 16,
            textAlign: 'center',
          }}
        >
          Every path leads to a deployed project and an on-chain credential
        </p>
      </div>

      {/* Path cards */}
      <div
        style={{
          display: 'flex',
          gap: 40,
          marginTop: 60,
        }}
      >
        {paths.map((path, index) => {
          const cardDelay = 30 + index * 15;
          const cardScale = spring({
            frame: frame - cardDelay,
            fps,
            config: { damping: 12, stiffness: 100 },
          });
          const cardOpacity = interpolate(
            frame,
            [cardDelay, cardDelay + 20],
            [0, 1],
            { extrapolateRight: 'clamp' }
          );

          // Hover-like animation
          const hoverY = Math.sin((frame + index * 20) * 0.05) * 5;

          return (
            <div
              key={path.name}
              style={{
                width: 360,
                padding: 40,
                background: 'rgba(22, 24, 29, 0.9)',
                borderRadius: 16,
                border: `1px solid ${path.color}30`,
                transform: `scale(${cardScale}) translateY(${hoverY}px)`,
                opacity: cardOpacity,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              {/* Top accent line */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 32,
                  right: 32,
                  height: 1,
                  background: path.color,
                  opacity: 0.4,
                }}
              />

              {/* Icon */}
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 12,
                  background: `${path.color}15`,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 20,
                  color: path.color,
                }}
              >
                {path.icon}
              </div>

              {/* Path label */}
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: path.color,
                  letterSpacing: 2,
                  marginBottom: 8,
                }}
              >
                {path.path}
              </span>

              {/* Name */}
              <h3
                style={{
                  fontSize: 28,
                  fontWeight: 600,
                  color: '#ffffff',
                  margin: 0,
                  marginBottom: 8,
                }}
              >
                {path.name}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontSize: 16,
                  color: '#94a3b8',
                  margin: 0,
                  marginBottom: 24,
                  textAlign: 'center',
                }}
              >
                {path.description}
              </p>

              {/* Milestones indicator */}
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  marginBottom: 24,
                }}
              >
                {Array.from({ length: 10 }, (_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: i < 3 ? path.color : `${path.color}30`,
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
                10 Milestones
              </span>

              {/* Price */}
              <div style={{ marginTop: 'auto' }}>
                <span style={{ fontSize: 14, color: '#10b981', marginRight: 8 }}>
                  Free to Learn
                </span>
                <span style={{ fontSize: 24, fontWeight: 600, color: '#ffffff' }}>
                  {path.price}
                </span>
                <span style={{ fontSize: 14, color: '#64748b', marginLeft: 8 }}>
                  certification
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
