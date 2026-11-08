
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { AppText } from '@/components/AppText';
import { MoviePoster } from '@/components/MoviePoster';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/Skeleton';
import { StateView } from '@/components/StateView';

import { MIN_TOUCH_TARGET, RADII, SPACING } from '@/constants/layout';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useResponsive } from '@/hooks/useResponsive';
import { useTitleSearch } from '@/hooks/useTitleSearch';

import { SOCIAL } from '@/services/socialService';
import {
  detailsRouteParams,
  isValidQuery,
  MIN_QUERY,
  MAX_QUERY,
} from '@/services/movieService';

import { useTheme } from '@/styles/ThemeProvider';
import type { TitleSummary, TitleType } from '@/type/movie';

type Scope = 'all' | 'movie' | 'series' | 'people';

const SCOPES: { key: Scope; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'movie', label: 'Movies' },
  { key: 'series', label: 'Series' },
  { key: 'people', label: 'People' },
];

const QUICK_SEARCHES = [
  'Interstellar',
  'Breaking Bad',
  'The Dark Knight',
  'Stranger Things',
];

export function DiscoverScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const r = useResponsive();

  const [text, setText] = useState('');
  const [scope, setScope] = useState<Scope>('all');

  const debounced = useDebouncedValue(text, 400);

  const type: TitleType | undefined =
    scope === 'movie' || scope === 'series' ? scope : undefined;

  const search = useTitleSearch(
    scope === 'people' ? '' : debounced,
    type,
  );

  const columns = r.gridColumns(r.isTablet ? 150 : 110);
  const posterW = r.posterWidth(columns);
  const gap = SPACING.md;

  const trimmed = text.trim();
  const validQuery = isValidQuery(trimmed);
  const tooShort = trimmed.length > 0 && trimmed.length < MIN_QUERY;

  const waiting =
    validQuery && trimmed !== debounced.trim();

  const showList =
    scope !== 'people' &&
    search.status === 'success' &&
    search.results.length > 0 &&
    !waiting;

  const open = useCallback(
    (title: TitleSummary) => {
      const params = detailsRouteParams(title, type);

      if (!params) return;

      router.push({
        pathname: '/title/[id]',
        params: {
          id: params.id,
          ...(params.type ? { type: params.type } : {}),
        },
      });
    },
    [router, type],
  );

  const renderItem = useCallback(
    ({ item }: { item: TitleSummary }) => (
      <MoviePoster
        uri={item.poster}
        title={item.title}
        year={item.year}
        width={posterW}
        onPress={() => open(item)}
      />
    ),
    [posterW, open],
  );

  const keyOf = useCallback(
    (item: TitleSummary) =>
      item.ids.imdb ??
      (item.ids.tmdb
        ? `tmdb:${item.ids.tmdb}`
        : `${item.title}-${item.year ?? 'unknown'}`),
    [],
  );

  const selectQuickSearch = useCallback((query: string) => {
    setText(query);
  }, []);

  const renderQuickSearch = useCallback(
    (query: string) => (
      <Pressable
        key={query}
        onPress={() => selectQuickSearch(query)}
        accessibilityRole="button"
        accessibilityLabel={`Search ${query}`}
        style={{
          minHeight: 42,
          paddingHorizontal: SPACING.lg,
          borderRadius: RADII.pill,
          backgroundColor: theme.colors.surfaceElevated,
          borderWidth: 1,
          borderColor: theme.colors.border,
          justifyContent: 'center',
        }}
      >
        <AppText variant="caption" color={theme.colors.text}>
          {query}
        </AppText>
      </Pressable>
    ),
    [selectQuickSearch, theme],
  );

  const body = useMemo(() => {
    if (scope === 'people') {
      return (
        <StateView
          kind="pending"
          title="People discovery is coming"
          message={
            SOCIAL.userSearchAvailable
              ? 'People search will be available here.'
              : 'Finding other cinephiles needs a user-search endpoint from the backend. Movie and series search is available now.'
          }
        />
      );
    }

    if (!validQuery) {
      return (
        <View
          style={{
            paddingHorizontal: r.gutter,
            paddingTop: SPACING.xl,
          }}
        >
          <View
            style={{
              gap: SPACING.sm,
              marginBottom: SPACING.xl,
            }}
          >
            <AppText variant="title">
              Find your next obsession.
            </AppText>

            <AppText color={theme.colors.textMuted}>
              Search movies and series by title.
            </AppText>
          </View>

          {tooShort ? (
            <StateView
              kind="empty"
              title="Keep typing"
              message={`Enter at least ${MIN_QUERY} characters to search.`}
            />
          ) : (
            <View style={{ gap: SPACING.md }}>
              <AppText
                variant="caption"
                color={theme.colors.textMuted}
              >
                QUICK SEARCHES
              </AppText>

              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: SPACING.sm,
                }}
              >
                {QUICK_SEARCHES.map(renderQuickSearch)}
              </View>

              <View
                style={{
                  marginTop: SPACING.xl,
                  padding: SPACING.lg,
                  borderRadius: RADII.lg,
                  backgroundColor: theme.colors.surface,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  gap: SPACING.xs,
                }}
              >
                <AppText variant="title">
                  Your next favourite is out there.
                </AppText>

                <AppText color={theme.colors.textMuted}>
                  Search for a movie or series to explore its details.
                </AppText>
              </View>
            </View>
          )}
        </View>
      );
    }

    if (search.status === 'loading' || waiting) {
      return (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap,
            padding: r.gutter,
          }}
        >
          {Array.from({ length: columns * 2 }).map((_, index) => (
            <Skeleton
              key={index}
              width={posterW}
              height={r.posterHeight(posterW)}
            />
          ))}
        </View>
      );
    }

    if (search.status === 'error') {
      return (
        <StateView
          kind="error"
          title="Couldn't load results"
          message={search.error?.message}
          onRetry={search.retry}
        />
      );
    }

    if (
      search.status === 'success' &&
      search.results.length === 0
    ) {
      return (
        <StateView
          kind="empty"
          title="Nothing found"
          message={`We couldn't find anything for "${trimmed}". Try another title or spelling.`}
        />
      );
    }

    return null;
  }, [
    scope,
    validQuery,
    tooShort,
    r,
    theme,
    search.status,
    search.error,
    search.retry,
    search.results.length,
    waiting,
    trimmed,
    columns,
    posterW,
    gap,
    renderQuickSearch,
  ]);

  return (
    <Screen>
      <View
        style={{
          paddingHorizontal: r.gutter,
          paddingTop: SPACING.lg,
          paddingBottom: SPACING.md,
          gap: SPACING.lg,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ gap: 3 }}>
            <AppText
              variant="caption"
              color={theme.colors.accent}
            >
              CINELOGUE
            </AppText>

            <AppText
              variant="title"
              accessibilityRole="header"
            >
              Discover
            </AppText>
          </View>

          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: RADII.pill,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.surfaceElevated,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <AppText color={theme.colors.accent}>
              ✦
            </AppText>
          </View>
        </View>

        {/* Search */}
        <View
          style={{
            minHeight: MIN_TOUCH_TARGET + 12,
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: RADII.lg,
            paddingHorizontal: SPACING.lg,
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
            gap: SPACING.sm,
          }}
        >
          <AppText color={theme.colors.textMuted}>
            ⌕
          </AppText>

          <TextInput
            value={text}
            onChangeText={setText}
            maxLength={MAX_QUERY}
            placeholder="Movies, series, titles..."
            placeholderTextColor={theme.colors.textMuted}
            accessibilityLabel="Search movies and series"
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="never"
            style={{
              flex: 1,
              minHeight: MIN_TOUCH_TARGET,
              color: theme.colors.text,
              fontSize: 15,
            }}
          />

          {text.length > 0 ? (
            <Pressable
              onPress={() => setText('')}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={10}
              style={{
                minWidth: MIN_TOUCH_TARGET,
                minHeight: MIN_TOUCH_TARGET,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppText color={theme.colors.textMuted}>
                ✕
              </AppText>
            </Pressable>
          ) : undefined}
        </View>

        {/* Search filters */}
        <View
          accessibilityRole="tablist"
          style={{
            flexDirection: 'row',
            gap: SPACING.sm,
          }}
        >
          {SCOPES.map((item) => {
            const active = item.key === scope;

            return (
              <Pressable
                key={item.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setScope(item.key)}
                style={{
                  flex: 1,
                  minHeight: MIN_TOUCH_TARGET,
                  paddingHorizontal: SPACING.sm,
                  borderRadius: RADII.pill,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: active
                    ? theme.colors.accent
                    : theme.colors.surfaceElevated,
                  borderWidth: active ? 0 : 1,
                  borderColor: theme.colors.border,
                }}
              >
                <AppText
                  variant="caption"
                  color={
                    active
                      ? theme.colors.accentText
                      : theme.colors.text
                  }
                >
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Results */}
      {showList ? (
        <FlatList
          key={`cols-${columns}`}
          data={search.results}
          keyExtractor={keyOf}
          renderItem={renderItem}
          numColumns={columns}
          columnWrapperStyle={
            columns > 1
              ? {
                  gap,
                  paddingHorizontal: r.gutter,
                }
              : undefined
          }
          contentContainerStyle={{
            gap: SPACING.lg,
            paddingBottom: SPACING.xxxl,
          }}
          ListHeaderComponent={
            <View
              style={{
                paddingHorizontal: r.gutter,
                paddingBottom: SPACING.md,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <AppText
                variant="caption"
                color={theme.colors.textMuted}
              >
                SEARCH RESULTS
              </AppText>

              <AppText
                variant="caption"
                color={theme.colors.textMuted}
              >
                {search.results.length} titles
              </AppText>
            </View>
          }
          onEndReached={search.loadMore}
          onEndReachedThreshold={0.6}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          initialNumToRender={columns * 3}
          windowSize={7}
          ListFooterComponent={
            search.loadingMore ? (
              <ActivityIndicator
                style={{ padding: SPACING.lg }}
                color={theme.colors.accent}
                accessibilityLabel="Loading more"
              />
            ) : undefined
          }
        />
      ) : (
        body
      )}
    </Screen>
  );
}
