import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { RADII, SPACING } from '@/constants/layout';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/styles/ThemeProvider';

type Props = {
  columns: number;
  cardWidth: number;
  gap: number;
  title: string;
  message: string;
  rows?: number;
};

/**
 * Shimmering poster grid shown while the catalogue API is not wired up yet.
 * When real data arrives, render your poster grid instead; the column / width
 * maths from the screen is already compatible.
 */
export function ResultsPlaceholder({ columns, cardWidth, gap, title, message, rows = 2 }: Props) {
  const { theme } = useTheme();
  const reduced = useReducedMotion();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) {
      pulse.setValue(0.4);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduced]);

  const shimmer = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.95] });
  const count = Math.max(1, columns) * rows;

  return (
    <View
      accessible
      accessibilityLabel={`${title}. ${message}`}
      accessibilityState={{ busy: true }}
      style={{ gap: SPACING.lg }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.md,
          padding: SPACING.md,
          borderRadius: RADII.lg,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <Animated.View
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: theme.colors.accent,
            opacity: shimmer,
          }}
        />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText numberOfLines={2} style={{ fontWeight: '800' }}>
            {title}
          </AppText>
          <AppText variant="caption" color={theme.colors.textMuted}>
            {message}
          </AppText>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }} importantForAccessibility="no-hide-descendants">
        {Array.from({ length: count }, (_, i) => (
          <Animated.View key={i} style={{ width: cardWidth, gap: SPACING.sm, opacity: shimmer }}>
            <View
              style={{
                width: '100%',
                aspectRatio: 2 / 3,
                borderRadius: RADII.md,
                backgroundColor: theme.colors.surfaceElevated,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            />
            <View style={{ height: 10, width: '85%', borderRadius: 5, backgroundColor: theme.colors.surfaceElevated }} />
            <View style={{ height: 10, width: '55%', borderRadius: 5, backgroundColor: theme.colors.surfaceElevated }} />
          </Animated.View>
        ))}
      </View>
    </View>
  );
}