import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { THEME_ORDER, THEMES } from '@/constants/themes';
import { MIN_TOUCH_TARGET, RADII, SPACING } from '@/constants/layout';
import { useReducedMotionPref } from '@/hooks/useReducedMotionPref';
import { useTheme } from '@/styles/ThemeProvider';
import type { ThemePreference } from '@/type/theme';

export function SettingsScreen() {
  const { theme, preference, setPreference } = useTheme();
  const reduce = useReducedMotionPref();
  const options: { key: ThemePreference; label: string }[] = [
    { key: 'system', label: 'Match system (light / dark)' },
    ...THEME_ORDER.map((id) => ({ key: id as ThemePreference, label: THEMES[id].label })),
  ];
  return (
    <Screen>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.xl }}>
        <View style={{ gap: SPACING.sm }}>
          <AppText variant="heading" accessibilityRole="header">Appearance</AppText>
          <View accessibilityRole="radiogroup" style={{ borderRadius: RADII.lg, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' }}>
            {options.map((o, idx) => {
              const on = preference === o.key;
              return (
                <Pressable
                  key={o.key}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  onPress={() => setPreference(o.key)}
                  style={{ minHeight: MIN_TOUCH_TARGET + 6, paddingHorizontal: SPACING.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.surface, borderTopWidth: idx === 0 ? 0 : 1, borderTopColor: theme.colors.border }}
                >
                  <AppText>{o.label}</AppText>
                  <AppText color={theme.colors.text}>{on ? '✓' : ''}</AppText>
                </Pressable>
              );
            })}
          </View>
          <AppText variant="caption" muted>Your choice is kept while the app is open. Saving it across restarts needs AsyncStorage (see src/helpers/storage.ts).</AppText>
        </View>
        <View style={{ gap: SPACING.xs }}>
          <AppText variant="heading" accessibilityRole="header">Accessibility</AppText>
          <AppText muted>Reduce motion follows your device setting: currently {reduce ? 'on' : 'off'}. Text size follows your system font size.</AppText>
        </View>
        <View style={{ gap: SPACING.xs }}>
          <AppText variant="heading" accessibilityRole="header">Account</AppText>
          <AppText muted>Pending integration: account settings need the authentication backend.</AppText>
        </View>
      </ScrollView>
    </Screen>
  );
}
