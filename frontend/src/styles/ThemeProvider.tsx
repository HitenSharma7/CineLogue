
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useColorScheme } from 'react-native';

import { storage } from '@/helpers/storage';

import {
  DEFAULT_DARK_THEME,
  DEFAULT_LIGHT_THEME,
  THEMES,
} from '@/constants/themes';

import type {
  ThemeId,
  ThemePreference,
} from '@/constants/themes';

import type { AppTheme } from '@/type/theme';

const STORAGE_KEY = 'cinelogue.theme';

type ThemeContextValue = {
  theme: AppTheme<ThemeId>;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemeId(value: string | null): value is ThemeId {
  return value !== null &&
    Object.prototype.hasOwnProperty.call(THEMES, value);
}

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const system = useColorScheme();

  const [preference, setPref] =
    useState<ThemePreference>('system');

  // Load saved theme preference.
  useEffect(() => {
    let alive = true;

    storage
      .getItem(STORAGE_KEY)
      .then((value) => {
        if (!alive || value === null) return;

        if (value === 'system' || isThemeId(value)) {
          setPref(value);
        }
      })
      .catch(() => {
        // Keep system preference if storage fails.
      });

    return () => {
      alive = false;
    };
  }, []);

  // Update preference and persist it.
  const setPreference = useCallback(
    (newPreference: ThemePreference) => {
      setPref(newPreference);

      storage
        .setItem(STORAGE_KEY, newPreference)
        .catch(() => {
          // Preference remains active for this session.
        });
    },
    [],
  );

  // Resolve the active theme.
  const value = useMemo<ThemeContextValue>(() => {
    const themeId: ThemeId =
      preference === 'system'
        ? system === 'light'
          ? DEFAULT_LIGHT_THEME
          : DEFAULT_DARK_THEME
        : preference;

    return {
      theme: THEMES[themeId],
      preference,
      setPreference,
    };
  }, [preference, system, setPreference]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom theme hook.
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useTheme must be used inside <ThemeProvider>',
    );
  }

  return context;
}
