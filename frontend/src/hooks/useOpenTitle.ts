import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { detailsRouteParams } from '@/services/movieService';
import type { TitleSummary } from '@/type/movie';

/** Opens the existing details route for anything that has ids + type. */
export function useOpenTitle() {
  const router = useRouter();
  return useCallback(
    (t: Pick<TitleSummary, 'ids' | 'type'>) => {
      const p = detailsRouteParams(t);
      if (!p) return;
      router.push({ pathname: '/title/[id]', params: { id: p.id, ...(p.type ? { type: p.type } : {}) } });
    },
    [router],
  );
}
