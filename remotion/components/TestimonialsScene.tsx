import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

// Star icon for ratings
const StarIcon = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

// Quote icon
const QuoteIcon = () => (
  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
  </svg>
);

// User icon placeholder
const UserIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const testimonials = [
  {
    quote: "Finally, an AI course that makes you build real things. I deployed my first AI workflow in week 2.",
    name: "Marcus T.",
    role: "Software Developer",
    path: "Student Path",
    color: '#a855f7', // purple
  },
  {
    quote: "Cut my weekly admin work by 8 hours. The automation templates alone were worth it.",
    name: "Sarah K.",
    role: "Operations Manager",
    path: "Employee Path",
    color: '#22d3ee', // cyan
  },
  {
    quote: "Built an AI sales research system that does what my intern used to do. Runs 24/7.",
    name: "James L.",
    role: "Startup Founder",
    path: "Owner Path",
    color: '#10b981', // emerald
  },
];

export const TestimonialsScene: React.FC = () => {
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
      {/* Floating quote marks in background */}
      {[...Array(6)].map((_, i) => {
        const floatDelay = i * 15;
        const floatOpacity = interpolate(
          frame,
          [floatDelay, floatDelay + 30],
          [0, 0.08],
          { extrapolateRight: 'clamp' }
        );
        const floatY = Math.sin((frame + floatDelay) * 0.03) * 15;
        const positions = [
          { x: 100, y: 150 },
          { x: 1700, y: 200 },
          { x: 200, y: 800 },
          { x: 1650, y: 750 },
          { x: 400, y: 400 },
          { x: 1500, y: 500 },
        ];

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: positions[i].x,
              top: positions[i].y + floatY,
              opacity: floatOpacity,
              color: '#22d3ee',
              transform: `scale(${1.5 + (i % 3) * 0.5}) rotate(${i % 2 === 0 ? -15 : 15}deg)`,
            }}
          >
            <QuoteIcon />
          </div>
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
          What Learners Say
        </h2>
        <p
          style={{
            fontSize: 24,
            color: '#94a3b8',
            marginTop: 16,
            opacity: subtitleOpacity,
          }}
        >
          Real results from real builders
        </p>
      </div>

      {/* Testimonial cards */}
      <div
        style={{
          display: 'flex',
          gap: 40,
          marginTop: 80,
        }}
      >
        {testimonials.map((testimonial, index) => {
          // Slide in from left, center, right
          const slideDirections = [-400, 0, 400];
          const cardDelay = 30 + index * 20;

          const cardX = interpolate(
            frame,
            [cardDelay, cardDelay + 30],
            [slideDirections[index], 0],
            { extrapolateRight: 'clamp' }
          );

          const cardScale = spring({
            frame: frame - cardDelay,
            fps,
            config: { damping: 15, stiffness: 80 },
          });

          const cardOpacity = interpolate(
            frame,
            [cardDelay, cardDelay + 25],
            [0, 1],
            { extrapolateRight: 'clamp' }
          );

          // Subtle floating animation
          const floatY = Math.sin((frame + index * 30) * 0.04) * 6;

          // Stars animation
          const starsDelay = cardDelay + 20;

          return (
            <div
              key={testimonial.name}
              style={{
                width: 380,
                padding: 36,
                background: 'rgba(22, 24, 29, 0.95)',
                borderRadius: 20,
                border: `1px solid ${testimonial.color}30`,
                transform: `translateX(${cardX}px) translateY(${floatY}px) scale(${cardScale})`,
                opacity: cardOpacity,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Top accent gradient */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: `linear-gradient(90deg, transparent, ${testimonial.color}, transparent)`,
                }}
              />

              {/* Quote icon */}
              <div
                style={{
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  color: testimonial.color,
                  opacity: 0.2,
                }}
              >
                <QuoteIcon />
              </div>

              {/* Star rating */}
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  marginBottom: 20,
                }}
              >
                {[...Array(5)].map((_, j) => {
                  const starOpacity = interpolate(
                    frame,
                    [starsDelay + j * 3, starsDelay + j * 3 + 10],
                    [0, 1],
                    { extrapolateRight: 'clamp' }
                  );
                  const starScale = spring({
                    frame: frame - (starsDelay + j * 3),
                    fps,
                    config: { damping: 10, stiffness: 150 },
                  });

                  return (
                    <span
                      key={j}
                      style={{
                        color: '#eab308',
                        opacity: starOpacity,
                        transform: `scale(${starScale})`,
                      }}
                    >
                      <StarIcon />
                    </span>
                  );
                })}
              </div>

              {/* Quote */}
              <p
                style={{
                  fontSize: 18,
                  color: '#e2e8f0',
                  lineHeight: 1.6,
                  margin: 0,
                  marginBottom: 28,
                  fontStyle: 'italic',
                }}
              >
                "{testimonial.quote}"
              </p>

              {/* Divider */}
              <div
                style={{
                  height: 1,
                  background: 'linear-gradient(90deg, transparent, #374151, transparent)',
                  marginBottom: 20,
                }}
              />

              {/* Author info */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  {/* Avatar placeholder */}
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: `${testimonial.color}20`,
                      border: `2px solid ${testimonial.color}40`,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: testimonial.color,
                    }}
                  >
                    <UserIcon />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: '#ffffff',
                      }}
                    >
                      {testimonial.name}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: '#6b7280',
                      }}
                    >
                      {testimonial.role}
                    </div>
                  </div>
                </div>

                {/* Path badge */}
                <div
                  style={{
                    padding: '6px 12px',
                    background: `${testimonial.color}15`,
                    borderRadius: 8,
                    border: `1px solid ${testimonial.color}30`,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: testimonial.color,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}
                  >
                    {testimonial.path}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
