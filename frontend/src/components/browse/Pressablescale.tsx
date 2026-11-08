import React, { useCallback, useRef } from 'react';
import {
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useReducedMotion } from '@/hooks/useReducedMotion';

type Props = Omit<PressableProps, 'style'> & {
  /** Visual box: size, background, radius, overflow. Applied to the animated outer view. */
  style?: StyleProp<ViewStyle>;
  /** Inner layout: padding, flex direction, gap. Applied to the Pressable itself. */
  contentStyle?: StyleProp<ViewStyle>;
  pressedScale?: number;
};

/**
 * Pressable with a springy native-driver scale. Splitting `style` and `contentStyle`
 * keeps the rounded/clipped box and the touch area identical, so nothing leaks outside.
 */
export function PressableScale({
  style,
  contentStyle,
  pressedScale = 0.97,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: Props) {
  const reduced = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;

  const to = useCallback(
    (value: number) => {
      if (reduced) return;
      Animated.spring(scale, {
        toValue: value,
        speed: 50,
        bounciness: 4,
        useNativeDriver: true,
      }).start();
    },
    [reduced, scale],
  );

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <Pressable
        {...rest}
        onPressIn={(e) => {
          to(pressedScale);
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          to(1);
          onPressOut?.(e);
        }}
        style={[{ flexGrow: 1 }, contentStyle]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}