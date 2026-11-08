
import type { AppTheme } from '@/type/theme';

// ---------------------------------------------------------------------------
// HOW TO ADD A THEME:
// Add one defineTheme({...}) entry to THEME_DEFINITIONS.
//
// HOW TO REMOVE A THEME:
// Delete its entry. Update DEFAULT_* if required.
//
// ThemeId, THEMES, THEME_LIST and THEME_ORDER
// are automatically derived from this array.
// ---------------------------------------------------------------------------

const defineTheme = <T extends AppTheme>(theme: T) => theme;

const THEME_DEFINITIONS = [
  // 1. MIDNIGHT
  defineTheme({
    id: 'midnight',
    label: 'Midnight',
    isDark: true,
    colors: {
      background: '#0A0B14',
      surface: '#12141F',
      surfaceElevated: '#1B1E2E',
      border: '#262A3F',
      text: '#F4F5FA',
      textMuted: '#8A90A8',
      accent: '#7C5CFF',
      accentText: '#FFFFFF',
      accentSoft: 'rgba(124,92,255,0.16)',
      accentGradient: ['#8F6BFF', '#5B3DF5'],
      rating: '#FFC857',
      success: '#3DD9A0',
      danger: '#FF5C7A',
      overlay: 'rgba(5,6,12,0.72)',
      tabBar: '#0E1019',
      heroGradient: ['#2A1F5C', '#0A0B14'],
    },
  }),

  // 2. AMOLED
  defineTheme({
    id: 'amoled',
    label: 'AMOLED',
    isDark: true,
    colors: {
      background: '#000000',
      surface: '#0D0D0D',
      surfaceElevated: '#171717',
      border: '#232323',
      text: '#FFFFFF',
      textMuted: '#8C8C8C',
      accent: '#00E5FF',
      accentText: '#00131A',
      accentSoft: 'rgba(0,229,255,0.14)',
      accentGradient: ['#4DF0FF', '#00B8D4'],
      rating: '#FFD54A',
      success: '#2EE59D',
      danger: '#FF4D4D',
      overlay: 'rgba(0,0,0,0.82)',
      tabBar: '#000000',
      heroGradient: ['#0B2A33', '#000000'],
    },
  }),

  // 3. NOIR GOLD
  defineTheme({
    id: 'gold',
    label: 'Noir Gold',
    isDark: true,
    colors: {
      background: '#0C0A07',
      surface: '#15120D',
      surfaceElevated: '#1F1A12',
      border: '#33291A',
      text: '#F7F1E3',
      textMuted: '#A39878',
      accent: '#E6C36A',
      accentText: '#1A1405',
      accentSoft: 'rgba(230,195,106,0.15)',
      accentGradient: ['#F3D98B', '#C9A227'],
      rating: '#F3D98B',
      success: '#7FD6A4',
      danger: '#F26D5B',
      overlay: 'rgba(8,6,3,0.78)',
      tabBar: '#100D09',
      heroGradient: ['#3A2C0E', '#0C0A07'],
    },
  }),

  // 4. AURORA
  defineTheme({
    id: 'aurora',
    label: 'Aurora',
    isDark: true,
    colors: {
      background: '#060F14',
      surface: '#0C1A21',
      surfaceElevated: '#13262F',
      border: '#1E3A46',
      text: '#EAF7F5',
      textMuted: '#7FA3A8',
      accent: '#2DE2B1',
      accentText: '#04201A',
      accentSoft: 'rgba(45,226,177,0.15)',
      accentGradient: ['#5CF0C8', '#7C5CFF'],
      rating: '#FFD166',
      success: '#2DE2B1',
      danger: '#FF6B8A',
      overlay: 'rgba(3,10,14,0.76)',
      tabBar: '#08141A',
      heroGradient: ['#0E4C5A', '#060F14'],
    },
  }),

  // 5. CRIMSON
  defineTheme({
    id: 'crimson',
    label: 'Crimson',
    isDark: true,
    colors: {
      background: '#0E0709',
      surface: '#170D10',
      surfaceElevated: '#221217',
      border: '#3A1E26',
      text: '#FBEFF1',
      textMuted: '#A8858C',
      accent: '#FF3B5C',
      accentText: '#FFFFFF',
      accentSoft: 'rgba(255,59,92,0.16)',
      accentGradient: ['#FF5C7A', '#D81B45'],
      rating: '#FFC857',
      success: '#4FD6A0',
      danger: '#FF8A5C',
      overlay: 'rgba(10,4,6,0.78)',
      tabBar: '#120A0C',
      heroGradient: ['#4A0F1E', '#0E0709'],
    },
  }),

  // 6. IVORY
  defineTheme({
    id: 'light',
    label: 'Ivory',
    isDark: false,
    colors: {
      background: '#F7F5F2',
      surface: '#FFFFFF',
      surfaceElevated: '#FFFFFF',
      border: '#E7E2DB',
      text: '#14121A',
      textMuted: '#6F6A77',
      accent: '#5B3DF5',
      accentText: '#FFFFFF',
      accentSoft: 'rgba(91,61,245,0.10)',
      accentGradient: ['#7C5CFF', '#5B3DF5'],
      rating: '#E8A400',
      success: '#14A870',
      danger: '#E5384F',
      overlay: 'rgba(20,18,26,0.45)',
      tabBar: '#FFFFFF',
      heroGradient: ['#E9E2FF', '#F7F5F2'],
    },
  }),
] as const;

// ---------------------------------------------------------------------------
// DERIVED EXPORTS
// ---------------------------------------------------------------------------

export type ThemeId = (typeof THEME_DEFINITIONS)[number]['id'];

export type ThemePreference = ThemeId | 'system';

// Theme lookup by ID.
export const THEMES = Object.fromEntries(
  THEME_DEFINITIONS.map((theme) => [theme.id, theme]),
) as Record<ThemeId, AppTheme<ThemeId>>;

// Ordered theme list for the theme picker.
export const THEME_LIST: AppTheme<ThemeId>[] = [
  ...THEME_DEFINITIONS,
];

// Backward-compatible ordered IDs.
// Used by SettingsScreen and other existing components.
export const THEME_ORDER: ThemeId[] = THEME_DEFINITIONS.map(
  (theme) => theme.id,
);

// Default themes.
export const DEFAULT_DARK_THEME: ThemeId = 'midnight';

export const DEFAULT_LIGHT_THEME: ThemeId = 'light';
