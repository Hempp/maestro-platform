/**
 * RATE LIMITING UTILITY
 * In-memory rate limiter for API protection
 *
 * For production at scale, consider using:
 * - Upstash Redis (@upstash/ratelimit)
 * - Vercel KV
 * - Cloudflare Rate Limiting
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (resets on cold start - acceptable for edge functions)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  window: number;
  /** Optional identifier prefix for grouping limits */
  prefix?: string;
}

// Preset configurations for common use cases
export const RATE_LIMITS = {
  // Strict limit for authentication attempts
  auth: { limit: 5, window: 60, prefix: 'auth' } as RateLimitConfig,

  // AI/LLM endpoints (expensive operations)
  ai: { limit: 20, window: 60, prefix: 'ai' } as RateLimitConfig,

  // Standard API endpoints
  api: { limit: 60, window: 60, prefix: 'api' } as RateLimitConfig,

  // Generous limit for read operations
  read: { limit: 120, window: 60, prefix: 'read' } as RateLimitConfig,

  // Webhook endpoints (from payment providers, etc.)
  webhook: { limit: 100, window: 60, prefix: 'webhook' } as RateLimitConfig,
} as const;

/**
 * Get client identifier from request
 * Uses X-Forwarded-For (from reverse proxy) or falls back to a header hash
 */
function getClientId(request: NextRequest): string {
  // Try forwarded IP first (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // Try real IP header
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback: hash of user agent + accept-language (not ideal, but better than nothing)
  const ua = request.headers.get('user-agent') || 'unknown';
  const lang = request.headers.get('accept-language') || 'unknown';
  return `fallback:${hashCode(ua + lang)}`;
}

function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp when the window resets
}

/**
 * Check rate limit for a request
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = RATE_LIMITS.api
): RateLimitResult {
  cleanup();

  const clientId = getClientId(request);
  const key = `${config.prefix || 'default'}:${clientId}`;
  const now = Date.now();
  const windowMs = config.window * 1000;

  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: Math.floor((now + windowMs) / 1000),
    };
  }

  // Existing window
  entry.count++;

  const remaining = Math.max(0, config.limit - entry.count);
  const success = entry.count <= config.limit;

  return {
    success,
    limit: config.limit,
    remaining,
    reset: Math.floor(entry.resetTime / 1000),
  };
}

/**
 * Apply rate limiting and return error response if exceeded
 * Returns null if rate limit is OK, otherwise returns a 429 response
 */
export function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = RATE_LIMITS.api
): NextResponse | null {
  const result = checkRateLimit(request, config);

  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        retryAfter: result.reset - Math.floor(Date.now() / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.reset.toString(),
          'Retry-After': (result.reset - Math.floor(Date.now() / 1000)).toString(),
        },
      }
    );
  }

  return null;
}

/**
 * Add rate limit headers to a response
 */
export function withRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.reset.toString());
  return response;
}
