import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { CountUpNumber, SplitText, WaveText } from './AnimatedText';

const milestones = [
  { number: 1, title: 'AI Fundamentals', status: 'completed' },
  { number: 2, title: 'Prompt Engineering', status: 'completed' },
  { number: 3, title: 'Workflow Design', status: 'completed' },
  { number: 4, title: 'Tool Integration', status: 'active' },
  { number: 5, title: 'Automation Basics', status: 'locked' },
  { number: 6, title: 'Data Analysis', status: 'locked' },
  { number: 7, title: 'AI Ethics', status: 'locked' },
  { number: 8, title: 'Project Planning', status: 'locked' },
  { number: 9, title: 'Implementation', status: 'locked' },
  { number: 10, title: 'Certification', status: 'locked' },
];

// Check icon SVG
const CheckIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

// Lock icon SVG
const LockIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
  </svg>
);

export const MilestonesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  // Progress bar animation
  const progressWidth = interpolate(frame, [30, 90], [0, 35], { extrapolateRight: 'clamp' });

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
          top: 80,
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
          <SplitText
            text="Milestone-Based Learning"
            splitBy="word"
            startFrame={0}
            staggerDelay={6}
            animation="blur"
          />
        </h2>
        <p
          style={{
            fontSize: 24,
            color: '#94a3b8',
            marginTop: 16,
            textAlign: 'center',
          }}
        >
          <WaveText
            text="Complete real projects, not just courses"
            startFrame={15}
            waveHeight={4}
            waveSpeed={0.12}
            waveLength={0.2}
          />
        </p>
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          top: 220,
          width: '80%',
          height: 8,
          background: 'rgba(34, 211, 238, 0.2)',
          borderRadius: 4,
        }}
      >
        <div
          style={{
            width: `${progressWidth}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #10b981, #22d3ee)',
            borderRadius: 4,
            boxShadow: '0 0 20px rgba(34, 211, 238, 0.5)',
          }}
        />
      </div>

      {/* Milestones grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 24,
          marginTop: 80,
          width: '90%',
        }}
      >
        {milestones.map((milestone, index) => {
          const delay = 20 + index * 8;
          const scale = spring({
            frame: frame - delay,
            fps,
            config: { damping: 15, stiffness: 120 },
          });
          const opacity = interpolate(
            frame,
            [delay, delay + 15],
            [0, 1],
            { extrapolateRight: 'clamp' }
          );

          const statusColors = {
            completed: { bg: '#10b981', border: '#10b981' },
            active: { bg: '#22d3ee', border: '#22d3ee' },
            locked: { bg: 'transparent', border: '#374151' },
          };
          const status = statusColors[milestone.status as keyof typeof statusColors];

          // Pulse animation for active
          const pulse = milestone.status === 'active'
            ? 1 + Math.sin(frame * 0.1) * 0.05
            : 1;

          return (
            <div
              key={milestone.number}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transform: `scale(${scale * pulse})`,
                opacity,
              }}
            >
              {/* Number circle */}
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: status.bg,
                  border: `3px solid ${status.border}`,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 12,
                  boxShadow: milestone.status === 'active'
                    ? '0 0 30px rgba(34, 211, 238, 0.6)'
                    : 'none',
                }}
              >
                {milestone.status === 'completed' ? (
                  <span style={{ color: '#ffffff' }}><CheckIcon /></span>
                ) : milestone.status === 'locked' ? (
                  <span style={{ color: '#6b7280' }}><LockIcon /></span>
                ) : (
                  <span
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: '#ffffff',
                    }}
                  >
                    {milestone.number}
                  </span>
                )}
              </div>

              {/* Title */}
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: milestone.status === 'locked' ? '#6b7280' : '#e2e8f0',
                  textAlign: 'center',
                }}
              >
                {milestone.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Stats with count-up animation */}
      <div
        style={{
          position: 'absolute',
          bottom: 100,
          display: 'flex',
          gap: 80,
        }}
      >
        {[
          { label: 'Completed', value: 3, color: '#10b981' },
          { label: 'In Progress', value: 1, color: '#22d3ee' },
          { label: 'Remaining', value: 6, color: '#6b7280' },
        ].map((stat, i) => {
          return (
            <div
              key={stat.label}
              style={{
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 700,
                  color: stat.color,
                }}
              >
                <CountUpNumber
                  endValue={stat.value}
                  startValue={0}
                  startFrame={100 + i * 10}
                  duration={40}
                  easing="spring"
                />
              </div>
              <div
                style={{
                  fontSize: 18,
                  color: '#94a3b8',
                }}
              >
                <SplitText
                  text={stat.label}
                  splitBy="letter"
                  startFrame={110 + i * 10}
                  staggerDelay={2}
                  animation="fadeIn"
                />
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
