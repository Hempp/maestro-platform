/**
 * Performance optimization utilities for Remotion videos
 * Provides memoized animation helpers, optimized interpolation functions,
 * frame-skip utilities, and pre-calculated animation curves
 */

import { Easing, interpolate } from 'remotion';

// ============================================================================
// Types
// ============================================================================

export interface AnimationCurve {
  inputRange: readonly number[];
  outputRange: readonly number[];
}

export interface SpringConfig {
  mass: number;
  damping: number;
  stiffness: number;
  overshootClamping?: boolean;
}

export interface CachedSpringResult {
  getValue: (frame: number) => number;
  duration: number;
}

// ============================================================================
// Pre-calculated Animation Curves
// ============================================================================

/**
 * Common easing curves pre-defined for consistent, optimized animations
 */
export const EASING_CURVES = {
  // Smooth fade in/out
  fadeIn: { inputRange: [0, 1], outputRange: [0, 1], easing: Easing.ease },
  fadeOut: { inputRange: [0, 1], outputRange: [1, 0], easing: Easing.ease },

  // Slide animations
  slideInFromBottom: { inputRange: [0, 1], outputRange: [30, 0] },
  slideInFromTop: { inputRange: [0, 1], outputRange: [-30, 0] },
  slideInFromLeft: { inputRange: [0, 1], outputRange: [-50, 0] },
  slideInFromRight: { inputRange: [0, 1], outputRange: [50, 0] },

  // Scale animations
  scaleUp: { inputRange: [0, 1], outputRange: [0.8, 1] },
  scaleDown: { inputRange: [0, 1], outputRange: [1, 0.8] },
  popIn: { inputRange: [0, 0.6, 1], outputRange: [0, 1.1, 1] },

  // Bounce animations
  bounceIn: { inputRange: [0, 0.4, 0.6, 0.8, 1], outputRange: [0, 1.2, 0.9, 1.05, 1] },
} as const;

/**
 * Pre-calculated spring curves for common configurations
 * Avoids recalculating spring physics on every frame
 */
export const SPRING_PRESETS: Record<string, SpringConfig> = {
  // Gentle, smooth spring
  gentle: { mass: 1, damping: 15, stiffness: 80, overshootClamping: false },

  // Bouncy spring with overshoot
  bouncy: { mass: 1, damping: 10, stiffness: 100, overshootClamping: false },

  // Stiff, quick response
  stiff: { mass: 1, damping: 20, stiffness: 200, overshootClamping: false },

  // No overshoot - good for UI elements
  noOvershoot: { mass: 1, damping: 20, stiffness: 120, overshootClamping: true },

  // Card animations
  card: { mass: 1, damping: 12, stiffness: 100, overshootClamping: false },

  // Quick snap
  snap: { mass: 0.5, damping: 15, stiffness: 300, overshootClamping: true },
} as const;

// ============================================================================
// Memoization Cache
// ============================================================================

const interpolationCache = new Map<string, number>();
const springCache = new Map<string, number[]>();

/**
 * Clear all caches - useful when changing compositions
 */
export function clearAnimationCaches(): void {
  interpolationCache.clear();
  springCache.clear();
}

// ============================================================================
// Memoized Animation Helpers
// ============================================================================

/**
 * Memoized interpolate function that caches results for repeated frame values
 * Ideal for animations that don't change configuration between frames
 */
export function memoizedInterpolate(
  frame: number,
  inputRange: readonly number[],
  outputRange: readonly number[],
  options?: { extrapolateLeft?: 'clamp' | 'extend'; extrapolateRight?: 'clamp' | 'extend' }
): number {
  const cacheKey = `${frame}:${inputRange.join(',')}:${outputRange.join(',')}:${options?.extrapolateLeft ?? 'extend'}:${options?.extrapolateRight ?? 'extend'}`;

  const cached = interpolationCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const result = interpolate(frame, inputRange, outputRange, options);
  interpolationCache.set(cacheKey, result);

  // Limit cache size to prevent memory issues
  if (interpolationCache.size > 10000) {
    const keysToDelete = Array.from(interpolationCache.keys()).slice(0, 5000);
    keysToDelete.forEach((key) => interpolationCache.delete(key));
  }

  return result;
}

/**
 * Pre-calculate spring values for a given duration
 * Returns a lookup function that's O(1) instead of recalculating physics
 */
