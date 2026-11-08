import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Gradient } from '@/components/browse/Gradient';
import { darken, lighten } from '@/utils/color';

/**
 * Hand-built vector glyphs (pure Views). No icon font, no emoji,
 * identical on iOS, Android and web.
 */

type GlyphProps = {
  size?: number;
  color?: string;
  thickness?: number;
  style?: StyleProp<ViewStyle>;
};

/** Right-pointing arrow. `rotate` in degrees: 180 = back, -45 = north-east. */
export function ArrowGlyph({ size = 18, color = '#FFFFFF', thickness = 2, rotate = 0, style }: GlyphProps & { rotate?: number }) {
  const head = size * 0.52;
  return (
    <View
      pointerEvents="none"
      style={[{ width: size, height: size, transform: [{ rotate: `${rotate}deg` }] }, style]}
    >
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: (size - thickness) / 2,
          width: size,
          height: thickness,
          borderRadius: thickness / 2,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: head * 0.2,
          top: (size - head) / 2,
          width: head,
          height: head,
          borderTopWidth: thickness,
          borderRightWidth: thickness,
          borderColor: color,
          borderTopRightRadius: thickness / 2,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
}

export function SearchGlyph({ size = 20, color = '#FFFFFF', thickness = 2, style }: GlyphProps) {
  const ring = size * 0.72;
  return (
    <View pointerEvents="none" style={[{ width: size, height: size }, style]}>
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: ring,
          height: ring,
          borderRadius: ring / 2,
          borderWidth: thickness,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: 0,
          bottom: size * 0.18 - thickness / 2,
          width: size * 0.36,
          height: thickness,
          borderRadius: thickness / 2,
          backgroundColor: color,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
}

/** Four-point sparkle: two thin diamonds crossing. */
export function Sparkle({ size = 16, color = '#FFFFFF', style }: Omit<GlyphProps, 'thickness'>) {
  const a = size / Math.SQRT2;
  const base = {
    position: 'absolute' as const,
    width: a,
    height: a,
    left: (size - a) / 2,
    top: (size - a) / 2,
    backgroundColor: color,
  };
  return (
    <View pointerEvents="none" style={[{ width: size, height: size }, style]}>
      <View style={[base, { transform: [{ scaleX: 0.24 }, { rotate: '45deg' }] }]} />
      <View style={[base, { transform: [{ scaleY: 0.24 }, { rotate: '45deg' }] }]} />
    </View>
  );
}

/** Glossy 3D sphere: lit from the top-left, shaded bottom-right, with a specular glint. */
export function Orb({ size = 40, color }: { size?: number; color: string }) {
  return (
    <View
      pointerEvents="none"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        backgroundColor: darken(color, 0.3),
      }}
    >
      <Gradient
        colors={[lighten(color, 0.5), color, darken(color, 0.6)]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.22, y: 0.1 }}
        end={{ x: 0.85, y: 1 }}
      />
      <View
        style={{
          position: 'absolute',
          left: size * 0.2,
          top: size * 0.13,
          width: size * 0.3,
          height: size * 0.17,
          borderRadius: size * 0.1,
          backgroundColor: 'rgba(255,255,255,0.6)',
          transform: [{ rotate: '-28deg' }],
        }}
      />
    </View>
  );
}