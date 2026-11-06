import type { TitleIds } from "../movies.types";

export type CatalogueMediaType = "movie" | "series";

export interface CatalogueGenre {
  name: string;
  slug: string;
}

export interface CatalogueTitle {
  ids: TitleIds;
  title: string;
  year: number | null;
  type: CatalogueMediaType;
  poster: string | null;
  score: number | null;
  plot: string | null;
  genres: CatalogueGenre[];
}

export interface CatalogueCheckpoint {
  query: string;
  type: CatalogueMediaType;
  nextPage: number | null;
  completed: boolean;
}

export interface CatalogueRepository {
  upsertTitleWithGenres(title: CatalogueTitle): Promise<void>;

  getCheckpoint(
    key: string,
  ): Promise<CatalogueCheckpoint | null>;

  saveCheckpoint(
    key: string,
    checkpoint: CatalogueCheckpoint,
  ): Promise<void>;
}

export interface CatalogueSyncOptions {
  query: string;
  type: CatalogueMediaType;
  maxPagesPerRun: number;
  requestDelayMs: number;
}

export interface CatalogueSyncResult {
  type: CatalogueMediaType;
  query: string;
  pagesProcessed: number;
  titlesDiscovered: number;
  titlesSaved: number;
  titlesSkipped: number;
  nextPage: number | null;
  completed: boolean;
}