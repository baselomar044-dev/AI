// ============================================
// 🎨 THEME PROVIDER - Apply theme to entire app
// ============================================

import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { getTheme } from '../lib/themes';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const theme = useStore((state) => state.theme);

  useEffect(() => {
    const themeData = getTheme(theme);
    const root = document.documentElement;
    
    // Apply all theme colors as CSS variables
    Object.entries(themeData.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    // Also set body background
    document.body.style.backgroundColor = themeData.colors.bg;
    document.body.style.color = themeData.colors.text;
    
    console.log('🎨 Theme applied:', theme);
  }, [theme]);

  return <>{children}</>;
};

export default ThemeProvider;
