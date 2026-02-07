// ============================================
// THEMES - Consistent Across ALL Pages
// ============================================

export type ThemeType = 'light' | 'pink' | 'gemini';

export interface ThemeColors {
  bg: string;
  bgSecondary: string;
  bgTertiary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  accentBg: string;
  border: string;
  card: string;
  cardHover: string;
  input: string;
  inputBorder: string;
  sidebar: string;
  sidebarHover: string;
  sidebarActive: string;
  userMsg: string;
  aiMsg: string;
  gradient: string;
  primary: string;
  success: string;
  error: string;
  warning: string;
}

// ============================================
// LIGHT THEME
// ============================================
const lightTheme: ThemeColors = {
  bg: 'bg-slate-50',
  bgSecondary: 'bg-white',
  bgTertiary: 'bg-slate-100',
  text: 'text-slate-900',
  textSecondary: 'text-slate-600',
  textMuted: 'text-slate-400',
  accent: 'text-blue-600',
  accentHover: 'text-blue-700',
  accentBg: 'bg-blue-50',
  border: 'border-slate-200',
  card: 'bg-white',
  cardHover: 'hover:bg-slate-50',
  input: 'bg-white',
  inputBorder: 'border-slate-300',
  sidebar: 'bg-white',
  sidebarHover: 'hover:bg-slate-100',
  sidebarActive: 'bg-blue-50 text-blue-600 border-blue-200',
  userMsg: 'bg-blue-100',
  aiMsg: 'bg-slate-100',
  gradient: 'bg-gradient-to-r from-blue-600 to-blue-500',
  primary: 'bg-blue-600',
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-amber-600',
};

// ============================================
// PINK THEME
// ============================================
const pinkTheme: ThemeColors = {
  bg: 'bg-pink-50',
  bgSecondary: 'bg-white',
  bgTertiary: 'bg-pink-100',
  text: 'text-pink-900',
  textSecondary: 'text-pink-700',
  textMuted: 'text-pink-400',
  accent: 'text-pink-600',
  accentHover: 'text-pink-700',
  accentBg: 'bg-pink-100',
  border: 'border-pink-200',
  card: 'bg-white',
  cardHover: 'hover:bg-pink-50',
  input: 'bg-white',
  inputBorder: 'border-pink-300',
  sidebar: 'bg-pink-50',
  sidebarHover: 'hover:bg-pink-100',
  sidebarActive: 'bg-pink-200 text-pink-700 border-pink-300',
  userMsg: 'bg-pink-200',
  aiMsg: 'bg-pink-100',
  gradient: 'bg-gradient-to-r from-pink-500 to-pink-400',
  primary: 'bg-pink-500',
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-amber-600',
};

// ============================================
// GEMINI STUDIO THEME (Deep Space)
// ============================================
const geminiTheme: ThemeColors = {
  bg: 'bg-[#050505]', // Deep black/blue
  bgSecondary: 'bg-[#0a0a0a]',
  bgTertiary: 'bg-[#111111]',
  text: 'text-white', // Changed from gray-200 to white
  textSecondary: 'text-gray-400', // Better contrast
  textMuted: 'text-gray-600',
  accent: 'text-blue-500',
  accentHover: 'text-blue-400',
  accentBg: 'bg-blue-900/20',
  border: 'border-gray-800', // Standard grey border
  card: 'bg-[#0a0a0a]',
  cardHover: 'hover:bg-[#111111]',
  input: 'bg-[#0a0a0a]',
  inputBorder: 'border-gray-800',
  sidebar: 'bg-[#050505]',
  sidebarHover: 'hover:bg-[#111111]',
  sidebarActive: 'bg-[#001d3d] text-blue-400 border border-blue-900/30', // Updated to match sidebar component
  userMsg: 'bg-[#1f1f1f]',
  aiMsg: 'bg-[#0a0a0a]',
  gradient: 'bg-gradient-to-r from-blue-700 to-blue-600',
  primary: 'bg-blue-600',
  success: 'text-blue-400', // Changed from green to blue
  error: 'text-gray-400', // Changed from red to grey (with maybe an icon distinction)
  warning: 'text-gray-400', // Changed from amber to grey
};

// ============================================
// THEME MAP & EXPORTS
// ============================================
export const themes: Record<ThemeType, ThemeColors> = {
  'light': lightTheme,
  'pink': pinkTheme,
  'gemini': geminiTheme,
};

export const themeNames: Record<ThemeType, { en: string; ar: string }> = {
  'light': { en: 'Light', ar: 'فاتح' },
  'pink': { en: 'Pink', ar: 'وردي' },
  'gemini': { en: 'Gemini Studio', ar: 'ستوديو جيمناي' },
};

// Get theme colors
export function getTheme(name: string): ThemeColors {
  return themes[name as ThemeType] || geminiTheme;
}

// Hook for components - THIS IS WHAT SETTINGSPAGE IMPORTS
export function useTheme(themeName: string): { colors: ThemeColors } {
  return { colors: getTheme(themeName) };
}

// Check if dark theme
export function isDarkTheme(name: string): boolean {
  return name === 'gemini' || name === 'dark';
}

// Alias for compatibility
export const useThemeColors = getTheme;
