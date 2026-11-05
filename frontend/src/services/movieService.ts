
import { ENV } from '@/config/env';
import { apiGet, ApiError } from './apiClient';
import type {
  Credits,
  Pagination,
  SearchPage,
  TitleDetails,
  TitleIds,
  TitleSummary,
  TitleType,
} from '@/type/movie';

/* ---------- Safe readers ---------- */

type UnknownRecord = Record<string, unknown>;

const isObj = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value);

const str = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;

  const result = value.trim();

  return result && result !== 'N/A' && result !== 'null'
    ? result
    : null;
};

function readCrewMembers(value: unknown): Credits['actors'] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!isObj(item)) return [];

    const name = str(item.name);
    if (!name) return [];

    return [{
      tmdb_id: num(item.tmdb_id),
      name,
      role: str(item.role),
      profile: str(item.profile),
    }];
  });
}

function readCredits(value: unknown): Credits | null {
  if (!isObj(value)) return null;

  const counts = isObj(value.counts) ? value.counts : null;

  return {
    directors: readCrewMembers(value.directors),
    writers: readCrewMembers(value.writers),
    actors: readCrewMembers(value.actors),
    guests: readCrewMembers(value.guests),
    counts: counts
      ? {
          cast_count: num(counts.cast_count) ?? 0,
          crew_count: num(counts.crew_count) ?? 0,
          guest_count: num(counts.guest_count) ?? 0,
          total_count: num(counts.total_count) ?? 0,
          writer_count: num(counts.writer_count) ?? 0,
          director_count: num(counts.director_count) ?? 0,
        }
      : null,
  };
}

const num = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

function firstValue(
  ...values: unknown[]
): unknown {
  return values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      value !== '',
  );
}

function readIds(value: unknown): TitleIds {
  const obj = isObj(value) ? value : {};

  const tmdb = num(obj.tmdb);

  return {
    imdb: str(obj.imdb),
    tmdb,
    mdblist:
      typeof obj.mdblist === 'number'
        ? String(obj.mdblist)
        : str(obj.mdblist),
  };
}

/**
 * Converts strings or common metadata objects into displayable labels.
 * Supports nested person/credit objects without exposing raw API data.
 */
function readLabel(value: unknown): string | null {
  const direct = str(value);
  if (direct) return direct;

  if (!isObj(value)) return null;

  const directLabel = firstValue(
    value.name,
    value.title,
    value.original_name,
    value.originalName,
    value.character,
    value.job,
  );

  const label = str(directLabel);
  if (label) return label;

  const person = value.person;
  if (isObj(person)) {
    return (
      str(person.name) ??
      str(person.title)
    );
  }

  return null;
}

