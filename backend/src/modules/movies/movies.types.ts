
export interface TitleIds {
  imdb: string | null;
  tmdb: number | null;
  mdblist: string | null;
}

export interface TitleSummary {
  ids: TitleIds;
  title: string;
  year: number | null;
  type: string | null;
  poster: string | null;
  // Provider score meaning is unconfirmed; don't display as a rating.
  score: number | null;
}

export interface CrewMember {
  tmdb_id: number | null;
  name: string;
  role: string | null;
  profile: string | null;
}

export interface CreditsCounts {
  cast_count: number;
  crew_count: number;
  guest_count: number;
  total_count: number;
  writer_count: number;
  director_count: number;
}

export interface Credits {
  directors: CrewMember[];
  writers: CrewMember[];
  actors: CrewMember[];
  guests: CrewMember[];
  counts: CreditsCounts | null;
}

export interface TitleDetails {
  ids: TitleIds;
  title: string;
  year: number | null;
  type: string | null;
  poster: string | null;
  plot: string | null;
  genres: string[];
  runtime: number | null;
  releaseDate: string | null;

  // Keep these so existing frontend code doesn't break.
  director: string[];
  cast: string[];

  // Full cast and crew metadata.
  credits: Credits | null;

  backdrop: string | null;
  rating: number | null;
}

export interface Pagination {
  page: number | null;
  pages: number | null;
  total: number | null;
}

export interface SearchResult {
  results: TitleSummary[];
  pagination: Pagination;
}
