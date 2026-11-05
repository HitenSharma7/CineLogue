export type ThemeId =
  | 'midnight'
  | 'amoled'
  | 'gold'
  | 'aurora'
  | 'light';

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentText: string; // text drawn on top of accent
  success: string;
  danger: string;
  overlay: string;
  tabBar: string;
  /** Hero / atmospheric gradient stops, top to bottom. */
  heroGradient: [string, string];
};

export type AppTheme = {
  id: ThemeId;
  label: string;
  isDark: boolean;
  colors: ThemeColors;
};

export type ThemePreference = ThemeId | 'system';
