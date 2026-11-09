import { describe, expect, it } from "vitest";
import { mapTitleRatings } from "../src/modules/ratings/ratings.mapper";

describe("mapTitleRatings", () => {
  it("maps documented ReelDB providers using their native scales", () => {
    const result = mapTitleRatings({
      ratings: {
        imdb: { rating: 8.7, votes: 2100000 },
        tomatoes: { rating: 83, certified_fresh: true },
        metacritic: { rating: 73 },
        trakt: { rating: 8.5, votes: 45000 },
        tmdb: { rating: 8.2, votes: 25000 },
        letterboxd: { rating: 4.2, votes: 1800000 },
      },
    });

    expect(result.ratings).toMatchObject({
      imdb: { rating: 8.7, votes: 2100000, scale: 10 },
      tomatoes: { rating: 83, scale: 100, certifiedFresh: true },
      metacritic: { rating: 73, scale: 100 },
      trakt: { rating: 8.5, scale: 10 },
      tmdb: { rating: 8.2, scale: 10 },
      letterboxd: { rating: 4.2, scale: 5 },
    });
    expect(result.featuredRating).toMatchObject({
      provider: "imdb",
      label: "IMDb",
      rating: 8.7,
      scale: 10,
      normalizedRating: 8.7,
    });
  });

  it("uses a deterministic attributed fallback when IMDb is absent", () => {
    const result = mapTitleRatings({
      ratings: { tmdb: { rating: "7.9", votes: "500" } },
    });
    expect(result.featuredRating).toMatchObject({
      provider: "tmdb",
      label: "TMDb",
      rating: 7.9,
      normalizedRating: 7.9,
    });
  });

  it("does not show an unattributed legacy score as a verified Home rating", () => {
    expect(mapTitleRatings({ rating: "7.5" })).toEqual({
      ratings: {},
      primaryRating: 7.5,
      featuredRating: null,
    });
  });

  it("prefers nested IMDb rating over the legacy field", () => {
    expect(mapTitleRatings({
      rating: 7.5,
      ratings: { imdb: { rating: 8.9, votes: 2000 } },
    }).primaryRating).toBe(8.9);
  });

  it("preserves zero rating and zero votes", () => {
    const result = mapTitleRatings({
      ratings: { imdb: { rating: 0, votes: 0 } },
    });
    expect(result.ratings.imdb).toMatchObject({ rating: 0, votes: 0 });
    expect(result.featuredRating?.rating).toBe(0);
  });

  it("keeps valid votes when a score is out of range", () => {
    expect(mapTitleRatings({
      ratings: { imdb: { rating: 11, votes: 42 } },
    }).ratings.imdb).toMatchObject({ rating: null, votes: 42, scale: 10 });
  });

  it("rejects malformed scores, negative votes, and unsafe vote integers", () => {
    const result = mapTitleRatings({
      ratings: {
        imdb: { rating: "8.4/10", votes: -1 },
        tmdb: { rating: 8, votes: Number.MAX_SAFE_INTEGER + 1 },
      },
    });
    expect(result.ratings.imdb).toBeUndefined();
    expect(result.ratings.tmdb).toMatchObject({ rating: 8, votes: null });
  });

  it("accepts numeric strings but not formatted or comma-separated values", () => {
    const result = mapTitleRatings({
      ratings: {
        imdb: { rating: "8.4", votes: "1200" },
        tmdb: { rating: "8,2", votes: "1,200" },
      },
    });
    expect(result.ratings.imdb).toMatchObject({ rating: 8.4, votes: 1200 });
    expect(result.ratings.tmdb).toBeUndefined();
  });

  it("normalizes provider aliases and validates links", () => {
    const result = mapTitleRatings({
      ratings: {
        rotten_tomatoes: {
          value: 91,
          url: "javascript:alert(1)",
          certified_fresh: "true",
        },
      },
    });
    expect(result.ratings.tomatoes).toMatchObject({
      rating: 91,
      scale: 100,
      url: null,
      certifiedFresh: true,
    });
  });

  it("handles malformed containers and unknown provider values safely", () => {
    expect(mapTitleRatings({ ratings: [] })).toEqual({
      ratings: {},
      primaryRating: null,
      featuredRating: null,
    });
    expect(mapTitleRatings({ ratings: { imdb: "8.5", unknown: { rating: 9 } } }).ratings)
      .toEqual({});
  });

  it("does not leak one provider's value into another provider", () => {
    const result = mapTitleRatings({
      ratings: { imdb: { rating: 8.2, votes: 10 } },
    });
    expect(result.ratings.tmdb).toBeUndefined();
    expect(result.ratings.tomatoes).toBeUndefined();
  });
});
