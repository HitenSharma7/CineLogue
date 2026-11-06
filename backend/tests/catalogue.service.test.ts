import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/modules/movies/catalogues/catalogue.provider", () => ({
  fetchCatalogueTitle: vi.fn(),
  searchCatalogueCandidates: vi.fn(),
}));

import {
  fetchCatalogueTitle,
  searchCatalogueCandidates,
} from "../src/modules/movies/catalogues/catalogue.provider";

import { syncCatalogue } from "../src/modules/movies/catalogues/catalogue.service";

import type {
  CatalogueRepository,
  CatalogueTitle,
  CatalogueCheckpoint,
  CatalogueSyncOptions,
} from "../src/modules/movies/catalogues/catalogue.types";

import type {
  SearchResult,
  TitleSummary,
} from "../src/modules/movies/movies.types";

const fetchTitleMock = vi.mocked(fetchCatalogueTitle);
const searchMock = vi.mocked(searchCatalogueCandidates);

const summary: TitleSummary = {
  ids: {
    imdb: "tt0111161",
    tmdb: 278,
    mdblist: null,
  },
  title: "The Shawshank Redemption",
  year: 1994,
  type: "movie",
  poster: "https://example.com/poster.jpg",
  score: 95,
};

const catalogueTitle: CatalogueTitle = {
  ids: {
    imdb: "tt0111161",
    tmdb: 278,
    mdblist: null,
  },
  title: "The Shawshank Redemption",
  year: 1994,
  type: "movie",
  poster: "https://example.com/poster.jpg",
  score: 95,
  plot: "Two imprisoned men bond over several years.",
  genres: [{ name: "Drama", slug: "drama" }],
};

const defaultOptions: CatalogueSyncOptions = {
  query: "the",
  type: "movie",
  maxPagesPerRun: 2,
  requestDelayMs: 0,
};

function createSearchResult(
  results: TitleSummary[],
  page: number,
  pages: number | null,
): SearchResult {
  return {
    results,
    pagination: {
      page,
      pages,
      total: null,
    },
  };
}

function createRepository() {
  const repository: CatalogueRepository = {
    upsertTitleWithGenres: vi.fn().mockResolvedValue(undefined),
    getCheckpoint: vi.fn().mockResolvedValue(null),
    saveCheckpoint: vi.fn().mockResolvedValue(undefined),
  };

  return repository;
}

