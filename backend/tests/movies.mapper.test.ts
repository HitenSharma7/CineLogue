
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
    { imdb: "tt1234567", tmdb: Number.MAX_SAFE_INTEGER + 1 },
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
});
