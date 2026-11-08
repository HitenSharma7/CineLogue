import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { HeroCarousel } from '@/components/HeroCarousel';
import { PosterShelf } from '@/components/PosterShelf';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/Skeleton';
import { StateView } from '@/components/StateView';
import { BRAND } from '@/config/brand';
import { EDITORS_PICKS, EDITORS_PICKS_LABEL, EDITORS_PICKS_SUBTITLE, HERO_COUNT } from '@/config/editorsPicks';
import { HALL_OF_FAME, HALL_OF_FAME_SUBTITLE, HALL_OF_FAME_TITLE } from '@/config/hallOfFame';
import { MIN_TOUCH_TARGET, RADII, SPACING } from '@/constants/layout';
import { useEditorsPicks } from '@/hooks/useEditorsPicks';
import { useOpenTitle } from '@/hooks/useOpenTitle';
import { useReducedMotionPref } from '@/hooks/useReducedMotionPref';
import { useResponsive } from '@/hooks/useResponsive';
import { useTheme } from '@/styles/ThemeProvider';

const AVATAR_SIZE = 44;
// Height of the floating greeting row = the taller of avatar / Settings button.
const HEADER_ROW_HEIGHT = Math.max(AVATAR_SIZE, MIN_TOUCH_TARGET);

function greeting(): string {
  const h = new Date().getHours();
  return h < 5 ? 'Late night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

/** Deliberate placeholder: no account exists yet, so no fake name or photo. */
function AvatarPlaceholder({ size = AVATAR_SIZE }: { size?: number }) {
  const { theme } = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: theme.colors.surfaceElevated, borderWidth: 2, borderColor: theme.colors.accent, overflow: 'hidden', alignItems: 'center' }}
    >
      <View style={{ marginTop: size * 0.18, width: size * 0.34, height: size * 0.34, borderRadius: size * 0.17, backgroundColor: theme.colors.textMuted }} />
      <View style={{ marginTop: size * 0.06, width: size * 0.72, height: size * 0.5, borderRadius: size * 0.36, backgroundColor: theme.colors.textMuted }} />
    </View>
  );
}

export function HomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotionPref();
  const openTitle = useOpenTitle();
  const picks = useEditorsPicks(EDITORS_PICKS);
  const hallOfFame = useEditorsPicks(HALL_OF_FAME);

  const goSearch = useCallback(() => router.push('/(tabs)/search'), [router]);
  const goProfile = useCallback(() => router.push('/(tabs)/profile'), [router]);
  const enter = (i: number) => (reduce ? undefined : FadeInDown.duration(380).delay(i * 90));

  // Hero needs artwork: prefer picks that have a poster, fall back to a text-only slide.
  const heroItems = useMemo(() => {
    const withArt = picks.items.filter((t) => t.poster);
    return (withArt.length > 0 ? withArt : picks.items).slice(0, HERO_COUNT);
  }, [picks.items]);

  // Floating greeting row: where it starts and how much room the hero must reserve for it.
  const headerTop = insets.top + SPACING.md;
  const headerOffset = headerTop + HEADER_ROW_HEIGHT;

  // Minimum hero height; the hero grows to fit its content if it needs more.
  const heroH = r.isTablet
    ? 560
    : Math.min(680, Math.max(520, Math.round(r.height * 0.68)));

  return (
    <Screen edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACING.xxl, gap: SPACING.xxl }}>
        <View style={{ width: r.contentWidth, alignSelf: 'center' }}>
          {picks.status === 'ready' && heroItems.length > 0 ? (
            <HeroCarousel
              items={heroItems}
              width={r.contentWidth}
              height={heroH}
              gutter={r.gutter}
              wide={r.isTablet}
              label="Editor's Pick"
              headerOffset={headerOffset}
              onOpen={openTitle}
              onSearch={goSearch}
            />
          ) : (
            <View style={{ width: r.contentWidth, height: heroH, backgroundColor: theme.colors.surface, justifyContent: 'flex-end', padding: r.gutter, gap: SPACING.md }}>
              {picks.status === 'loading' ? (
                <>
                  <Skeleton width="30%" height={22} radius={RADII.pill} />
                  <Skeleton width="85%" height={44} />
                  <Skeleton width="100%" height={60} />
                  <Skeleton width="100%" height={56} radius={RADII.pill} />
                </>
              ) : picks.status === 'error' ? (
                <StateView kind="error" title="Couldn't load featured titles" message={picks.error?.message} onRetry={picks.retry} />
              ) : (
                <>
                  <AppText variant="display" accessibilityRole="header">{BRAND.tagline}</AppText>
                  <AppButton label="Search movies and series" onPress={goSearch} />
                </>
              )}
            </View>
          )}

          {/* Greeting row floats at the very top; the hero reserves `headerOffset` so nothing sits under it. */}
          <View
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              top: headerTop,
              left: r.gutter,
              right: r.gutter,
              height: HEADER_ROW_HEIGHT,
              flexDirection: 'row',
              alignItems: 'center',
              gap: SPACING.md,
              zIndex: 10,
            }}
          >
            <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={goProfile} hitSlop={6}>
              <AvatarPlaceholder />
            </Pressable>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <AppText variant="caption" muted numberOfLines={1}>{greeting()},</AppText>
              <AppText variant="heading" numberOfLines={1}>Cinephile</AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Settings"
              onPress={() => router.push('/settings')}
              style={{ height: MIN_TOUCH_TARGET, paddingHorizontal: SPACING.lg, borderRadius: RADII.pill, justifyContent: 'center', backgroundColor: theme.colors.overlay, borderWidth: 1, borderColor: theme.colors.border }}
            >
              <AppText variant="caption">Settings</AppText>
            </Pressable>
          </View>
        </View>

        <Animated.View entering={enter(0)}>
          <PosterShelf
            title={EDITORS_PICKS_LABEL}
            subtitle={EDITORS_PICKS_SUBTITLE}
            size="lg"
            status={picks.status}
            items={picks.items}
            errorMessage={picks.error?.message}
            onOpen={openTitle}
            onRetry={picks.retry}
          />
        </Animated.View>

        <Animated.View entering={enter(1)}>
          <PosterShelf
            title={HALL_OF_FAME_TITLE}
            subtitle={HALL_OF_FAME_SUBTITLE}
            size="lg"
            status={hallOfFame.status}
            items={hallOfFame.items}
            errorMessage={hallOfFame.error?.message}
            onOpen={openTitle}
            onRetry={hallOfFame.retry}
          />
        </Animated.View>

        <Animated.View entering={enter(2)} style={{ paddingHorizontal: r.gutter }}>
          <View style={{ padding: SPACING.xl, borderRadius: RADII.xl, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, gap: SPACING.md, overflow: 'hidden' }}>
            <View pointerEvents="none" style={{ position: 'absolute', right: -50, top: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: theme.colors.accent, opacity: theme.isDark ? 0.22 : 0.12 }} />
            <AppText style={{ fontSize: 26, lineHeight: 32, fontWeight: '800' }} accessibilityRole="header">
              Looking for something else?
            </AppText>
            <AppText muted>Search the whole catalogue of movies and series.</AppText>
            <AppButton label="Search the catalogue" onPress={goSearch} />
          </View>
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}