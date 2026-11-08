import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';

import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { FeaturedCarousel } from '@/components/browse/Featuredcarousel';
import { GenreCard, GenreHero } from '@/components/browse/Genrecard';
import { ArrowGlyph, Orb, SearchGlyph, Sparkle } from '@/components/browse/Glyphs';
import { Gradient } from '@/components/browse/Gradient';
import { MoodChip } from '@/components/browse/Moodchip';
import { PressableScale } from '@/components/browse/Pressablescale';
import { ResultsPlaceholder } from '@/components/browse/Resultsplaceholder';
import { SegmentedControl } from '@/components/browse/Segmentedcontrol';
import { SparkleField } from '@/components/browse/Sparklefield';
import {
  GENRES,
  GENRE_BY_SLUG,
  MOODS,
  getFeatured,
  paletteOf,
  type Genre,
  type Mood,
} from '@/constants/genre';
import { MIN_TOUCH_TARGET, SPACING } from '@/constants/layout';
import { display, eyebrow, fitDisplay, tabular } from '@/constants/typography';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useResponsive } from '@/hooks/useResponsive';
import { useTheme } from '@/styles/ThemeProvider';
import { withAlpha } from '@/utils/color';

type MediaFilter = 'all' | 'movie' | 'series';

const FILTERS: readonly { key: MediaFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'movie', label: 'Movies' },
  { key: 'series', label: 'Series' },
];

const GAP = SPACING.md;
const MAX_CONTENT_WIDTH = 1080;
const COLUMN_STAGGER = 30;
/** Card heights as a multiple of card width. The varied rhythm is what makes the grid feel editorial. */
const HEIGHT_FACTORS = [1.3, 1.08, 1.14, 1.36, 1.22, 1.04, 1.32, 1.12];
const GLOW_HEIGHT = 520;

/* -------------------------------------------------------------------------- */
/* Local building blocks                                                      */
/* -------------------------------------------------------------------------- */

/** Fade + rise on mount. Remounting via `key` replays it, which gives view transitions. */
function Enter({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [progress, reduced]);

  return (
    <Animated.View
      style={[
        {
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

function SectionHeader({ eyebrowText, title, trailing }: { eyebrowText: string; title: string; trailing?: string }) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: SPACING.md }}>
      <View style={{ flexShrink: 1, gap: 4 }}>
        <AppText color={theme.colors.accent} style={eyebrow(10.5)}>
          {eyebrowText}
        </AppText>
        <AppText accessibilityRole="header" numberOfLines={2} maxFontSizeMultiplier={1.2} style={display(30)}>
          {title}
        </AppText>
      </View>
      {trailing ? (
        <AppText color={theme.colors.textMuted} style={[display(30, { italic: true, weight: '400' }), tabular]}>
          {trailing}
        </AppText>
      ) : null}
    </View>
  );
}

/** Horizontal rail that bleeds to the screen edges while content still aligns to the gutter. */
function Rail({ gutter, children }: { gutter: number; children: ReactNode }) {
  return (
    <Animated.ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      style={{ marginHorizontal: -gutter }}
      contentContainerStyle={{ paddingHorizontal: gutter, gap: SPACING.sm + 2 }}
    >
      {children}
    </Animated.ScrollView>
  );
}

function GlassButton({
  onPress,
  label,
  size = 48,
  children,
}: {
  onPress: () => void;
  label: string;
  size?: number;
  children: ReactNode;
}) {
  const { theme } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: withAlpha(theme.colors.text, 0.07),
        borderWidth: 1,
        borderColor: withAlpha(theme.colors.text, 0.16),
      }}
      contentStyle={{ alignItems: 'center', justifyContent: 'center' }}
    >
      {children}
    </PressableScale>
  );
}

/** A sparkle that turns slowly. The "surprise me" affordance. */
function SpinSparkle({ color }: { color: string }) {
  const reduced = useReducedMotion();
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 7000, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, spin]);

  return (
    <Animated.View
      style={{ transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}
    >
      <Sparkle size={22} color={color} />
    </Animated.View>
  );
}

