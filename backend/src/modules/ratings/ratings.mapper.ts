import type {
  MappedTitleRatings,
  ProviderRating,
  TitleRatings,
} from "./ratings.types";

type RawRecord = Record<string, unknown>;

function isRecord(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toRating(value: unknown): number | null {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value.trim())
        : Number.NaN;

  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 10
    ? parsed
    : null;
}

function toVotes(value: unknown): number | null {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+$/.test(value.trim())
        ? Number(value.trim())
        : Number.NaN;

  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

function mapProviderRating(value: unknown): ProviderRating | null {
  if (!isRecord(value)) return null;

  const rating = toRating(value.rating ?? value.value);
  const votes = toVotes(value.votes);

  if (rating === null && votes === null) return null;
  return { rating, votes };
}

/**
 * Normalizes ReelDB's provider ratings without mixing provider values.
 * The legacy top-level rating is used only as an IMDb fallback.
 */
export function mapTitleRatings(raw: unknown): MappedTitleRatings {
  const title = isRecord(raw) ? raw : {};
  const source = isRecord(title.ratings) ? title.ratings : {};

  const ratings: TitleRatings = {
    imdb: mapProviderRating(source.imdb),
    tmdb: mapProviderRating(source.tmdb),
    mdblist: mapProviderRating(source.mdblist),
  };

  return {
    ratings,
    primaryRating:
      ratings.imdb?.rating ?? toRating(title.rating ?? title.imdbRating),
  };
}
