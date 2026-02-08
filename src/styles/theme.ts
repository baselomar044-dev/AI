// ============================================
// 🎨 TRY-IT! MODERN THEME SYSTEM
// Rich, Professional, Beautiful
// ============================================

export interface Theme {
  id: string;
  name: string;
  nameAr: string;
  colors: ThemeColors;
  gradients: ThemeGradients;
  shadows: ThemeShadows;
  fonts: ThemeFonts;
  borderRadius: ThemeBorderRadius;
  animation: ThemeAnimation;
}

interface ThemeColors {
  // Primary brand
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryGlow: string;
  
  // Secondary accent
  secondary: string;
  secondaryLight: string;
  
  // Background layers
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgElevated: string;
  bgGlass: string;
  
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  
  // Status
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Borders
  border: string;
  borderLight: string;
  borderFocus: string;
  
  // Special
  aiMessage: string;
  userMessage: string;
  codeBlock: string;
  highlight: string;
}

interface ThemeGradients {
  primary: string;
  secondary: string;
  hero: string;
  card: string;
  button: string;
  glow: string;
}

interface ThemeShadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  glow: string;
  inner: string;
}

interface ThemeFonts {
  primary: string;
  arabic: string;
  mono: string;
  display: string;
}

interface ThemeBorderRadius {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

interface ThemeAnimation {
  fast: string;
  normal: string;
  slow: string;
  bounce: string;
}

// ================== THEMES ==================

export const THEMES: Record<string, Theme> = {
  // ===== DARK BLUE (Default) =====
  darkBlue: {
    id: 'darkBlue',
    name: 'Midnight Ocean',
    nameAr: 'المحيط الليلي',
    colors: {
      primary: '#3B82F6',
      primaryLight: '#60A5FA',
      primaryDark: '#1D4ED8',
      primaryGlow: 'rgba(59, 130, 246, 0.5)',
      
      secondary: '#8B5CF6',
      secondaryLight: '#A78BFA',
      
      bgPrimary: '#0F172A',
      bgSecondary: '#1E293B',
      bgTertiary: '#334155',
      bgElevated: '#1E3A5F',
      bgGlass: 'rgba(30, 41, 59, 0.8)',
      
      textPrimary: '#F8FAFC',
      textSecondary: '#CBD5E1',
      textMuted: '#64748B',
      textOnPrimary: '#FFFFFF',
      
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#06B6D4',
      
      border: '#334155',
      borderLight: '#475569',
      borderFocus: '#3B82F6',
      
      aiMessage: '#1E3A5F',
      userMessage: '#3B82F6',
      codeBlock: '#0D1117',
      highlight: 'rgba(59, 130, 246, 0.2)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
      secondary: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
      hero: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0F172A 100%)',
      card: 'linear-gradient(145deg, rgba(30, 58, 95, 0.5) 0%, rgba(15, 23, 42, 0.8) 100%)',
      button: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
      glow: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
    },
    shadows: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
      md: '0 4px 6px rgba(0, 0, 0, 0.4)',
      lg: '0 10px 15px rgba(0, 0, 0, 0.5)',
      xl: '0 20px 25px rgba(0, 0, 0, 0.6)',
      glow: '0 0 20px rgba(59, 130, 246, 0.4)',
      inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
    },
    fonts: {
      primary: '"Inter", "Segoe UI", sans-serif',
      arabic: '"Tajawal", "Cairo", sans-serif',
      mono: '"JetBrains Mono", "Fira Code", monospace',
      display: '"Poppins", "Inter", sans-serif',
    },
    borderRadius: {
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      full: '9999px',
    },
    animation: {
      fast: '150ms ease',
      normal: '300ms ease',
      slow: '500ms ease',
      bounce: '500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },

  // ===== LIGHT BLUE =====
  lightBlue: {
    id: 'lightBlue',
    name: 'Crystal Clear',
    nameAr: 'كريستال صافي',
    colors: {
      primary: '#0EA5E9',
      primaryLight: '#38BDF8',
      primaryDark: '#0284C7',
      primaryGlow: 'rgba(14, 165, 233, 0.3)',
      
      secondary: '#6366F1',
      secondaryLight: '#818CF8',
      
      bgPrimary: '#F8FAFC',
      bgSecondary: '#FFFFFF',
      bgTertiary: '#F1F5F9',
      bgElevated: '#FFFFFF',
      bgGlass: 'rgba(255, 255, 255, 0.9)',
      
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#94A3B8',
      textOnPrimary: '#FFFFFF',
      
      success: '#059669',
      warning: '#D97706',
      error: '#DC2626',
      info: '#0891B2',
      
      border: '#E2E8F0',
      borderLight: '#F1F5F9',
      borderFocus: '#0EA5E9',
      
      aiMessage: '#F0F9FF',
      userMessage: '#0EA5E9',
      codeBlock: '#1E293B',
      highlight: 'rgba(14, 165, 233, 0.1)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)',
      secondary: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
      hero: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 50%, #F0F9FF 100%)',
      card: 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)',
      button: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
      glow: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%)',
    },
    shadows: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px rgba(0, 0, 0, 0.07)',
      lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px rgba(0, 0, 0, 0.12)',
      glow: '0 0 20px rgba(14, 165, 233, 0.2)',
      inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
    },
    fonts: {
      primary: '"Inter", "Segoe UI", sans-serif',
      arabic: '"Tajawal", "Cairo", sans-serif',
      mono: '"JetBrains Mono", "Fira Code", monospace',
      display: '"Poppins", "Inter", sans-serif',
    },
    borderRadius: {
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      full: '9999px',
    },
    animation: {
      fast: '150ms ease',
      normal: '300ms ease',
      slow: '500ms ease',
      bounce: '500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },

  // ===== PINK =====
  pink: {
    id: 'pink',
    name: 'Rose Garden',
    nameAr: 'حديقة الورد',
    colors: {
      primary: '#EC4899',
      primaryLight: '#F472B6',
      primaryDark: '#DB2777',
      primaryGlow: 'rgba(236, 72, 153, 0.5)',
      
      secondary: '#A855F7',
      secondaryLight: '#C084FC',
      
      bgPrimary: '#1F1226',
      bgSecondary: '#2D1B35',
      bgTertiary: '#3D2847',
      bgElevated: '#4A2D58',
      bgGlass: 'rgba(45, 27, 53, 0.8)',
      
      textPrimary: '#FDF2F8',
      textSecondary: '#F9A8D4',
      textMuted: '#9D7BA3',
      textOnPrimary: '#FFFFFF',
      
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
      info: '#67E8F9',
      
      border: '#4A2D58',
      borderLight: '#5C3A6A',
      borderFocus: '#EC4899',
      
      aiMessage: '#3D2847',
      userMessage: '#EC4899',
      codeBlock: '#1A0F1F',
      highlight: 'rgba(236, 72, 153, 0.2)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #EC4899 0%, #A855F7 100%)',
      secondary: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)',
      hero: 'linear-gradient(135deg, #1F1226 0%, #3D2847 50%, #1F1226 100%)',
      card: 'linear-gradient(145deg, rgba(74, 45, 88, 0.5) 0%, rgba(31, 18, 38, 0.8) 100%)',
      button: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
      glow: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)',
    },
    shadows: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
      md: '0 4px 6px rgba(0, 0, 0, 0.4)',
      lg: '0 10px 15px rgba(0, 0, 0, 0.5)',
      xl: '0 20px 25px rgba(0, 0, 0, 0.6)',
      glow: '0 0 20px rgba(236, 72, 153, 0.4)',
      inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
    },
    fonts: {
      primary: '"Inter", "Segoe UI", sans-serif',
      arabic: '"Tajawal", "Cairo", sans-serif',
      mono: '"JetBrains Mono", "Fira Code", monospace',
      display: '"Poppins", "Inter", sans-serif',
    },
    borderRadius: {
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      full: '9999px',
    },
    animation: {
      fast: '150ms ease',
      normal: '300ms ease',
      slow: '500ms ease',
      bounce: '500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },

  // ===== EMERALD (Bonus) =====
  emerald: {
    id: 'emerald',
    name: 'Emerald Night',
    nameAr: 'ليل زمردي',
    colors: {
      primary: '#10B981',
      primaryLight: '#34D399',
      primaryDark: '#059669',
      primaryGlow: 'rgba(16, 185, 129, 0.5)',
      
      secondary: '#06B6D4',
      secondaryLight: '#22D3EE',
      
      bgPrimary: '#0D1F17',
      bgSecondary: '#132A21',
      bgTertiary: '#1A382C',
      bgElevated: '#1F4233',
      bgGlass: 'rgba(19, 42, 33, 0.8)',
      
      textPrimary: '#ECFDF5',
      textSecondary: '#A7F3D0',
      textMuted: '#6EE7B7',
      textOnPrimary: '#FFFFFF',
      
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
      info: '#67E8F9',
      
      border: '#1F4233',
      borderLight: '#2D5A45',
      borderFocus: '#10B981',
      
      aiMessage: '#1A382C',
      userMessage: '#10B981',
      codeBlock: '#0A1610',
      highlight: 'rgba(16, 185, 129, 0.2)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
      secondary: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
      hero: 'linear-gradient(135deg, #0D1F17 0%, #1A382C 50%, #0D1F17 100%)',
      card: 'linear-gradient(145deg, rgba(31, 66, 51, 0.5) 0%, rgba(13, 31, 23, 0.8) 100%)',
      button: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      glow: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)',
    },
    shadows: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
      md: '0 4px 6px rgba(0, 0, 0, 0.4)',
      lg: '0 10px 15px rgba(0, 0, 0, 0.5)',
      xl: '0 20px 25px rgba(0, 0, 0, 0.6)',
      glow: '0 0 20px rgba(16, 185, 129, 0.4)',
      inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
    },
    fonts: {
      primary: '"Inter", "Segoe UI", sans-serif',
      arabic: '"Tajawal", "Cairo", sans-serif',
      mono: '"JetBrains Mono", "Fira Code", monospace',
      display: '"Poppins", "Inter", sans-serif',
    },
    borderRadius: {
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      full: '9999px',
    },
    animation: {
      fast: '150ms ease',
      normal: '300ms ease',
      slow: '500ms ease',
      bounce: '500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
};