function GenrePill({ genre, onPress }: { genre: Genre; onPress: (g: Genre) => void }) {
  const { theme } = useTheme();
  const pal = paletteOf(genre.accent);
  return (
    <PressableScale
      onPress={() => onPress(genre)}
      accessibilityRole="button"
      accessibilityLabel={`Open ${genre.name}`}
      style={{
        borderRadius: 999,
        backgroundColor: withAlpha(pal.base, 0.14),
        borderWidth: 1,
        borderColor: withAlpha(pal.glow, 0.36),
      }}
      contentStyle={{
        minHeight: MIN_TOUCH_TARGET + 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingLeft: 8,
        paddingRight: 18,
      }}
    >
      <Orb size={28} color={pal.glow} />
      <AppText color={theme.colors.text} maxFontSizeMultiplier={1.2} style={{ fontWeight: '700' }}>
        {genre.name}
      </AppText>
    </PressableScale>
  );
}

/* -------------------------------------------------------------------------- */
/* Screen                                                                     */
/* -------------------------------------------------------------------------- */

export function BrowseScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const r = useResponsive();

  const scrollRef = useRef<React.ComponentRef<typeof Animated.ScrollView> | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollX = useRef(new Animated.Value(0)).current;

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [filter, setFilter] = useState<MediaFilter>('all');
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);

  const selectedGenre = selectedSlug ? GENRE_BY_SLUG[selectedSlug] ?? null : null;
  const featured = useMemo(() => getFeatured(), []);

  /* ---- layout maths: measured from the real container, not the window ---- */
  const containerWidth = measuredWidth ?? Math.min(r.width, MAX_CONTENT_WIDTH);
  const available = Math.max(240, containerWidth - r.gutter * 2);

  const minCard = r.isTablet ? 200 : 150;
  const columns = Math.max(2, Math.floor((available + GAP) / (minCard + GAP)));
  const cardWidth = Math.floor((available - GAP * (columns - 1)) / columns);

  const posterColumns = Math.min(6, Math.max(3, Math.floor((available + GAP) / (112 + GAP))));
  const posterWidth = Math.floor((available - GAP * (posterColumns - 1)) / posterColumns);

  const featW = Math.round(Math.min(Math.max(containerWidth * 0.72, 250), 400));
  const featH = Math.round(featW * (r.isTablet ? 1.2 : 1.36));
  const featSnap = featW + GAP;

  const heroH = Math.round(Math.min(Math.max(available * 0.92, 320), 480));

  const masonry = useMemo(() => {
    const cols: { genre: Genre; index: number }[][] = Array.from({ length: columns }, () => []);
    GENRES.forEach((genre, index) => cols[index % columns].push({ genre, index }));
    return cols;
  }, [columns]);

  const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    setMeasuredWidth((prev) => (prev === w ? prev : w));
  }, []);

  const onScroll = useMemo(
    () => Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true }),
    [scrollY],
  );

  /* ---- navigation between landing and detail ---- */
  const openGenre = useCallback((genre: Genre) => {
    setSelectedSlug(genre.slug);
    setFilter('all');
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  const goBack = useCallback(() => {
    setSelectedSlug(null);
    setFilter('all');
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  const surprise = useCallback(() => {
    const pool = GENRES.filter((g) => g.slug !== selectedSlug);
    openGenre(pool[Math.floor(Math.random() * pool.length)]);
  }, [openGenre, selectedSlug]);

  // Android hardware / gesture back closes the genre first instead of leaving the tab.
  useEffect(() => {
    if (!selectedGenre) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [selectedGenre, goBack]);

  const openSearch = useCallback(() => router.push('/(tabs)/search'), [router]);

  const moods = useMemo(
    () =>
      MOODS.map((mood) => ({ mood, genre: GENRE_BY_SLUG[mood.genreSlug] })).filter(
        (item): item is { mood: Mood; genre: Genre } => Boolean(item.genre),
      ),
    [],
  );

  const filterLabel = FILTERS.find((f) => f.key === filter)?.label ?? 'All';

  const glowShift = scrollY.interpolate({ inputRange: [0, 420], outputRange: [0, -150], extrapolate: 'clamp' });
  const heroShift = scrollY.interpolate({ inputRange: [-200, 0, 360], outputRange: [-50, 0, 80], extrapolate: 'clamp' });

  return (
    <Screen>
      <View style={{ flex: 1 }}>
        {/* Ambient light: the screen takes on the colour of whatever genre is centred. */}
        <Animated.View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: GLOW_HEIGHT, transform: [{ translateY: glowShift }] }}
        >
          {selectedGenre ? (
            <Gradient colors={[withAlpha(paletteOf(selectedGenre.accent).glow, 0.5), withAlpha(paletteOf(selectedGenre.accent).glow, 0)]} />
          ) : (
            featured.map((genre, i) => {
              const inputRange = [(i - 1) * featSnap, i * featSnap, (i + 1) * featSnap];
              return (
                <Animated.View
                  key={genre.slug}
                  style={[
                    StyleSheet.absoluteFill,
                    { opacity: scrollX.interpolate({ inputRange, outputRange: [0, 1, 0], extrapolate: 'clamp' }) },
                  ]}
                >
                  <Gradient colors={[withAlpha(paletteOf(genre.accent).glow, 0.5), withAlpha(paletteOf(genre.accent).glow, 0)]} />
                </Animated.View>
              );
            })
          )}
          <SparkleField count={8} seed={selectedGenre ? 5 : 3} color={theme.colors.accent} minSize={5} maxSize={12} />
        </Animated.View>

        <Animated.ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          onScroll={onScroll}
          contentContainerStyle={{ paddingBottom: SPACING.xxxl * 1.5, alignItems: 'center' }}
        >
          <View onLayout={onContainerLayout} style={{ width: '100%', maxWidth: MAX_CONTENT_WIDTH }}>
            {/* ------------------------------ HEADER ------------------------------ */}
            <View style={{ paddingHorizontal: r.gutter, paddingTop: SPACING.xl, gap: SPACING.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: SPACING.md }}>
                <View style={{ flexShrink: 1, gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Sparkle size={12} color={theme.colors.accent} />
                    <AppText color={theme.colors.accent} style={eyebrow(11)}>
                      Cinelogue
                    </AppText>
                  </View>
                  <AppText
                    accessibilityRole="header"
                    numberOfLines={1}
                    maxFontSizeMultiplier={1.15}
                    style={display(fitDisplay('Discover', available - 72, 50, 32))}
                  >
                    Discover
                  </AppText>
                  <AppText color={theme.colors.textMuted} numberOfLines={2} style={{ fontSize: 14, lineHeight: 20 }}>
                    Find the film that fits tonight.
                  </AppText>
                </View>

                <GlassButton onPress={surprise} label="Surprise me with a random genre" size={52}>
                  <SpinSparkle color={theme.colors.accent} />
                </GlassButton>
              </View>

              <Pressable
                onPress={openSearch}
                accessibilityRole="search"
                accessibilityLabel="Search movies and series"
                style={({ pressed }) => ({
                  minHeight: 56,
                  paddingHorizontal: 18,
                  borderRadius: 28,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  backgroundColor: withAlpha(theme.colors.text, pressed ? 0.1 : 0.06),
                  borderWidth: 1,
                  borderColor: pressed ? theme.colors.accent : withAlpha(theme.colors.text, 0.14),
                })}
              >
                <SearchGlyph size={20} color={theme.colors.accent} thickness={2} />
                <AppText color={theme.colors.textMuted} numberOfLines={1} style={{ flex: 1, fontSize: 15 }}>
                  Titles, people, moods
                </AppText>
                <ArrowGlyph size={16} color={theme.colors.textMuted} thickness={1.8} />
              </Pressable>
            </View>

            {/* ------------------------------ BODY -------------------------------- */}
            {!selectedGenre ? (
              <Enter key="landing" style={{ paddingTop: SPACING.lg, gap: SPACING.xl + 8 }}>
                {/* Featured coverflow (full bleed) */}
                <FeaturedCarousel
                  genres={featured}
                  viewportWidth={containerWidth}
                  cardWidth={featW}
                  cardHeight={featH}
                  gap={GAP}
                  tall={r.isTablet}
                  scrollX={scrollX}
                  onPress={openGenre}
                />

                <View style={{ paddingHorizontal: r.gutter, gap: SPACING.xl + 8 }}>
                  <View style={{ gap: SPACING.md + 2 }}>
                    <SectionHeader eyebrowText="By feeling" title="Tonight, I'm feeling" />
                    <Rail gutter={r.gutter}>
                      {moods.map(({ mood, genre }) => (
                        <MoodChip key={mood.key} mood={mood} genre={genre} onPress={openGenre} />
                      ))}
                    </Rail>
                  </View>

                  <View style={{ gap: SPACING.md + 2 }}>
                    <SectionHeader eyebrowText="The full shelf" title="Every genre" trailing={String(GENRES.length)} />
                    <View style={{ flexDirection: 'row', gap: GAP, alignItems: 'flex-start' }}>
                      {masonry.map((column, ci) => (
                        <View
                          key={ci}
                          style={{ width: cardWidth, gap: GAP, paddingTop: (ci % 2) * COLUMN_STAGGER }}
                        >
                          {column.map(({ genre, index }) => (
                            <GenreCard
                              key={genre.slug}
                              genre={genre}
                              index={index}
                              width={cardWidth}
                              height={Math.round(cardWidth * HEIGHT_FACTORS[index % HEIGHT_FACTORS.length])}
                              onPress={openGenre}
                            />
                          ))}
                        </View>
                      ))}
                    </View>
                  </View>

                  <PressableScale
                    onPress={surprise}
                    accessibilityRole="button"
                    accessibilityLabel="Surprise me with a random genre"
                    style={{
                      borderRadius: 30,
                      backgroundColor: withAlpha(theme.colors.accent, 0.14),
                      borderWidth: 1,
                      borderColor: withAlpha(theme.colors.accent, 0.5),
                    }}
                    contentStyle={{
                      minHeight: 60,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 12,
                      paddingHorizontal: 24,
                    }}
                  >
                    <SpinSparkle color={theme.colors.accent} />
                    <AppText color={theme.colors.text} style={{ fontWeight: '800', fontSize: 15 }}>
                      Can't decide? Surprise me
                    </AppText>
                  </PressableScale>
                </View>
              </Enter>
            ) : (
              <Enter
                key={selectedGenre.slug}
                style={{ paddingHorizontal: r.gutter, paddingTop: SPACING.lg, gap: SPACING.xl }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
                  <GlassButton onPress={goBack} label="Back to all genres" size={46}>
                    <ArrowGlyph size={18} rotate={180} color={theme.colors.text} thickness={2} />
                  </GlassButton>
                  <AppText color={theme.colors.textMuted} style={eyebrow(11)}>
                    All genres
                  </AppText>
                </View>

                <GenreHero genre={selectedGenre} width={available} height={heroH} tall={r.isTablet} shiftY={heroShift} />

                <View style={{ gap: SPACING.md + 2 }}>
                  <SectionHeader eyebrowText="Now showing" title={`Explore ${selectedGenre.name}`} />
                  <SegmentedControl
                    options={FILTERS}
                    value={filter}
                    onChange={setFilter}
                    accessibilityLabel="Show movies, series or both"
                  />
                </View>

                <ResultsPlaceholder
                  columns={posterColumns}
                  cardWidth={posterWidth}
                  gap={GAP}
                  title={`${filterLabel} in ${selectedGenre.name}`}
                  message="Titles will appear here as soon as the catalogue connects."
                />

                <View style={{ gap: SPACING.md + 2 }}>
                  <SectionHeader eyebrowText="Keep going" title="More genres" />
                  <Rail gutter={r.gutter}>
                    {GENRES.filter((g) => g.slug !== selectedGenre.slug).map((genre) => (
                      <GenrePill key={genre.slug} genre={genre} onPress={openGenre} />
                    ))}
                  </Rail>
                </View>
              </Enter>
            )}
          </View>
        </Animated.ScrollView>
      </View>
    </Screen>
  );
}