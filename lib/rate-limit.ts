import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  interval: number; // in milliseconds
  uniqueTokenPerInterval: number; // max number of unique tokens
  maxRequests: number; // max requests per interval
}

export function rateLimit(config: RateLimitConfig) {
  const { interval, maxRequests } = config;

  return {
    check: (request: NextRequest, limit: number = maxRequests): boolean => {
      const token = getClientIdentifier(request);
      const now = Date.now();
      const resetTime = now + interval;

      if (!store[token]) {
        store[token] = {
          count: 1,
          resetTime,
        };
        return true;
      }

      if (now > store[token].resetTime) {
        store[token] = {
          count: 1,
          resetTime,
        };
        return true;
      }

      if (store[token].count >= limit) {
        return false;
      }

      store[token].count++;
      return true;
    },

    getRemaining: (request: NextRequest): number => {
      const token = getClientIdentifier(request);
      if (!store[token]) return maxRequests;
      return Math.max(0, maxRequests - store[token].count);
    },

    getReset: (request: NextRequest): number => {
      const token = getClientIdentifier(request);
      if (!store[token]) return Date.now() + interval;
      return store[token].resetTime;
    },
  };
}

function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from headers (works with proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  const ip = forwarded?.split(',')[0] || realIp || 'unknown';

  // Combine with user agent for more uniqueness
  const userAgent = request.headers.get('user-agent') || '';

  return `${ip}-${userAgent}`;
}

export function rateLimitResponse(
  request: NextRequest,
  remaining: number,
  reset: number
): NextResponse {
  const response = NextResponse.json(
    {
      success: false,
      error: 'Too many requests. Please try again later.',
    },
    { status: 429 }
  );

  response.headers.set('X-RateLimit-Limit', String(remaining + 1));
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  response.headers.set('X-RateLimit-Reset', String(reset));
  response.headers.set('Retry-After', String(Math.ceil((reset - Date.now()) / 1000)));

  return response;
}

// Pre-configured rate limiters
export const strictRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
  maxRequests: 10, // 10 requests per minute
});

export const standardRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
  maxRequests: 60, // 60 requests per minute
});

export const authRateLimit = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 500,
  maxRequests: 5, // 5 login attempts per 15 minutes
});
