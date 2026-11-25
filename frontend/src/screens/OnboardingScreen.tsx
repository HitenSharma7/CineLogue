import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  Extrapolation,
  FadeIn,
  FadeInDown,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { LogoMark } from '@/components/Logo';
import { Screen } from '@/components/Screen';
import { BRAND } from '@/config/brand';
import { RADII, SPACING } from '@/constants/layout';
import { setOnboarded } from '@/hooks/AppFlow';
import { useReducedMotionPref } from '@/hooks/useReducedMotionPref';
import { useTheme } from '@/styles/ThemeProvider';

const PAGES = [
  { title: 'Find your next watch', body: 'Search movies and series and open full details in a couple of taps.' },
  { title: 'Keep track of what you love', body: 'Watchlists, ratings and reviews are on the way, once the backend supports them.' },
  { title: 'Taste, shared', body: 'Taste DNA and following fellow cinephiles are planned. We only show real data, never made-up activity.' },
];

/**
 * Poster image URLs. Duplicates and empty entries are removed automatically.
 * Leave empty to show the gradient placeholder tiles. Use only images you have rights to display.
 */
const RAW_POSTERS: (string | undefined)[] = [
  // Indian cinema
  'https://www.themoviedb.org/t/p/w1280/bQtT9GsMtPjjfkFPXUSN9pt7uts.jpg',
  'https://image.tmdb.org/t/p/original/14zedCaF044yj3at1TJ2uHpaNQD.jpg',
  'https://www.themoviedb.org/t/p/w1280/ov8vrRLZGoXHpYjSY9Vpv1tHJX7.jpg',
  'https://i.pinimg.com/1200x/76/3f/95/763f9549c167ca605e1e0796fde33c65.jpg',
  'https://i.pinimg.com/736x/88/5e/07/885e07c34950929483ff48cb59d3edfc.jpg',
  'https://image.tmdb.org/t/p/original/cIVqxRhzCIJPTAE2RhH9rumvYKi.jpg',

  // International cinema
  'https://image.tmdb.org/t/p/w342/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
  'https://image.tmdb.org/t/p/w342/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
  'https://image.tmdb.org/t/p/w342/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
  'https://image.tmdb.org/t/p/w342/7WUHnWGx5OO145IRxPDUkQSh4C7.jpg',
  'https://image.tmdb.org/t/p/w342/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg',
  'https://image.tmdb.org/t/p/w342/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
  'https://image.tmdb.org/t/p/w342/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
  'https://image.tmdb.org/t/p/w342/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
  'https://image.tmdb.org/t/p/w342/74xTEgt7R36Fpooo50r9T25onhq.jpg',
  'https://image.tmdb.org/t/p/w342/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg',
  'https://image.tmdb.org/t/p/w342/2cxhvwyEwRlysAmRH4gqj7W0CDX.jpg',
  'https://image.tmdb.org/t/p/w342/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg',
];
const POSTERS: string[] = Array.from(new Set(RAW_POSTERS.filter((u): u is string => !!u)));

const FALLBACK_GRADIENTS: [string, string][] = [
  ['#7A0C14', '#1A0508'],
  ['#12304D', '#050B14'],
  ['#3B1C5A', '#0C0614'],
  ['#0F4C45', '#04120F'],
  ['#5A3A12', '#140D04'],
  ['#4A1230', '#12040B'],
];

const COLS = 3;
const GAP = 10;
const PER_COL = 6;

/** Safe "color with alpha" for hex or rgb() colors; never produces an invalid string. */
function withAlpha(color: string | undefined, a: number): string {
  const c = color ?? '#0B0B0F';
  if (c.startsWith('#')) {
    let h = c.slice(1);
    if (h.length === 3 || h.length === 4) h = h.split('').map((x) => x + x).join('');
    if (h.length >= 6) {
      const r = parseInt(h.slice(0, 2), 16);
      const g = parseInt(h.slice(2, 4), 16);
      const b = parseInt(h.slice(4, 6), 16);
      return `rgba(${r},${g},${b},${a})`;
    }
  }
  const m = c.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (m) return `rgba(${m[1]},${m[2]},${m[3]},${a})`;
  return `rgba(11,11,15,${a})`;
}

/* ───────────────────────── Poster wall ───────────────────────── */

function PosterTile({ w, h, index, uri }: { w: number; h: number; index: number; uri?: string }) {
  const g = FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length];
  const o = useSharedValue(0);
  const imgStyle = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <View
      style={{
        width: w,
        height: h,
        borderRadius: RADII.md ?? 14,
        overflow: 'hidden',
        marginBottom: GAP,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      {/* Gradient always sits underneath, so there is never an empty hole while images load */}
      <LinearGradient colors={g} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', inset: 0 }} />
      {uri ? (
        <Animated.Image
          source={{ uri }}
          resizeMode="cover"
          onLoad={() => {
            o.value = withTiming(1, { duration: 600 });
          }}
          style={[{ width: '100%', height: '100%' }, imgStyle]}
        />
      ) : null}
    </View>
  );
}

