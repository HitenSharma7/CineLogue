
export type ThemeColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentText: string;
  accentSoft: string;
  accentGradient: [string, string];
  rating: string;
  success: string;
  danger: string;
  overlay: string;
  tabBar: string;
  heroGradient: [string, string];
};

export type AppTheme<TId extends string = string> = {
  id: TId;
  label: string;
  isDark: boolean;
  colors: ThemeColors;
};