describe("syncCatalogue", () => {
  let repository: CatalogueRepository;

  beforeEach(() => {
    vi.clearAllMocks();

    repository = createRepository();

    fetchTitleMock.mockResolvedValue(catalogueTitle);
  });

  // -----------------------------------------------
  // Successful ingestion
  // -----------------------------------------------

  it("fetches, maps and persists discovered titles", async () => {
    searchMock.mockResolvedValue(
      createSearchResult([summary], 1, 1),
    );

    const result = await syncCatalogue(repository, defaultOptions);

    expect(searchMock).toHaveBeenCalledWith({
      q: "the",
      page: 1,
      type: "movie",
    });

    expect(fetchTitleMock).toHaveBeenCalledWith(summary, "movie");

    expect(repository.upsertTitleWithGenres).toHaveBeenCalledWith(
      catalogueTitle,
    );

    expect(result).toEqual({
      type: "movie",
      query: "the",
      pagesProcessed: 1,
      titlesDiscovered: 1,
      titlesSaved: 1,
      titlesSkipped: 0,
      nextPage: null,
      completed: true,
    });
  });

  it("processes every title returned on a page", async () => {
    const secondSummary: TitleSummary = {
      ...summary,
      ids: {
        imdb: "tt0068646",
        tmdb: 238,
        mdblist: null,
      },
      title: "The Godfather",
    };

    searchMock.mockResolvedValue(
      createSearchResult([summary, secondSummary], 1, 1),
    );

    await syncCatalogue(repository, defaultOptions);

    expect(fetchTitleMock).toHaveBeenCalledTimes(2);
    expect(repository.upsertTitleWithGenres).toHaveBeenCalledTimes(2);
  });

  it("skips duplicate provider identities within the same page", async () => {
    searchMock.mockResolvedValue(
      createSearchResult([summary, summary], 1, 1),
    );

    const result = await syncCatalogue(repository, defaultOptions);

    expect(fetchTitleMock).toHaveBeenCalledTimes(1);
    expect(repository.upsertTitleWithGenres).toHaveBeenCalledTimes(1);

    expect(result.titlesDiscovered).toBe(2);
    expect(result.titlesSaved).toBe(1);
    expect(result.titlesSkipped).toBe(1);
  });
it("detects duplicates using overlapping provider IDs", async () => {
  const secondSummary: TitleSummary = {
    ...summary,
    ids: {
      imdb: "tt9999999",
      tmdb: 278, // Same TMDB ID, different IMDb ID
      mdblist: null,
    },
    title: "Another version of the same movie",
  };

  searchMock.mockResolvedValue(
    createSearchResult([summary, secondSummary], 1, 1),
  );

  const result = await syncCatalogue(repository, defaultOptions);

  expect(fetchTitleMock).toHaveBeenCalledTimes(1);
  expect(repository.upsertTitleWithGenres).toHaveBeenCalledTimes(1);

  expect(result.titlesDiscovered).toBe(2);
  expect(result.titlesSaved).toBe(1);
  expect(result.titlesSkipped).toBe(1);
});
  // -----------------------------------------------
  // Concurrency and retry behaviour
  // -----------------------------------------------

  it("never exceeds configured detail-fetch concurrency", async () => {
    let active = 0;
    let maxActive = 0;

    const summaries: TitleSummary[] = Array.from(
      { length: 6 },
      (_, index) => ({
        ...summary,
        ids: {
          imdb: `tt${String(index + 1).padStart(7, "0")}`,
          tmdb: index + 1,
          mdblist: null,
        },
        title: `Test Movie ${index + 1}`,
      }),
    );

    searchMock.mockResolvedValue(
      createSearchResult(summaries, 1, 1),
    );

    fetchTitleMock.mockImplementation(async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 10));
      active--;
      return catalogueTitle;
    });

    await syncCatalogue(repository, {
      ...defaultOptions,
      concurrency: 2,
    });

    expect(maxActive).toBe(2);
    expect(active).toBe(0);
    expect(fetchTitleMock).toHaveBeenCalledTimes(6);
  });

  it.each([0, -1, 11, 1.5])(
    "rejects invalid concurrency: %s",
    async (concurrency) => {
      await expect(
        syncCatalogue(repository, {
          ...defaultOptions,
          concurrency,
        }),
      ).rejects.toThrow(
        "concurrency must be between 1 and 10.",
      );

      expect(searchMock).not.toHaveBeenCalled();
    },
  );

  it("retries a transient provider failure and then succeeds", async () => {
    const transientError = Object.assign(
      new Error("Upstream unavailable"),
      { status: 503 },
    );

    searchMock.mockResolvedValue(
      createSearchResult([summary], 1, 1),
    );

    fetchTitleMock
      .mockRejectedValueOnce(transientError)
      .mockResolvedValueOnce(catalogueTitle);

    const result = await syncCatalogue(repository, {
      ...defaultOptions,
      maxRetries: 1,
      retryBaseDelayMs: 0,
    });

    expect(fetchTitleMock).toHaveBeenCalledTimes(2);
    expect(repository.upsertTitleWithGenres).toHaveBeenCalledTimes(1);
    expect(result.titlesSaved).toBe(1);
  });

  it("does not retry a permanent provider 4xx failure", async () => {
    const permanentError = Object.assign(
      new Error("Invalid provider request"),
      { status: 400 },
    );

    searchMock.mockResolvedValue(
      createSearchResult([summary], 1, 1),
    );

    fetchTitleMock.mockRejectedValue(permanentError);

    await expect(
      syncCatalogue(repository, {
        ...defaultOptions,
        maxRetries: 3,
        retryBaseDelayMs: 0,
      }),
    ).rejects.toThrow("Invalid provider request");

    expect(fetchTitleMock).toHaveBeenCalledTimes(1);
    expect(repository.saveCheckpoint).not.toHaveBeenCalled();
  });

  it("does not save the page checkpoint when retries are exhausted", async () => {
    const transientError = Object.assign(
      new Error("Upstream unavailable"),
      { status: 503 },
    );

    searchMock.mockResolvedValue(
      createSearchResult([summary], 1, 3),
    );

    fetchTitleMock.mockRejectedValue(transientError);

    await expect(
      syncCatalogue(repository, {
        ...defaultOptions,
        maxRetries: 2,
        retryBaseDelayMs: 0,
      }),
    ).rejects.toThrow("Upstream unavailable");

    expect(fetchTitleMock).toHaveBeenCalledTimes(3);
    expect(repository.saveCheckpoint).not.toHaveBeenCalled();
  });

  // -----------------------------------------------
  // Pagination and checkpoints
  // -----------------------------------------------

  it("starts ingestion from page one when no checkpoint exists", async () => {
    searchMock.mockResolvedValue(
      createSearchResult([], 1, null),
    );

    await syncCatalogue(repository, defaultOptions);

    expect(searchMock).toHaveBeenCalledWith({
      q: "the",
      page: 1,
      type: "movie",
    });
  });

  it("resumes from the saved next page", async () => {
    const checkpoint: CatalogueCheckpoint = {
      query: "the",
      type: "movie",
      nextPage: 4,
      completed: false,
    };

    vi.mocked(repository.getCheckpoint).mockResolvedValue(checkpoint);

    searchMock.mockResolvedValue(
      createSearchResult([summary], 4, 10),
    );

    const result = await syncCatalogue(repository, defaultOptions);

    expect(searchMock).toHaveBeenCalledWith({
      q: "the",
      page: 4,
      type: "movie",
    });

    expect(result.nextPage).toBe(6);
    expect(result.completed).toBe(false);
  });

  it("saves a checkpoint after each successfully processed page", async () => {
    searchMock
      .mockResolvedValueOnce(createSearchResult([summary], 1, 3))
      .mockResolvedValueOnce(createSearchResult([summary], 2, 3));

    const result = await syncCatalogue(repository, {
      ...defaultOptions,
      maxPagesPerRun: 2,
    });

    expect(repository.saveCheckpoint).toHaveBeenNthCalledWith(
      1,
      "reeldb:movie:the",
      {
        query: "the",
        type: "movie",
        nextPage: 2,
        completed: false,
      },
    );

    expect(repository.saveCheckpoint).toHaveBeenNthCalledWith(
      2,
      "reeldb:movie:the",
      {
        query: "the",
        type: "movie",
        nextPage: 3,
        completed: false,
      },
    );

    expect(result.pagesProcessed).toBe(2);
    expect(result.nextPage).toBe(3);
  });

  it("marks ingestion complete when the final known page is processed", async () => {
    vi.mocked(repository.getCheckpoint).mockResolvedValue({
      query: "the",
      type: "movie",
      nextPage: 2,
      completed: false,
    });

    searchMock.mockResolvedValue(
      createSearchResult([summary], 2, 2),
    );

    const result = await syncCatalogue(repository, defaultOptions);

    expect(repository.saveCheckpoint).toHaveBeenCalledWith(
      "reeldb:movie:the",
      {
        query: "the",
        type: "movie",
        nextPage: 2,
        completed: true,
      },
    );

    expect(result.completed).toBe(true);
    expect(result.nextPage).toBeNull();
  });

  it("marks ingestion complete when ReelDB returns an empty page", async () => {
    searchMock.mockResolvedValue(
      createSearchResult([], 1, null),
    );

    const result = await syncCatalogue(repository, defaultOptions);

    expect(fetchTitleMock).not.toHaveBeenCalled();
    expect(repository.upsertTitleWithGenres).not.toHaveBeenCalled();

    expect(result.completed).toBe(true);
    expect(result.nextPage).toBeNull();
  });

  it("does not exceed the configured page limit per run", async () => {
    searchMock.mockResolvedValue(
      createSearchResult([summary], 1, 20),
    );

    const result = await syncCatalogue(repository, {
      ...defaultOptions,
      maxPagesPerRun: 2,
    });

    expect(searchMock).toHaveBeenCalledTimes(2);
    expect(result.pagesProcessed).toBe(2);
    expect(result.nextPage).toBe(3);
    expect(result.completed).toBe(false);
  });

  it("does not restart an already completed catalogue", async () => {
    vi.mocked(repository.getCheckpoint).mockResolvedValue({
      query: "the",
      type: "movie",
      nextPage: 10,
      completed: true,
    });

    const result = await syncCatalogue(repository, defaultOptions);

    expect(searchMock).not.toHaveBeenCalled();
    expect(fetchTitleMock).not.toHaveBeenCalled();

    expect(result.pagesProcessed).toBe(0);
    expect(result.completed).toBe(true);
    expect(result.nextPage).toBeNull();
  });

  it("keeps movie and series checkpoints separate", async () => {
    searchMock.mockResolvedValue(
      createSearchResult([], 1, null),
    );

    await syncCatalogue(repository, {
      ...defaultOptions,
      type: "series",
    });

    expect(repository.getCheckpoint).toHaveBeenCalledWith(
      "reeldb:series:the",
    );
  });

  // -----------------------------------------------
  // Invalid and incomplete provider data
  // -----------------------------------------------

  it("skips a title when its details cannot be fetched", async () => {
    searchMock.mockResolvedValue(
      createSearchResult([summary], 1, 1),
    );

    fetchTitleMock.mockResolvedValue(null);

    const result = await syncCatalogue(repository, defaultOptions);

    expect(repository.upsertTitleWithGenres).not.toHaveBeenCalled();
    expect(result.titlesSkipped).toBe(1);
    expect(result.titlesSaved).toBe(0);
  });

  it("skips a title when no genres are available", async () => {
    searchMock.mockResolvedValue(
      createSearchResult([summary], 1, 1),
    );

    fetchTitleMock.mockResolvedValue({
      ...catalogueTitle,
      genres: [],
    });

    const result = await syncCatalogue(repository, defaultOptions);

    expect(repository.upsertTitleWithGenres).not.toHaveBeenCalled();
    expect(result.titlesSkipped).toBe(1);
  });

  // -----------------------------------------------
  // Failure and recovery behaviour
  // -----------------------------------------------

  it("does not advance the checkpoint when title fetching fails", async () => {
    searchMock.mockResolvedValue(
      createSearchResult([summary], 1, 3),
    );

    fetchTitleMock.mockRejectedValue(
      new Error("ReelDB unavailable"),
    );

    await expect(
      syncCatalogue(repository, defaultOptions),
    ).rejects.toThrow("ReelDB unavailable");

    expect(repository.saveCheckpoint).not.toHaveBeenCalled();
  });

  it("does not advance the checkpoint when database upsert fails", async () => {
    searchMock.mockResolvedValue(
      createSearchResult([summary], 1, 3),
    );

    vi.mocked(repository.upsertTitleWithGenres).mockRejectedValue(
      new Error("Database unavailable"),
    );

    await expect(
      syncCatalogue(repository, defaultOptions),
    ).rejects.toThrow("Database unavailable");

    expect(repository.saveCheckpoint).not.toHaveBeenCalled();
  });

  it("propagates checkpoint persistence failures", async () => {
    searchMock.mockResolvedValue(
      createSearchResult([summary], 1, 3),
    );

    vi.mocked(repository.saveCheckpoint).mockRejectedValue(
      new Error("Checkpoint write failed"),
    );

    await expect(
      syncCatalogue(repository, defaultOptions),
    ).rejects.toThrow("Checkpoint write failed");
  });

  it("propagates checkpoint retrieval failures", async () => {
    vi.mocked(repository.getCheckpoint).mockRejectedValue(
      new Error("Checkpoint read failed"),
    );

    await expect(
      syncCatalogue(repository, defaultOptions),
    ).rejects.toThrow("Checkpoint read failed");

    expect(searchMock).not.toHaveBeenCalled();
  });

  // -----------------------------------------------
  // Input validation and normalization
  // -----------------------------------------------

  it("trims the query before searching and checkpointing", async () => {
    searchMock.mockResolvedValue(
      createSearchResult([], 1, null),
    );

    await syncCatalogue(repository, {
      ...defaultOptions,
      query: "  THE  ",
    });

    expect(repository.getCheckpoint).toHaveBeenCalledWith(
      "reeldb:movie:the",
    );

    expect(searchMock).toHaveBeenCalledWith({
      q: "THE",
      page: 1,
      type: "movie",
    });
  });

  it("rejects a query shorter than two characters", async () => {
    await expect(
      syncCatalogue(repository, {
        ...defaultOptions,
        query: "a",
      }),
    ).rejects.toThrow(
      "Catalogue search query must be 2–100 characters.",
    );

    expect(searchMock).not.toHaveBeenCalled();
  });

  it("rejects a query longer than 100 characters", async () => {
    await expect(
      syncCatalogue(repository, {
        ...defaultOptions,
        query: "a".repeat(101),
      }),
    ).rejects.toThrow(
      "Catalogue search query must be 2–100 characters.",
    );

    expect(searchMock).not.toHaveBeenCalled();
  });

  it.each([0, -1, 101, 1.5])(
    "rejects invalid maxPagesPerRun value: %s",
    async (maxPagesPerRun) => {
      await expect(
        syncCatalogue(repository, {
          ...defaultOptions,
          maxPagesPerRun,
        }),
      ).rejects.toThrow(
        "maxPagesPerRun must be between 1 and 100",
      );

      expect(searchMock).not.toHaveBeenCalled();
    },
  );

  it.each([-1, 1.5])(
    "rejects invalid requestDelayMs value: %s",
    async (requestDelayMs) => {
      await expect(
        syncCatalogue(repository, {
          ...defaultOptions,
          requestDelayMs,
        }),
      ).rejects.toThrow(
        "requestDelayMs must be a non-negative integer.",
      );

      expect(searchMock).not.toHaveBeenCalled();
    },
  );
});