export interface Genre {
  slug: string;
  name: string;
  description: string;
  displayOrder: number;
}

export interface GenreTitleQuery {
  slug: string;
  type: "all" | "movie" | "series";
  page: number;
}

export interface GenrePagination {
  page: number;
  pages: number;
  total: number;
}

export interface GenreTitlesResult {
  genre: Genre;
  results: import("../movies.types").TitleSummary[];
  pagination: GenrePagination;
}