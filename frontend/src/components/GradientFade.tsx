import React, { useMemo } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';

type Props = {
  /** Solid colour the fade resolves to (normally theme.colors.background). */
  color: string;
  /** Edge that is fully opaque. */
  side: 'top' | 'bottom';
  height: DimensionValue;
  steps?: number;
  /** >1 reaches full opacity sooner (keeps text readable over artwork). */
  strength?: number;
};

/**
 * Dependency-free gradient: stacked bands with an eased opacity ramp.
 * Static (no animation), so it is cheap. Swap for expo-linear-gradient later
 * if you add it; the props map 1:1.
 */
export function GradientFade({ color, side, height, steps = 36, strength = 1.3 }: Props) {
  const ramp = useMemo(
    () =>
      Array.from({ length: steps }, (_, i) => {
        const pos = (i + 0.5) / steps; // 0 = top band, 1 = bottom band
        const d = side === 'bottom' ? 1 - pos : pos; // 0 at opaque edge
        const smooth = d * d * (3 - 2 * d);
        return Math.min(1, strength * (1 - smooth));
      }),
    [steps, side, strength],
  );
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.base, side === 'bottom' ? { bottom: 0 } : { top: 0 }, { height }]}
    >
      {ramp.map((o, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: color, opacity: o }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ base: { position: 'absolute', left: 0, right: 0 } });
