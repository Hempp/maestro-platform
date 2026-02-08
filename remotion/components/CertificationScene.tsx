import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

// Trophy icon
const TrophyIcon = () => (
  <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228M16.27 9.728a7.47 7.47 0 0 1-.981 3.172m-5.784-.001a7.47 7.47 0 0 1-.981-3.171" />
  </svg>
);

// Check badge icon
const CheckBadgeIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
  </svg>
);

// Cube icon for blockchain blocks
const CubeIcon = () => (
  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
  </svg>
);

export const CertificationScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  // Certificate card animation
  const cardScale = spring({
    frame: frame - 30,
    fps,
    config: { damping: 12, stiffness: 80 },
  });
  const cardOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: 'clamp' });

  // Blockchain animation
  const blockchainOpacity = interpolate(frame, [70, 90], [0, 1], { extrapolateRight: 'clamp' });

  // Glow effect
  const glowIntensity = 0.3 + Math.sin(frame * 0.08) * 0.15;

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
          Blockchain Credentials
        </h2>
        <p
          style={{
            fontSize: 24,
            color: '#94a3b8',
            marginTop: 16,
            textAlign: 'center',
          }}
        >
          Soulbound Tokens on Polygon - Verified Forever
        </p>
      </div>

      {/* Certificate card */}
      <div
        style={{
          transform: `scale(${cardScale})`,
          opacity: cardOpacity,
          position: 'relative',
        }}
      >
        {/* Glow effect */}
        <div
          style={{
            position: 'absolute',
            inset: -20,
            background: `radial-gradient(ellipse at center, rgba(34, 211, 238, ${glowIntensity}) 0%, transparent 70%)`,
            borderRadius: 40,
            filter: 'blur(30px)',
          }}
        />

        {/* Certificate */}
        <div
          style={{
            width: 600,
            padding: 50,
            background: 'linear-gradient(135deg, rgba(22, 24, 29, 0.95) 0%, rgba(15, 17, 21, 0.95) 100%)',
            borderRadius: 16,
            border: '1px solid rgba(34, 211, 238, 0.5)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background pattern */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.03,
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='%2322d3ee'/%3E%3C/svg%3E")`,
              backgroundSize: '30px 30px',
            }}
          />

          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              marginBottom: 30,
            }}
          >
            <div
              style={{
                width: 70,
                height: 70,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '0 10px 30px rgba(34, 211, 238, 0.4)',
                color: '#ffffff',
              }}
            >
              <TrophyIcon />
            </div>
            <div>
              <div style={{ fontSize: 14, color: '#22d3ee', fontWeight: 600, letterSpacing: 2 }}>
                CERTIFIED
              </div>
              <div style={{ fontSize: 28, fontWeight: 600, color: '#ffffff' }}>
                AI Operations Master
              </div>
            </div>
          </div>

          {/* Recipient */}
          <div style={{ marginBottom: 30 }}>
            <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>
              Awarded to
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#e2e8f0' }}>
              John Smith
            </div>
          </div>

          {/* Details grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 20,
              marginBottom: 30,
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                Issue Date
              </div>
              <div style={{ fontSize: 16, color: '#e2e8f0' }}>
                February 8, 2026
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                Token ID
              </div>
              <div style={{ fontSize: 16, color: '#e2e8f0', fontFamily: 'monospace' }}>
                #1847
              </div>
            </div>
          </div>

          {/* Verification badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '16px 20px',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: 12,
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            <span style={{ color: '#10b981' }}><CheckBadgeIcon /></span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#10b981' }}>
                Verified on Polygon
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>
                0x7a3b...8f2d
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blockchain visualization */}
      <div
        style={{
          position: 'absolute',
          bottom: 100,
          opacity: blockchainOpacity,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}
      >
        {[0, 1, 2, 3, 4].map((i) => {
          const blockDelay = 90 + i * 8;
          const blockScale = spring({
            frame: frame - blockDelay,
            fps,
            config: { damping: 15, stiffness: 100 },
          });
          const isActive = i === 2;

          return (
            <React.Fragment key={i}>
              {/* Block */}
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 12,
                  background: isActive
                    ? 'linear-gradient(135deg, #22d3ee, #3b82f6)'
                    : 'rgba(50, 50, 70, 0.8)',
                  border: `2px solid ${isActive ? '#22d3ee' : '#374151'}`,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  transform: `scale(${blockScale})`,
                  boxShadow: isActive ? '0 10px 40px rgba(34, 211, 238, 0.4)' : 'none',
                  color: isActive ? '#ffffff' : '#6b7280',
                }}
              >
                {isActive ? (
                  <TrophyIcon />
                ) : (
                  <CubeIcon />
                )}
              </div>

              {/* Chain link */}
              {i < 4 && (
                <div
                  style={{
                    width: 40,
                    height: 4,
                    background: 'linear-gradient(90deg, #374151, #22d3ee, #374151)',
                    borderRadius: 2,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
