import {
  fetchCatalogueTitle,
  searchCatalogueCandidates,
} from "./catalogue.provider";

import type {
  CatalogueMediaType,
  CatalogueRepository,
  CatalogueSyncOptions,
  CatalogueSyncResult,
} from "./catalogue.types";

import type { TitleSummary } from "../movies.types";

const DEFAULT_CONCURRENCY = 3;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_BASE_DELAY_MS = 250;

const TRANSIENT_NETWORK_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "ECONNABORTED",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_SOCKET",
]);

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function checkpointKey(
  query: string,
  type: CatalogueMediaType,
): string {
  return `reeldb:${type}:${query.trim().toLowerCase()}`;
}

function getProviderIdentityKeys(summary: TitleSummary): string[] {
  const keys: string[] = [];

  const imdb = summary.ids.imdb?.trim().toLowerCase();

  if (imdb) {
    keys.push(`imdb:${imdb}`);
  }

  if (summary.ids.tmdb !== null) {
    keys.push(`tmdb:${summary.ids.tmdb}`);
  }

  if (summary.ids.mdblist !== null) {
    keys.push(`mdblist:${summary.ids.mdblist}`);
  }

  return keys;
}

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const candidate = error as {
    status?: unknown;
    statusCode?: unknown;
    response?: { status?: unknown };
  };

  const status =
    candidate.status ??
    candidate.statusCode ??
    candidate.response?.status;

  return typeof status === "number" ? status : undefined;
}

function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const candidate = error as {
    code?: unknown;
    cause?: { code?: unknown };
  };

  const code = candidate.code ?? candidate.cause?.code;

  return typeof code === "string" ? code : undefined;
}

function isRetryableError(error: unknown): boolean {
  const status = getErrorStatus(error);

  if (status !== undefined) {
    return status === 429 || status >= 500;
  }

  const code = getErrorCode(error);

  if (code && TRANSIENT_NETWORK_CODES.has(code)) {
    return true;
  }

  // Native fetch commonly wraps network failures in TypeError.
  return error instanceof TypeError;
}

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number,
  baseDelayMs: number,
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (
        attempt >= maxRetries ||
        !isRetryableError(error)
      ) {
        throw error;
      }

      const exponentialDelay =
        baseDelayMs * 2 ** attempt;

      const jitter = Math.random() * exponentialDelay * 0.25;

      await wait(exponentialDelay + jitter);
      attempt++;
    }
  }
}

/**
 * Serializes request start times while allowing requests
 * to remain in flight concurrently.
 */
function createRequestPacer(minimumIntervalMs: number) {
  let nextAllowedStart = 0;
  let queue: Promise<void> = Promise.resolve();

  return async function pace<T>(
    operation: () => Promise<T>,
  ): Promise<T> {
    let release!: () => void;

    const previous = queue;

    queue = new Promise<void>((resolve) => {
      release = resolve;
    });

    await previous;

    try {
      const now = Date.now();
      const delay = Math.max(0, nextAllowedStart - now);

      if (delay > 0) {
        await wait(delay);
      }

      nextAllowedStart = Date.now() + minimumIntervalMs;
    } finally {
      release();
    }

    return operation();
  };
}

function validateOptions(options: CatalogueSyncOptions): void {
  const query = options.query.trim();

  if (query.length < 2 || query.length > 100) {
    throw new Error(
      "Catalogue search query must be 2–100 characters.",
    );
  }

  if (
    !Number.isInteger(options.maxPagesPerRun) ||
    options.maxPagesPerRun < 1 ||
    options.maxPagesPerRun > 100
  ) {
    throw new Error(
      "maxPagesPerRun must be between 1 and 100",
    );
  }

  if (
    !Number.isInteger(options.requestDelayMs) ||
    options.requestDelayMs < 0
  ) {
    throw new Error(
      "requestDelayMs must be a non-negative integer.",
    );
  }

  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;

  if (
    !Number.isInteger(concurrency) ||
    concurrency < 1 ||
    concurrency > 10
  ) {
    throw new Error("concurrency must be between 1 and 10.");
  }

  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;

  if (
    !Number.isInteger(maxRetries) ||
    maxRetries < 0 ||
    maxRetries > 5
  ) {
    throw new Error("maxRetries must be between 0 and 5.");
  }

  const retryBaseDelayMs =
    options.retryBaseDelayMs ?? DEFAULT_RETRY_BASE_DELAY_MS;

  if (
    !Number.isInteger(retryBaseDelayMs) ||
    retryBaseDelayMs < 0 ||
    retryBaseDelayMs > 30_000
  ) {
    throw new Error(
      "retryBaseDelayMs must be between 0 and 30000.",
    );
  }
}

