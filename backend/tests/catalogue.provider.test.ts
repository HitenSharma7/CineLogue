import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/integrations/reeldb/reeldb.client", () => ({
  reeldbGet: vi.fn(),
}));

vi.mock("../src/modules/movies/movies.mapper", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../src/modules/movies/movies.mapper")
    >();

  return {
    ...actual,
    mapDetailsResponse: vi.fn(),
  };
});

import { reeldbGet } from "../src/integrations/reeldb/reeldb.client";
import { mapDetailsResponse } from "../src/modules/movies/movies.mapper";

import { fetchCatalogueTitle } from "../src/modules/movies/catalogues/catalogue.provider";

import type {
  TitleSummary,
  TitleDetails,
} from "../src/modules/movies/movies.types";

const reeldbGetMock = vi.mocked(reeldbGet);
const mapDetailsResponseMock = vi.mocked(mapDetailsResponse);

const summary: TitleSummary = {
  ids: {
    imdb: "tt0944947",
    tmdb: 1399,
    mdblist: null,
  },
  title: "Game of Thrones",
  year: 2011,
  type: "series",
  poster: "https://example.com/poster.jpg",
  score: 85,
};

const details: TitleDetails = {
  ids: {
    imdb: "tt0944947",
    tmdb: 1399,
    mdblist: null,
  },
  title: "Game of Thrones",
  year: 2011,
  type: "series",
  poster: "https://example.com/details-poster.jpg",
  plot: "Nine noble families fight for control of the Iron Throne.",
  genres: ["Action", "Drama", "Fantasy", "Science Fiction"],
  runtime: null,
  releaseDate: null,
  director: null,
  cast: [],
  backdrop: null,
  rating: null,
};

describe("fetchCatalogueTitle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches title details using the IMDb ID when available", async () => {
    reeldbGetMock.mockResolvedValue({
      found: true,
      data: {},
    });

    mapDetailsResponseMock.mockReturnValue(details);

    await fetchCatalogueTitle(summary, "movie");

    expect(reeldbGetMock).toHaveBeenCalledWith("/v1/title", {
      imdb: "tt0944947",
      type: "series",
      append: "ratings",
    });
  });

  it("uses the TMDB ID when IMDb ID is unavailable", async () => {
    const tmdbOnlySummary: TitleSummary = {
      ...summary,
      ids: {
        imdb: null,
        tmdb: 1399,
        mdblist: null,
      },
    };

    reeldbGetMock.mockResolvedValue({
      found: true,
      data: {},
    });

    mapDetailsResponseMock.mockReturnValue(details);

    await fetchCatalogueTitle(tmdbOnlySummary, "series");

    expect(reeldbGetMock).toHaveBeenCalledWith("/v1/title", {
      tmdb: 1399,
      type: "series",
      append: "ratings",
    });
  });

  it("returns null when no usable provider ID exists", async () => {
    const invalidSummary: TitleSummary = {
      ...summary,
      ids: {
        imdb: null,
        tmdb: null,
        mdblist: null,
      },
    };

    const result = await fetchCatalogueTitle(
      invalidSummary,
      "movie",
    );

    expect(result).toBeNull();
    expect(reeldbGetMock).not.toHaveBeenCalled();
    expect(mapDetailsResponseMock).not.toHaveBeenCalled();
  });

  it("returns null when ReelDB does not find the title", async () => {
    reeldbGetMock.mockResolvedValue({
      found: false,
    });

    const result = await fetchCatalogueTitle(summary, "movie");

    expect(result).toBeNull();
    expect(mapDetailsResponseMock).not.toHaveBeenCalled();
  });

  it("maps title details and normalizes actual genres", async () => {
    reeldbGetMock.mockResolvedValue({
      found: true,
      data: {},
    });

    mapDetailsResponseMock.mockReturnValue(details);

    const result = await fetchCatalogueTitle(summary, "movie");

    expect(result).toEqual({
      ids: details.ids,
      title: "Game of Thrones",
      year: 2011,
      type: "series",
      poster: "https://example.com/details-poster.jpg",
      score: 85,
      plot: details.plot,
      genres: [
        { name: "Action", slug: "action" },
        { name: "Drama", slug: "drama" },
        { name: "Fantasy", slug: "fantasy" },
        { name: "Science Fiction", slug: "science-fiction" },
      ],
    });
  });

  it("uses the search poster when the details poster is missing", async () => {
    reeldbGetMock.mockResolvedValue({
      found: true,
      data: {},
    });

    mapDetailsResponseMock.mockReturnValue({
      ...details,
      poster: null,
    });

    const result = await fetchCatalogueTitle(summary, "series");

    expect(result?.poster).toBe(summary.poster);
  });

  it("uses the fallback media type when summary has an unsupported type", async () => {
  reeldbGetMock.mockResolvedValue({
    found: true,
    data: {},
  });

  mapDetailsResponseMock.mockReturnValue({
    ...details,
    type: "unknown",
  } as unknown as TitleDetails);

  const unsupportedSummary = {
    ...summary,
    type: "unknown",
  } as unknown as TitleSummary;

  const result = await fetchCatalogueTitle(
    unsupportedSummary,
    "movie",
  );

  expect(result?.type).toBe("movie");
});

  it("returns an empty genre array when details contain no genres", async () => {
    reeldbGetMock.mockResolvedValue({
      found: true,
      data: {},
    });

    mapDetailsResponseMock.mockReturnValue({
      ...details,
      genres: [],
    });

    const result = await fetchCatalogueTitle(summary, "series");

    expect(result?.genres).toEqual([]);
  });

  it("passes the provider response to the details mapper", async () => {
    const providerResponse = {
      title: "Game of Thrones",
      genres: ["Drama"],
    };

    reeldbGetMock.mockResolvedValue({
      found: true,
      data: providerResponse,
    });

    mapDetailsResponseMock.mockReturnValue(details);

    await fetchCatalogueTitle(summary, "series");

    expect(mapDetailsResponseMock).toHaveBeenCalledWith(
      providerResponse,
      { imdb: "tt0944947" },
    );
  });
});