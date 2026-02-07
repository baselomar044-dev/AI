// ============================================
// 🛡️ COMPREHENSIVE ERROR HANDLING SYSTEM
// ============================================

import { toast } from 'react-hot-toast';

// Error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  RATE_LIMIT = 'RATE_LIMIT',
  API = 'API',
  VALIDATION = 'VALIDATION',
  PERMISSION = 'PERMISSION',
  NOT_FOUND = 'NOT_FOUND',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType;
  code: string;
  message: string;
  messageAr: string;
  details?: any;
  retryable: boolean;
  retryAfterMs?: number;
  suggestions?: string[];
  suggestionsAr?: string[];
}

// Error codes with bilingual messages
const ERROR_DEFINITIONS: Record<string, Omit<AppError, 'details'>> = {
  // Network errors
  'NET_OFFLINE': {
    type: ErrorType.NETWORK,
    code: 'NET_OFFLINE',
    message: 'No internet connection. Please check your network.',
    messageAr: 'لا يوجد اتصال بالإنترنت. يرجى التحقق من الشبكة.',
    retryable: true,
    suggestions: ['Check your WiFi or mobile data', 'Try again in a moment'],
    suggestionsAr: ['تحقق من الواي فاي أو بيانات الهاتف', 'حاول مرة أخرى بعد قليل'],
  },
  'NET_TIMEOUT': {
    type: ErrorType.TIMEOUT,
    code: 'NET_TIMEOUT',
    message: 'Request timed out. The server is taking too long.',
    messageAr: 'انتهت مهلة الطلب. الخادم يستغرق وقتاً طويلاً.',
    retryable: true,
    retryAfterMs: 2000,
    suggestions: ['The AI is thinking hard', 'Try a simpler question'],
    suggestionsAr: ['الذكاء الاصطناعي يفكر بعمق', 'جرب سؤالاً أبسط'],
  },
  
  // Auth errors
  'AUTH_EXPIRED': {
    type: ErrorType.AUTH,
    code: 'AUTH_EXPIRED',
    message: 'Your session has expired. Please sign in again.',
    messageAr: 'انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.',
    retryable: false,
  },
  'AUTH_INVALID': {
    type: ErrorType.AUTH,
    code: 'AUTH_INVALID',
    message: 'Invalid credentials. Please check your email and password.',
    messageAr: 'بيانات اعتماد غير صالحة. تحقق من بريدك وكلمة المرور.',
    retryable: false,
  },
  
  // Rate limit errors
  'RATE_GEMINI': {
    type: ErrorType.RATE_LIMIT,
    code: 'RATE_GEMINI',
    message: 'Gemini rate limit reached. Switching to backup model...',
    messageAr: 'تم الوصول لحد Gemini. جاري التبديل للنموذج البديل...',
    retryable: true,
    retryAfterMs: 0,
    suggestions: ['Using Groq as backup', 'No action needed'],
    suggestionsAr: ['يتم استخدام Groq كبديل', 'لا حاجة لأي إجراء'],
  },
  'RATE_GROQ': {
    type: ErrorType.RATE_LIMIT,
    code: 'RATE_GROQ',
    message: 'Groq rate limit reached. Switching to backup model...',
    messageAr: 'تم الوصول لحد Groq. جاري التبديل للنموذج البديل...',
    retryable: true,
    retryAfterMs: 0,
  },
  'RATE_ALL': {
    type: ErrorType.RATE_LIMIT,
    code: 'RATE_ALL',
    message: 'All AI providers are at capacity. Please try again later.',
    messageAr: 'جميع مزودي الذكاء الاصطناعي وصلوا للحد الأقصى. حاول لاحقاً.',
    retryable: true,
    retryAfterMs: 60000,
    suggestions: ['Wait 1 minute', 'Try a different time of day'],
    suggestionsAr: ['انتظر دقيقة واحدة', 'جرب وقتاً مختلفاً من اليوم'],
  },
  
  // API errors
  'API_INVALID_KEY': {
    type: ErrorType.API,
    code: 'API_INVALID_KEY',
    message: 'Invalid API key. Please check your settings.',
    messageAr: 'مفتاح API غير صالح. تحقق من الإعدادات.',
    retryable: false,
    suggestions: ['Go to Settings > API Keys', 'Regenerate your API key'],
    suggestionsAr: ['اذهب إلى الإعدادات > مفاتيح API', 'أعد إنشاء مفتاح API'],
  },
  'API_QUOTA': {
    type: ErrorType.API,
    code: 'API_QUOTA',
    message: 'Monthly quota exceeded for this service.',
    messageAr: 'تم تجاوز الحصة الشهرية لهذه الخدمة.',
    retryable: false,
    suggestions: ['Wait until next month', 'Upgrade your plan'],
    suggestionsAr: ['انتظر حتى الشهر القادم', 'قم بترقية خطتك'],
  },
  
  // Validation errors
  'VAL_MESSAGE_EMPTY': {
    type: ErrorType.VALIDATION,
    code: 'VAL_MESSAGE_EMPTY',
    message: 'Please enter a message.',
    messageAr: 'يرجى إدخال رسالة.',
    retryable: false,
  },
  'VAL_FILE_TOO_LARGE': {
    type: ErrorType.VALIDATION,
    code: 'VAL_FILE_TOO_LARGE',
    message: 'File is too large. Maximum size is 50MB.',
    messageAr: 'الملف كبير جداً. الحد الأقصى 50 ميجابايت.',
    retryable: false,
  },
  'VAL_UNSUPPORTED_FILE': {
    type: ErrorType.VALIDATION,
    code: 'VAL_UNSUPPORTED_FILE',
    message: 'This file type is not supported.',
    messageAr: 'نوع الملف هذا غير مدعوم.',
    retryable: false,
  },
};

