import { useCallback, useEffect, useRef, useState } from 'react';
import { isAbort, ApiError } from '@/services/apiClient';
import { isValidQuery, normalizeQuery, searchTitles, MAX_PAGE } from '@/services/movieService';
import type { Pagination, TitleSummary, TitleType } from '@/type/movie';

type Status = 'idle' | 'loading' | 'success' | 'error';

export type TitleSearchState = {
  status: Status;
  results: TitleSummary[];
  pagination: Pagination | null;
  error: ApiError | Error | null;
  loadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  retry: () => void;
};

/**
 * Runs a search for an already-debounced query. Each new query/type aborts
 * the previous request, and a request token guarantees a stale response can
 * never overwrite a newer one.
 */
export function useTitleSearch(query: string, type?: TitleType): TitleSearchState {
  const [status, setStatus] = useState<Status>('idle');
  const [results, setResults] = useState<TitleSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nonce, setNonce] = useState(0);

  const pageRef = useRef(1);
  const tokenRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const moreInFlight = useRef(false);

  const q = normalizeQuery(query);

  useEffect(() => {
    abortRef.current?.abort();
    const token = ++tokenRef.current;
    moreInFlight.current = false;
    setLoadingMore(false);

    if (!isValidQuery(q)) {
      setStatus('idle');
      setResults([]);
      setPagination(null);
      setError(null);
      return;
    }

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    pageRef.current = 1;
    setStatus('loading');
    setError(null);

    searchTitles({ q, page: 1, type }, ctrl.signal)
      .then((page) => {
        if (token !== tokenRef.current) return;
        setResults(page.results);
        setPagination(page.pagination);
        setStatus('success');
      })
      .catch((e: unknown) => {
        if (token !== tokenRef.current || isAbort(e)) return;
        setError(e instanceof Error ? e : new Error('Search failed.'));
        setStatus('error');
      });

    return () => ctrl.abort();
  }, [q, type, nonce]);

  const hasMore =
    status === 'success' &&
    pagination !== null &&
    pagination.pages !== null &&
    pageRef.current < Math.min(pagination.pages, MAX_PAGE);

  const loadMore = useCallback(() => {
    if (!hasMore || moreInFlight.current) return;
    moreInFlight.current = true;
    setLoadingMore(true);
    const token = tokenRef.current;
    const next = pageRef.current + 1;
    searchTitles({ q, page: next, type }, abortRef.current?.signal)
      .then((page) => {
        if (token !== tokenRef.current) return;
        pageRef.current = next;
        setResults((prev) => {
          // de-duplicate across pages by stable id
          const seen = new Set(prev.map((r) => r.ids.imdb ?? `tmdb:${r.ids.tmdb}`));
          const fresh = page.results.filter((r) => !seen.has(r.ids.imdb ?? `tmdb:${r.ids.tmdb}`));
          return [...prev, ...fresh];
        });
        setPagination(page.pagination);
      })
      .catch(() => {
        /* a failed "load more" keeps existing results; user can scroll again */
      })
      .finally(() => {
        if (token === tokenRef.current) {
          moreInFlight.current = false;
          setLoadingMore(false);
        }
      });
  }, [hasMore, q, type]);

  const retry = useCallback(() => setNonce((n) => n + 1), []);

  return { status, results, pagination, error, loadingMore, hasMore, loadMore, retry };
}
