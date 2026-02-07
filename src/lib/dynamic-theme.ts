// ============================================
// 🎨 DYNAMIC THEME SYSTEM
// Real-time theme updates from Admin Agent
// ============================================

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

interface LayoutConfig {
  sidebarPosition: 'left' | 'right' | 'hidden';
  sidebarWidth: string;
  headerHeight: string;
  chatBubbleStyle: 'rounded' | 'square' | 'bubble';
  messageAlignment: 'left' | 'alternate';
  compactMode: boolean;
  showTimestamps: boolean;
  showAvatars: boolean;
  animationsEnabled: boolean;
}

interface DynamicTheme {
  name: string;
  colors: ThemeColors;
  fonts: {
    primary: string;
    secondary: string;
    mono: string;
  };
  borderRadius: string;
  spacing: string;
}

// Default theme (matches admin-agent defaults)
const DEFAULT_THEME: DynamicTheme = {
  name: 'Default Dark',
  colors: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#f59e0b',
    background: '#0f0f23',
    surface: '#1a1a2e',
    text: '#ffffff',
    textSecondary: '#a0a0a0',
    border: '#2a2a4a',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  fonts: {
    primary: 'Inter, system-ui, sans-serif',
    secondary: 'Plus Jakarta Sans, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  borderRadius: '12px',
  spacing: '1rem',
};

const DEFAULT_LAYOUT: LayoutConfig = {
  sidebarPosition: 'left',
  sidebarWidth: '280px',
  headerHeight: '60px',
  chatBubbleStyle: 'rounded',
  messageAlignment: 'alternate',
  compactMode: false,
  showTimestamps: true,
  showAvatars: true,
  animationsEnabled: true,
};

// Current state
let currentTheme: DynamicTheme = { ...DEFAULT_THEME };
let currentLayout: LayoutConfig = { ...DEFAULT_LAYOUT };
let listeners: Array<() => void> = [];

// Load from localStorage on init
export function initDynamicTheme(): void {
  try {
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme) {
      currentTheme = JSON.parse(savedTheme);
      applyThemeToDOM(currentTheme);
    }
    
    const savedLayout = localStorage.getItem('app-layout');
    if (savedLayout) {
      currentLayout = JSON.parse(savedLayout);
      applyLayoutToDOM(currentLayout);
    }
    
    // Fetch latest from server if authenticated
    fetchLatestConfig();
  } catch (error) {
    console.error('Failed to initialize theme:', error);
    applyThemeToDOM(DEFAULT_THEME);
  }
}

// Fetch latest config from server
async function fetchLatestConfig(): Promise<void> {
  // Admin config fetch completely removed
  return;
}

// Apply theme to DOM
function applyThemeToDOM(theme: DynamicTheme): void {
  const root = document.documentElement;
  
  // Apply colors
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
  
  // Apply fonts
  root.style.setProperty('--font-primary', theme.fonts.primary);
  root.style.setProperty('--font-secondary', theme.fonts.secondary);
  root.style.setProperty('--font-mono', theme.fonts.mono);
  
  // Apply other properties
  root.style.setProperty('--border-radius', theme.borderRadius);
  root.style.setProperty('--spacing', theme.spacing);
  
  // Set body styles
  document.body.style.backgroundColor = theme.colors.background;
  document.body.style.color = theme.colors.text;
  document.body.style.fontFamily = theme.fonts.primary;
  
  // Update meta theme-color
  let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = theme.colors.background;
}

// Apply layout to DOM
function applyLayoutToDOM(layout: LayoutConfig): void {
  const root = document.documentElement;
  
  root.style.setProperty('--sidebar-position', layout.sidebarPosition);
  root.style.setProperty('--sidebar-width', layout.sidebarWidth);
  root.style.setProperty('--header-height', layout.headerHeight);
  root.style.setProperty('--chat-bubble-style', layout.chatBubbleStyle);
  
  // Toggle classes on body
  document.body.classList.toggle('compact-mode', layout.compactMode);
  document.body.classList.toggle('no-animations', !layout.animationsEnabled);
  document.body.classList.toggle('hide-timestamps', !layout.showTimestamps);
  document.body.classList.toggle('hide-avatars', !layout.showAvatars);
  document.body.classList.toggle('sidebar-right', layout.sidebarPosition === 'right');
  document.body.classList.toggle('sidebar-hidden', layout.sidebarPosition === 'hidden');
}

// Set theme
export function setTheme(theme: Partial<DynamicTheme>): void {
  currentTheme = {
    ...currentTheme,
    ...theme,
    colors: { ...currentTheme.colors, ...theme.colors },
    fonts: { ...currentTheme.fonts, ...theme.fonts },
  };
  
  localStorage.setItem('app-theme', JSON.stringify(currentTheme));
  applyThemeToDOM(currentTheme);
  notifyListeners();
}

// Set layout
export function setLayout(layout: Partial<LayoutConfig>): void {
  currentLayout = { ...currentLayout, ...layout };
  
  localStorage.setItem('app-layout', JSON.stringify(currentLayout));
  applyLayoutToDOM(currentLayout);
  notifyListeners();
}

// Get current theme
export function getTheme(): DynamicTheme {
  return { ...currentTheme };
}

// Get current layout
export function getLayout(): LayoutConfig {
  return { ...currentLayout };
}

// Quick color update
export function setColor(colorName: keyof ThemeColors, value: string): void {
  currentTheme.colors[colorName] = value;
  localStorage.setItem('app-theme', JSON.stringify(currentTheme));
  
  const root = document.documentElement;
  root.style.setProperty(`--color-${colorName}`, value);
  
  // Update body if it's background or text
  if (colorName === 'background') {
    document.body.style.backgroundColor = value;
    const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (meta) meta.content = value;
  } else if (colorName === 'text') {
    document.body.style.color = value;
  }
  
  notifyListeners();
}

// Subscribe to changes
export function subscribe(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

// Notify listeners
function notifyListeners(): void {
  listeners.forEach(listener => listener());
}

// Reset to defaults
export function resetTheme(): void {
  setTheme(DEFAULT_THEME);
}

export function resetLayout(): void {
  setLayout(DEFAULT_LAYOUT);
}

// Check if dark theme
export function isDark(): boolean {
  const bgColor = currentTheme.colors.background;
  // Simple luminance check
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

// CSS variables string for use in styled-components or inline styles
export function getCSSVariables(): string {
  return `
    --color-primary: ${currentTheme.colors.primary};
    --color-secondary: ${currentTheme.colors.secondary};
    --color-accent: ${currentTheme.colors.accent};
    --color-background: ${currentTheme.colors.background};
    --color-surface: ${currentTheme.colors.surface};
    --color-text: ${currentTheme.colors.text};
    --color-textSecondary: ${currentTheme.colors.textSecondary};
    --color-border: ${currentTheme.colors.border};
    --color-success: ${currentTheme.colors.success};
    --color-warning: ${currentTheme.colors.warning};
    --color-error: ${currentTheme.colors.error};
    --color-info: ${currentTheme.colors.info};
    --font-primary: ${currentTheme.fonts.primary};
    --font-secondary: ${currentTheme.fonts.secondary};
    --font-mono: ${currentTheme.fonts.mono};
    --border-radius: ${currentTheme.borderRadius};
    --spacing: ${currentTheme.spacing};
    --sidebar-width: ${currentLayout.sidebarWidth};
    --header-height: ${currentLayout.headerHeight};
  `;
}

// Export types
export type { DynamicTheme, LayoutConfig, ThemeColors };
