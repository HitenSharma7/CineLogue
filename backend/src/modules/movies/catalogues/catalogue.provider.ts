
import { reeldbGet } from "../../../integrations/reeldb/reeldb.client";

import {
  mapDetailsResponse,
  mapSearchResponse,
} from "../movies.mapper";

import type {
  SearchResult,
  TitleSummary,
} from "../movies.types";

import type {
  CatalogueMediaType,
  CatalogueTitle,
} from "./catalogue.types";

import { toCatalogueGenres } from "../genres/genre.normalizer";

// Internal search query for catalogue ingestion.
// This is separate from public search validation.
interface CatalogueSearchQuery {
  q: string;
  page: number;
  type: CatalogueMediaType;
}

// Fetch detailed title information and extract real genres.
export async function fetchCatalogueTitle(
  summary: TitleSummary,
  fallbackType: CatalogueMediaType,
): Promise<CatalogueTitle | null> {
  const { imdb, tmdb } = summary.ids;

  if (!imdb && tmdb === null) {
    return null;
  }

  const type: CatalogueMediaType =
    summary.type === "series" || summary.type === "movie"
      ? summary.type
      : fallbackType;

  const requestedIds = imdb
    ? { imdb }
    : { tmdb: tmdb! };

  const result = await reeldbGet("/v1/title", {
    ...requestedIds,
    type,
    append: "ratings",
  });

  if (!result.found) {
    return null;
  }

  const details = mapDetailsResponse(
    result.data,
    requestedIds,
  );

  const resolvedType: CatalogueMediaType =
    details.type === "series" || details.type === "movie"
      ? details.type
      : type;

  return {
    ids: details.ids,
    title: details.title,
    year: details.year,
    type: resolvedType,
    poster: details.poster ?? summary.poster,
    score: summary.score,
    plot: details.plot,
    genres: toCatalogueGenres(details.genres),
  };
}

// Search ReelDB candidates for catalogue ingestion.
// Does not use the public API's 100-page validation limit.
export async function searchCatalogueCandidates(
  query: CatalogueSearchQuery,
): Promise<SearchResult> {
  const result = await reeldbGet("/v1/search", {
    q: query.q,
    page: query.page,
    type: query.type,
  });

  if (!result.found) {
    throw new Error(
      `ReelDB catalogue search failed for query: ${query.q}`,
    );
  }

  return mapSearchResponse(result.data);
}
