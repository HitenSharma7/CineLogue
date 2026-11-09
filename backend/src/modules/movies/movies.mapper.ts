
import { z } from "zod";
import { AppError } from "../../utils/AppError";
import { getTitleRatings } from "../ratings/ratings.service";
import type {
  Credits,
  CrewMember,
  Pagination,
  SearchResult,
  TitleDetails,
  TitleIds,
  TitleSummary,
} from "./movies.types";

type RawRecord = Record<string, unknown>;

export interface RequestedIds {
  imdb?: string;
  tmdb?: number;
}

const imdbIdSchema = z.string().regex(/^tt\d{7,10}$/);

const mdblistIdSchema = z
  .string()
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/);

const requestedIdsSchema = z
  .object({
    imdb: imdbIdSchema.optional(),
    tmdb: z.number().int().positive().safe().optional(),
  })
  .refine(
    (ids) => ids.imdb !== undefined || ids.tmdb !== undefined,
    { message: "At least one movie ID is required." },
  );

function isRecord(value: unknown): value is RawRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function badResponse(reason: string): AppError {
  console.error(`[reeldb] unexpected response shape: ${reason}`);

  return new AppError(
    502,
    "PROVIDER_BAD_RESPONSE",
    "The movie data service returned an unexpected response.",
  );
}

function toText(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  return trimmed === "" || trimmed === "N/A" ? null : trimmed;
}

function toInt(value: unknown, min: number): number | null {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+$/.test(value.trim())
        ? Number(value.trim())
        : Number.NaN;

  return Number.isSafeInteger(parsed) && parsed >= min
    ? parsed
    : null;
}

function toYear(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") {
    return null;
  }

  const match = String(value).match(/^\d{4}$/);
  if (!match) return null;

  const year = Number(match[0]);

  return year >= 1888 && year <= 2100 ? year : null;
}

function toScore(value: unknown): number | null {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 10
    ? parsed
    : null;
}
function toHttpsUrl(value: unknown): string | null {
  const text = toText(value);

  if (!text || !text.startsWith("https://")) return null;

  return z.string().url().safeParse(text).success ? text : null;
}

function readIds(value: unknown): TitleIds {
  const ids = isRecord(value) ? value : {};

  const imdb = imdbIdSchema.safeParse(ids.imdb);

  const mdblist = mdblistIdSchema.safeParse(
    typeof ids.mdblist === "number"
      ? String(ids.mdblist)
      : ids.mdblist,
  );

  return {
    imdb: imdb.success ? imdb.data : null,
    tmdb: toInt(ids.tmdb, 1),
    mdblist: mdblist.success ? mdblist.data : null,
  };
}

function hasAnyId(ids: TitleIds): boolean {
  return (
    ids.imdb !== null ||
    ids.tmdb !== null ||
    ids.mdblist !== null
  );
}

function toSummary(item: unknown): TitleSummary | null {
  if (!isRecord(item)) return null;

  const title = toText(item.title);
  const ids = readIds(item.ids);

  if (!title || !hasAnyId(ids)) return null;

  return {
    ids,
    title,
    year: toYear(item.year),
    type: toText(item.type)?.toLowerCase() ?? null,
    poster: toHttpsUrl(item.poster),
    score: toScore(item.score),
  };
}

function toTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    const single = toText(value);
    return single ? [single] : [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return toText(item);
      }

      if (isRecord(item)) {
        return (
          toText(item.name) ??
          toText(item.title) ??
          toText(item.original_name)
        );
      }

      return null;
    })
    .filter((item): item is string => item !== null);
}

function toRuntime(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value > 0
      ? value
      : null;
  }

  if (typeof value !== "string") return null;

  const match = value
    .trim()
    .match(/^(\d+)(?:\s*min(?:utes?)?)?$/i);

  return match ? toInt(match[1], 1) : null;
}

export function mapSearchResponse(raw: unknown): SearchResult {
  if (!isRecord(raw) || !Array.isArray(raw.results)) {
    throw badResponse("search response has no results array");
  }

  const results = raw.results
    .map(toSummary)
    .filter((entry): entry is TitleSummary => entry !== null);

  if (raw.results.length > 0 && results.length === 0) {
    throw badResponse(
      "no search item had a title and a usable provider id",
    );
  }

  const skipped = raw.results.length - results.length;

  if (skipped > 0) {
    console.error(
      `[reeldb] skipped ${skipped} malformed search item(s)`,
    );
  }

  const pagination: Pagination = {
    page: toInt(raw.page, 1),
    pages: toInt(raw.pages, 0),
    total: toInt(raw.total, 0),
  };

  return { results, pagination };
}

export function mapDetailsResponse(
  raw: unknown,
  requested: RequestedIds,
): TitleDetails {
  const parsedRequested = requestedIdsSchema.safeParse(requested);

  if (!parsedRequested.success) {
    throw new AppError(
      400,
      "INVALID_REQUESTED_IDS",
      "The requested movie IDs are invalid.",
    );
  }

  if (!isRecord(raw)) {
    throw badResponse("title response is not an object");
  }

  const title = toText(raw.title);

  if (!title) {
    throw badResponse("title response has no title");
  }

  const fromProvider = readIds(raw.ids);

  const ids: TitleIds = {
    imdb: fromProvider.imdb ?? parsedRequested.data.imdb ?? null,
    tmdb: fromProvider.tmdb ?? parsedRequested.data.tmdb ?? null,
    mdblist: fromProvider.mdblist,
  };
  const { ratings, primaryRating: rating } = getTitleRatings(raw);

  return {
    ids,
    title,
    year: toYear(raw.year),
    type: toText(raw.type)?.toLowerCase() ?? null,
    poster: toHttpsUrl(raw.poster),
    plot: toText(raw.plot) ?? toText(raw.description),
    genres: toTextArray(raw.genres),
    runtime: toRuntime(raw.runtime),
    releaseDate: toText(raw.releaseDate) ?? toText(raw.released),
    director: toTextArray(raw.director ?? raw.directors),
    cast: toTextArray(raw.cast ?? raw.actors),
    credits: null,
    backdrop: toHttpsUrl(raw.backdrop ?? raw.backdropUrl),
    rating,
    ratings,
  };
}

export function mapCreditsResponse(raw: unknown): Credits {
  const data = isRecord(raw) ? raw : {};

  const mapMembers = (value: unknown): CrewMember[] => {
    if (!Array.isArray(value)) return [];

    return value.flatMap((item): CrewMember[] => {
      if (!isRecord(item)) return [];

      const name = toText(item.name);
      if (!name) return [];

      return [
        {
          tmdb_id: toInt(item.tmdb_id, 1),
          name,
          role: toText(item.role),
          profile: toHttpsUrl(item.profile),
        },
      ];
    });
  };

  const counts = isRecord(data.counts) ? data.counts : null;

  return {
    directors: mapMembers(data.directors),
    writers: mapMembers(data.writers),
    actors: mapMembers(data.actors),
    guests: mapMembers(data.guests),
    counts: counts
      ? {
          cast_count: toInt(counts.cast_count, 0) ?? 0,
          crew_count: toInt(counts.crew_count, 0) ?? 0,
          guest_count: toInt(counts.guest_count, 0) ?? 0,
          total_count: toInt(counts.total_count, 0) ?? 0,
          writer_count: toInt(counts.writer_count, 0) ?? 0,
          director_count: toInt(counts.director_count, 0) ?? 0,
        }
      : null,
  };
}
