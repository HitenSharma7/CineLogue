import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from './AppText';
import { LogoMark, Wordmark } from './Logo';
import { BRAND } from '@/config/brand';
import { MOTION } from '@/constants/motion';
import { SPACING } from '@/constants/layout';
import { useReducedMotionPref } from '@/hooks/useReducedMotionPref';
import { useTheme } from '@/styles/ThemeProvider';

const TOTAL_MS = 2600;

function useFade(v: SharedValue<number>, reduce: boolean) {
  return useAnimatedStyle(() => ({
    opacity: v.value,
    transform: [{ translateY: reduce ? 0 : (1 - v.value) * 8 }],
  }));
}

/** Short in-app splash. Tap to skip. Reduced motion => fades only (no scale). */
export function SplashOverlay({ onDone }: { onDone: () => void }) {
  const { theme } = useTheme();
  const reduce = useReducedMotionPref();
  const glow = useSharedValue(0);
  const logo = useSharedValue(0);
  const word = useSharedValue(0);
  const line1 = useSharedValue(0);
  const line2 = useSharedValue(0);
  const out = useSharedValue(1);
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    out.value = withTiming(0, { duration: MOTION.base });
    setTimeout(onDone, MOTION.base);
  };

  useEffect(() => {
    const e = Easing.out(Easing.cubic);
    glow.value = withTiming(1, { duration: 900, easing: e });
    logo.value = withDelay(150, withTiming(1, { duration: MOTION.splashReveal, easing: e }));
    word.value = withDelay(600, withTiming(1, { duration: MOTION.slow }));
    line1.value = withDelay(1000, withTiming(1, { duration: MOTION.slow }));
    line2.value = withDelay(1350, withTiming(1, { duration: MOTION.slow }));
    const t = setTimeout(finish, TOTAL_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const root = useAnimatedStyle(() => ({ opacity: out.value }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value * 0.35, transform: [{ scale: 0.8 + glow.value * 0.4 }] }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logo.value,
    transform: [{ scale: reduce ? 1 : 0.85 + logo.value * 0.15 }],
  }));
  const wordStyle = useFade(word, reduce);
  const l1 = useFade(line1, reduce);
  const l2 = useFade(line2, reduce);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.background }, root]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Skip intro"
        onPress={finish}
        style={styles.fill}
      >
        <Animated.View
          pointerEvents="none"
          style={[styles.glow, { backgroundColor: theme.colors.accent }, glowStyle]}
        />
        <Animated.View style={logoStyle}>
          <LogoMark size={88} />
        </Animated.View>
        <Animated.View style={[{ marginTop: SPACING.xl, alignItems: 'center', gap: SPACING.xs }, wordStyle]}>
          <Wordmark size={30} />
          <AppText muted variant="caption" style={{ letterSpacing: 2, textTransform: 'uppercase' }}>
            {BRAND.tagline}
          </AppText>
        </Animated.View>
        <View style={{ marginTop: SPACING.xxxl, alignItems: 'center', paddingHorizontal: SPACING.xl, gap: SPACING.xs }}>
          <Animated.View style={l1}>
            <AppText style={{ textAlign: 'center', fontStyle: 'italic' }}>{BRAND.splashLines[0]}</AppText>
          </Animated.View>
          <Animated.View style={l2}>
            <AppText style={{ textAlign: 'center', fontStyle: 'italic' }}>{BRAND.splashLines[1]}</AppText>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 320, height: 320, borderRadius: 160 },
});