// ================== CSS GENERATOR ==================

export function generateThemeCSS(theme: Theme): string {
  return `
:root {
  /* Colors */
  --color-primary: ${theme.colors.primary};
  --color-primary-light: ${theme.colors.primaryLight};
  --color-primary-dark: ${theme.colors.primaryDark};
  --color-primary-glow: ${theme.colors.primaryGlow};
  --color-secondary: ${theme.colors.secondary};
  --color-secondary-light: ${theme.colors.secondaryLight};
  
  --color-bg-primary: ${theme.colors.bgPrimary};
  --color-bg-secondary: ${theme.colors.bgSecondary};
  --color-bg-tertiary: ${theme.colors.bgTertiary};
  --color-bg-elevated: ${theme.colors.bgElevated};
  --color-bg-glass: ${theme.colors.bgGlass};
  
  --color-text-primary: ${theme.colors.textPrimary};
  --color-text-secondary: ${theme.colors.textSecondary};
  --color-text-muted: ${theme.colors.textMuted};
  --color-text-on-primary: ${theme.colors.textOnPrimary};
  
  --color-success: ${theme.colors.success};
  --color-warning: ${theme.colors.warning};
  --color-error: ${theme.colors.error};
  --color-info: ${theme.colors.info};
  
  --color-border: ${theme.colors.border};
  --color-border-light: ${theme.colors.borderLight};
  --color-border-focus: ${theme.colors.borderFocus};
  
  --color-ai-message: ${theme.colors.aiMessage};
  --color-user-message: ${theme.colors.userMessage};
  --color-code-block: ${theme.colors.codeBlock};
  --color-highlight: ${theme.colors.highlight};
  
  /* Gradients */
  --gradient-primary: ${theme.gradients.primary};
  --gradient-secondary: ${theme.gradients.secondary};
  --gradient-hero: ${theme.gradients.hero};
  --gradient-card: ${theme.gradients.card};
  --gradient-button: ${theme.gradients.button};
  --gradient-glow: ${theme.gradients.glow};
  
  /* Shadows */
  --shadow-sm: ${theme.shadows.sm};
  --shadow-md: ${theme.shadows.md};
  --shadow-lg: ${theme.shadows.lg};
  --shadow-xl: ${theme.shadows.xl};
  --shadow-glow: ${theme.shadows.glow};
  --shadow-inner: ${theme.shadows.inner};
  
  /* Fonts */
  --font-primary: ${theme.fonts.primary};
  --font-arabic: ${theme.fonts.arabic};
  --font-mono: ${theme.fonts.mono};
  --font-display: ${theme.fonts.display};
  
  /* Border Radius */
  --radius-sm: ${theme.borderRadius.sm};
  --radius-md: ${theme.borderRadius.md};
  --radius-lg: ${theme.borderRadius.lg};
  --radius-xl: ${theme.borderRadius.xl};
  --radius-full: ${theme.borderRadius.full};
  
  /* Animation */
  --animation-fast: ${theme.animation.fast};
  --animation-normal: ${theme.animation.normal};
  --animation-slow: ${theme.animation.slow};
  --animation-bounce: ${theme.animation.bounce};
}
`;
}

// ================== THEME UTILS ==================

export function getThemeList(): { id: string; name: string; nameAr: string }[] {
  return Object.values(THEMES).map(t => ({
    id: t.id,
    name: t.name,
    nameAr: t.nameAr,
  }));
}

export function getTheme(id: string): Theme {
  return THEMES[id] || THEMES.darkBlue;
}

export function applyTheme(themeId: string): void {
  const theme = getTheme(themeId);
  const css = generateThemeCSS(theme);
  
  let styleEl = document.getElementById('try-it-theme');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'try-it-theme';
    document.head.appendChild(styleEl);
  }
  
  styleEl.textContent = css;
  document.body.setAttribute('data-theme', themeId);
}
