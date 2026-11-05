import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { storage } from '@/helpers/storage';
import { DEFAULT_DARK_THEME, DEFAULT_LIGHT_THEME, THEMES } from '@/constants/themes';
import type { AppTheme, ThemeId, ThemePreference } from '@/type/theme';

const STORAGE_KEY = 'cinelogue.theme';

type ThemeContextValue = {
  theme: AppTheme;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemeId(v: string | null): v is ThemeId {
  return v !== null && v in THEMES;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [preference, setPref] = useState<ThemePreference>('system');

  useEffect(() => {
    let alive = true;
    storage.getItem(STORAGE_KEY).then((v) => {
      if (!alive) return;
      if (v === 'system' || isThemeId(v)) setPref(v);
    });
    return () => {
      alive = false;
    };
  }, []);

  const setPreference = useCallback((p: ThemePreference) => {
    setPref(p);
    storage.setItem(STORAGE_KEY, p).catch(() => {});
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const id: ThemeId =
      preference === 'system'
        ? system === 'light'
          ? DEFAULT_LIGHT_THEME
          : DEFAULT_DARK_THEME
        : preference;
    return { theme: THEMES[id], preference, setPreference };
  }, [preference, system, setPreference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
