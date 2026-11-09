
import { describe, it, expect } from "vitest";
import {
  validMovieFixtures,
  malformedMovieFixtures,
} from "./fixtures/movies.fixtures";
import {
  mapSearchResponse,
  mapDetailsResponse,
} from "../src/modules/movies/movies.mapper";

describe("mapSearchResponse", () => {
  it("maps a valid search response", () => {
    const result = mapSearchResponse({
      results: [
        {
          ids: { imdb: "tt0133093", tmdb: 603 },
          title: "The Matrix",
          year: 1999,
          type: "MOVIE",
          poster: "https://example.com/matrix.jpg",
          score: 8.7,
        },
      ],
      page: 1,
      pages: 10,
      total: 100,
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({
      title: "The Matrix",
      year: 1999,
      type: "movie",
      poster: "https://example.com/matrix.jpg",
      score: 8.7,
      ids: { imdb: "tt0133093", tmdb: 603 },
    });
    expect(result.pagination).toEqual({
      page: 1,
      pages: 10,
      total: 100,
    });
  });

  it("returns an empty result list", () => {
    const result = mapSearchResponse({ results: [] });

    expect(result.results).toEqual([]);
    expect(result.pagination).toEqual({
      page: null,
      pages: null,
      total: null,
    });
  });

  it.each([null, undefined, [], "invalid", 123])(
    "rejects an invalid top-level response: %s",
    (raw) => {
      expect(() => mapSearchResponse(raw)).toThrow(
        expect.objectContaining({
          statusCode: 502,
          code: "PROVIDER_BAD_RESPONSE",
        }),
      );
    },
  );

  it.each([null, undefined, {}, "invalid", 123])(
    "rejects a response without a results array: %s",
    (results) => {
      expect(() => mapSearchResponse({ results })).toThrow(
        expect.objectContaining({
          statusCode: 502,
          code: "PROVIDER_BAD_RESPONSE",
        }),
      );
    },
  );

  it.each(validMovieFixtures)(
    "maps valid fixture: $name",
    ({ raw }) => {
      const result = mapSearchResponse({
        results: [raw],
        page: 1,
        pages: 1,
        total: 1,
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0].title).toBe(raw.title);
      expect(result.results[0].ids).toBeDefined();
    },
  );

  it.each(
    malformedMovieFixtures.filter(
      ({ name }) =>
        name !== "invalid IMDb ID but valid TMDB ID" &&
        name !== "invalid poster URL" &&
        name !== "out-of-range score" &&
        name !== "impossible year",
    ),
  )(
    "throws 502 when the only search item is unusable: $name",
    ({ raw }) => {
      expect(() =>
        mapSearchResponse({
          results: [raw],
          page: 1,
          pages: 1,
          total: 1,
        }),
      ).toThrow(
        expect.objectContaining({
          statusCode: 502,
          code: "PROVIDER_BAD_RESPONSE",
        }),
      );
    },
  );

  it("accepts a valid TMDB ID when the IMDb ID is invalid", () => {
    const result = mapSearchResponse({
      results: [
        {
          ids: { imdb: "invalid", tmdb: 603 },
          title: "Example Movie",
        },
      ],
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].ids.imdb).toBeNull();
    expect(result.results[0].ids.tmdb).toBe(603);
  });

  it("normalizes an invalid poster URL to null", () => {
    const result = mapSearchResponse({
      results: [
        {
          ids: { tmdb: 603 },
          title: "Example Movie",
          poster: "javascript:alert(1)",
        },
      ],
    });

    expect(result.results[0].poster).toBeNull();
  });

  it("normalizes an out-of-range score to null", () => {
    const result = mapSearchResponse({
      results: [
        {
          ids: { tmdb: 603 },
          title: "Example Movie",
          score: 100,
        },
      ],
    });

    expect(result.results[0].score).toBeNull();
  });

  it("normalizes an impossible year to null", () => {
    const result = mapSearchResponse({
      results: [
        {
          ids: { tmdb: 603 },
          title: "Example Movie",
          year: 2500,
        },
      ],
    });

    expect(result.results[0].year).toBeNull();
  });

  it("skips malformed items when valid items also exist", () => {
    const result = mapSearchResponse({
      results: [
        null,
        { title: "Invalid Movie" },
        {
          ids: { tmdb: 603 },
          title: "The Matrix",
        },
      ],
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].title).toBe("The Matrix");
  });

  it("normalizes blank optional text to null", () => {
    const result = mapSearchResponse({
      results: [
        {
          ids: { tmdb: 603 },
          title: "The Matrix",
          type: "   ",
        },
      ],
    });

    expect(result.results[0].type).toBeNull();
  });

  it("normalizes invalid pagination values to null", () => {
    const result = mapSearchResponse({
      results: [],
      page: 0,
      pages: -1,
      total: "invalid",
    });

    expect(result.pagination).toEqual({
      page: null,
      pages: null,
      total: null,
    });
  });
});

describe("mapDetailsResponse", () => {
  const requested = { imdb: "tt0133093", tmdb: 603 };

  it("maps valid movie details", () => {
    const result = mapDetailsResponse(
      {
        ids: { imdb: "tt0133093", tmdb: 603 },
        title: "The Matrix",
        year: 1999,
        type: "MOVIE",
        poster: "https://example.com/matrix.jpg",
        description: "A science-fiction film.",
      },
      requested,
    );

    expect(result).toMatchObject({
      title: "The Matrix",
      year: 1999,
      type: "movie",
      poster: "https://example.com/matrix.jpg",
      plot: "A science-fiction film.",
      ids: { imdb: "tt0133093", tmdb: 603 },
    });
  });

  it("uses plot when description is missing", () => {
    const result = mapDetailsResponse(
      {
        ids: { tmdb: 603 },
        title: "The Matrix",
        plot: "Fallback plot.",
      },
      requested,
    );

    expect(result.plot).toBe("Fallback plot.");
  });

  it("uses requested IDs when provider IDs are missing", () => {
    const result = mapDetailsResponse(
      { title: "The Matrix" },
      requested,
    );

    expect(result.ids.imdb).toBe("tt0133093");
    expect(result.ids.tmdb).toBe(603);
  });

  it("prefers valid provider IDs over requested IDs", () => {
    const result = mapDetailsResponse(
      {
        ids: { imdb: "tt7654321", tmdb: 999 },
        title: "Example Movie",
      },
      requested,
    );

    expect(result.ids.imdb).toBe("tt7654321");
    expect(result.ids.tmdb).toBe(999);
  });

  it.each([
    null,
    undefined,
    [],
    "invalid",
    123,
  ])("rejects an invalid details response: %s", (raw) => {
    expect(() => mapDetailsResponse(raw, requested)).toThrow(
      expect.objectContaining({
        statusCode: 502,
        code: "PROVIDER_BAD_RESPONSE",
      }),
    );
  });

  it.each([
    {},
    { title: "" },
    { title: "   " },
    { title: null },
    { title: 123 },
  ])("rejects details without a usable title: %o", (raw) => {
    expect(() => mapDetailsResponse(raw, requested)).toThrow(
      expect.objectContaining({
        statusCode: 502,
        code: "PROVIDER_BAD_RESPONSE",
      }),
    );
  });

  it.each([
    {},
    { imdb: "invalid" },
    { imdb: "tt1234567", tmdb: -1 },
    { imdb: "tt1234567", tmdb: 1.5 },
    {
      imdb: "tt1234567",
      tmdb: Number.MAX_SAFE_INTEGER + 1,
    },
  ])("rejects invalid requested IDs: %o", (ids) => {
    expect(() => mapDetailsResponse({ title: "Example Movie" }, ids))
      .toThrow(
        expect.objectContaining({
          statusCode: 400,
          code: "INVALID_REQUESTED_IDS",
        }),
      );
  });

  it("normalizes invalid optional detail fields", () => {
    const result = mapDetailsResponse(
      {
        title: "Example Movie",
        year: 2500,
        poster: "javascript:alert(1)",
        description: "   ",
        plot: "   ",
      },
      requested,
    );

    expect(result.year).toBeNull();
    expect(result.poster).toBeNull();
    expect(result.plot).toBeNull();
  });

  // Provider ratings: core behaviour

  it("maps IMDb, TMDB and MDBList ratings independently", () => {
    const result = mapDetailsResponse(
      {
        title: "The Matrix",
        ratings: {
          imdb: { rating: 8.7, votes: 2100000 },
          tmdb: { rating: 8.2, votes: 25000 },
          mdblist: { rating: 8.5, votes: 1500 },
        },
      },
      requested,
    );

    expect(result.ratings).toEqual({
      imdb: { rating: 8.7, votes: 2100000 },
      tmdb: { rating: 8.2, votes: 25000 },
      mdblist: { rating: 8.5, votes: 1500 },
    });

    expect(result.rating).toBe(8.7);
  });

  it("returns null for all providers when ratings are missing", () => {
    const result = mapDetailsResponse(
      { title: "The Matrix" },
      requested,
    );

    expect(result.ratings).toEqual({
      imdb: null,
      tmdb: null,
      mdblist: null,
    });
  });

  it("normalizes invalid ratings while preserving valid vote counts", () => {
    const result = mapDetailsResponse(
      {
        title: "The Matrix",
        ratings: {
          imdb: { rating: 11, votes: 1000 },
          tmdb: { rating: 8.2, votes: 2000 },
          mdblist: { rating: -1, votes: 3000 },
        },
      },
      requested,
    );

    expect(result.ratings).toEqual({
      imdb: { rating: null, votes: 1000 },
      tmdb: { rating: 8.2, votes: 2000 },
      mdblist: { rating: null, votes: 3000 },
    });
  });

  it("accepts numeric strings for ratings and votes", () => {
    const result = mapDetailsResponse(
      {
        title: "The Matrix",
        ratings: {
          imdb: { rating: "8.7", votes: "2100000" },
          tmdb: { rating: "8.2", votes: "25000" },
          mdblist: { rating: "8.5", votes: "1500" },
        },
      },
      requested,
    );

    expect(result.ratings).toEqual({
      imdb: { rating: 8.7, votes: 2100000 },
      tmdb: { rating: 8.2, votes: 25000 },
      mdblist: { rating: 8.5, votes: 1500 },
    });
  });

  it("uses the legacy rating field when IMDb provider rating is unavailable", () => {
    const result = mapDetailsResponse(
      {
        title: "The Matrix",
        rating: 7.9,
        ratings: {
          imdb: null,
          tmdb: { rating: 8.2, votes: 25000 },
        },
      },
      requested,
    );

    expect(result.rating).toBe(7.9);
    expect(result.ratings.imdb).toBeNull();
  });

  // Provider isolation and precedence

  it("preserves a valid zero rating and zero votes", () => {
    const result = mapDetailsResponse(
      {
        title: "Example Movie",
        ratings: {
          imdb: { rating: 0, votes: 0 },
        },
      },
      requested,
    );

    expect(result.ratings.imdb).toEqual({
      rating: 0,
      votes: 0,
    });

    expect(result.rating).toBe(0);
  });

  it("does not allow one provider rating to populate another provider", () => {
    const result = mapDetailsResponse(
      {
        title: "Example Movie",
        ratings: {
          imdb: { rating: 8.4, votes: 1000 },
        },
      },
      requested,
    );

    expect(result.ratings.imdb).toEqual({
      rating: 8.4,
      votes: 1000,
    });
    expect(result.ratings.tmdb).toBeNull();
    expect(result.ratings.mdblist).toBeNull();
  });

  it("supports the value alias when rating is unavailable", () => {
    const result = mapDetailsResponse(
      {
        title: "Example Movie",
        ratings: {
          imdb: { value: 8.6, votes: 1200 },
        },
      },
      requested,
    );

    expect(result.ratings.imdb).toEqual({
      rating: 8.6,
      votes: 1200,
    });
  });

  it("prefers rating over value when both are provided", () => {
    const result = mapDetailsResponse(
      {
        title: "Example Movie",
        ratings: {
          imdb: {
            rating: 8.5,
            value: 9.1,
            votes: 1000,
          },
        },
      },
      requested,
    );

    expect(result.ratings.imdb).toEqual({
      rating: 8.5,
      votes: 1000,
    });
  });

  it("prefers the provider IMDb rating over the legacy rating", () => {
    const result = mapDetailsResponse(
      {
        title: "Example Movie",
        rating: 7.5,
        ratings: {
          imdb: { rating: 8.9, votes: 2000 },
        },
      },
      requested,
    );

    expect(result.rating).toBe(8.9);
  });

  // Invalid rating values

  it.each([
    "NaN",
    "Infinity",
    "-Infinity",
    "",
    "   ",
    "not-a-number",
  ])("rejects invalid IMDb rating strings: %s", (rating) => {
    const result = mapDetailsResponse(
      {
        title: "Example Movie",
        ratings: {
          imdb: { rating, votes: 1000 },
        },
      },
      requested,
    );

    expect(result.ratings.imdb).toEqual({
      rating: null,
      votes: 1000,
    });
  });

  it.each([
    -1,
    10.01,
    11,
    100,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ])("rejects invalid numeric ratings: %s", (rating) => {
    const result = mapDetailsResponse(
      {
        title: "Example Movie",
        ratings: {
          imdb: { rating, votes: 1000 },
        },
      },
      requested,
    );

    expect(result.ratings.imdb).toEqual({
      rating: null,
      votes: 1000,
    });
  });

  // Invalid vote counts

  it.each([
    -1,
    1.5,
    "1.5",
    "invalid",
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.MAX_SAFE_INTEGER + 1,
  ])("rejects invalid vote counts: %s", (votes) => {
    const result = mapDetailsResponse(
      {
        title: "Example Movie",
        ratings: {
          imdb: { rating: 8.5, votes },
        },
      },
      requested,
    );

    expect(result.ratings.imdb).toEqual({
      rating: 8.5,
      votes: null,
    });
  });

  // Malformed provider payloads

  it.each([
    null,
    undefined,
    [],
    "invalid",
    123,
  ])("ignores malformed provider rating objects: %s", (providerRating) => {
    const result = mapDetailsResponse(
      {
        title: "Example Movie",
        ratings: {
          imdb: providerRating,
        },
      },
      requested,
    );

    expect(result.ratings.imdb).toBeNull();
  });

  it("handles a malformed ratings container safely", () => {
    const result = mapDetailsResponse(
      {
        title: "Example Movie",
        ratings: [],
      },
      requested,
    );

    expect(result.ratings).toEqual({
      imdb: null,
      tmdb: null,
      mdblist: null,
    });
  });
});
