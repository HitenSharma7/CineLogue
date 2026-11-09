import type {
  FeaturedRating,
  MappedTitleRatings,
  ProviderRating,
  RatingProviderId,
  RatingScale,
  TitleRatings,
} from "./ratings.types";

type RawRecord = Record<string, unknown>;

const PROVIDERS: ReadonlyArray<{
  id: RatingProviderId;
  label: string;
  scale: RatingScale;
  aliases: readonly string[];
}> = [
  { id: "imdb", label: "IMDb", scale: 10, aliases: ["imdb"] },
  { id: "tmdb", label: "TMDb", scale: 10, aliases: ["tmdb"] },
  { id: "mdblist", label: "MDBList", scale: 10, aliases: ["mdblist", "mdb_list"] },
  { id: "tomatoes", label: "Rotten Tomatoes", scale: 100, aliases: ["tomatoes", "rottentomatoes", "rotten_tomatoes", "rottenTomatoes"] },
  { id: "metacritic", label: "Metacritic", scale: 100, aliases: ["metacritic"] },
  { id: "trakt", label: "Trakt", scale: 10, aliases: ["trakt"] },
  { id: "letterboxd", label: "Letterboxd", scale: 5, aliases: ["letterboxd"] },
  { id: "rogerebert", label: "RogerEbert", scale: 4, aliases: ["rogerebert", "roger_ebert"] },
  { id: "myanimelist", label: "MyAnimeList", scale: 10, aliases: ["myanimelist", "my_anime_list", "mal"] },
  { id: "kinopoisk", label: "Kinopoisk", scale: 10, aliases: ["kinopoisk"] },
];

function isRecord(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstDefined(record: RawRecord, keys: readonly string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value.trim() === "") return null;
  // Do not parse formatted values such as "8.2/10", "82%", or "1,200".
  const normalized = value.trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function toRating(value: unknown, scale: RatingScale): number | null {
  const parsed = toFiniteNumber(value);
  return parsed !== null && parsed >= 0 && parsed <= scale ? parsed : null;
}

function toVotes(value: unknown): number | null {
  const parsed = toFiniteNumber(value);
  return parsed !== null &&
    Number.isSafeInteger(parsed) &&
    parsed >= 0
    ? parsed
    : null;
}

function toHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function toBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return null;
}

function mapProviderRating(
  value: unknown,
  scale: RatingScale,
): ProviderRating | null {
  if (!isRecord(value)) return null;

  const rating = toRating(firstDefined(value, ["rating", "value", "score"]), scale);
  const votes = toVotes(firstDefined(value, ["votes", "vote_count", "voteCount"]));
  const url = toHttpsUrl(value.url);
  const certifiedFresh = toBoolean(
    firstDefined(value, ["certified_fresh", "certifiedFresh"]),
  );

  if (rating === null && votes === null && url === null && certifiedFresh === null) {
    return null;
  }

  return {
    rating,
    votes,
    scale,
    url,
    ...(certifiedFresh !== null ? { certifiedFresh } : {}),
  };
}

function getProviderValue(source: RawRecord, aliases: readonly string[]): unknown {
  return firstDefined(source, aliases);
}

function makeFeaturedRating(
  ratings: TitleRatings,
): FeaturedRating | null {
  // Keep this order deliberate and stable: a global audience rating first,
  // then the broadest fallback. Every card carries its source label.
  const preference: RatingProviderId[] = [
    "imdb",
    "tmdb",
    "letterboxd",
    "trakt",
    "tomatoes",
    "metacritic",
    "myanimelist",
    "mdblist",
    "rogerebert",
    "kinopoisk",
  ];

  for (const provider of preference) {
    const entry = ratings[provider];
    if (!entry || entry.rating === null) continue;
    const metadata = PROVIDERS.find((item) => item.id === provider);
    if (!metadata) continue;

    return {
      provider,
      label: metadata.label,
      rating: entry.rating,
      scale: entry.scale,
      normalizedRating: Math.round((entry.rating / entry.scale) * 100) / 10,
      votes: entry.votes,
    };
  }

  return null;
}

/**
 * Converts provider-native ReelDB rating objects into a stable app contract.
 * Missing/invalid sources stay absent; zero is a valid score, never "missing".
 */
export function mapTitleRatings(raw: unknown): MappedTitleRatings {
  const title = isRecord(raw) ? raw : {};
  const source = isRecord(title.ratings) ? title.ratings : {};
  const ratings: TitleRatings = {};

  for (const provider of PROVIDERS) {
    const mapped = mapProviderRating(
      getProviderValue(source, provider.aliases),
      provider.scale,
    );
    if (mapped) ratings[provider.id] = mapped;
  }

  // Older payloads may expose a top-level IMDb-like rating. It is used only
  // for the legacy field; without provider attribution it is not shown as a
  // verified featured rating on Home.
  const legacyImdb = toRating(title.rating ?? title.imdbRating, 10);
  const primaryRating = ratings.imdb?.rating ?? legacyImdb;

  return {
    ratings,
    primaryRating,
    featuredRating: makeFeaturedRating(ratings),
  };
}
