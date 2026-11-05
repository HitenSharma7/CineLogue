import React, { useCallback } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/AppText';
import { MoviePoster } from '@/components/MoviePoster';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/Skeleton';
import { StateView } from '@/components/StateView';
import { EDITORS_PICKS, EDITORS_PICKS_LABEL, EDITORS_PICKS_SUBTITLE } from '@/config/editorsPicks';
import { MIN_TOUCH_TARGET, RADII, SPACING } from '@/constants/layout';
import { useEditorsPicks } from '@/hooks/useEditorsPicks';
import { useOpenTitle } from '@/hooks/useOpenTitle';
import { useResponsive } from '@/hooks/useResponsive';
import { useTheme } from '@/styles/ThemeProvider';
import type { TitleDetails } from '@/type/movie';

/** Discover tab: a browsable grid of the curated picks. Free-text search lives in the Search tab. */
export function BrowseScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const r = useResponsive();
  const openTitle = useOpenTitle();
  const picks = useEditorsPicks(EDITORS_PICKS);

  const columns = r.gridColumns(r.isTablet ? 160 : 120);
  const posterW = r.posterWidth(columns);
  const gap = SPACING.md;

  const renderItem = useCallback(
    ({ item }: { item: TitleDetails }) => (
      <MoviePoster uri={item.poster} title={item.title} year={item.year} width={posterW} onPress={() => openTitle(item)} />
    ),
    [posterW, openTitle],
  );

  const header = (
    <View style={{ padding: r.gutter, gap: SPACING.md }}>
      <AppText style={{ fontSize: 32, lineHeight: 38, fontWeight: '900' }} accessibilityRole="header">Discover</AppText>
      <Pressable
        accessibilityRole="search"
        accessibilityLabel="Search movies and series"
        accessibilityHint="Opens Search"
        onPress={() => router.push('/(tabs)/search')}
        style={({ pressed }) => ({ minHeight: MIN_TOUCH_TARGET + 10, borderRadius: RADII.pill, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: SPACING.lg, justifyContent: 'center', opacity: pressed ? 0.9 : 1 })}
      >
        <AppText muted>Search movies, series…</AppText>
      </Pressable>
      <View style={{ gap: 2, marginTop: SPACING.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <View style={{ width: 4, height: 22, borderRadius: 2, backgroundColor: theme.colors.accent }} />
          <AppText accessibilityRole="header" style={{ fontSize: 22, lineHeight: 28, fontWeight: '800' }}>{EDITORS_PICKS_LABEL}</AppText>
        </View>
        <AppText variant="caption" muted style={{ marginLeft: SPACING.md }}>{EDITORS_PICKS_SUBTITLE}</AppText>
      </View>
    </View>
  );

  return (
    <Screen>
      {picks.status === 'error' ? (
        <>
          {header}
          <StateView kind="error" title="Couldn't load titles" message={picks.error?.message} onRetry={picks.retry} />
        </>
      ) : picks.status === 'loading' ? (
        <>
          {header}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap, paddingHorizontal: r.gutter }}>
            {Array.from({ length: columns * 2 }).map((_, i) => (
              <Skeleton key={i} width={posterW} height={r.posterHeight(posterW)} />
            ))}
          </View>
        </>
      ) : (
        <FlatList
          key={`cols-${columns}`}
          data={picks.items}
          keyExtractor={(t) => t.ids.imdb ?? `tmdb:${t.ids.tmdb}`}
          renderItem={renderItem}
          numColumns={columns}
          ListHeaderComponent={header}
          columnWrapperStyle={columns > 1 ? { gap, paddingHorizontal: r.gutter } : undefined}
          contentContainerStyle={{ gap: SPACING.lg, paddingBottom: SPACING.xxxl }}
        />
      )}
    </Screen>
  );
}
