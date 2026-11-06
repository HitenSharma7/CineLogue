
import type { CatalogueGenre } from "../catalogues/catalogue.types";

const GENRE_ALIASES: Record<string, string> = {
  "sci-fi": "science fiction",
  "science-fiction": "science fiction",
  "rom-com": "romance",
};

export function normalizeGenreName(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  return GENRE_ALIASES[normalized] ?? normalized;
}

export function normalizeGenres(genres: string[]): string[] {
  return [
    ...new Set(
      genres
        .filter((genre) => typeof genre === "string")
        .map(normalizeGenreName)
        .filter(Boolean),
    ),
  ];
}

export function genreToSlug(value: string): string {
  return normalizeGenreName(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatGenreName(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function toCatalogueGenres(
  genres: string[],
): CatalogueGenre[] {
  const uniqueGenres = new Map<string, CatalogueGenre>();

  for (const genre of normalizeGenres(genres)) {
    const slug = genreToSlug(genre);

    if (!slug || uniqueGenres.has(slug)) {
      continue;
    }

    uniqueGenres.set(slug, {
      name: formatGenreName(genre),
      slug,
    });
  }

  return [...uniqueGenres.values()];
}
