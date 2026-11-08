
import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { useReducedMotion } from '@/hooks/useReducedMotion';

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  maxTilt?: number;
  pressedScale?: number;
  haptic?: boolean;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export function TiltPressable({
  style,
  contentStyle,
  maxTilt = 9,
  pressedScale = 0.975,
  haptic = true,
  onPress,
  onPressIn,
  onPressOut,
  onLayout,
  children,
  ...rest
}: Props) {
  const reduced = useReducedMotion();

  const dimensions = useRef({
    width: 0,
    height: 0,
  });

  const scale = useRef(new Animated.Value(1)).current;
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;

  const spring = (
    value: Animated.Value,
    toValue: number,
    speed = 28,
  ) => {
    Animated.spring(value, {
      toValue,
      speed,
      bounciness: 5,
      useNativeDriver: true,
    }).start();
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;

    dimensions.current = { width, height };

    onLayout?.(event);
  };

  const handleIn = (event: GestureResponderEvent) => {
    onPressIn?.(event);

    if (reduced) return;

    const { locationX, locationY } = event.nativeEvent;
    const { width, height } = dimensions.current;

    if (width > 0 && height > 0) {
      const normalizedX = (locationX / width) * 2 - 1;
      const normalizedY = (locationY / height) * 2 - 1;

      spring(tx, clamp(normalizedX, -1, 1));
      spring(ty, clamp(normalizedY, -1, 1));
    }

    spring(scale, pressedScale, 40);
  };

  const handleOut = (event: GestureResponderEvent) => {
    onPressOut?.(event);

    spring(scale, 1);
    spring(tx, 0);
    spring(ty, 0);
  };

  const handlePress = (event: GestureResponderEvent) => {
    if (haptic) {
      void Haptics.impactAsync(
        Haptics.ImpactFeedbackStyle.Light,
      ).catch(() => {});
    }

    onPress?.(event);
  };

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [
            { perspective: 900 },
            {
              rotateX: ty.interpolate({
                inputRange: [-1, 1],
                outputRange: [`${maxTilt}deg`, `${-maxTilt}deg`],
              }),
            },
            {
              rotateY: tx.interpolate({
                inputRange: [-1, 1],
                outputRange: [`${-maxTilt}deg`, `${maxTilt}deg`],
              }),
            },
            { scale },
          ],
        },
      ]}
    >
      <Pressable
        {...rest}
        onLayout={handleLayout}
        onPress={handlePress}
        onPressIn={handleIn}
        onPressOut={handleOut}
        style={[{ flexGrow: 1 }, contentStyle]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
