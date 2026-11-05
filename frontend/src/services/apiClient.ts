import { ENV } from '@/config/env';

export type ApiErrorKind = 'network' | 'timeout' | 'http' | 'invalid-response' | 'aborted';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
  get retryable(): boolean {
    return this.kind === 'network' || this.kind === 'timeout' || (this.status !== undefined && this.status >= 500);
  }
}

export function isAbort(e: unknown): boolean {
  return e instanceof ApiError && e.kind === 'aborted';
}

type Query = Record<string, string | number | undefined | null>;

function buildUrl(path: string, query?: Query): string {
  const qs = new URLSearchParams();
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') qs.append(k, String(v));
    }
  }
  const s = qs.toString();
  return `${ENV.apiBaseUrl}${path}${s ? `?${s}` : ''}`;
}

/** Extracts a human message from a typical error body without assuming its shape. */
function messageFromBody(body: unknown): string | undefined {
  if (body && typeof body === 'object') {
    const o = body as Record<string, unknown>;
    if (typeof o.message === 'string') return o.message;
    if (o.error && typeof o.error === 'object') {
      const m = (o.error as Record<string, unknown>).message;
      if (typeof m === 'string') return m;
    }
    if (typeof o.error === 'string') return o.error;
  }
  return undefined;
}

export async function apiGet(
  path: string,
  opts: { query?: Query; signal?: AbortSignal } = {},
): Promise<unknown> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, ENV.requestTimeoutMs);
  const onExternalAbort = () => controller.abort();
  if (opts.signal) {
    if (opts.signal.aborted) controller.abort();
    else opts.signal.addEventListener('abort', onExternalAbort);
  }

  try {
    let res: Response;
    try {
      res = await fetch(buildUrl(path, opts.query), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
    } catch {
      if (timedOut) throw new ApiError('timeout', 'The server took too long to respond.');
      if (controller.signal.aborted) throw new ApiError('aborted', 'Request cancelled.');
      throw new ApiError('network', `Could not reach the server at ${ENV.apiBaseUrl}.`);
    }

    let body: unknown = undefined;
    try {
      body = await res.json();
    } catch {
      if (res.ok) throw new ApiError('invalid-response', 'The server returned a non-JSON response.', res.status);
    }

    if (!res.ok) {
      throw new ApiError('http', messageFromBody(body) ?? `Request failed (${res.status}).`, res.status);
    }
    return body;
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener('abort', onExternalAbort);
  }
}
