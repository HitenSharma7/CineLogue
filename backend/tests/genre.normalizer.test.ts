import { describe, expect, it } from "vitest";

import {
  normalizeGenreName,
  normalizeGenres,
  genreToSlug,
  toCatalogueGenres,
} from "../src/modules/movies/genres/genre.normalizer";

describe("normalizeGenreName", () => {
  it("converts genre names to lowercase", () => {
    expect(normalizeGenreName("ACTION")).toBe("action");
  });

  it("trims leading and trailing whitespace", () => {
    expect(normalizeGenreName("  Drama  ")).toBe("drama");
  });

  it("normalizes multiple spaces", () => {
    expect(normalizeGenreName("Science   Fiction")).toBe(
      "science fiction",
    );
  });

  it("normalizes sci-fi aliases", () => {
    expect(normalizeGenreName("Sci-Fi")).toBe("science fiction");
    expect(normalizeGenreName("science-fiction")).toBe(
      "science fiction",
    );
  });

  it("normalizes rom-com alias", () => {
    expect(normalizeGenreName("Rom-Com")).toBe("romance");
  });

  it("preserves unknown genre names after normalization", () => {
    expect(normalizeGenreName("Documentary")).toBe("documentary");
  });
});

describe("normalizeGenres", () => {
  it("normalizes all genre names", () => {
    expect(
      normalizeGenres(["ACTION", " Drama ", "Science Fiction"]),
    ).toEqual(["action", "drama", "science fiction"]);
  });

  it("removes duplicate genres after normalization", () => {
    expect(
      normalizeGenres([
        "Sci-Fi",
        "Science Fiction",
        "science-fiction",
        "Drama",
        "DRAMA",
      ]),
    ).toEqual(["science fiction", "drama"]);
  });

  it("removes empty genre names", () => {
    expect(normalizeGenres(["Action", "", "  ", "Drama"])).toEqual([
      "action",
      "drama",
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(normalizeGenres([])).toEqual([]);
  });
});

describe("genreToSlug", () => {
  it("converts spaces into hyphens", () => {
    expect(genreToSlug("Science Fiction")).toBe("science-fiction");
  });

  it("removes special characters", () => {
    expect(genreToSlug("Action & Adventure")).toBe(
      "action-adventure",
    );
  });

  it("removes leading and trailing hyphens", () => {
    expect(genreToSlug("  Drama!  ")).toBe("drama");
  });

  it("applies aliases before generating slugs", () => {
    expect(genreToSlug("Sci-Fi")).toBe("science-fiction");
    expect(genreToSlug("Rom-Com")).toBe("romance");
  });
});

describe("toCatalogueGenres", () => {
  it("converts genre strings into catalogue genre objects", () => {
    expect(toCatalogueGenres(["Action", "Science Fiction"])).toEqual([
      { name: "Action", slug: "action" },
      { name: "Science Fiction", slug: "science-fiction" },
    ]);
  });

  it("removes duplicate genres using normalized slugs", () => {
    expect(
      toCatalogueGenres([
        "Sci-Fi",
        "Science Fiction",
        "science-fiction",
        "Drama",
        "DRAMA",
      ]),
    ).toEqual([
      { name: "Science Fiction", slug: "science-fiction" },
      { name: "Drama", slug: "drama" },
    ]);
  });

  it("formats genre names in title case", () => {
    expect(toCatalogueGenres(["science fiction", "action"])).toEqual([
      { name: "Science Fiction", slug: "science-fiction" },
      { name: "Action", slug: "action" },
    ]);
  });

  it("returns an empty array when no genres are provided", () => {
    expect(toCatalogueGenres([])).toEqual([]);
  });
});