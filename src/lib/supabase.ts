// ============================================
// 🔐 SUPABASE CLIENT - Secure Configuration
// ============================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Client-side Supabase configuration
// ⚠️ Only VITE_SUPABASE_ANON_KEY is safe for client-side!
// Never expose service keys to the frontend!

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate configuration
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return url.startsWith('https://') && url.includes('supabase.co');
  } catch {
    return false;
  }
};

const isValidAnonKey = (key: string): boolean => {
  // Anon keys are JWTs with "anon" role
  if (!key || key.length < 100) return false;
  try {
    const payload = JSON.parse(atob(key.split('.')[1]));
    return payload.role === 'anon';
  } catch {
    return false;
  }
};

// Create client only if properly configured
let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  if (!isValidUrl(supabaseUrl)) {
    console.error('❌ Invalid VITE_SUPABASE_URL. Must be a valid Supabase URL.');
  } else if (!isValidAnonKey(supabaseAnonKey)) {
    console.error('❌ Invalid VITE_SUPABASE_ANON_KEY. Ensure you are using the anon key, NOT the service key!');
  } else {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: 'tryit-auth',
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
}

export { supabase };

// Check if Supabase is available
export const isSupabaseConfigured = (): boolean => {
  return supabase !== null;
};

// ================== AUTH API CLIENT ==================
// Use backend API for authentication instead of direct Supabase calls
// This ensures all auth logic goes through our secure backend

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface ApiError {
  error: string;
  errorEn?: string;
  code?: string;
}

// Token storage (in memory + localStorage for persistence)
let accessToken: string | null = null;
let refreshToken: string | null = null;
let tokenExpiresAt: number = 0;

const TOKEN_STORAGE_KEY = 'ai_assistant_tokens';

// Load tokens from storage on init
const loadTokens = () => {
  try {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) {
      const { access, refresh, expiresAt } = JSON.parse(stored);
      accessToken = access;
      refreshToken = refresh;
      tokenExpiresAt = expiresAt;
    }
  } catch {
    // Ignore storage errors
  }
};

const saveTokens = (access: string, refresh: string, expiresIn: number) => {
  accessToken = access;
  refreshToken = refresh;
  tokenExpiresAt = Date.now() + (expiresIn * 1000);
  
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({
      access,
      refresh,
      expiresAt: tokenExpiresAt,
    }));
  } catch {
    // Continue without persistence if storage fails
  }
};

const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  tokenExpiresAt = 0;
  
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Ignore
  }
};

// Initialize tokens
loadTokens();

// Get valid access token (auto-refresh if needed)
export const getAccessToken = async (): Promise<string | null> => {
  // If token is expired or expiring soon (within 1 minute), refresh
  if (accessToken && tokenExpiresAt > Date.now() + 60000) {
    return accessToken;
  }
  
  // Try to refresh
  if (refreshToken) {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      
      if (response.ok) {
        const data: AuthResponse = await response.json();
        saveTokens(data.accessToken, data.refreshToken, data.expiresIn);
        return data.accessToken;
      }
    } catch {
      // Refresh failed
    }
    
    // Refresh failed - clear tokens
    clearTokens();
  }
  
  return null;
};

// ================== AUTH FUNCTIONS ==================

export const signUp = async (
  email: string, 
  password: string, 
  name?: string
): Promise<{ data: AuthResponse | null; error: ApiError | null }> => {
  try {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { data: null, error: data };
    }
    
    saveTokens(data.accessToken, data.refreshToken, data.expiresIn);
    return { data, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: { error: 'Network error', code: 'NETWORK_ERROR' } 
    };
  }
};

export const signIn = async (
  email: string, 
  password: string
): Promise<{ data: AuthResponse | null; error: ApiError | null }> => {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { data: null, error: data };
    }
    
    saveTokens(data.accessToken, data.refreshToken, data.expiresIn);
    return { data, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: { error: 'Network error', code: 'NETWORK_ERROR' } 
    };
  }
};

export const signOut = async (): Promise<void> => {
  try {
    const token = await getAccessToken();
    if (token) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
    }
  } catch {
    // Continue with local logout even if server call fails
  }
  
  clearTokens();
};

export const getCurrentUser = async (): Promise<AuthResponse['user'] | null> => {
  try {
    const token = await getAccessToken();
    if (!token) return null;
    
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        clearTokens();
      }
      return null;
    }
    
    const data = await response.json();
    return data.user;
  } catch {
    return null;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getAccessToken();
  return token !== null;
};

// Authenticated fetch helper
export const authFetch = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const token = await getAccessToken();
  
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
};
