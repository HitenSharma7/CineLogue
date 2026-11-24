import { reeldbGet } from "../../integrations/reeldb/reeldb.client";
import { mapDetailsResponse, mapSearchResponse } from "./movies.mapper";
import type { TitleSummary } from "./movies.types";

const TARGET_PER_COLLECTION = 20;
const SEARCH_PAGES = 4;
const DETAIL_CONCURRENCY = 4;
const CATEGORY_CONCURRENCY = 2;

const COLLECTIONS = [
  { id: "action", title: "Action", subtitle: "High-stakes stories and adrenaline.", genre: "Action", query: "action" },
  { id: "crime", title: "Crime", subtitle: "Criminal worlds, cases and investigations.", genre: "Crime", query: "crime" },
  { id: "science-fiction", title: "Science Fiction", subtitle: "Ideas and worlds beyond the ordinary.", genre: "Science Fiction", query: "science fiction" },
  { id: "comedy", title: "Comedy", subtitle: "Stories made to make you laugh.", genre: "Comedy", query: "comedy" },
  { id: "animation", title: "Animation", subtitle: "Animated stories worth discovering.", genre: "Animation", query: "animation" },
  { id: "drama", title: "Drama", subtitle: "Character-led stories that stay with you.", genre: "Drama", query: "drama" },
] as const;

type CollectionDefinition = (typeof COLLECTIONS)[number];
type CollectionResult = {
  id: string;
  title: string;
  subtitle: string;
  genre: string;
  results: TitleSummary[];
};

function normalizeGenre(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, " ");
  if (normalized === "sci-fi" || normalized === "science-fiction") return "science fiction";
  return normalized;
}

function keyOf(item: TitleSummary): string | null {
  if (item.ids.imdb) return `imdb:${item.ids.imdb}`;
  if (item.ids.tmdb !== null) return `tmdb:${item.ids.tmdb}`;
  if (item.ids.mdblist) return `mdblist:${item.ids.mdblist}`;
  return null;
}

async function searchCandidates(collection: CollectionDefinition): Promise<TitleSummary[]> {
  const unique = new Map<string, TitleSummary>();
  for (let page = 1; page <= SEARCH_PAGES; page += 1) {
    const response = await reeldbGet("/v1/search", {
      q: collection.query,
      page,
      type: "movie",
    });
    if (!response.found) break;
    const pageData = mapSearchResponse(response.data);
    for (const item of pageData.results) {
      const key = keyOf(item);
      if (key && !unique.has(key)) unique.set(key, item);
    }
    if (!pageData.results.length || (pageData.pagination.pages !== null && page >= pageData.pagination.pages)) break;
  }
  return [...unique.values()];
}

async function hydrateAndFilter(
  collection: CollectionDefinition,
  candidates: TitleSummary[],
): Promise<TitleSummary[]> {
  const matched = new Map<string, TitleSummary>();
  let cursor = 0;

  const worker = async () => {
    while (matched.size < TARGET_PER_COLLECTION) {
      const candidate = candidates[cursor++];
      if (!candidate) return;
      const id = candidate.ids.imdb
        ? { imdb: candidate.ids.imdb }
        : candidate.ids.tmdb !== null
          ? { tmdb: candidate.ids.tmdb }
          : null;
      if (!id) continue;

      try {
        const detailResponse = await reeldbGet("/v1/title", { ...id, type: "movie" });
        if (!detailResponse.found) continue;
        const details = mapDetailsResponse(detailResponse.data, id);
        const hasGenre = details.genres.some(
          (genre) => normalizeGenre(genre) === normalizeGenre(collection.genre),
        );
        if (!hasGenre || !details.poster) continue;
        const key = keyOf(details);
        if (key && !matched.has(key)) matched.set(key, {
          ids: details.ids,
          title: details.title,
          year: details.year,
          type: details.type,
          poster: details.poster,
          score: candidate.score,
        });
      } catch (error) {
        // One malformed or unavailable title must not fail an entire Home shelf.
        console.warn("[home-collections] skipped unavailable title detail", error instanceof Error ? error.message : "unknown error");
      }
    }
  };

  await Promise.all(Array.from(
    { length: Math.min(DETAIL_CONCURRENCY, candidates.length) },
    () => worker(),
  ));
  return [...matched.values()].slice(0, TARGET_PER_COLLECTION);
}

async function loadCollection(collection: CollectionDefinition): Promise<CollectionResult> {
  const candidates = await searchCandidates(collection);
  const results = await hydrateAndFilter(collection, candidates);
  return {
    id: collection.id,
    title: collection.title,
    subtitle: collection.subtitle,
    genre: collection.genre,
    results,
  };
}

export async function getHomeCollections(): Promise<{ collections: CollectionResult[] }> {
  const results = new Map<string, CollectionResult>();
  let cursor = 0;

  const worker = async () => {
    while (true) {
      const collection = COLLECTIONS[cursor++];
      if (!collection) return;
      const result = await loadCollection(collection);
      results.set(collection.id, result);
    }
  };

  await Promise.all(Array.from(
    { length: Math.min(CATEGORY_CONCURRENCY, COLLECTIONS.length) },
    () => worker(),
  ));

  return { collections: COLLECTIONS.map((collection) => results.get(collection.id)!) };
}
