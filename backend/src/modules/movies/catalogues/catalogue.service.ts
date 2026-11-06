
import {
  fetchCatalogueTitle,
  searchCatalogueCandidates,
} from "./catalogue.provider";

import type {
  CatalogueMediaType,
  CatalogueRepository,
  CatalogueSyncOptions,
  CatalogueSyncResult,
} from "./catalogue.types";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function checkpointKey(
  query: string,
  type: CatalogueMediaType,
): string {
  return `reeldb:${type}:${query.trim().toLowerCase()}`;
}

export async function syncCatalogue(
  repository: CatalogueRepository,
  options: CatalogueSyncOptions,
): Promise<CatalogueSyncResult> {
  const query = options.query.trim();

  if (query.length < 2 || query.length > 100) {
    throw new Error(
      "Catalogue search query must be 2–100 characters.",
    );
  }

  if (
    !Number.isInteger(options.maxPagesPerRun) ||
    options.maxPagesPerRun < 1 ||
    options.maxPagesPerRun > 100
  ) {
    throw new Error(
      "maxPagesPerRun must be between 1 and 100.",
    );
  }

  if (
    !Number.isInteger(options.requestDelayMs) ||
    options.requestDelayMs < 0
  ) {
    throw new Error(
      "requestDelayMs must be a non-negative integer.",
    );
  }

  const key = checkpointKey(query, options.type);
  const previous = await repository.getCheckpoint(key);

  if (previous?.completed) {
    return {
      type: options.type,
      query,
      pagesProcessed: 0,
      titlesDiscovered: 0,
      titlesSaved: 0,
      titlesSkipped: 0,
      nextPage: null,
      completed: true,
    };
  }

  let page = previous?.nextPage ?? 1;

  let pagesProcessed = 0;
  let titlesDiscovered = 0;
  let titlesSaved = 0;
  let titlesSkipped = 0;
  let completed = false;

  while (pagesProcessed < options.maxPagesPerRun) {
    const search = await searchCatalogueCandidates({
      q: query,
      page,
      type: options.type,
    });

    pagesProcessed++;
    titlesDiscovered += search.results.length;

    if (search.results.length === 0) {
      completed = true;
    } else {
      for (const summary of search.results) {
        const title = await fetchCatalogueTitle(
          summary,
          options.type,
        );

        if (!title || title.genres.length === 0) {
          titlesSkipped++;
        } else {
          await repository.upsertTitleWithGenres(title);
          titlesSaved++;
        }

        if (options.requestDelayMs > 0) {
          await wait(options.requestDelayMs);
        }
      }

      completed =
        search.pagination.pages !== null &&
        page >= search.pagination.pages;
    }

    const nextPage = completed ? page : page + 1;

    // Save checkpoint only after the entire page is processed.
    await repository.saveCheckpoint(key, {
      query,
      type: options.type,
      nextPage,
      completed,
    });

    if (completed) break;

    page++;
  }

  return {
    type: options.type,
    query,
    pagesProcessed,
    titlesDiscovered,
    titlesSaved,
    titlesSkipped,
    nextPage: completed ? null : page,
    completed,
  };
}
