import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient, type LinearGradientProps } from 'expo-linear-gradient';

type Props = {
  colors: LinearGradientProps['colors'];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  locations?: LinearGradientProps['locations'];
  style?: StyleProp<ViewStyle>;
};

/** Absolute-fill gradient overlay. Top to bottom by default. Never intercepts touches. */
export function Gradient({ colors, start = { x: 0.5, y: 0 }, end = { x: 0.5, y: 1 }, locations, style }: Props) {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={colors}
      start={start}
      end={end}
      locations={locations}
      style={[StyleSheet.absoluteFill, style]}
    />
  );
}