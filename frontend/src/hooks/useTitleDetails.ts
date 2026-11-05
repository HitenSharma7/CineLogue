
import { useCallback, useEffect, useState } from 'react';
import { ApiError, isAbort } from '@/services/apiClient';
import { getTitleDetails } from '@/services/movieService';
import type { TitleDetails, TitleType } from '@/type/movie';

export function useTitleDetails(
  id: string | undefined,
  type: TitleType | undefined,
) {
  const [data, setData] = useState<TitleDetails | null>(null);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    if (!id) {
      setData(null);
      setLoading(false);
      setError(new Error('Missing title ID.'));

      return () => controller.abort();
    }

    setLoading(true);
    setError(null);

    getTitleDetails({ id, type }, controller.signal)
      .then((details) => {
        if (controller.signal.aborted) return;

        setData(details);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (isAbort(cause) || controller.signal.aborted) return;

        setError(
          cause instanceof Error
            ? cause
            : new Error('Failed to load title details.'),
        );
        setLoading(false);
      });

    return () => controller.abort();
  }, [id, type, nonce]);

  const retry = useCallback(() => {
    setNonce((current) => current + 1);
  }, []);

  return { data, error, loading, retry };
}
