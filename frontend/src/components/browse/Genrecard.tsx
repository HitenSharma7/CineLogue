import React, { memo, useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { ArrowGlyph, Sparkle } from '@/components/browse/Glyphs';
import { Gradient } from '@/components/browse/Gradient';
import { GenreArt } from '@/components/browse/Genreart';
import { SparkleField } from '@/components/browse/Sparklefield';
import { TiltPressable } from '@/components/browse/Tiltpressable';
import { paletteOf, type Genre } from '@/constants/genre';
import { CARD_RADIUS, display, eyebrow, fitDisplay, tabular } from '@/constants/typography';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { withAlpha } from '@/utils/color';

const WHITE = '#FFFFFF';
const pad2 = (n: number) => String(n).padStart(2, '0');

/** Hairline inner rim that makes a card feel like a physical, glass-edged object. */
function Rim({ radius = CARD_RADIUS }: { radius?: number }) {
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: 1, borderColor: withAlpha(WHITE, 0.16) }]}
    />
  );
}

function GlassChip({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        minHeight: 30,
        paddingHorizontal: 12,
        borderRadius: 999,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: withAlpha(WHITE, 0.14),
        borderWidth: 1,
        borderColor: withAlpha(WHITE, 0.22),
      }}
    >
      {children}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Grid card: a small poster                                                  */
/* -------------------------------------------------------------------------- */

type GenreCardProps = {
  genre: Genre;
  width: number;
  height: number;
  index: number;
  onPress: (genre: Genre) => void;
};

export const GenreCard = memo(function GenreCard({ genre, width, height, index, onPress }: GenreCardProps) {
  const reduced = useReducedMotion();
  const pal = paletteOf(genre.accent);
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) {
      enter.setValue(1);
      return;
    }
    const anim = Animated.timing(enter, {
      toValue: 1,
      duration: 480,
      delay: Math.min(index, 10) * 55,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [enter, index, reduced]);

  const nameSize = fitDisplay(genre.name, width - 32, 27);

  return (
    <Animated.View
      style={{
        width,
        opacity: enter,
        transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) }],
      }}
    >
      <TiltPressable
        onPress={() => onPress(genre)}
        accessibilityRole="button"
        accessibilityLabel={`${genre.name}. ${genre.description}`}
        accessibilityHint="Opens this genre"
        style={{ minHeight: height, borderRadius: CARD_RADIUS, overflow: 'hidden', backgroundColor: pal.deep }}
        contentStyle={{ flexGrow: 1, justifyContent: 'flex-end', padding: 16 }}
      >
        <GenreArt genre={genre} width={width} height={height} />
        <Gradient
          colors={[withAlpha(pal.deep, 0), withAlpha(pal.deep, 0.55), withAlpha(pal.deep, 0.96)]}
          locations={[0.3, 0.68, 1]}
        />
        <Rim />

        <View
          style={{
            position: 'absolute',
            top: 14,
            left: 16,
            right: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <AppText color={withAlpha(pal.light, 0.9)} style={[eyebrow(10.5), tabular]}>
            {pad2(index + 1)}
          </AppText>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: withAlpha(WHITE, 0.14),
              borderWidth: 1,
              borderColor: withAlpha(WHITE, 0.22),
            }}
          >
            <ArrowGlyph size={14} rotate={-45} thickness={1.8} />
          </View>
        </View>

        <View style={{ gap: 5 }}>
          <View style={{ width: 22, height: 2, borderRadius: 1, backgroundColor: withAlpha(pal.light, 0.8) }} />
          <AppText
            color={WHITE}
            numberOfLines={2}
            maxFontSizeMultiplier={1.2}
            style={display(nameSize)}
          >
            {genre.name}
          </AppText>
          <AppText
            color={withAlpha(WHITE, 0.72)}
            numberOfLines={2}
            maxFontSizeMultiplier={1.2}
            style={{ fontSize: 12, lineHeight: 16 }}
          >
            {genre.description}
          </AppText>
        </View>
      </TiltPressable>
    </Animated.View>
  );
});

/* -------------------------------------------------------------------------- */
/* Featured card: the coverflow centrepiece                                    */
/* -------------------------------------------------------------------------- */

type FeaturedCardProps = {
  genre: Genre;
  index: number;
  total: number;
  width: number;
  height: number;
  snap: number;
  scrollX: Animated.Value;
  tall: boolean;
  onPress: (genre: Genre) => void;
};

