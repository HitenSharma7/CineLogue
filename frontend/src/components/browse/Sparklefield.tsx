import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { Sparkle } from '@/components/browse/Glyphs';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type Props = {
  count?: number;
  seed?: number;
  color?: string;
  minSize?: number;
  maxSize?: number;
  duration?: number;
};

/** Small deterministic PRNG so every field lays out identically across renders. */
function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/**
 * Scattered sparkles that twinkle out of phase.
 * One native-driven value powers all of them, so it stays cheap.
 */
export function SparkleField({
  count = 12,
  seed = 7,
  color = '#FFFFFF',
  minSize = 5,
  maxSize = 13,
  duration = 3800,
}: Props) {
  const reduced = useReducedMotion();
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) {
      t.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(t, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [t, reduced, duration]);

  const items = useMemo(() => {
    const rand = rng(seed * 997 + 13);
    return Array.from({ length: count }, () => ({
      x: 4 + rand() * 90,
      y: 4 + rand() * 90,
      size: minSize + rand() * (maxSize - minSize),
      phase: 0.16 + rand() * 0.68,
    }));
  }, [count, seed, minSize, maxSize]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {items.map((item, i) => {
        const p = item.phase;
        const inputRange = [0, p - 0.12, p, p + 0.12, 1];
        const opacity = reduced
          ? 0.5
          : t.interpolate({ inputRange, outputRange: [0.1, 0.1, 1, 0.1, 0.1] });
        const scale = reduced
          ? 1
          : t.interpolate({ inputRange, outputRange: [0.5, 0.5, 1, 0.5, 0.5] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: `${item.x}%`,
              top: `${item.y}%`,
              opacity,
              transform: [{ scale }],
            }}
          >
            <Sparkle size={item.size} color={color} />
          </Animated.View>
        );
      })}
    </View>
  );
}