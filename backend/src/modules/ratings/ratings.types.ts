/**
 * Rating scales are provider-native. Never compare or average scores across
 * providers without an explicit normalization policy.
 */
export type RatingScale = 5 | 10 | 100;

export type RatingProviderId =
  | "imdb"
  | "tmdb"
  | "mdblist"
  | "tomatoes"
  | "metacritic"
  | "trakt"
  | "letterboxd"
  | "rogerebert"
  | "myanimelist";

export interface ProviderRating {
  /** Provider-native score. Null means the provider has no usable score. */
  rating: number | null;
  /** Provider-native vote count. May be unavailable independently of score. */
  votes: number | null;
  /** Native maximum score for this provider; not inferred from the value. */
  scale: RatingScale;
  /** Optional provider-owned deep link, accepted only when it is HTTPS. */
  url: string | null;
  /** Rotten Tomatoes certification metadata, when supplied. */
  certifiedFresh?: boolean | null;
}

export type TitleRatings = Partial<Record<RatingProviderId, ProviderRating>>;

export interface FeaturedRating {
  provider: RatingProviderId;
  label: string;
  rating: number;
  scale: RatingScale;
  /** Score converted to a 10-point scale for consistent compact UI display. */
  normalizedRating: number;
  votes: number | null;
}

export interface MappedTitleRatings {
  ratings: TitleRatings;
  /** Backward-compatible legacy field. IMDb only; never silently relabel another source. */
  primaryRating: number | null;
  /** Deterministic, explicitly attributed rating suitable for a Home card. */
  featuredRating: FeaturedRating | null;
}