export function preCalculateSpring(
  fps: number,
  config: SpringConfig,
  durationInFrames: number
): CachedSpringResult {
  const cacheKey = `${fps}:${config.mass}:${config.damping}:${config.stiffness}:${config.overshootClamping ?? false}:${durationInFrames}`;

  let values = springCache.get(cacheKey);

  if (!values) {
    values = [];
    const { mass, damping, stiffness, overshootClamping = false } = config;

    // Calculate spring physics for each frame
    for (let f = 0; f < durationInFrames; f++) {
      const t = f / fps;

      // Damped harmonic oscillator formula
      const omega0 = Math.sqrt(stiffness / mass);
      const zeta = damping / (2 * Math.sqrt(stiffness * mass));

      let value: number;

      if (zeta < 1) {
        // Underdamped
        const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
        value = 1 - Math.exp(-zeta * omega0 * t) * (Math.cos(omegaD * t) + (zeta * omega0 / omegaD) * Math.sin(omegaD * t));
      } else if (zeta === 1) {
        // Critically damped
        value = 1 - (1 + omega0 * t) * Math.exp(-omega0 * t);
      } else {
        // Overdamped
        const s1 = -omega0 * (zeta - Math.sqrt(zeta * zeta - 1));
        const s2 = -omega0 * (zeta + Math.sqrt(zeta * zeta - 1));
        value = 1 + (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s1 - s2);
      }

      if (overshootClamping) {
        value = Math.min(1, Math.max(0, value));
      }

      values.push(value);
    }

    springCache.set(cacheKey, values);
  }

  return {
    getValue: (frame: number) => {
      const clampedFrame = Math.max(0, Math.min(frame, values!.length - 1));
      const index = Math.floor(clampedFrame);
      const fraction = clampedFrame - index;

      // Linear interpolation between frames for sub-frame precision
      if (fraction > 0 && index < values!.length - 1) {
        return values![index] + (values![index + 1] - values![index]) * fraction;
      }

      return values![index];
    },
    duration: durationInFrames,
  };
}

// ============================================================================
// Frame-Skip Utilities
// ============================================================================

/**
 * Throttle animation updates to specific intervals
 * Useful for complex animations that don't need 30fps precision
 */
export function frameSkip(frame: number, interval: number): number {
  return Math.floor(frame / interval) * interval;
}

/**
 * Get throttled frame with smooth transition between keyframes
 * Provides interpolation between skipped frames for smoother appearance
 */
export function smoothFrameSkip(frame: number, interval: number): number {
  const lowerFrame = Math.floor(frame / interval) * interval;
  const upperFrame = lowerFrame + interval;
  const progress = (frame - lowerFrame) / interval;

  // Ease the transition between keyframes
  const easedProgress = Easing.inOut(Easing.ease)(progress);
  return lowerFrame + easedProgress * (upperFrame - lowerFrame);
}

/**
 * Check if current frame is a keyframe (should recalculate)
 */
export function isKeyframe(frame: number, interval: number): boolean {
  return frame % interval === 0;
}

/**
 * Get the nearest keyframe for a given frame
 */
export function getNearestKeyframe(frame: number, interval: number): number {
  return Math.round(frame / interval) * interval;
}

// ============================================================================
// Optimized Interpolation Functions
// ============================================================================

/**
 * Fast linear interpolation without range checks
 * Use when you're certain frame is within range
 */
export function fastLerp(frame: number, startFrame: number, endFrame: number, startValue: number, endValue: number): number {
  const t = (frame - startFrame) / (endFrame - startFrame);
  return startValue + t * (endValue - startValue);
}

/**
 * Clamped linear interpolation
 * Slightly faster than full interpolate for simple cases
 */
export function clampedLerp(frame: number, startFrame: number, endFrame: number, startValue: number, endValue: number): number {
  const t = Math.max(0, Math.min(1, (frame - startFrame) / (endFrame - startFrame)));
  return startValue + t * (endValue - startValue);
}

/**
 * Optimized opacity animation with clamping
 * Common pattern extracted for performance
 */
export function animateOpacity(frame: number, startFrame: number, duration: number = 20): number {
  if (frame < startFrame) return 0;
  if (frame >= startFrame + duration) return 1;
  return (frame - startFrame) / duration;
}

