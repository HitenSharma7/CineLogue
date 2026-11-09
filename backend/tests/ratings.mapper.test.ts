import { describe, expect, it } from "vitest";
import { mapTitleRatings } from "../src/modules/ratings/ratings.mapper";

describe("mapTitleRatings", () => {
  it("maps IMDb, TMDb and MDBList independently", () => {
    expect(mapTitleRatings({
      ratings: {
        imdb: { rating: 8.4, votes: 1200 },
        tmdb: { rating: "7.9", votes: "500" },
        mdblist: { value: 8.1, votes: 300 },
      },
    })).toEqual({
      ratings: {
        imdb: { rating: 8.4, votes: 1200 },
        tmdb: { rating: 7.9, votes: 500 },
        mdblist: { rating: 8.1, votes: 300 },
      },
      primaryRating: 8.4,
    });
  });

  it("uses the legacy top-level rating only as an IMDb fallback", () => {
    expect(mapTitleRatings({ rating: "7.5" })).toEqual({
      ratings: { imdb: null, tmdb: null, mdblist: null },
      primaryRating: 7.5,
    });
  });

  it("prefers the nested IMDb rating over the legacy rating", () => {
    expect(mapTitleRatings({
      rating: 7.5,
      ratings: { imdb: { rating: 8.9, votes: 2000 } },
    }).primaryRating).toBe(8.9);
  });

  it("preserves zero rating and zero votes", () => {
    expect(mapTitleRatings({
      ratings: { imdb: { rating: 0, votes: 0 } },
    })).toEqual({
      ratings: { imdb: { rating: 0, votes: 0 }, tmdb: null, mdblist: null },
      primaryRating: 0,
    });
  });

  it("keeps valid votes when the rating is invalid", () => {
    expect(mapTitleRatings({
      ratings: { imdb: { rating: 11, votes: 42 } },
    }).ratings.imdb).toEqual({ rating: null, votes: 42 });
  });

  it("rejects invalid ratings and vote counts", () => {
    expect(mapTitleRatings({
      ratings: { imdb: { rating: "NaN", votes: -1 } },
    }).ratings.imdb).toBeNull();
  });

  it("handles malformed ratings containers safely", () => {
    expect(mapTitleRatings({ ratings: [] })).toEqual({
      ratings: { imdb: null, tmdb: null, mdblist: null },
      primaryRating: null,
    });
  });

  it("does not copy one provider's value into another provider", () => {
    const result = mapTitleRatings({
      ratings: { imdb: { rating: 8.2, votes: 10 } },
    });
    expect(result.ratings.tmdb).toBeNull();
    expect(result.ratings.mdblist).toBeNull();
  });
});
