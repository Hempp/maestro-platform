import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

const chatMessages = [
  { role: 'user', content: "I'm ready to start milestone 4!" },
  { role: 'assistant', content: "Great! Let's integrate your first AI tool. What API are you considering?" },
  { role: 'user', content: "I'm thinking about using Claude for document analysis." },
  { role: 'assistant', content: "Excellent choice! Let me guide you through the setup..." },
];

// AI Bot icon
const BotIcon = () => (
  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
  </svg>
);

// Arrow icon
const ArrowIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
  </svg>
);

// Terminal icon
const TerminalIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
  </svg>
);

// Code icon
const CodeIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
  </svg>
);

// Target icon
const TargetIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
  </svg>
);

export const TutorScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

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
          opacity: titleOpacity,
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
          AI-Powered Tutor
        </h2>
        <p
          style={{
            fontSize: 24,
            color: '#94a3b8',
            marginTop: 16,
            textAlign: 'center',
          }}
        >
          Get personalized guidance on every milestone
        </p>
      </div>

      {/* Chat interface mockup */}
      <div
        style={{
          width: 900,
          height: 550,
          background: 'rgba(20, 20, 35, 0.9)',
          borderRadius: 16,
          border: '1px solid rgba(34, 211, 238, 0.3)',
          overflow: 'hidden',
          marginTop: 60,
          boxShadow: '0 40px 100px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 30px',
            borderBottom: '1px solid rgba(34, 211, 238, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#ffffff',
            }}
          >
            <BotIcon />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#ffffff' }}>
              Phazur AI Tutor
            </div>
            <div style={{ fontSize: 14, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
              Online
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            padding: 30,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {chatMessages.map((msg, index) => {
            const delay = 30 + index * 25;
            const opacity = interpolate(
              frame,
              [delay, delay + 15],
              [0, 1],
              { extrapolateRight: 'clamp' }
            );
            const translateY = interpolate(
              frame,
              [delay, delay + 15],
              [20, 0],
              { extrapolateRight: 'clamp' }
            );

            const isUser = msg.role === 'user';

            // Typing indicator for assistant messages
            const showTyping = frame >= delay && frame < delay + 15 && !isUser;

            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  opacity,
                  transform: `translateY(${translateY}px)`,
                }}
              >
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '16px 20px',
                    borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    background: isUser
                      ? 'linear-gradient(135deg, #22d3ee, #3b82f6)'
                      : 'rgba(50, 50, 70, 0.8)',
                    color: '#ffffff',
                    fontSize: 16,
                    lineHeight: 1.5,
                  }}
                >
                  {showTyping ? (
                    <TypingIndicator frame={frame} />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input area */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '20px 30px',
            borderTop: '1px solid rgba(34, 211, 238, 0.2)',
            display: 'flex',
            gap: 16,
          }}
        >
          <div
            style={{
              flex: 1,
              padding: '16px 20px',
              background: 'rgba(50, 50, 70, 0.5)',
              borderRadius: 12,
              color: '#6b7280',
              fontSize: 16,
            }}
          >
            Ask your tutor anything...
          </div>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#ffffff',
            }}
          >
            <ArrowIcon />
          </div>
        </div>
      </div>

      {/* Features */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          display: 'flex',
          gap: 60,
        }}
      >
        {[
          { icon: <TerminalIcon />, label: 'Real-time Chat', color: '#22d3ee' },
          { icon: <CodeIcon />, label: 'Code Review', color: '#a855f7' },
          { icon: <TargetIcon />, label: 'Goal Tracking', color: '#10b981' },
        ].map((feature, i) => {
          const featureOpacity = interpolate(
            frame,
            [110 + i * 10, 120 + i * 10],
            [0, 1],
            { extrapolateRight: 'clamp' }
          );

          return (
            <div
              key={feature.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                opacity: featureOpacity,
              }}
            >
              <div style={{ color: feature.color }}>{feature.icon}</div>
              <span style={{ fontSize: 18, color: '#e2e8f0' }}>{feature.label}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const TypingIndicator: React.FC<{ frame: number }> = ({ frame }) => {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#94a3b8',
            opacity: 0.5 + Math.sin((frame + i * 10) * 0.3) * 0.5,
          }}
        />
      ))}
    </div>
  );
};
