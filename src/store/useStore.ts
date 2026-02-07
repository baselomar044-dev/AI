// ============================================
// Global State Store (Zustand)
// ============================================

import { create } from 'zustand';

export interface User {
  id?: string;
  email?: string;
  name?: string;
  avatar?: string;
}

interface StoreState {
  // Auth state
  user: User | null;
  isLoading: boolean;
  token: string | null;

  // Theme and UI
  theme: 'dark' | 'light' | 'pink' | 'blue' | 'green';
  language: 'en' | 'ar';
  sidebarOpen: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setTheme: (theme: 'dark' | 'light' | 'pink' | 'blue' | 'green') => void;
  setLanguage: (language: 'en' | 'ar') => void;
  setSidebarOpen: (open: boolean) => void;
  initialize: () => Promise<void>;
  logout: () => void;
}

export const useStore = create<StoreState>((set) => ({
  // Initial state
  user: null,
  isLoading: true,
  token: null,
  theme: 'dark',
  language: 'en',
  sidebarOpen: true,

  // Actions
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setTheme: (theme) => {
    set({ theme });
    localStorage.setItem('theme', theme);
  },
  setLanguage: (language) => {
    set({ language });
    localStorage.setItem('language', language);
  },
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Initialize app state from localStorage and auth
  initialize: async () => {
    try {
      // Load persisted preferences
      const savedTheme = (localStorage.getItem('theme') || 'dark') as any;
      const savedLanguage = (localStorage.getItem('language') || 'en') as any;
      const savedToken = localStorage.getItem('token');

      set({ theme: savedTheme, language: savedLanguage, token: savedToken });

      // Try to restore user session if token exists
      if (savedToken) {
        try {
          // Call your auth API endpoint to validate token
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${savedToken}`,
            },
          });

          if (response.ok) {
            const user = await response.json();
            set({ user, isLoading: false });
          } else {
            // Token invalid, clear it
            localStorage.removeItem('token');
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Failed to restore session:', error);
          set({ isLoading: false });
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Initialization error:', error);
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },
}));