// Create error from code
export function createError(code: string, details?: any): AppError {
  const def = ERROR_DEFINITIONS[code] || {
    type: ErrorType.UNKNOWN,
    code: 'UNKNOWN',
    message: 'An unexpected error occurred.',
    messageAr: 'حدث خطأ غير متوقع.',
    retryable: false,
  };
  
  return { ...def, details };
}

// Parse HTTP errors
export function parseHttpError(status: number, body?: any): AppError {
  switch (status) {
    case 401:
      return createError('AUTH_EXPIRED');
    case 403:
      return createError('AUTH_INVALID');
    case 404:
      return {
        type: ErrorType.NOT_FOUND,
        code: 'NOT_FOUND',
        message: 'Resource not found.',
        messageAr: 'المورد غير موجود.',
        retryable: false,
      };
    case 429:
      // Check which provider hit limit
      if (body?.provider === 'gemini') return createError('RATE_GEMINI');
      if (body?.provider === 'groq') return createError('RATE_GROQ');
      return createError('RATE_ALL');
    case 500:
    case 502:
    case 503:
      return {
        type: ErrorType.API,
        code: 'SERVER_ERROR',
        message: 'Server error. We\'re working on it.',
        messageAr: 'خطأ في الخادم. نحن نعمل على حله.',
        retryable: true,
        retryAfterMs: 5000,
      };
    default:
      return createError('UNKNOWN', { status, body });
  }
}

// Error display
export function showError(error: AppError, lang: 'en' | 'ar' = 'en'): void {
  const message = lang === 'ar' ? error.messageAr : error.message;
  
  if (error.type === ErrorType.RATE_LIMIT && error.retryAfterMs === 0) {
    // Auto-retry, just show info
    toast(message, { icon: '🔄', duration: 2000 });
  } else if (error.retryable) {
    toast.error(message, {
      duration: 5000,
      icon: '⚠️',
    });
  } else {
    toast.error(message, {
      duration: 7000,
      icon: '❌',
    });
  }
}

// Retry with exponential backoff
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    onRetry,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
        onRetry?.(attempt + 1, lastError);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// Global error boundary state
export const errorBoundaryState = {
  hasError: false,
  error: null as AppError | null,
  reset: () => {
    errorBoundaryState.hasError = false;
    errorBoundaryState.error = null;
  },
  setError: (error: AppError) => {
    errorBoundaryState.hasError = true;
    errorBoundaryState.error = error;
  },
};

// Fetch wrapper with error handling
export async function safeFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    // Check online status
    if (!navigator.onLine) {
      return { data: null, error: createError('NET_OFFLINE') };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      return { data: null, error: parseHttpError(response.status, body) };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { data: null, error: createError('NET_TIMEOUT') };
    }
    if (error.message?.includes('fetch')) {
      return { data: null, error: createError('NET_OFFLINE') };
    }
    return { data: null, error: createError('UNKNOWN', error) };
  }
}