export const FeaturedCard = memo(function FeaturedCard({
  genre,
  index,
  total,
  width,
  height,
  snap,
  scrollX,
  tall,
  onPress,
}: FeaturedCardProps) {
  const pal = paletteOf(genre.accent);
  const inputRange = [(index - 1) * snap, index * snap, (index + 1) * snap];

  const rotateY = scrollX.interpolate({ inputRange, outputRange: ['-34deg', '0deg', '34deg'], extrapolate: 'clamp' });
  const scale = scrollX.interpolate({ inputRange, outputRange: [0.84, 1, 0.84], extrapolate: 'clamp' });
  const opacity = scrollX.interpolate({ inputRange, outputRange: [0.5, 1, 0.5], extrapolate: 'clamp' });
  const lift = scrollX.interpolate({ inputRange, outputRange: [28, 0, 28], extrapolate: 'clamp' });
  const shiftX = scrollX.interpolate({
    inputRange,
    outputRange: [-width * 0.16, 0, width * 0.16],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={{
        width,
        opacity,
        transform: [{ perspective: 1100 }, { translateY: lift }, { scale }, { rotateY }],
      }}
    >
      {/* shadow lives on a non-clipping wrapper so the coloured glow isn't cut off */}
      <View
        style={{
          borderRadius: CARD_RADIUS + 4,
          backgroundColor: pal.deep,
          shadowColor: pal.glow,
          shadowOpacity: 0.5,
          shadowRadius: 26,
          shadowOffset: { width: 0, height: 18 },
          elevation: 16,
        }}
      >
        <TiltPressable
          maxTilt={6}
          onPress={() => onPress(genre)}
          accessibilityRole="button"
          accessibilityLabel={`Featured: ${genre.name}. ${genre.description}`}
          accessibilityHint="Opens this genre"
          style={{ height, borderRadius: CARD_RADIUS + 4, overflow: 'hidden', backgroundColor: pal.deep }}
          contentStyle={{ flexGrow: 1, justifyContent: 'flex-end', padding: 20 }}
        >
          <GenreArt genre={genre} width={width} height={height} shiftX={shiftX} />
          <SparkleField count={5} seed={index + 2} color={pal.light} minSize={6} maxSize={14} />
          <Gradient
            colors={[withAlpha(pal.deep, 0), withAlpha(pal.deep, 0.6), withAlpha(pal.deep, 0.97)]}
            locations={[0.28, 0.66, 1]}
          />
          <Rim radius={CARD_RADIUS + 4} />

          <View
            style={{
              position: 'absolute',
              top: 18,
              left: 20,
              right: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <GlassChip>
              <Sparkle size={11} color={pal.light} />
              <Text style={[eyebrow(10), { color: WHITE }]}>Featured</Text>
            </GlassChip>
            <AppText color={withAlpha(WHITE, 0.8)} style={[eyebrow(10.5), tabular]}>
              {pad2(index + 1)} / {pad2(total)}
            </AppText>
          </View>

          <View style={{ gap: 8 }}>
            <AppText
              color={WHITE}
              numberOfLines={2}
              maxFontSizeMultiplier={1.15}
              style={display(fitDisplay(genre.name, width - 40, tall ? 54 : 42, 24))}
            >
              {genre.name}
            </AppText>
            <AppText
              color={withAlpha(WHITE, 0.78)}
              numberOfLines={2}
              maxFontSizeMultiplier={1.2}
              style={{ fontSize: 14, lineHeight: 20, maxWidth: 360 }}
            >
              {genre.description}
            </AppText>

            <View
              style={{
                marginTop: 8,
                alignSelf: 'flex-start',
                minHeight: 44,
                paddingLeft: 20,
                paddingRight: 16,
                borderRadius: 999,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: WHITE,
              }}
            >
              <AppText color={pal.deep} maxFontSizeMultiplier={1.15} style={{ fontWeight: '800', fontSize: 14 }}>
                Explore
              </AppText>
              <ArrowGlyph size={16} color={pal.deep} thickness={2} />
            </View>
          </View>
        </TiltPressable>
      </View>
    </Animated.View>
  );
});

/* -------------------------------------------------------------------------- */
/* Hero for the genre detail screen                                            */
/* -------------------------------------------------------------------------- */

type HeroProps = {
  genre: Genre;
  width: number;
  height: number;
  tall: boolean;
  shiftY?: Animated.AnimatedInterpolation<number>;
};

export function GenreHero({ genre, width, height, tall, shiftY }: HeroProps) {
  const pal = paletteOf(genre.accent);
  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel={`${genre.name}. ${genre.description}`}
      style={{
        minHeight: height,
        borderRadius: CARD_RADIUS + 6,
        overflow: 'hidden',
        justifyContent: 'flex-end',
        padding: 24,
        backgroundColor: pal.deep,
        shadowColor: pal.glow,
        shadowOpacity: 0.4,
        shadowRadius: 28,
        shadowOffset: { width: 0, height: 16 },
        elevation: 14,
      }}
    >
      <GenreArt genre={genre} width={width} height={height} shiftY={shiftY} />
      <SparkleField count={7} seed={11} color={pal.light} minSize={6} maxSize={16} />
      <Gradient
        colors={[withAlpha(pal.deep, 0), withAlpha(pal.deep, 0.62), withAlpha(pal.deep, 0.97)]}
        locations={[0.25, 0.64, 1]}
      />
      <Rim radius={CARD_RADIUS + 6} />

      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Sparkle size={12} color={pal.light} />
          <AppText color={withAlpha(pal.light, 0.95)} style={eyebrow(11)}>
            Genre
          </AppText>
        </View>
        <AppText color={WHITE} numberOfLines={2} maxFontSizeMultiplier={1.12} style={display(fitDisplay(genre.name, width - 48, tall ? 68 : 52, 28))}>
          {genre.name}
        </AppText>
        <AppText
          color={withAlpha(WHITE, 0.8)}
          maxFontSizeMultiplier={1.2}
          style={{ fontSize: 15, lineHeight: 22, maxWidth: 420 }}
        >
          {genre.description}
        </AppText>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
          <GlassChip>
            <Text style={[eyebrow(10), { color: WHITE }]}>Movies</Text>
          </GlassChip>
          <GlassChip>
            <Text style={[eyebrow(10), { color: WHITE }]}>Series</Text>
          </GlassChip>
        </View>
      </View>
    </View>
  );
}