/**
 * Optimized slide animation with clamping
 * Returns Y offset for slide-up animations
 */
export function animateSlideUp(frame: number, startFrame: number, duration: number = 20, distance: number = 30): number {
  if (frame < startFrame) return distance;
  if (frame >= startFrame + duration) return 0;
  const progress = (frame - startFrame) / duration;
  return distance * (1 - Easing.out(Easing.ease)(progress));
}

/**
 * Optimized scale animation
 */
export function animateScale(frame: number, startFrame: number, duration: number = 20, fromScale: number = 0.8): number {
  if (frame < startFrame) return fromScale;
  if (frame >= startFrame + duration) return 1;
  const progress = (frame - startFrame) / duration;
  return fromScale + (1 - fromScale) * Easing.out(Easing.back(1.5))(progress);
}

// ============================================================================
// Stagger Utilities
// ============================================================================

/**
 * Calculate staggered animation delay for list items
 */
export function getStaggerDelay(index: number, baseDelay: number = 0, staggerInterval: number = 8): number {
  return baseDelay + index * staggerInterval;
}

/**
 * Get staggered opacity for list items
 */
export function getStaggeredOpacity(frame: number, index: number, baseDelay: number = 0, staggerInterval: number = 8, duration: number = 15): number {
  const delay = getStaggerDelay(index, baseDelay, staggerInterval);
  return animateOpacity(frame, delay, duration);
}

/**
 * Get staggered scale for list items
 */
export function getStaggeredScale(frame: number, index: number, baseDelay: number = 0, staggerInterval: number = 8, duration: number = 20): number {
  const delay = getStaggerDelay(index, baseDelay, staggerInterval);
  return animateScale(frame, delay, duration, 0);
}

// ============================================================================
// Loop Utilities
// ============================================================================

/**
 * Create a looping animation value
 */
export function loop(frame: number, durationInFrames: number): number {
  return frame % durationInFrames;
}

/**
 * Create a ping-pong (back and forth) animation value
 */
export function pingPong(frame: number, durationInFrames: number): number {
  const cycle = Math.floor(frame / durationInFrames);
  const position = frame % durationInFrames;
  return cycle % 2 === 0 ? position : durationInFrames - position;
}

/**
 * Oscillate between -1 and 1 based on frame
 * Faster than Math.sin for simple oscillations
 */
export function oscillate(frame: number, frequency: number = 0.1): number {
  return Math.sin(frame * frequency);
}

/**
 * Get a smooth pulse value (0 to 1 to 0)
 */
export function pulse(frame: number, duration: number): number {
  const t = (frame % duration) / duration;
  return Math.sin(t * Math.PI);
}

// ============================================================================
// Performance Measurement
// ============================================================================

let frameRenderTimes: number[] = [];

/**
 * Record frame render time for performance monitoring
 */
export function recordFrameRenderTime(time: number): void {
  frameRenderTimes.push(time);
  if (frameRenderTimes.length > 100) {
    frameRenderTimes = frameRenderTimes.slice(-100);
  }
}

/**
 * Get average frame render time
 */
export function getAverageRenderTime(): number {
  if (frameRenderTimes.length === 0) return 0;
  return frameRenderTimes.reduce((a, b) => a + b, 0) / frameRenderTimes.length;
}

/**
 * Check if rendering is meeting target FPS
 */
export function isRenderingAtTargetFps(targetFps: number): boolean {
  const avgTime = getAverageRenderTime();
  const targetFrameTime = 1000 / targetFps;
  return avgTime <= targetFrameTime;
}

export default {
  // Curves
  EASING_CURVES,
  SPRING_PRESETS,

  // Cache management
  clearAnimationCaches,

  // Memoized helpers
  memoizedInterpolate,
  preCalculateSpring,

  // Frame skip
  frameSkip,
  smoothFrameSkip,
  isKeyframe,
  getNearestKeyframe,

  // Fast interpolation
  fastLerp,
  clampedLerp,
  animateOpacity,
  animateSlideUp,
  animateScale,

  // Stagger
  getStaggerDelay,
  getStaggeredOpacity,
  getStaggeredScale,

  // Loop
  loop,
  pingPong,
  oscillate,
  pulse,

  // Performance
  recordFrameRenderTime,
  getAverageRenderTime,
  isRenderingAtTargetFps,
};
