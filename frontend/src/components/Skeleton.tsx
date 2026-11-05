import React, { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import type { DimensionValue } from 'react-native';
import { RADII } from '@/constants/layout';
import { useReducedMotionPref } from '@/hooks/useReducedMotionPref';
import { useTheme } from '@/styles/ThemeProvider';

export function Skeleton({ width, height, radius = RADII.md }: { width: DimensionValue; height: number; radius?: number }) {
  const { theme } = useTheme();
  const reduce = useReducedMotionPref();
  const o = useSharedValue(0.5);
  useEffect(() => {
    if (!reduce) o.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [reduce, o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width, height, borderRadius: radius, backgroundColor: theme.colors.surfaceElevated }, style]}
    />
  );
}
