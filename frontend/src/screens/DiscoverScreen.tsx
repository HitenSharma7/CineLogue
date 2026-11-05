import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, TextInput, View } from 'react-native';
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
import { detailsRouteParams, isValidQuery, MIN_QUERY, MAX_QUERY } from '@/services/movieService';
import { useTheme } from '@/styles/ThemeProvider';
import type { TitleSummary, TitleType } from '@/type/movie';

type Scope = 'all' | 'movie' | 'series' | 'people';
const SCOPES: { key: Scope; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'movie', label: 'Movies' },
  { key: 'series', label: 'Series' },
  { key: 'people', label: 'People' },
];

export function DiscoverScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const r = useResponsive();
  const [text, setText] = useState('');
  const [scope, setScope] = useState<Scope>('all');
  const debounced = useDebouncedValue(text, 400);
  const type: TitleType | undefined = scope === 'movie' || scope === 'series' ? scope : undefined;
  const search = useTitleSearch(scope === 'people' ? '' : debounced, type);

  const columns = r.gridColumns(r.isTablet ? 150 : 110);
  const posterW = r.posterWidth(columns);
  const gap = SPACING.md;

  const open = useCallback(
    (t: TitleSummary) => {
      const p = detailsRouteParams(t, type);
      if (!p) return;
      router.push({ pathname: '/title/[id]', params: { id: p.id, ...(p.type ? { type: p.type } : {}) } });
    },
    [router, type],
  );

  const renderItem = useCallback(
    ({ item }: { item: TitleSummary }) => (
      <MoviePoster uri={item.poster} title={item.title} year={item.year} width={posterW} onPress={() => open(item)} />
    ),
    [posterW, open],
  );
  const keyOf = useCallback((t: TitleSummary) => t.ids.imdb ?? `tmdb:${t.ids.tmdb}`, []);

  const trimmed = text.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < MIN_QUERY;
  const waiting = isValidQuery(trimmed) && trimmed !== debounced.trim();

  const body = useMemo(() => {
    if (scope === 'people') {
      return (
        <StateView
          kind="pending"
          title="People search is coming"
          message={SOCIAL.userSearchAvailable ? '' : 'Finding other cinephiles needs a user-search endpoint from the backend. Movie and series search works now.'}
        />
      );
    }
    if (!isValidQuery(trimmed)) {
      return <StateView kind="empty" title="Search the catalogue" message={tooShort ? `Type at least ${MIN_QUERY} characters.` : 'Search by title to find movies and series.'} />;
    }
    if (search.status === 'loading' || waiting) {
      return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap, padding: r.gutter }}>
          {Array.from({ length: columns * 2 }).map((_, i) => (
            <Skeleton key={i} width={posterW} height={r.posterHeight(posterW)} />
          ))}
        </View>
      );
    }
    if (search.status === 'error') {
      return <StateView kind="error" title="Couldn't load results" message={search.error?.message} onRetry={search.retry} />;
    }
    if (search.status === 'success' && search.results.length === 0) {
      return <StateView kind="empty" title="No results" message={`Nothing found for “${trimmed}”. Try another spelling or fewer words.`} />;
    }
    return null;
  }, [scope, trimmed, tooShort, search.status, search.error, search.retry, search.results.length, waiting, columns, posterW, gap, r]);

  const showList = scope !== 'people' && search.status === 'success' && search.results.length > 0 && !waiting;

  return (
    <Screen>
      <View style={{ padding: r.gutter, gap: SPACING.md }}>
        <AppText variant="title" accessibilityRole="header">Search</AppText>
        <TextInput
          value={text}
          onChangeText={setText}
          maxLength={MAX_QUERY}
          placeholder={scope === 'people' ? 'Search people (coming soon)' : 'Search movies and series'}
          placeholderTextColor={theme.colors.textMuted}
          accessibilityLabel="Search"
          returnKeyType="search"
          autoCorrect={false}
          clearButtonMode="while-editing"
          style={{ minHeight: MIN_TOUCH_TARGET + 6, borderRadius: RADII.pill, paddingHorizontal: SPACING.lg, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.text, fontSize: 16 }}
        />
        <View accessibilityRole="tablist" style={{ flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' }}>
          {SCOPES.map((s) => {
            const on = s.key === scope;
            return (
              <Pressable
                key={s.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => setScope(s.key)}
                style={{ minHeight: MIN_TOUCH_TARGET, paddingHorizontal: SPACING.lg, borderRadius: RADII.pill, justifyContent: 'center', flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, backgroundColor: on ? theme.colors.accent : theme.colors.surfaceElevated }}
              >
                {on ? <AppText variant="caption" color={theme.colors.accentText}>✓</AppText> : null}
                <AppText variant="caption" color={on ? theme.colors.accentText : theme.colors.text}>{s.label}</AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {showList ? (
        <FlatList
          key={`cols-${columns}`}
          data={search.results}
          keyExtractor={keyOf}
          renderItem={renderItem}
          numColumns={columns}
          columnWrapperStyle={columns > 1 ? { gap, paddingHorizontal: r.gutter } : undefined}
          contentContainerStyle={{ gap: SPACING.lg, paddingBottom: SPACING.xxxl }}
          onEndReached={search.loadMore}
          onEndReachedThreshold={0.6}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          initialNumToRender={columns * 3}
          windowSize={7}
          ListFooterComponent={search.loadingMore ? <ActivityIndicator style={{ padding: SPACING.lg }} color={theme.colors.accent} accessibilityLabel="Loading more" /> : null}
        />
      ) : (
        body
      )}
    </Screen>
  );
}
