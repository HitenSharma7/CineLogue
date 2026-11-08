import React, { memo, type ReactNode } from 'react';
import { Animated, Image, StyleSheet, View, type ViewStyle } from 'react-native';

import { Gradient } from '@/components/browse/Gradient';
import { Orb } from '@/components/browse/Glyphs';
import { paletteOf, type Genre, type Palette } from '@/constants/genre';
import { mix, withAlpha } from '@/utils/color';

type Shift = Animated.Value | Animated.AnimatedInterpolation<number>;

type Props = {
  genre: Genre;
  width: number;
  height: number;
  /** Parallax offsets (native-driven). The emblem layer moves, the base colour does not. */
  shiftX?: Shift;
  shiftY?: Shift;
};

const circle = (key: string, cx: number, cy: number, d: number, style: ViewStyle) => (
  <View
    key={key}
    style={[{ position: 'absolute', left: cx - d / 2, top: cy - d / 2, width: d, height: d, borderRadius: d / 2 }, style]}
  />
);

function pattern(genre: Genre, W: number, H: number, pal: Palette): ReactNode {
  const u = W;
  const v = genre.variant;
  const bgAt = (y: number) => mix(pal.mid, pal.deep, Math.min(1, Math.max(0, y / Math.max(H, 1))));

  switch (genre.art) {
    case 'rings': {
      const cx = v === 1 ? W * 0.24 : W * 0.76;
      const cy = H * 0.28;
      return (
        <>
          {[0, 1, 2, 3, 4].map((k) =>
            circle(`r${k}`, cx, cy, u * (0.2 + 0.2 * k), {
              borderWidth: 1.5,
              borderColor: withAlpha(pal.light, 0.44 - 0.07 * k),
            }),
          )}
          {circle('rc', cx, cy, u * 0.12, { backgroundColor: withAlpha(pal.light, 0.9) })}
        </>
      );
    }

    case 'stripes': {
      const n = 8;
      const bw = u * 0.075;
      const gap = u * 0.05;
      return (
        <View
          style={{
            position: 'absolute',
            left: W * 0.36,
            top: -H * 0.25,
            width: n * (bw + gap),
            height: H * 1.2,
            flexDirection: 'row',
            gap,
            transform: [{ rotate: v === 1 ? '24deg' : '-24deg' }],
          }}
        >
          {Array.from({ length: n }, (_, i) => (
            <View
              key={i}
              style={{
                width: bw,
                height: H * 1.2 * (0.5 + ((i * 37) % 45) / 100),
                borderRadius: bw / 2,
                backgroundColor: withAlpha(pal.light, 0.1 + (i / n) * 0.32),
              }}
            />
          ))}
        </View>
      );
    }

    case 'orbit': {
      const cx = W * 0.66;
      const cy = H * 0.27;
      const d = u * 0.46;
      return (
        <>
          {circle('ring', cx, cy, u * 1.02, {
            borderWidth: 2,
            borderColor: withAlpha(pal.light, 0.5),
            transform: [{ rotate: '-20deg' }, { scaleY: 0.26 }],
          })}
          <View key="planet" style={{ position: 'absolute', left: cx - d / 2, top: cy - d / 2 }}>
            <Orb size={d} color={pal.glow} />
          </View>
          {circle('moon', W * 0.2, H * 0.12, u * 0.07, { backgroundColor: withAlpha(pal.light, 0.8) })}
          {circle('moon2', W * 0.9, H * 0.44, u * 0.04, { backgroundColor: withAlpha(pal.light, 0.6) })}
        </>
      );
    }

    case 'sun': {
      const cx = v === 1 ? W * 0.62 : W * 0.5;
      const cy = H * 0.3;
      const d = u * 0.6;
      const cut = bgAt(cy + d * 0.3);
      return (
        <>
          {circle('halo', cx, cy, d * 1.6, { backgroundColor: withAlpha(pal.glow, 0.16) })}
          <View
            key="sun"
            style={{
              position: 'absolute',
              left: cx - d / 2,
              top: cy - d / 2,
              width: d,
              height: d,
              borderRadius: d / 2,
              overflow: 'hidden',
            }}
          >
            <Gradient colors={[pal.light, pal.glow]} />
            {[0, 1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: d * (0.5 + i * 0.1),
                  height: 1.5 + i * 1.7,
                  backgroundColor: cut,
                }}
              />
            ))}
          </View>
        </>
      );
    }

    case 'bars': {
      const heights = [0.18, 0.32, 0.24, 0.42, 0.3, 0.5, 0.26, 0.36, 0.2];
      const ordered = v === 1 ? [...heights].reverse() : heights;
      const n = ordered.length;
      const slot = (W * 0.88) / n;
      const baseY = H * 0.56;
      return (
        <>
          {circle('moon', W * 0.78, H * 0.1, u * 0.14, { backgroundColor: withAlpha(pal.light, 0.7) })}
          {ordered.map((h, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: W * 0.06 + i * slot,
                top: baseY - H * h,
                width: slot * 0.62,
                height: H * h + H,
                borderTopLeftRadius: 3,
                borderTopRightRadius: 3,
                backgroundColor: withAlpha(pal.light, 0.14 + h * 0.34),
              }}
            />
          ))}
        </>
      );
    }

    case 'venn': {
      const cy = H * 0.3;
      const d = u * 0.52;
      const off = u * 0.15;
      const style: ViewStyle = {
        backgroundColor: withAlpha(pal.light, 0.26),
        borderWidth: 1.5,
        borderColor: withAlpha(pal.light, 0.55),
      };
      return (
        <>
          {circle('a', W * 0.5 - off, cy, d, style)}
          {circle('b', W * 0.5 + off, cy, d, style)}
        </>
      );
    }

    case 'diamonds': {
      const cx = W * 0.68;
      const cy = H * 0.28;
      return (
        <>
          {[0, 1, 2, 3, 4].map((k) => {
            const s = u * (0.12 + 0.13 * k);
            return (
              <View
                key={k}
                style={{
                  position: 'absolute',
                  left: cx - s / 2,
                  top: cy - s / 2,
                  width: s,
                  height: s,
                  borderWidth: 1.5,
                  borderColor: withAlpha(pal.light, 0.52 - 0.08 * k),
                  transform: [{ rotate: v === 1 ? '30deg' : '45deg' }],
                }}
              />
            );
          })}
          {circle('core', cx, cy, u * 0.06, { backgroundColor: withAlpha(pal.light, 0.95) })}
        </>
      );
    }

    case 'dots': {
      const cols = 6;
      const rows = 5;
      const cell = (W * 0.78) / cols;
      const left = W * 0.11;
      const top = H * 0.05;
      const items: ReactNode[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const dist = Math.hypot(c - (cols - 1) / 2, (r - (rows - 1) / 2) * 1.1);
          const fall = Math.max(0, 1 - dist / 3.3);
          items.push(
            circle(`d${r}-${c}`, left + c * cell + cell / 2, top + r * cell + cell / 2, 3 + 10 * fall, {
              backgroundColor: withAlpha(pal.light, 0.3 + 0.6 * fall),
            }),
          );
        }
      }
      return <>{items}</>;
    }

    case 'crescent': {
      const cx = W * 0.62;
      const cy = H * 0.27;
      const d = u * 0.56;
      const dx = v === 1 ? -u * 0.13 : v === 2 ? 0 : u * 0.14;
      const dy = v === 2 ? -u * 0.13 : -u * 0.05;
      const cut = bgAt(cy);
      return (
        <>
          {circle('glow', cx, cy, d * 1.5, { backgroundColor: withAlpha(pal.glow, 0.14) })}
          {circle('moon', cx, cy, d, { backgroundColor: withAlpha(pal.light, 0.94) })}
          {circle('cut', cx + dx, cy + dy, d * 0.96, { backgroundColor: cut })}
          {circle('s1', W * 0.2, H * 0.14, u * 0.035, { backgroundColor: withAlpha(pal.light, 0.8) })}
          {circle('s2', W * 0.34, H * 0.4, u * 0.025, { backgroundColor: withAlpha(pal.light, 0.6) })}
          {circle('s3', W * 0.9, H * 0.46, u * 0.03, { backgroundColor: withAlpha(pal.light, 0.7) })}
        </>
      );
    }

    case 'chevrons':
    default: {
      const cx = W * 0.6;
      const s = u * 0.46;
      return (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: cx - s / 2,
                top: H * 0.08 + i * u * 0.11,
                width: s,
                height: s,
                borderTopWidth: 3,
                borderLeftWidth: 3,
                borderTopLeftRadius: 4,
                borderColor: withAlpha(pal.light, 0.66 - i * 0.11),
                transform: [{ rotate: v === 1 ? '135deg' : '45deg' }],
              }}
            />
          ))}
        </>
      );
    }
  }
}

