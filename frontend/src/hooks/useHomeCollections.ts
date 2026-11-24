import { useCallback, useEffect, useState } from 'react';
import { isAbort } from '@/services/apiClient';
import { getHomeCollections, type HomeCollection } from '@/services/movieService';
import type { TitleSummary } from '@/type/movie';

export type HomeShelf = {
  id: string;
  title: string;
  subtitle: string;
  genre: string;
  items: TitleSummary[];
  status: 'loading' | 'ready' | 'error';
  error: Error | null;
};

const SHELF_ORDER = [
  { id: 'action', title: 'Action', subtitle: 'High-stakes stories and adrenaline.', genre: 'Action' },
  { id: 'crime', title: 'Crime', subtitle: 'Criminal worlds, cases and investigations.', genre: 'Crime' },
  { id: 'science-fiction', title: 'Science Fiction', subtitle: 'Ideas and worlds beyond the ordinary.', genre: 'Science Fiction' },
  { id: 'comedy', title: 'Comedy', subtitle: 'Stories made to make you laugh.', genre: 'Comedy' },
  { id: 'animation', title: 'Animation', subtitle: 'Animated stories worth discovering.', genre: 'Animation' },
  { id: 'drama', title: 'Drama', subtitle: 'Character-led stories that stay with you.', genre: 'Drama' },
] as const;

const CACHE_TTL_MS = 15 * 60 * 1000;
let cache: { collections: HomeCollection[]; fetchedAt: number } | null = null;

function fromApi(collection: HomeCollection): HomeShelf {
  return {
    id: collection.id,
    title: collection.title,
    subtitle: collection.subtitle,
    genre: collection.genre,
    items: collection.results.slice(0, 20),
    status: 'ready',
    error: null,
  };
}

function loadingShelves(): HomeShelf[] {
  return SHELF_ORDER.map((shelf) => ({
    ...shelf,
    items: [],
    status: 'loading',
    error: null,
  }));
}

/** Uses the backend's genre-verified ReelDB collections endpoint. */
export function useHomeCollections() {
  const [collections, setCollections] = useState<HomeShelf[]>(() =>
    cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS
      ? cache.collections.map(fromApi)
      : loadingShelves(),
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS && attempt === 0) return;

    const controller = new AbortController();
    setCollections((current) => current.map((shelf) => ({
      ...shelf,
      status: 'loading',
      error: null,
    })));

    getHomeCollections(controller.signal).then((data) => {
      if (controller.signal.aborted) return;
      cache = { collections: data, fetchedAt: Date.now() };
      const byId = new Map(data.map((entry) => [entry.id, entry]));
      setCollections(SHELF_ORDER.map((definition) => {
        const found = byId.get(definition.id);
        return found ? fromApi(found) : {
          ...definition,
          items: [],
          status: 'ready',
          error: null,
        };
      }));
    }).catch((error: unknown) => {
      if (isAbort(error) || controller.signal.aborted) return;
      const normalized = error instanceof Error ? error : new Error('Unable to load Home collections.');
      setCollections((current) => current.map((shelf) => ({
        ...shelf,
        status: 'error',
        error: normalized,
      })));
    });

    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback((_id?: string) => {
    cache = null;
    setAttempt((value) => value + 1);
  }, []);

  return { collections, retry };
}
