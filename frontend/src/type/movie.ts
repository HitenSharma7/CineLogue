export type TitleType = 'movie' | 'series';

export type TitleIds = {
  imdb: string | null;
  tmdb: number | null;
  mdblist: string | null;
};

/** Normalized shape used by the UI. Mirrors the verified backend contract. */
export type TitleSummary = {
  ids: TitleIds;
  title: string;
  year: number | null;
  type: string | null;
  poster: string | null;
  /** Provider score. NOT confirmed as a user-facing rating: do not display. */
  score: number | null;
};


export type TitleDetails = {
  ids: TitleIds;
  title: string;
  year: number | null;
  type: string | null;
  poster: string | null;
  plot: string | null;

  genres: string[];
  runtime: number | null;
  releaseDate: string | null;
  director: string[];
  cast: string[];
 credits: Credits | null;
  backdrop: string | null;
  rating: number | null;
};

export type Pagination = {
  page: number | null;
  pages: number | null;
  total: number | null;
};

export type SearchPage = {
  results: TitleSummary[];
  pagination: Pagination;
};

export type CrewMember = {
  tmdb_id: number | null;
  name: string;
  role: string | null;
  profile: string | null;
};

export type CreditCounts = {
  cast_count: number;
  crew_count: number;
  guest_count: number;
  total_count: number;
  writer_count: number;
  director_count: number;
};


export type Credits = {
  directors: CrewMember[];
  writers: CrewMember[];
  actors: CrewMember[];
  guests: CrewMember[];
  counts: {
    cast_count: number;
    crew_count: number;
    guest_count: number;
    total_count: number;
    writer_count: number;
    director_count: number;
  } | null;
};