/**
 * Generative cover art: tonal gradient, a bespoke geometric emblem per genre,
 * soft glow and a glossy sheen. If `genre.image` is set, the photo takes over.
 */
export const GenreArt = memo(function GenreArt({ genre, width, height, shiftX, shiftY }: Props) {
  const pal = paletteOf(genre.accent);
  const moving = shiftX !== undefined || shiftY !== undefined;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      <Gradient colors={[pal.mid, pal.deep]} />

      {genre.image ? (
        // Over-scan only on axes that actually move, so parallax never reveals an edge.
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: shiftX ? -width * 0.18 : 0,
              right: shiftX ? -width * 0.18 : 0,
              top: shiftY ? -84 : 0,
              bottom: shiftY ? -84 : 0,
            },
            moving ? { transform: [{ translateX: shiftX ?? 0 }, { translateY: shiftY ?? 0 }] } : null,
          ]}
        >
          <Image
            source={genre.image}
            resizeMode="cover"
            resizeMethod="resize"
            fadeDuration={0}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ) : (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            moving ? { transform: [{ translateX: shiftX ?? 0 }, { translateY: shiftY ?? 0 }] } : null,
          ]}
        >
          {circle('glow1', width * 0.82, height * 0.1, width * 1.1, { backgroundColor: withAlpha(pal.glow, 0.14) })}
          {circle('glow2', width * 0.1, height * 0.5, width * 0.7, { backgroundColor: withAlpha(pal.base, 0.18) })}
          {pattern(genre, width, height, pal)}
        </Animated.View>
      )}

      {/* glossy sheen from the top-left, the cue that makes flat shapes read as a lit surface */}
      <Gradient
        colors={[withAlpha('#FFFFFF', 0.2), withAlpha('#FFFFFF', 0)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.75, y: 0.5 }}
      />
    </View>
  );
});