function readStringArray(value: unknown): string[] {
  if (typeof value === 'string') {
    // Some APIs return comma-separated metadata.
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (!Array.isArray(value)) {
    const label = readLabel(value);
    return label ? [label] : [];
  }

  const result: string[] = [];

  for (const item of value) {
    const label = readLabel(item);

    if (label && !result.includes(label)) {
      result.push(label);
    }
  }

  return result;
}

function readPagination(value: unknown): Pagination {
  const obj = isObj(value) ? value : {};

  return {
    page: num(obj.page),
    pages: num(obj.pages),
    total: num(obj.total),
  };
}

function unwrap(body: unknown): unknown {
  if (isObj(body) && body.success === true && 'data' in body) {
    return body.data;
  }

  throw new ApiError(
    'invalid-response',
    'Unexpected response from the server.',
  );
}

/** Returns null for records without a usable title or ID. */
function readSummary(value: unknown): TitleSummary | null {
  if (!isObj(value)) return null;

  const title = str(value.title);
  const ids = readIds(value.ids);

  if (
    !title ||
    (!ids.imdb && ids.tmdb === null && !ids.mdblist)
  ) {
    return null;
  }

  return {
    ids,
    title,
    year: num(value.year),
    type: str(value.type),
    poster: str(value.poster),
    score: num(value.score),
  };
}

function readRuntime(value: unknown): number | null {
  const runtime = num(value);

  if (runtime !== null && runtime > 0) {
    return runtime;
  }

  // Support a runtime object if the backend uses one.
  if (isObj(value)) {
    const nested = num(
      firstValue(value.minutes, value.runtime, value.value),
    );

    return nested !== null && nested > 0 ? nested : null;
  }

  return null;
}

function readRating(value: unknown): number | null {
  const direct = num(value);

  if (direct !== null) return direct;

  if (!isObj(value)) return null;

  // Accept common rating fields, not arbitrary objects.
  const nested = num(
    firstValue(
      value.rating,
      value.average,
      value.value,
      value.score,
      value.imdb,
    ),
  );

  if (nested !== null) return nested;

  // Handle provider-keyed rating objects, e.g. { imdb: { rating: 8.7 } }.
  for (const key of ['imdb', 'tmdb', 'mdblist']) {
    const provider = value[key];

    if (isObj(provider)) {
      const providerRating = num(
        firstValue(
          provider.rating,
          provider.value,
          provider.score,
        ),
      );

      if (providerRating !== null) return providerRating;
    }
  }

  return null;
}

/* ---------- Public API ---------- */

export const MIN_QUERY = 2;
export const MAX_QUERY = 100;
export const MAX_PAGE = 100;

export function normalizeQuery(q: string): string {
  return q.trim();
}

export function isValidQuery(q: string): boolean {
  const length = normalizeQuery(q).length;
  return length >= MIN_QUERY && length <= MAX_QUERY;
}

export async function searchTitles(
  params: { q: string; page?: number; type?: TitleType },
  signal?: AbortSignal,
): Promise<SearchPage> {
  const q = normalizeQuery(params.q);

  if (!isValidQuery(q)) {
    throw new ApiError(
      'http',
      `Search must be ${MIN_QUERY}-${MAX_QUERY} characters.`,
      400,
    );
  }

  const page = Math.min(
    Math.max(params.page ?? 1, 1),
    MAX_PAGE,
  );

  const body = await apiGet(`${ENV.moviesPath}/search`, {
    query: { q, page, type: params.type },
    signal,
  });

  const data = unwrap(body);

  if (!isObj(data) || !Array.isArray(data.results)) {
    throw new ApiError(
      'invalid-response',
      'Search response was missing results.',
    );
  }

  const results: TitleSummary[] = [];

  for (const item of data.results) {
    const summary = readSummary(item);
    if (summary) results.push(summary);
  }

  return {
    results,
    pagination: readPagination(data.pagination),
  };
}

/** Fetches and normalizes title details from the existing backend endpoint. */
export async function getTitleDetails(
  params: { id: string; type?: TitleType },
  signal?: AbortSignal,
): Promise<TitleDetails> {
  const id = params.id.trim();
  const isImdb = /^tt\d+$/.test(id);
  const isTmdb = /^\d+$/.test(id);

  if (!isImdb && !isTmdb) {
    throw new ApiError('http', 'Invalid title ID.', 400);
  }

  if (isTmdb && !params.type) {
    throw new ApiError(
      'http',
      'A type (movie or series) is required for this title.',
      400,
    );
  }

  const body = await apiGet(
    `${ENV.moviesPath}/${encodeURIComponent(id)}`,
    {
      query: { type: params.type },
      signal,
    },
  );

  const data = unwrap(body);

  if (!isObj(data)) {
    throw new ApiError(
      'invalid-response',
      'Details response was incomplete.',
    );
  }

  const base = readSummary(data);

  if (!base) {
    throw new ApiError(
      'invalid-response',
      'Details response was missing a valid title or ID.',
    );
  }

  const directors = firstValue(
    data.director,
    data.directors,
    data.crew,
  );

  const castValue = firstValue(
    data.cast,
    data.actors,
    data.topCast,
    data.credits,
  );

  // If credits contains an object, extract its cast/crew arrays.
  let castSource = castValue;
  let directorSource = directors;

  if (isObj(castValue)) {
    castSource = firstValue(
      castValue.cast,
      castValue.actors,
      castValue.results,
    );
  }

  if (isObj(directors)) {
    directorSource = firstValue(
      directors.directors,
      directors.crew,
      directors.results,
    );
  }

  const releaseDate = str(
    firstValue(
      data.releaseDate,
      data.released,
      data.release_date,
      data.firstAirDate,
      data.first_air_date,
    ),
  );
const credits = readCredits(data.credits);
  return {
    ids: base.ids,
    title: base.title,
    year: base.year,
    type: base.type,
    poster: base.poster,
    plot: str(data.plot) ?? str(data.description) ?? str(data.overview),

    genres: readStringArray(data.genres),
    runtime: readRuntime(
      firstValue(data.runtime, data.duration),
    ),
    releaseDate,
   director:
  credits && credits.directors.length > 0
    ? credits.directors.map((person) => person.name)
    : readStringArray(directorSource),

cast:
  credits && credits.actors.length > 0
    ? credits.actors.map((person) => person.name)
    : readStringArray(castSource),
credits,

    backdrop: str(
      firstValue(
        data.backdrop,
        data.backdropUrl,
        data.backdrop_path,
      ),
    ),
    rating: readRating(
      firstValue(data.rating, data.ratings),
    ),
  };
}

/* ---------- Navigation helpers ---------- */

export function asTitleType(
  value: string | null | undefined,
): TitleType | undefined {
  return value === 'movie' || value === 'series'
    ? value
    : undefined;
}

export function detailsRouteParams(
  summary: Pick<TitleSummary, 'ids' | 'type'>,
  fallbackType?: TitleType,
): { id: string; type?: TitleType } | null {
  const type = asTitleType(summary.type) ?? fallbackType;

  if (summary.ids.imdb) {
    return {
      id: summary.ids.imdb,
      type,
    };
  }

  if (summary.ids.tmdb !== null) {
    return type
      ? { id: String(summary.ids.tmdb), type }
      : null;
  }

  return null;
}
