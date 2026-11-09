export interface ProviderRating {
  rating: number | null;
  votes: number | null;
}

export interface TitleRatings {
  imdb: ProviderRating | null;
  tmdb: ProviderRating | null;
  mdblist: ProviderRating | null;
}

export interface MappedTitleRatings {
  ratings: TitleRatings;
  /** IMDb score retained for backward compatibility with the movies API. */
  primaryRating: number | null;
}