export async function syncCatalogue(
  repository: CatalogueRepository,
  options: CatalogueSyncOptions,
): Promise<CatalogueSyncResult> {
  validateOptions(options);

  const query = options.query.trim();
  const key = checkpointKey(query, options.type);

  const concurrency =
    options.concurrency ?? DEFAULT_CONCURRENCY;

  const maxRetries =
    options.maxRetries ?? DEFAULT_MAX_RETRIES;

  const retryBaseDelayMs =
    options.retryBaseDelayMs ?? DEFAULT_RETRY_BASE_DELAY_MS;

  const paceRequest = createRequestPacer(options.requestDelayMs);

  const previous = await repository.getCheckpoint(key);

  if (previous?.completed) {
    return {
      type: options.type,
      query,
      pagesProcessed: 0,
      titlesDiscovered: 0,
      titlesSaved: 0,
      titlesSkipped: 0,
      nextPage: null,
      completed: true,
    };
  }

  let page = previous?.nextPage ?? 1;

  if (page === null || !Number.isInteger(page) || page < 1) {
    throw new Error("Catalogue checkpoint contains an invalid nextPage.");
  }

  let pagesProcessed = 0;
  let titlesDiscovered = 0;
  let titlesSaved = 0;
  let titlesSkipped = 0;
  let completed = false;

  const seenProviderIds = new Set<string>();

  while (pagesProcessed < options.maxPagesPerRun) {
    const search = await withRetry(
      () =>
        paceRequest(() =>
          searchCatalogueCandidates({
            q: query,
            page,
            type: options.type,
          }),
        ),
      maxRetries,
      retryBaseDelayMs,
    );

    pagesProcessed++;
    titlesDiscovered += search.results.length;

    if (search.results.length === 0) {
      completed = true;
    } else {
      const candidates: TitleSummary[] = [];

      for (const summary of search.results) {
        const identityKeys = getProviderIdentityKeys(summary);

        if (identityKeys.length === 0) {
          titlesSkipped++;
          continue;
        }

        const isDuplicate = identityKeys.some((identity) =>
          seenProviderIds.has(identity),
        );

        if (isDuplicate) {
          titlesSkipped++;
          continue;
        }

        for (const identity of identityKeys) {
          seenProviderIds.add(identity);
        }

        candidates.push(summary);
      }

      let cursor = 0;
      let firstError: unknown;

      const worker = async (): Promise<void> => {
        while (true) {
          const index = cursor++;

          if (index >= candidates.length) {
            return;
          }

          const summary = candidates[index];

          try {
            const title = await withRetry(
              () =>
                paceRequest(() =>
                  fetchCatalogueTitle(summary, options.type),
                ),
              maxRetries,
              retryBaseDelayMs,
            );

            if (!title || title.genres.length === 0) {
              titlesSkipped++;
              continue;
            }

            await repository.upsertTitleWithGenres(title);
            titlesSaved++;
          } catch (error) {
            firstError ??= error;
          }
        }
      };

      const workers = Array.from(
        { length: Math.min(concurrency, candidates.length) },
        () => worker(),
      );

      // Wait for every worker to settle. No background writes
      // should continue after this sync operation rejects.
      await Promise.all(workers);

      if (firstError !== undefined) {
        throw firstError;
      }

      completed =
        search.pagination.pages !== null &&
        page >= search.pagination.pages;
    }

    // A page checkpoint is written only after all its titles
    // have been successfully processed.
    const nextPage = completed ? page : page + 1;

    await repository.saveCheckpoint(key, {
      query,
      type: options.type,
      nextPage,
      completed,
    });

    if (completed) {
      break;
    }

    page++;
  }

  return {
    type: options.type,
    query,
    pagesProcessed,
    titlesDiscovered,
    titlesSaved,
    titlesSkipped,
    nextPage: completed ? null : page,
    completed,
  };
}