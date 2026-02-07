// ============================================
// 🚦 RATE LIMITER - Request Rate Limiting
// ============================================

import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

// ================== STANDARD RATE LIMITER ==================
// General API rate limiting
export const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'تم تجاوز الحد الأقصى للطلبات. يرجى المحاولة لاحقاً.',
    errorEn: 'Too many requests. Please try again later.',
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return (req as any).userId || req.ip || 'anonymous';
  },
});

// ================== STRICT RATE LIMITER ==================
// For sensitive endpoints (auth, etc.)
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 requests per hour
  message: {
    error: 'تم تجاوز الحد الأقصى للمحاولات. يرجى الانتظار.',
    errorEn: 'Too many attempts. Please wait.',
    retryAfter: 60 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ================== AI RATE LIMITER ==================
// Specific limits for AI endpoints
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: {
    error: 'تم تجاوز حد طلبات الذكاء الاصطناعي. يرجى الانتظار.',
    errorEn: 'AI request limit exceeded. Please wait.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return (req as any).userId || req.ip || 'anonymous';
  },
});

// ================== SPEED LIMITER ==================
// Slow down requests instead of blocking
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per window without delay
  delayMs: (hits) => hits * 100, // Add 100ms delay per request after limit
  maxDelayMs: 5000, // Maximum delay of 5 seconds
});

// ================== CUSTOM RATE LIMITER FACTORY ==================
export function createRateLimiter(options: {
  windowMs?: number;
  max?: number;
  message?: string;
  keyPrefix?: string;
}) {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Rate limit exceeded',
    keyPrefix = '',
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const userId = (req as any).userId || req.ip || 'anonymous';
      return keyPrefix ? `${keyPrefix}:${userId}` : userId;
    },
  });
}

// ================== DYNAMIC RATE LIMITER ==================
// Rate limits based on user tier
export function createDynamicLimiter(getTierLimits: (userId: string) => { windowMs: number; max: number }) {
  const limiters = new Map<string, ReturnType<typeof rateLimit>>();

  return (req: any, res: any, next: any) => {
    const userId = req.userId || req.ip || 'anonymous';
    
    if (!limiters.has(userId)) {
      const limits = getTierLimits(userId);
      limiters.set(userId, rateLimit({
        windowMs: limits.windowMs,
        max: limits.max,
        keyGenerator: () => userId,
      }));
    }

    const limiter = limiters.get(userId)!;
    return limiter(req, res, next);
  };
}

// ================== IN-MEMORY RATE TRACKING ==================
// For more granular control (e.g., per-feature limits)
class RateTracker {
  private requests: Map<string, number[]> = new Map();

  isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get or initialize request timestamps
    let timestamps = this.requests.get(key) || [];
    
    // Filter out old timestamps
    timestamps = timestamps.filter(t => t > windowStart);
    
    // Check if under limit
    if (timestamps.length >= maxRequests) {
      return false;
    }
    
    // Add new timestamp
    timestamps.push(now);
    this.requests.set(key, timestamps);
    
    return true;
  }

  getRemainingRequests(key: string, maxRequests: number, windowMs: number): number {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    const timestamps = this.requests.get(key) || [];
    const recentRequests = timestamps.filter(t => t > windowStart);
    
    return Math.max(0, maxRequests - recentRequests.length);
  }

  resetKey(key: string): void {
    this.requests.delete(key);
  }

  // Cleanup old entries periodically
  cleanup(maxAge: number = 60 * 60 * 1000): void {
    const now = Date.now();
    const cutoff = now - maxAge;
    
    for (const [key, timestamps] of this.requests.entries()) {
      const filtered = timestamps.filter(t => t > cutoff);
      if (filtered.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, filtered);
      }
    }
  }
}

export const rateTracker = new RateTracker();

// Run cleanup every hour
setInterval(() => rateTracker.cleanup(), 60 * 60 * 1000);

// ================== EXPORTS ==================
export default {
  standardLimiter,
  strictLimiter,
  aiLimiter,
  speedLimiter,
  createRateLimiter,
  createDynamicLimiter,
  rateTracker,
};
