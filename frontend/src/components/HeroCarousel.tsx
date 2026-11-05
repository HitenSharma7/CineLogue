import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Animated, {
  Extrapolation,
  FadeIn,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { AppButton } from './AppButton';
import { AppText } from './AppText';
import { GradientFade } from './GradientFade';
import { POSTER_ASPECT, RADII, SPACING } from '@/constants/layout';
import { useReducedMotionPref } from '@/hooks/useReducedMotionPref';
import { useTheme } from '@/styles/ThemeProvider';
import type { TitleDetails } from '@/type/movie';

const CLAMP = Extrapolation.CLAMP;
const TYPE_LABEL: Record<string, string> = { movie: 'FILM', series: 'SERIES' };

type Props = {
  items: TitleDetails[];
  width: number;
  /** Minimum hero height. The hero grows to fit its content, so nothing gets clipped. */
  height: number;
  gutter: number;
  wide: boolean;
  label: string;
  /**
   * Space reserved at the top for the greeting/avatar/Settings row that
   * HomeScreen floats over the hero (safe-area top + row height).
   */
  headerOffset: number;
  onOpen: (t: TitleDetails) => void;
  onSearch: () => void;
};

type PosterCardProps = {
  item: TitleDetails;
  index: number;
  x: SharedValue<number>;
  slotWidth: number;
  cardWidth: number;
  cardHeight: number;
  reduce: boolean;
  onOpen: (item: TitleDetails) => void;
};

function PosterCard({
  item,
  index,
  x,
  slotWidth,
  cardWidth,
  cardHeight,
  reduce,
  onOpen,
}: PosterCardProps) {
  const { theme } = useTheme();
  const [imageFailed, setImageFailed] = useState(false);
  const input = [(index - 1) * slotWidth, index * slotWidth, (index + 1) * slotWidth];

  const animatedCardStyle = useAnimatedStyle(() => {
    if (reduce) return {};
    return {
      opacity: interpolate(x.value, input, [0.58, 1, 0.58], CLAMP),
      transform: [
        { perspective: 1000 },
        { translateX: interpolate(x.value, input, [cardWidth * 0.12, 0, -cardWidth * 0.12], CLAMP) },
        { rotateY: `${interpolate(x.value, input, [28, 0, -28], CLAMP)}deg` },
        { scale: interpolate(x.value, input, [0.78, 1, 0.78], CLAMP) },
      ],
    };
  });

  return (
    <View style={{ width: slotWidth, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          {
            width: cardWidth,
            height: cardHeight,
            borderRadius: RADII.xl,
            overflow: 'hidden',
            backgroundColor: theme.colors.surfaceElevated,
            borderWidth: 1,
            borderColor: theme.colors.border,
            elevation: 12,
            shadowColor: '#000',
            shadowOpacity: 0.34,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 12 },
          },
          animatedCardStyle,
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${item.title}`}
          onPress={() => onOpen(item)}
          style={StyleSheet.absoluteFill}
        >
          {item.poster && !imageFailed ? (
            <Image
              source={{ uri: item.poster }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={250}
              cachePolicy="memory-disk"
              accessibilityIgnoresInvertColors
              onError={() => setImageFailed(true)}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', padding: SPACING.md }]}>
              <AppText variant="heading" style={{ textAlign: 'center' }}>{item.title}</AppText>
            </View>
          )}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: 0.05 }]} />
          <View style={styles.posterBottomShade} />
          <View style={styles.posterBadge}>
            <AppText color="#FFFFFF" variant="caption" style={styles.badgeText}>
              {TYPE_LABEL[item.type ?? ''] ?? 'CINEMA'}
            </AppText>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function PageDot({ index, x, slotWidth, reduce }: {
  index: number;
  x: SharedValue<number>;
  slotWidth: number;
  reduce: boolean;
}) {
  const { theme } = useTheme();
  const style = useAnimatedStyle(() => {
    const progress = x.value / slotWidth;
    const active = interpolate(progress, [index - 1, index, index + 1], [0, 1, 0], CLAMP);
    return {
      width: reduce ? (active > 0.5 ? 20 : 6) : 6 + active * 14,
      opacity: 0.35 + active * 0.65,
    };
  });

  return <Animated.View style={[{ height: 6, borderRadius: 4, backgroundColor: theme.colors.accent }, style]} />;
}

/**
 * Poster-first 3D coverflow. Uses the existing real-title data, callbacks,
 * theme, and reduced-motion preference; no extra dependency is required.
 *
 * Layout (top to bottom, all in normal flow so nothing overlaps):
 *   header offset -> label row -> poster carousel -> dots -> title block
 */
export function HeroCarousel({ items, width, height, gutter, wide, label, headerOffset, onOpen, onSearch }: Props) {
  const { theme } = useTheme();
  const reduce = useReducedMotionPref();
  const x = useSharedValue(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const cardWidth = Math.min(Math.round(width * (wide ? 0.34 : 0.54)), wide ? 300 : 230);
  const cardHeight = Math.min(Math.round(cardWidth / POSTER_ASPECT), Math.round(height * 0.52));
  const slotWidth = cardWidth + (wide ? 34 : 30);
  const sidePadding = Math.max(0, (width - slotWidth) / 2);

  const current = items[Math.min(activeIndex, Math.max(items.length - 1, 0))];

  const onScroll = useAnimatedScrollHandler((event) => {
    x.value = event.contentOffset.x;
  });

  useEffect(() => {
    x.value = 0;
    setActiveIndex(0);
  }, [items, width, height, x]);

  const onMomentumEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / slotWidth);
    setActiveIndex(Math.max(0, Math.min(items.length - 1, next)));
  }, [items.length, slotWidth]);

  const renderItem = useCallback(({ item, index }: { item: TitleDetails; index: number }) => (
    <PosterCard
      item={item}
      index={index}
      x={x}
      slotWidth={slotWidth}
      cardWidth={cardWidth}
      cardHeight={cardHeight}
      reduce={reduce}
      onOpen={onOpen}
    />
  ), [x, slotWidth, cardWidth, cardHeight, reduce, onOpen]);

  const title = current?.title ?? 'Discover your next favourite';
  const meta = current
    ? [current.year, current.type ? TYPE_LABEL[current.type] ?? current.type : null].filter(Boolean).join('  ·  ')
    : null;

  const titleStyle = useMemo(() => ({
    fontSize: title.length > 24 ? (wide ? 32 : 27) : (wide ? 40 : 34),
    lineHeight: title.length > 24 ? (wide ? 38 : 32) : (wide ? 46 : 39),
  }), [title, wide]);

  return (
    <Animated.View
      entering={reduce ? undefined : FadeIn.duration(450)}
      style={{
        width,
        minHeight: height,
        backgroundColor: theme.colors.background,
        overflow: 'hidden',
        paddingBottom: SPACING.lg,
      }}
    >
      {/* Background layer: sized to the content, never affects layout. */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.background }]}>
        <View
          style={[
            styles.ambientGlow,
            {
              top: headerOffset + 40,
              backgroundColor: theme.colors.accent,
              opacity: theme.isDark ? 0.18 : 0.09,
            },
          ]}
        />
        <GradientFade color={theme.colors.background} side="top" height={100} strength={0.9} steps={12} />
        <GradientFade color={theme.colors.background} side="bottom" height={Math.round(cardHeight * 0.6)} strength={1} steps={20} />
      </View>

      {/* Label row sits BELOW the greeting/Settings row that HomeScreen floats on top. */}
      <View
        style={[
          styles.topRow,
          { paddingHorizontal: gutter, marginTop: headerOffset + SPACING.md },
        ]}
      >
        <View style={[styles.activeLabel, { backgroundColor: theme.colors.accent }]}>
          <AppText color={theme.colors.accentText} variant="caption" style={styles.badgeText}>
            {label.toUpperCase()}
          </AppText>
        </View>
        <AppText
          variant="caption"
          muted
          numberOfLines={1}
          style={{ letterSpacing: 1.4, flexShrink: 1, textAlign: 'right' }}
        >
          A WORLD OF CINEMA
        </AppText>
      </View>

      <View style={{ height: cardHeight + 30, justifyContent: 'center', marginTop: SPACING.sm }}>
        <Animated.FlatList
          key={`${width}-${cardWidth}-${cardHeight}`}
          horizontal
          data={items}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.ids.imdb ?? (item.ids.tmdb !== null ? `tmdb:${item.ids.tmdb}` : `${item.title}-${index}`)}
          showsHorizontalScrollIndicator={false}
          bounces={false}
          decelerationRate="fast"
          snapToInterval={slotWidth}
          snapToAlignment="start"
          disableIntervalMomentum
          contentContainerStyle={{ paddingHorizontal: sidePadding }}
          getItemLayout={(_, index) => ({ length: slotWidth, offset: slotWidth * index, index })}
          onScroll={onScroll}
          onMomentumScrollEnd={onMomentumEnd}
          scrollEventThrottle={16}
          initialNumToRender={3}
          windowSize={5}
          accessibilityLabel={`${label}, ${items.length} titles`}
        />
      </View>

      {/* Dots live in the normal flow, directly under the posters. */}
      {items.length > 1 ? (
        <View accessibilityLabel={`Featured title ${activeIndex + 1} of ${items.length}`} style={styles.dots}>
          {items.map((_, index) => (
            <PageDot key={index} index={index} x={x} slotWidth={slotWidth} reduce={reduce} />
          ))}
        </View>
      ) : null}

      <View style={[styles.titleBlock, { paddingHorizontal: gutter }]}>
        {meta ? <AppText variant="caption" muted style={styles.meta}>{meta}</AppText> : null}
        <AppText accessibilityRole="header" numberOfLines={2} style={[styles.title, titleStyle]}>
          {title}
        </AppText>
        {current?.plot ? (
          <AppText muted numberOfLines={2} ellipsizeMode="tail" style={styles.plot}>{current.plot}</AppText>
        ) : null}

        <View style={styles.actions}>
          <AppButton
            label="Explore film"
            onPress={() => current && onOpen(current)}
            style={{ flex: 1 }}
          />
          <AppButton label="Search" variant="ghost" onPress={onSearch} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  activeLabel: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADII.pill,
  },
  badgeText: {
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  ambientGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    alignSelf: 'center',
  },
  posterBottomShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '30%',
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  posterBadge: {
    position: 'absolute',
    left: SPACING.sm,
    bottom: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  titleBlock: {
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  meta: {
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    textAlign: 'center',
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  plot: {
    textAlign: 'center',
    maxWidth: 540,
    lineHeight: 21,
  },
  actions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.xs,
  },
});