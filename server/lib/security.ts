// ============================================
// 🔒 SECURITY - Enterprise-Grade Middleware & Utilities
// ============================================

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// ================== ENVIRONMENT VALIDATION ==================

const requiredSecrets = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missingSecrets = requiredSecrets.filter(key => !process.env[key]);

if (missingSecrets.length > 0 && process.env.NODE_ENV === 'production') {
  throw new Error(`FATAL: Missing required security secrets: ${missingSecrets.join(', ')}`);
}

// Use secure random defaults ONLY in development (will log warning)
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  const devSecret = crypto.randomBytes(64).toString('hex');
  console.warn('⚠️  WARNING: Using auto-generated JWT_SECRET. Set JWT_SECRET in production!');
  return devSecret;
})();

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (() => {
  const devSecret = crypto.randomBytes(64).toString('hex');
  console.warn('⚠️  WARNING: Using auto-generated JWT_REFRESH_SECRET. Set in production!');
  return devSecret;
})();

// Export for use in auth routes
export { JWT_SECRET, JWT_REFRESH_SECRET };

// ================== HELMET CONFIG (Hardened CSP) ==================

export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://accounts.google.com', 'https://apis.google.com', 'https://www.google.com', 'https://www.gstatic.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      fontSrc: ["'self'", 'fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: [
        "'self'",
        'https://*.groq.com',
        'https://*.googleapis.com',
        'https://*.openrouter.ai',
        'https://*.supabase.co',
        'wss://*.supabase.co',
        'https://accounts.google.com',
      ],
      mediaSrc: ["'self'", 'blob:'],
      frameSrc: ["'self'", 'https://accounts.google.com', 'https://www.google.com'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      // upgradeInsecureRequests removed
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'same-origin' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

// ================== SECURITY HEADERS ==================

export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Additional security headers beyond Helmet
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0'); // Modern browsers handle this; header can cause issues
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(self), geolocation=(), payment=()');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  
  // Remove server identification
  res.removeHeader('X-Powered-By');
  
  next();
};

// ================== RATE LIMITERS ==================

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200'),
  message: {
    error: 'تم تجاوز الحد الأقصى للطلبات',
    errorEn: 'Too many requests, please try again later',
    retryAfter: 'Retry-After header indicates wait time',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health',
});

// Chat/AI rate limiter (more restrictive)
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: {
    error: 'تم تجاوز حد طلبات المحادثة',
    errorEn: 'Chat rate limit exceeded',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise IP
    return (req as any).userId || req.ip || 'anonymous';
  },
});

// Auth rate limiter (very restrictive - brute force protection)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: {
    error: 'محاولات تسجيل دخول كثيرة. حاول بعد 15 دقيقة',
    errorEn: 'Too many login attempts. Please try again in 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Password reset rate limiter
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: {
    error: 'تم تجاوز حد طلبات إعادة تعيين كلمة المرور',
    errorEn: 'Too many password reset requests',
  },
});

// ================== REQUEST LOGGING ==================

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')?.substring(0, 100),
      userId: (req as any).userId || 'anonymous',
    };
    
    // Log errors and slow requests
    if (res.statusCode >= 400 || duration > 5000) {
      console.warn('[REQUEST]', JSON.stringify(log));
    } else if (process.env.NODE_ENV !== 'production') {
      console.log('[REQUEST]', JSON.stringify(log));
    }
  });
  
  next();
};

// ================== ERROR HANDLER ==================

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Log error with context (but sanitize sensitive data)
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    userId: (req as any).userId,
  });

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      error: 'التوكن غير صالح',
      errorEn: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      error: 'انتهت صلاحية الجلسة',
      errorEn: 'Session expired',
      code: 'TOKEN_EXPIRED',
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: err.message,
      code: 'VALIDATION_ERROR',
    });
  }

  // Rate limit errors
  if (err.status === 429) {
    return res.status(429).json({
      error: 'تم تجاوز الحد الأقصى للطلبات',
      errorEn: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  }

  // Default error - never expose internal details in production
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'حدث خطأ في الخادم'
    : err.message;

  res.status(statusCode).json({ 
    error: message,
    code: 'INTERNAL_ERROR',
  });
};

// ================== JWT TOKEN UTILITIES ==================

export interface TokenPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export const generateAccessToken = (userId: string, email: string): string => {
  return jwt.sign(
    { userId, email, type: 'access' },
    JWT_SECRET,
    { expiresIn: '15m' } // Short-lived access tokens
  );
};

export const generateRefreshToken = (userId: string, email: string): string => {
  return jwt.sign(
    { userId, email, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyAccessToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
  if (decoded.type !== 'access') {
    throw new Error('Invalid token type');
  }
  return decoded;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  if (decoded.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  return decoded;
};

// ================== AUTH MIDDLEWARE ==================

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'التوثيق مطلوب',
        errorEn: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    
    (req as any).userId = decoded.userId;
    (req as any).userEmail = decoded.email;
    
    next();
  } catch (error) {
    if ((error as any).name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'انتهت صلاحية الجلسة',
        errorEn: 'Session expired',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({ 
      error: 'توثيق غير صالح',
      errorEn: 'Invalid authentication',
      code: 'AUTH_INVALID',
    });
  }
};

// Optional auth - doesn't fail if no token provided
export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);
      
      (req as any).userId = decoded.userId;
      (req as any).userEmail = decoded.email;
    }
    
    next();
  } catch (error) {
    // Ignore auth errors for optional auth - just proceed without user context
    next();
  }
};

// ================== INPUT VALIDATION & SANITIZATION ==================

// Password strength validation
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return { valid: errors.length === 0, errors };
};

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

// XSS Sanitization
export const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/data:/gi, 'data-blocked:')
      .trim()
      .slice(0, 50000); // Reasonable max length
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      // Sanitize keys too
      const sanitizedKey = String(key).replace(/[^\w\-_.]/g, '').slice(0, 100);
      sanitized[sanitizedKey] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
};

// Request body sanitization middleware
export const sanitizeBody = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  next();
};

// ================== CREDENTIAL ENCRYPTION ==================

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

export const encryptCredential = (plaintext: string): string => {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

export const decryptCredential = (ciphertext: string): string => {
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

export default {
  helmetConfig,
  securityHeaders,
  generalLimiter,
  chatLimiter,
  authLimiter,
  passwordResetLimiter,
  requestLogger,
  errorHandler,
  authMiddleware,
  optionalAuthMiddleware,
  sanitizeInput,
  sanitizeBody,
  validatePassword,
  validateEmail,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  encryptCredential,
  decryptCredential,
};
