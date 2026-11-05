import { useCallback, useEffect, useState } from 'react';
import { isAbort } from '@/services/apiClient';
import { getTitleDetails } from '@/services/movieService';
import type { PickConfig } from '@/config/editorsPicks';
import type { TitleDetails } from '@/type/movie';

/** Successful lookups survive tab switches, so Home/Discover never refetch them. */
const cache = new Map<string, TitleDetails>();
const CONCURRENCY = 3; // be gentle with the backend (and the provider behind it)
const keyOf = (p: PickConfig) => `${p.id}:${p.type ?? ''}`;

export type PicksStatus = 'loading' | 'ready' | 'error';

/**
 * Loads curated titles through the existing details service. Results stream
 * in as they arrive (config order preserved). A pick that fails is skipped;
 * `error` is only set when NOTHING could be loaded.
 */
export function useEditorsPicks(picks: readonly PickConfig[]) {
  const cached = () =>
    picks.map((p) => cache.get(keyOf(p))).filter((d): d is TitleDetails => d !== undefined);
  const [items, setItems] = useState<TitleDetails[]>(cached);
  const [done, setDone] = useState(() => picks.every((p) => cache.has(keyOf(p))));
  const [error, setError] = useState<Error | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    const slots: (TitleDetails | undefined)[] = picks.map((p) => cache.get(keyOf(p)));
    const publish = () => setItems(slots.filter((d): d is TitleDetails => d !== undefined));
    const pending = picks.map((p, i) => ({ p, i })).filter(({ p }) => !cache.has(keyOf(p)));

    setError(null);
    publish();
    if (pending.length === 0) {
      setDone(true);
      return;
    }
    setDone(false);

    let next = 0;
    let lastError: Error | null = null;
    const worker = async () => {
      while (!ctrl.signal.aborted) {
        const job = pending[next++];
        if (!job) return;
        try {
          const d = await getTitleDetails(job.p, ctrl.signal);
          cache.set(keyOf(job.p), d);
          slots[job.i] = d;
          publish();
        } catch (e) {
          if (isAbort(e) || ctrl.signal.aborted) return;
          lastError = e instanceof Error ? e : new Error('Failed to load.');
        }
      }
    };
    Promise.all(Array.from({ length: Math.min(CONCURRENCY, pending.length) }, worker)).then(() => {
      if (ctrl.signal.aborted) return;
      setError(lastError);
      setDone(true);
    });
    return () => ctrl.abort();
  }, [picks, nonce]);

  const retry = useCallback(() => setNonce((n) => n + 1), []);
  const status: PicksStatus = items.length > 0 ? 'ready' : done ? (error ? 'error' : 'ready') : 'loading';
  return { status, items, error: items.length === 0 ? error : null, retry };
}
