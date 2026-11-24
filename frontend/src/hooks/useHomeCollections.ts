import { useCallback, useEffect, useState } from 'react';
import { isAbort } from '@/services/apiClient';
import { searchTitles } from '@/services/movieService';
import type { TitleSummary } from '@/type/movie';

/**
 * The category queries are section definitions, not title data.
 * Every poster/title in these shelves is returned live by ReelDB search.
 */
export const HOME_COLLECTIONS = [
  { id: 'action', title: 'Action & Adventure', query: 'action adventure', subtitle: 'Big action. Bigger adventures.' },
  { id: 'thriller', title: 'Crime & Thrillers', query: 'crime thriller', subtitle: 'Mysteries, investigations and twists.' },
  { id: 'scifi', title: 'Science Fiction', query: 'science fiction', subtitle: 'Worlds beyond the ordinary.' },
  { id: 'comedy', title: 'Comedy', query: 'comedy', subtitle: 'A little fun for your watchlist.' },
  { id: 'animation', title: 'Animation', query: 'animation', subtitle: 'Animated stories worth watching.' },
  { id: 'drama', title: 'Drama', query: 'drama', subtitle: 'Stories that stay with you.' },
] as const;

const TARGET_PER_COLLECTION = 20;
const MAX_PAGES = 3;
const CACHE_TTL_MS = 15 * 60 * 1000;
const CATEGORY_CONCURRENCY = 2;

type Collection = (typeof HOME_COLLECTIONS)[number];
type CollectionState = {
  items: TitleSummary[];
  status: 'loading' | 'ready' | 'error';
  error: Error | null;
};
type CacheEntry = { items: TitleSummary[]; fetchedAt: number };

const cache = new Map<string, CacheEntry>();

function titleKey(item: TitleSummary): string | null {
  if (item.ids.imdb) return `imdb:${item.ids.imdb}`;
  if (item.ids.tmdb !== null) return `tmdb:${item.ids.tmdb}`;
  if (item.ids.mdblist) return `mdblist:${item.ids.mdblist}`;
  return null;
}

function cachedItems(id: string): TitleSummary[] | null {
  const entry = cache.get(id);
  if (!entry || Date.now() - entry.fetchedAt > CACHE_TTL_MS) return null;
  return entry.items;
}

async function loadCollection(
  collection: Collection,
  signal: AbortSignal,
): Promise<TitleSummary[]> {
  const unique = new Map<string, TitleSummary>();

  for (let page = 1; page <= MAX_PAGES && unique.size < TARGET_PER_COLLECTION; page += 1) {
    const response = await searchTitles(
      { q: collection.query, page, type: 'movie' },
      signal,
    );

    for (const item of response.results) {
      if (!item.poster) continue;
      const key = titleKey(item);
      if (key && !unique.has(key)) unique.set(key, item);
      if (unique.size >= TARGET_PER_COLLECTION) break;
    }

    if (!response.results.length || (response.pagination.pages !== null && page >= response.pagination.pages)) {
      break;
    }
  }

  return Array.from(unique.values()).slice(0, TARGET_PER_COLLECTION);
}

function initialState(): Record<string, CollectionState> {
  return Object.fromEntries(HOME_COLLECTIONS.map((collection) => {
    const items = cachedItems(collection.id);
    return [collection.id, { items: items ?? [], status: items ? 'ready' : 'loading', error: null }];
  }));
}

/**
 * Fetches six API-driven Home shelves with bounded concurrency and a short
 * in-memory cache. No movie IDs or poster data are stored in the app.
 */
export function useHomeCollections() {
  const [collections, setCollections] = useState<Record<string, CollectionState>>(initialState);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let next = 0;

    setCollections((current) => {
      const nextState = { ...current };
      for (const collection of HOME_COLLECTIONS) {
        const items = cachedItems(collection.id);
        nextState[collection.id] = items
          ? { items, status: 'ready', error: null }
          : { items: [], status: 'loading', error: null };
      }
      return nextState;
    });

    const pending = HOME_COLLECTIONS.filter((collection) => !cachedItems(collection.id));

    const worker = async () => {
      while (!controller.signal.aborted) {
        const collection = pending[next++];
        if (!collection) return;

        try {
          const items = await loadCollection(collection, controller.signal);
          cache.set(collection.id, { items, fetchedAt: Date.now() });
          if (!controller.signal.aborted) {
            setCollections((current) => ({
              ...current,
              [collection.id]: { items, status: 'ready', error: null },
            }));
          }
        } catch (error) {
          if (isAbort(error) || controller.signal.aborted) return;
          const normalized = error instanceof Error ? error : new Error('Unable to load this collection.');
          setCollections((current) => ({
            ...current,
            [collection.id]: { items: [], status: 'error', error: normalized },
          }));
        }
      }
    };

    void Promise.all(
      Array.from({ length: Math.min(CATEGORY_CONCURRENCY, pending.length) }, () => worker()),
    );

    return () => controller.abort();
  }, [nonce]);

  const retry = useCallback((id: string) => {
    cache.delete(id);
    setCollections((current) => ({
      ...current,
      [id]: { items: [], status: 'loading', error: null },
    }));
    setNonce((value) => value + 1);
  }, []);

  return {
    collections: HOME_COLLECTIONS.map((definition) => ({
      ...definition,
      ...(collections[definition.id] ?? { items: [], status: 'loading' as const, error: null }),
    })),
    retry,
  };
}
