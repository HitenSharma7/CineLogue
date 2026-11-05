import React, { useCallback } from 'react';
import { FlatList, View } from 'react-native';
import { AppButton } from './AppButton';
import { AppText } from './AppText';
import { MoviePoster } from './MoviePoster';
import { Skeleton } from './Skeleton';
import { SPACING } from '@/constants/layout';
import { useResponsive } from '@/hooks/useResponsive';
import { useTheme } from '@/styles/ThemeProvider';
import type { TitleSummary } from '@/type/movie';

/** Anything with these fields fits (TitleSummary or TitleDetails). */
export type ShelfItem = Pick<TitleSummary, 'ids' | 'title' | 'year' | 'type' | 'poster'>;
export type ShelfStatus = 'ready' | 'loading' | 'error';

type Props = {
  title: string;
  subtitle?: string;
  status: ShelfStatus;
  items?: ShelfItem[];
  /** 'lg' = cinematic big posters (Home). */
  size?: 'md' | 'lg';
  errorMessage?: string;
  onOpen?: (t: ShelfItem) => void;
  onRetry?: () => void;
};

const keyOf = (t: ShelfItem) => t.ids.imdb ?? `tmdb:${t.ids.tmdb}`;

/** Editorial section header + horizontally browsable posters with loading/error states. */
export function PosterShelf({ title, subtitle, status, items, size = 'md', errorMessage, onOpen, onRetry }: Props) {
  const { theme } = useTheme();
  const r = useResponsive();
  const posterW = size === 'lg' ? (r.isTablet ? 200 : r.sizeClass === 'compact' ? 136 : 152) : r.isTablet ? 150 : 120;
  const gap = SPACING.md;
  const tileCount = Math.max(3, Math.ceil(r.inner / (posterW + gap)) + 1);

  const renderItem = useCallback(
    ({ item }: { item: ShelfItem }) => (
      <MoviePoster uri={item.poster} title={item.title} year={item.year} width={posterW} onPress={() => onOpen?.(item)} />
    ),
    [posterW, onOpen],
  );

  if (status === 'ready' && (!items || items.length === 0)) return null;

  return (
    <View style={{ gap: SPACING.md }}>
      <View style={{ paddingHorizontal: r.gutter, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <View style={{ width: 4, height: 22, borderRadius: 2, backgroundColor: theme.colors.accent }} />
          <AppText accessibilityRole="header" style={{ fontSize: 22, lineHeight: 28, fontWeight: '800', flex: 1 }} numberOfLines={2}>
            {title}
          </AppText>
        </View>
        {subtitle ? (
          <AppText variant="caption" muted style={{ marginLeft: SPACING.md }}>
            {subtitle}
          </AppText>
        ) : null}
      </View>

      {status === 'ready' && items ? (
        <FlatList
          horizontal
          data={items}
          keyExtractor={keyOf}
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap, paddingHorizontal: r.gutter }}
          initialNumToRender={tileCount}
          windowSize={5}
        />
      ) : null}

      {status === 'loading' ? (
        <View style={{ flexDirection: 'row', gap, paddingHorizontal: r.gutter, overflow: 'hidden' }}>
          {Array.from({ length: tileCount }).map((_, i) => (
            <Skeleton key={i} width={posterW} height={r.posterHeight(posterW)} />
          ))}
        </View>
      ) : null}

      {status === 'error' ? (
        <View accessibilityLiveRegion="polite" style={{ paddingHorizontal: r.gutter, gap: SPACING.sm, alignItems: 'flex-start' }}>
          <AppText muted>{errorMessage ?? `Couldn't load ${title.toLowerCase()}.`}</AppText>
          {onRetry ? <AppButton label="Try again" variant="secondary" onPress={onRetry} /> : null}
        </View>
      ) : null}
    </View>
  );
}
