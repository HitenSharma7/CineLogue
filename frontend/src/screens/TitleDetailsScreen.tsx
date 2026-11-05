import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { MoviePoster } from '@/components/MoviePoster';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Skeleton } from '@/components/Skeleton';
import { StateView } from '@/components/StateView';
import { RADII, SPACING } from '@/constants/layout';
import { useResponsive } from '@/hooks/useResponsive';
import { useTitleDetails } from '@/hooks/useTitleDetails';
import { asTitleType } from '@/services/movieService';
import { useTheme } from '@/styles/ThemeProvider';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.55; // 55% of the screen for cinematic impact

const TYPE_LABEL: Record<string, string> = {
  movie: 'FILM',
  series: 'SERIES',
};

function formatRuntime(minutes: number | null): string | null {
  if (minutes == null || minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours > 0
    ? `${hours}h ${remainingMinutes}m`
    : `${remainingMinutes}m`;
}

function formatReleaseDate(date: string | null): string | null {
  if (!date) return null;
  const parsed = new Date(`${date.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function TitleDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string; type?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const rawType = Array.isArray(params.type) ? params.type[0] : params.type;
  const type = asTitleType(rawType);
  const { data, loading, error, retry } = useTitleDetails(id, type);

  const r = useResponsive();
  const { theme } = useTheme();

  // Animated values for Parallax effect
  const scrollY = useRef(new Animated.Value(0)).current;

  const posterW = r.isTablet
    ? 280
    : Math.min(Math.round(r.inner * 0.45), 180); // Slightly smaller to look sleek next to text
  const posterH = r.posterHeight(posterW);

  const runtimeLabel = data ? formatRuntime(data.runtime) : null;
  const releaseDateLabel = data ? formatReleaseDate(data.releaseDate) : null;

  // Parallax interpolations
  const heroTranslateY = scrollY.interpolate({
    inputRange: [-HERO_HEIGHT, 0, HERO_HEIGHT],
    outputRange: [-HERO_HEIGHT * 0.5, 0, HERO_HEIGHT * 0.3], // Moves slower than scroll
    extrapolate: 'clamp',
  });

  const heroScale = scrollY.interpolate({
    inputRange: [-HERO_HEIGHT, 0],
    outputRange: [2, 1], // Zooms in when pulling down
    extrapolateRight: 'clamp',
  });

  return (
    <Screen>
      <ScreenHeader title="CineLogue" />

      {loading ? (
        <View style={styles.loading}>
          <Skeleton width="100%" height={HERO_HEIGHT} />
          <View style={styles.loadingOverlap}>
            <Skeleton width={posterW} height={posterH} />
            <View style={{ flex: 1, gap: 10 }}>
              <Skeleton width="90%" height={32} />
              <Skeleton width="60%" height={20} />
            </View>
          </View>
        </View>
      ) : error || !data ? (
        <StateView
          kind="error"
          title="Couldn't load this film"
          message={error?.message}
          onRetry={retry}
        />
      ) : (
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: SPACING.xxl }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
          {/* Parallax Hero Artwork */}
          <View style={[styles.hero, { height: HERO_HEIGHT }]}>
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                { transform: [{ translateY: heroTranslateY }, { scale: heroScale }] },
              ]}
            >
              {data.backdrop || data.poster ? (
                <Image
                  source={{ uri: data.backdrop ?? data.poster ?? undefined }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  contentPosition="top center"
                  blurRadius={data.backdrop ? 0 : 8}
                  transition={500}
                />
              ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.surfaceElevated }]} />
              )}
            </Animated.View>

            {/* Smooth Cinematic Gradient to blend with content */}
            <LinearGradient
              colors={[
                'transparent',
                'rgba(0,0,0,0.3)',
                theme.colors.background,
              ]}
              locations={[0, 0.6, 1]}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.heroContent}>
              <View style={[styles.eyebrow, { borderColor: theme.colors.accent }]}>
                <AppText color={theme.colors.accent} variant="caption" style={styles.eyebrowText}>
                  {TYPE_LABEL[data.type ?? ''] ?? 'NOW SHOWING'}
                </AppText>
              </View>
            </View>
          </View>

          {/* Overlapping Content Section */}
          <View
            style={[
              styles.content,
              { 
                paddingHorizontal: r.gutter,
                backgroundColor: theme.colors.background,
              },
            ]}
          >
            <View style={[styles.movieLayout, r.isTablet && styles.tabletLayout]}>
              
              {/* Main Poster with Glow Effect */}
              <View style={[styles.posterWrap, { shadowColor: theme.colors.accent }]}>
                <MoviePoster
                  uri={data.poster}
                  title={data.title}
                  width={posterW}
                  showCaption={false}
                />
              </View>

              <View style={styles.details}>
                <AppText variant="display" accessibilityRole="header" style={styles.title}>
                  {data.title}
                </AppText>

                <View style={styles.metadata}>
                  {data.year != null && <AppText muted style={styles.metadataText}>{data.year}</AppText>}
                  {data.year != null && data.type && <AppText muted>·</AppText>}
                  {data.type && <AppText muted style={styles.metadataText}>{TYPE_LABEL[data.type] ?? data.type}</AppText>}
                </View>

                {/* Pill-shaped Genre Chips */}
                {(data.genres?.length ?? 0) > 0 && (
                  <View style={styles.genreRow}>
                    {data.genres.map((genre) => (
                      <View key={genre} style={[styles.genreChip, { backgroundColor: theme.colors.surfaceElevated }]}>
                        <AppText variant="caption" style={{ opacity: 0.85 }}>{genre}</AppText>
                      </View>
                    ))}
                  </View>
                )}

                {(runtimeLabel || releaseDateLabel) && (
                  <View style={styles.metadata}>
                    {runtimeLabel && <AppText muted>{runtimeLabel}</AppText>}
                    {runtimeLabel && releaseDateLabel && <AppText muted>·</AppText>}
                    {releaseDateLabel && <AppText muted>{releaseDateLabel}</AppText>}
                  </View>
                )}

                {/* Rating with bold highlight */}
                {data.rating != null && (
                  <View style={styles.ratingRow}>
                    <AppText style={styles.star}>★</AppText>
                    <AppText variant="heading" style={{ fontSize: 24 }}>
                      {data.rating.toFixed(1)}
                    </AppText>
                    <AppText muted variant="caption" style={{ marginTop: 4 }}>
                      / 10
                    </AppText>
                  </View>
                )}

                {/* Synopsis */}
                <View style={styles.section}>
                  <View style={[styles.accentLine, { backgroundColor: theme.colors.accent }]} />
                  <AppText muted={!data.plot} style={styles.synopsis}>
                    {data.plot ?? 'The story is waiting to be discovered.'}
                  </AppText>
                </View>
              </View>
            </View>

            {/* Cast & Characters Carousel */}
            {((data.credits?.actors.length ?? 0) > 0 || (data.cast?.length ?? 0) > 0) && (
              <View style={[styles.section, styles.marginTopLg]}>
                <View style={styles.sectionHeading}>
                  <View>
                    <AppText variant="caption" style={[styles.sectionEyebrow, { color: theme.colors.accent }]}>
                      THE PEOPLE BEHIND THE STORY
                    </AppText>
                    <AppText variant="heading" style={styles.sectionTitle}>
                      Cast & Characters
                    </AppText>
                  </View>
                </View>

                <Animated.ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.castCarousel}
                  snapToInterval={130} // Sleek snapping behavior
                  decelerationRate="fast"
                >
                  {(data.credits?.actors?.length
                    ? data.credits.actors
                    : data.cast.map((name) => ({
                        name, role: null, profile: null, tmdb_id: null,
                      }))
                  ).map((person, index) => (
                    <View key={`${person.tmdb_id ?? person.name}-${index}`} style={styles.personCard}>
                      <View style={[styles.personPortrait, { backgroundColor: theme.colors.surfaceElevated }]}>
                        {person.profile && (
                          <Image
                            source={{ uri: person.profile }}
                            style={StyleSheet.absoluteFill}
                            contentFit="cover"
                            transition={250}
                          />
                        )}
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.8)']}
                          style={styles.portraitShade}
                        />
                      </View>
                      <View style={styles.personInfo}>
                        <AppText style={styles.personName} numberOfLines={1}>{person.name}</AppText>
                        {person.role && (
                          <AppText muted variant="caption" style={styles.personRole} numberOfLines={1}>
                            {person.role}
                          </AppText>
                        )}
                      </View>
                    </View>
                  ))}
                </Animated.ScrollView>
              </View>
            )}

            {/* Director & Writer credits */}
            {((data.credits?.directors.length ?? 0) > 0 ||
              (data.credits?.writers.length ?? 0) > 0) && (
              <View style={[styles.section, styles.marginTopLg]}>
                <AppText
                  variant="caption"
                  style={[styles.sectionEyebrow, { color: theme.colors.accent }]}
                >
                  THE CREATIVE MINDS
                </AppText>
                <AppText variant="heading" style={styles.sectionTitle}>
                  Behind the Film
                </AppText>

                {(data.credits?.directors.length ?? 0) > 0 && (
                  <View style={styles.creditGroup}>
                    <AppText muted variant="caption">DIRECTED BY</AppText>
                    <AppText style={styles.creditNames}>
                      {data.credits!.directors.map((person) => person.name).join(', ')}
                    </AppText>
                  </View>
                )}

                {(data.credits?.writers.length ?? 0) > 0 && (
                  <View style={styles.creditGroup}>
                    <AppText muted variant="caption">WRITTEN BY</AppText>
                    <AppText style={styles.creditNames}>
                      {data.credits!.writers.map((person) => person.name).join(', ')}
                    </AppText>
                  </View>
                )}
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <AppButton
                label="＋ Add to Watchlist"
                variant="primary"
                style={{ height: 56, borderRadius: RADII.lg }}
                disabled
              />
              <AppButton
                label="Rate this film"
                variant="ghost"
                disabled
              />
            </View>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
              <AppText variant="caption" muted style={{ letterSpacing: 1.5 }}>
                CINELOGUE · FILM DISCOVERY
              </AppText>
            </View>
          </View>
        </Animated.ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  floatingHeader: {
    position: 'absolute',
    top: 0,
    zIndex: 10,
    width: '100%',
    backgroundColor: 'transparent',
  },
  loading: { flex: 1 },
  loadingOverlap: {
    flexDirection: 'row',
    padding: SPACING.xl,
    marginTop: -80,
    gap: SPACING.lg,
  },
  hero: {
    width: SCREEN_WIDTH,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  heroContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 70, // Extra padding to account for the overlapping content
    alignItems: 'center',
  },
  eyebrow: {
    borderWidth: 1.5,
    borderRadius: RADII.pill,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.4)', // Glassy badge
  },
  eyebrowText: {
    fontWeight: '900',
    letterSpacing: 3,
    fontSize: 11,
  },
  content: {
    gap: SPACING.xl,
    marginTop: -40, // Pulls the content up over the gradient
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: SPACING.xl,
  },
  movieLayout: {
    flexDirection: 'row', // Side-by-side poster and details
    alignItems: 'flex-start',
    gap: SPACING.xl,
    marginTop: -60, // Pull poster up even higher for a 3D layered look
  },
  tabletLayout: {
    gap: SPACING.xxl,
  },
  posterWrap: {
    borderRadius: RADII.md,
    elevation: 12, // Android shadow
    shadowOffset: { width: 0, height: 10 }, // iOS shadow
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  details: {
    flex: 1,
    gap: SPACING.md,
    paddingTop: 45, // Push text down so it aligns well next to the protruding poster
  },
  title: {
    fontWeight: '900',
    letterSpacing: -0.5,
    fontSize: 28,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  metadataText: {
    fontWeight: '600',
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  genreChip: {
    borderRadius: RADII.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  star: {
    fontSize: 26,
    color: '#D9A441',
    textShadowColor: 'rgba(217, 164, 65, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  accentLine: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: SPACING.sm,
  },
  section: {
    gap: SPACING.sm,
  },
  marginTopLg: {
    marginTop: SPACING.lg,
  },
  synopsis: {
    lineHeight: 24,
    fontSize: 15,
    opacity: 0.9,
  },
  sectionHeading: {
    marginBottom: SPACING.sm,
  },
  sectionEyebrow: {
    letterSpacing: 2,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionTitle: {
    fontWeight: '900',
    letterSpacing: -0.5,
    fontSize: 22,
  },
  castCarousel: {
    gap: SPACING.md,
    paddingRight: SPACING.xl,
    paddingVertical: SPACING.xs,
  },
  personCard: {
    width: 120,
    gap: 8,
  },
  personPortrait: {
    width: 120,
    height: 160,
    borderRadius: RADII.lg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  portraitShade: {
    height: '40%',
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  personInfo: {
    paddingHorizontal: 2,
  },
  personName: {
    fontWeight: '800',
    fontSize: 14,
  },
  personRole: {
    fontSize: 12,
  },
  creditGroup: {
    gap: SPACING.xs,
    padding: SPACING.md,
    borderRadius: RADII.md,
    backgroundColor: 'rgba(127, 127, 127, 0.08)',
  },
  creditNames: {
    fontWeight: '700',
    lineHeight: 22,
  },
  actions: {
    marginTop: SPACING.xl,
    gap: SPACING.md,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: SPACING.xl,
    paddingTop: SPACING.xl,
    alignItems: 'center',
  },
});