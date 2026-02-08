/**
 * Performance utilities for Remotion
 */

export {
  // Pre-calculated curves
  EASING_CURVES,
  SPRING_PRESETS,

  // Cache management
  clearAnimationCaches,

  // Memoized helpers
  memoizedInterpolate,
  preCalculateSpring,

  // Frame skip utilities
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

  // Stagger utilities
  getStaggerDelay,
  getStaggeredOpacity,
  getStaggeredScale,

  // Loop utilities
  loop,
  pingPong,
  oscillate,
  pulse,

  // Performance measurement
  recordFrameRenderTime,
  getAverageRenderTime,
  isRenderingAtTargetFps,

  // Types
  type AnimationCurve,
  type SpringConfig,
  type CachedSpringResult,
} from './performance';
