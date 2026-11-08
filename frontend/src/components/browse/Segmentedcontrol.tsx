import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View, type LayoutChangeEvent } from 'react-native';

import { AppText } from '@/components/AppText';
import { MIN_TOUCH_TARGET, RADII } from '@/constants/layout';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/styles/ThemeProvider';

const PAD = 4;

type Option<K extends string> = { key: K; label: string };

type Props<K extends string> = {
  options: readonly Option<K>[];
  value: K;
  onChange: (key: K) => void;
  accessibilityLabel?: string;
};

/** Equal-width segmented control with a sliding, native-driven indicator. */
export function SegmentedControl<K extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: Props<K>) {
  const { theme } = useTheme();
  const reduced = useReducedMotion();
  const [trackWidth, setTrackWidth] = useState(0);

  const index = Math.max(0, options.findIndex((o) => o.key === value));
  const position = useRef(new Animated.Value(index)).current;

  useEffect(() => {
    if (reduced) {
      position.setValue(index);
      return;
    }
    Animated.spring(position, {
      toValue: index,
      speed: 22,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
  }, [index, position, reduced]);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    setTrackWidth((prev) => (prev === w ? prev : w));
  };

  const segmentWidth = Math.max(0, (trackWidth - PAD * 2) / Math.max(1, options.length));

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      onLayout={onLayout}
      style={{
        flexDirection: 'row',
        padding: PAD,
        minHeight: MIN_TOUCH_TARGET + PAD * 2,
        borderRadius: RADII.pill,
        backgroundColor: theme.colors.surfaceElevated,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: PAD,
          bottom: PAD,
          left: PAD,
          width: segmentWidth,
          borderRadius: RADII.pill,
          backgroundColor: theme.colors.accent,
          transform: [
            {
              translateX: position.interpolate({
                inputRange: [0, 1],
                outputRange: [0, segmentWidth],
              }),
            },
          ],
        }}
      />

      {options.map((option) => {
        const active = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            style={{
              flex: 1,
              minHeight: MIN_TOUCH_TARGET,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 8,
            }}
          >
            <AppText
              variant="caption"
              numberOfLines={1}
              maxFontSizeMultiplier={1.2}
              color={active ? theme.colors.accentText : theme.colors.textMuted}
              style={{ fontWeight: '800' }}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}