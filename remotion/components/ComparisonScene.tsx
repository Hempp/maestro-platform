import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

// Checkmark icon
const CheckIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

// X mark icon
const XIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Video/Course icon
const CourseIcon = () => (
  <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5" />
  </svg>
);

// Rocket/Phazur icon
const PhazurIcon = () => (
  <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
  </svg>
);

const comparisonItems = [
  { label: 'Hands-On Projects', traditional: false, phazur: true },
  { label: 'Terminal-First Learning', traditional: false, phazur: true },
  { label: 'AI Coaching (Socratic)', traditional: false, phazur: true },
  { label: 'Blockchain Credentials', traditional: false, phazur: true },
  { label: 'Pay After Completion', traditional: false, phazur: true },
  { label: 'Video Lectures', traditional: true, phazur: false },
  { label: 'Passive Learning', traditional: true, phazur: false },
  { label: 'PDF Certificates', traditional: true, phazur: false },
];

export const ComparisonScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(frame, [0, 20], [30, 0], { extrapolateRight: 'clamp' });

  // Column headers animation
  const traditionalHeaderOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: 'clamp' });
  const traditionalHeaderX = interpolate(frame, [20, 40], [-50, 0], { extrapolateRight: 'clamp' });

  const phazurHeaderOpacity = interpolate(frame, [25, 45], [0, 1], { extrapolateRight: 'clamp' });
  const phazurHeaderX = interpolate(frame, [25, 45], [50, 0], { extrapolateRight: 'clamp' });

  // VS animation
  const vsScale = spring({
    frame: frame - 35,
    fps,
    config: { damping: 8, stiffness: 100 },
  });
  const vsOpacity = interpolate(frame, [35, 50], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: 60,
      }}
    >
      {/* Background divider */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '50%',
          width: 2,
          background: 'linear-gradient(180deg, transparent, #374151 30%, #374151 70%, transparent)',
          opacity: interpolate(frame, [30, 50], [0, 0.5], { extrapolateRight: 'clamp' }),
        }}
      />

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontSize: 52,
            fontWeight: 600,
            color: '#ffffff',
            margin: 0,
          }}
        >
          Traditional Courses vs{' '}
          <span
            style={{
              color: '#22d3ee',
              textShadow: '0 0 15px rgba(34, 211, 238, 0.5)',
            }}
          >
            Phazur
          </span>
        </h2>
      </div>

      {/* Comparison table */}
      <div
        style={{
          display: 'flex',
          gap: 60,
          marginTop: 60,
        }}
      >
        {/* Traditional Column */}
        <div
          style={{
            width: 500,
            opacity: traditionalHeaderOpacity,
            transform: `translateX(${traditionalHeaderX}px)`,
          }}
        >
          {/* Column header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 40,
              padding: '20px 24px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 16,
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 12,
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#ef4444',
              }}
            >
              <CourseIcon />
            </div>
            <div>
              <h3
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  color: '#ffffff',
                  margin: 0,
                }}
              >
                Traditional Courses
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: '#6b7280',
                  margin: 0,
                  marginTop: 4,
                }}
              >
                Watch, memorize, forget
              </p>
            </div>
          </div>

          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {comparisonItems.map((item, index) => {
              const itemDelay = 50 + index * 8;
              const itemOpacity = interpolate(
                frame,
                [itemDelay, itemDelay + 15],
                [0, 1],
                { extrapolateRight: 'clamp' }
              );
              const itemX = interpolate(
                frame,
                [itemDelay, itemDelay + 15],
                [-30, 0],
                { extrapolateRight: 'clamp' }
              );

              // Icon animation
              const iconScale = spring({
                frame: frame - (itemDelay + 5),
                fps,
                config: { damping: 12, stiffness: 150 },
              });

              return (
                <div
                  key={`trad-${item.label}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '16px 20px',
                    background: item.traditional
                      ? 'rgba(239, 68, 68, 0.08)'
                      : 'rgba(50, 50, 60, 0.5)',
                    borderRadius: 12,
                    border: `1px solid ${item.traditional ? 'rgba(239, 68, 68, 0.2)' : 'rgba(75, 75, 85, 0.5)'}`,
                    opacity: itemOpacity,
                    transform: `translateX(${itemX}px)`,
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: item.traditional
                        ? 'rgba(239, 68, 68, 0.2)'
                        : 'rgba(107, 114, 128, 0.3)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: item.traditional ? '#ef4444' : '#6b7280',
                      transform: `scale(${iconScale})`,
                    }}
                  >
                    {item.traditional ? <CheckIcon /> : <XIcon />}
                  </div>

                  {/* Label */}
                  <span
                    style={{
                      fontSize: 16,
                      color: item.traditional ? '#e2e8f0' : '#6b7280',
                      textDecoration: item.traditional ? 'none' : 'line-through',
                      fontWeight: item.traditional ? 500 : 400,
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* VS Badge */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) scale(${vsScale})`,
            opacity: vsOpacity,
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1e1e2e, #0f0f15)',
              border: '3px solid #374151',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            }}
          >
            <span
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#94a3b8',
                letterSpacing: 2,
              }}
            >
              VS
            </span>
          </div>
        </div>

        {/* Phazur Column */}
        <div
          style={{
            width: 500,
            opacity: phazurHeaderOpacity,
            transform: `translateX(${phazurHeaderX}px)`,
          }}
        >
          {/* Column header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 40,
              padding: '20px 24px',
              background: 'rgba(34, 211, 238, 0.1)',
              borderRadius: 16,
              border: '1px solid rgba(34, 211, 238, 0.3)',
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.3), rgba(59, 130, 246, 0.3))',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#22d3ee',
                boxShadow: '0 4px 20px rgba(34, 211, 238, 0.3)',
              }}
            >
              <PhazurIcon />
            </div>
            <div>
              <h3
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  color: '#22d3ee',
                  textShadow: '0 0 15px rgba(34, 211, 238, 0.5)',
                  margin: 0,
                }}
              >
                Phazur
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: '#6b7280',
                  margin: 0,
                  marginTop: 4,
                }}
              >
                Build, ship, prove
              </p>
            </div>
          </div>

          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {comparisonItems.map((item, index) => {
              const itemDelay = 55 + index * 8;
              const itemOpacity = interpolate(
                frame,
                [itemDelay, itemDelay + 15],
                [0, 1],
                { extrapolateRight: 'clamp' }
              );
              const itemX = interpolate(
                frame,
                [itemDelay, itemDelay + 15],
                [30, 0],
                { extrapolateRight: 'clamp' }
              );

              // Icon animation
              const iconScale = spring({
                frame: frame - (itemDelay + 5),
                fps,
                config: { damping: 12, stiffness: 150 },
              });

              // Glow for phazur items
              const glowIntensity = item.phazur
                ? 0.15 + Math.sin((frame + index * 15) * 0.06) * 0.08
                : 0;

              return (
                <div
                  key={`phazur-${item.label}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '16px 20px',
                    background: item.phazur
                      ? 'rgba(16, 185, 129, 0.08)'
                      : 'rgba(50, 50, 60, 0.5)',
                    borderRadius: 12,
                    border: `1px solid ${item.phazur ? 'rgba(16, 185, 129, 0.3)' : 'rgba(75, 75, 85, 0.5)'}`,
                    opacity: itemOpacity,
                    transform: `translateX(${itemX}px)`,
                    boxShadow: item.phazur
                      ? `0 4px 20px rgba(16, 185, 129, ${glowIntensity})`
                      : 'none',
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: item.phazur
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(107, 114, 128, 0.3)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: item.phazur ? '#10b981' : '#6b7280',
                      transform: `scale(${iconScale})`,
                    }}
                  >
                    {item.phazur ? <CheckIcon /> : <XIcon />}
                  </div>

                  {/* Label */}
                  <span
                    style={{
                      fontSize: 16,
                      color: item.phazur ? '#e2e8f0' : '#6b7280',
                      textDecoration: item.phazur ? 'none' : 'line-through',
                      fontWeight: item.phazur ? 500 : 400,
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