function PosterColumn({
  col,
  w,
  h,
  direction,
  offset,
  reduce,
}: {
  col: number;
  w: number;
  h: number;
  direction: 1 | -1;
  offset: number;
  reduce: boolean;
}) {
  const loop = PER_COL * (h + GAP);
  const y = useSharedValue(direction === 1 ? -loop : 0);

  useEffect(() => {
    if (reduce) return;
    y.value = direction === 1 ? -loop : 0;
    y.value = withRepeat(
      withTiming(direction === 1 ? 0 : -loop, { duration: 42000 + col * 7000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [reduce, loop, direction, col, y]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  // Posters are interleaved across columns so neighbouring columns never show the same poster.
  const items = useMemo(() => Array.from({ length: PER_COL * 2 }, (_, k) => k % PER_COL), []);

  return (
    <View style={{ width: w, marginTop: offset }}>
      <Animated.View style={style}>
        {items.map((k, idx) => {
          const n = k * COLS + col;
          const uri = POSTERS.length ? POSTERS[n % POSTERS.length] : undefined;
          return <PosterTile key={idx} w={w} h={h} index={n} uri={uri} />;
        })}
      </Animated.View>
    </View>
  );
}

/* ───────────────────────── Pager bits ───────────────────────── */

function PageCopy({
  page,
  index,
  scrollX,
  pageW,
}: {
  page: (typeof PAGES)[number];
  index: number;
  scrollX: SharedValue<number>;
  pageW: number;
}) {
  const style = useAnimatedStyle(() => {
    const d = scrollX.value / pageW - index;
    const a = Math.abs(d);
    return {
      opacity: interpolate(a, [0, 0.75], [1, 0], Extrapolation.CLAMP),
      transform: [
        { translateY: interpolate(a, [0, 1], [0, 14], Extrapolation.CLAMP) },
        { scale: interpolate(a, [0, 1], [1, 0.94], Extrapolation.CLAMP) },
      ],
    };
  });
  return (
    <Animated.View style={[{ width: pageW, gap: SPACING.sm, alignItems: 'center' }, style]}>
      <AppText variant="display" accessibilityRole="header" style={{ textAlign: 'center' }}>
        {page.title}
      </AppText>
      <AppText muted style={{ textAlign: 'center' }}>
        {page.body}
      </AppText>
    </Animated.View>
  );
}

function Dot({ index, scrollX, pageW, color, onPress }: { index: number; scrollX: SharedValue<number>; pageW: number; color: string; onPress: () => void }) {
  const style = useAnimatedStyle(() => {
    const p = scrollX.value / pageW;
    const range = [index - 1, index, index + 1];
    return {
      width: interpolate(p, range, [8, 26, 8], Extrapolation.CLAMP),
      opacity: interpolate(p, range, [0.3, 1, 0.3], Extrapolation.CLAMP),
    };
  });
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Go to page ${index + 1}`}>
      <Animated.View style={[{ height: 8, borderRadius: RADII.pill, backgroundColor: color }, style]} />
    </Pressable>
  );
}

/* ───────────────────────── Screen ───────────────────────── */

export function OnboardingScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const reduce = useReducedMotionPref();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [i, setI] = useState(0);
  const last = i === PAGES.length - 1;

  const colors = theme.colors as any;
  const bg: string = colors.background ?? '#0B0B0F';
  const accent: string = colors.accent ?? '#C40000';

  const isWide = width >= 600;
  const contentW = Math.min(width, isWide ? 480 : width);
  const pageW = contentW - SPACING.xl * 2;

  // Poster wall sizing: responsive to width, height-capped so the copy always fits.
  const wallW = Math.min(width, 640);
  const edge = SPACING.md;
  const tileW = (wallW - edge * 2 - GAP * (COLS - 1)) / COLS;
  const tileH = tileW * 1.5;
  const heroH = Math.max(300, Math.round(height * (isWide ? 0.5 : 0.57)));

  // Scroll-driven state
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollX = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  useAnimatedReaction(
    () => Math.round(scrollX.value / pageW),
    (cur, prev) => {
      if (cur !== prev && cur >= 0 && cur < PAGES.length) runOnJS(setI)(cur);
    },
    [pageW],
  );

  const goTo = useCallback(
    (k: number) => {
      scrollRef.current?.scrollTo({ x: k * pageW, animated: !reduce });
    },
    [pageW, reduce, scrollRef],
  );

  const finish = async (to: '/(tabs)/home' | '/login') => {
    await setOnboarded();
    router.replace(to);
  };

  // The wall drifts sideways a little as the user swipes through pages.
  const wallParallax = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(scrollX.value, [0, pageW * (PAGES.length - 1)], [0, -28], Extrapolation.CLAMP),
      },
    ],
  }));

  return (
    <Screen edges={['bottom']} style={{ padding: 0, backgroundColor: bg }}>
      {/* ── Poster wall ── */}
      <View style={{ height: heroH, alignItems: 'center', overflow: 'hidden' }} pointerEvents="none">
        <Animated.View
          entering={reduce ? undefined : FadeIn.duration(900)}
          style={[
            {
              width: wallW,
              flexDirection: 'row',
              gap: GAP,
              paddingHorizontal: edge,
              marginTop: -tileH * 0.35,
              transform: [{ rotate: '-8deg' }, { scale: 1.22 }],
            },
            wallParallax,
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {Array.from({ length: COLS }, (_, c) => (
            <PosterColumn
              key={c}
              col={c}
              w={tileW}
              h={tileH}
              direction={c % 2 === 0 ? -1 : 1}
              offset={c === 1 ? -tileH * 0.45 : c === 2 ? tileH * 0.15 : 0}
              reduce={reduce}
            />
          ))}
        </Animated.View>

        {/* Accent glow rising from behind the copy */}
        <LinearGradient
          colors={[withAlpha(accent, 0), withAlpha(accent, 0.22)]}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: heroH * 0.55 }}
        />
        {/* Fade into content */}
        <LinearGradient
          colors={[withAlpha(bg, 0), withAlpha(bg, 0.65), bg]}
          locations={[0, 0.6, 1]}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: heroH * 0.62 }}
        />
        {/* Top vignette for the logo */}
        <LinearGradient
          colors={[withAlpha(bg, 0.85), withAlpha(bg, 0)]}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, height: insets.top + 110 }}
        />
      </View>

      {/* ── Logo ── */}
      <Animated.View
        entering={reduce ? undefined : FadeInDown.delay(150).duration(500)}
        style={{ position: 'absolute', top: insets.top + SPACING.md, left: 0, right: 0, alignItems: 'center' }}
        pointerEvents="none"
      >
        <LogoMark size={44} />
      </Animated.View>

      {/* ── Copy + actions ── */}
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: contentW,
          alignSelf: 'center',
          paddingHorizontal: SPACING.xl,
          justifyContent: 'flex-end',
          paddingBottom: SPACING.lg,
          gap: SPACING.lg,
        }}
      >
        <View style={{ alignItems: 'center', gap: SPACING.sm }}>
          <AppText muted variant="caption" style={{ letterSpacing: 2.5, textTransform: 'uppercase' }}>
            {BRAND.tagline}
          </AppText>

          {/* Swipeable pages */}
          <Animated.ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={pageW}
            style={{ width: pageW, flexGrow: 0 }}
          >
            {PAGES.map((p, k) => (
              <PageCopy key={k} page={p} index={k} scrollX={scrollX} pageW={pageW} />
            ))}
          </Animated.ScrollView>
        </View>

        {/* Dots */}
        <View
          accessible
          accessibilityLabel={`Page ${i + 1} of ${PAGES.length}`}
          style={{ flexDirection: 'row', gap: SPACING.sm, justifyContent: 'center', alignItems: 'center' }}
        >
          {PAGES.map((_, k) => (
            <Dot key={k} index={k} scrollX={scrollX} pageW={pageW} color={accent} onPress={() => goTo(k)} />
          ))}
        </View>

        {/* Actions: primary button stays in the same spot on every page */}
        <Animated.View entering={reduce ? undefined : FadeInDown.delay(300).duration(500)} style={{ gap: SPACING.md }}>
          <AppButton
            label={last ? 'Get started' : 'Next'}
            onPress={() => (last ? finish('/(tabs)/home') : goTo(i + 1))}
          />
          <View style={{ minHeight: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
            {last ? (
              <>
                <AppText muted variant="caption">Already have an account?</AppText>
                <Pressable onPress={() => finish('/login')} hitSlop={12} accessibilityRole="link">
                  <AppText variant="caption" style={{ color: accent, fontWeight: '700' }}>
                    Sign in
                  </AppText>
                </Pressable>
              </>
            ) : (
              <Pressable onPress={() => finish('/(tabs)/home')} hitSlop={12} accessibilityRole="button" accessibilityLabel="Skip onboarding">
                <AppText muted variant="caption" style={{ fontWeight: '600' }}>
                  Skip for now
                </AppText>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </View>
    </Screen>
  );
}