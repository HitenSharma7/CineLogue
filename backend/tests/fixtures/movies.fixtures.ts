
/**
 * Synthetic fixtures for movie mapper tests.
 * These are test inputs, not verified ReelDB API responses.
 */

export const validMovieFixtures = [
  {
    name: "Hindi cinema — Dhurandhar-style title",
    raw: {
      ids: { imdb: "tt1234567", tmdb: 12345, mdblist: "dhurandhar-test" },
      title: "Dhurandhar",
      year: 2025,
      type: "movie",
      poster: "https://example.com/posters/dhurandhar.jpg",
      score: 7.5,
    },
  },
  {
    name: "Punjabi cinema — Unicode and punctuation",
    raw: {
      ids: { tmdb: 23456 },
      title: "ਚੱਲ ਮੇਰਾ ਪੁੱਤ ੩",
      year: 2021,
      type: "movie",
      poster: "https://example.com/posters/punjabi-film.jpg",
      score: 7.1,
    },
  },
  {
    name: "Tamil cinema",
    raw: {
      ids: { tmdb: 34567 },
      title: "பொன்னியின் செல்வன்",
      year: 2022,
      type: "movie",
      poster: "https://example.com/posters/tamil-film.jpg",
      score: 8.0,
    },
  },
  {
    name: "Telugu cinema",
    raw: {
      ids: { tmdb: 45678 },
      title: "బాహుబలి",
      year: 2015,
      type: "movie",
      poster: "https://example.com/posters/telugu-film.jpg",
      score: 8.1,
    },
  },
  {
    name: "Malayalam cinema",
    raw: {
      ids: { tmdb: 56789 },
      title: "മഞ്ഞുമ്മൽ ബോയ്സ്",
      year: 2024,
      type: "movie",
      poster: "https://example.com/posters/malayalam-film.jpg",
      score: 8.0,
    },
  },
  {
    name: "Hollywood — punctuation and subtitle",
    raw: {
      ids: { imdb: "tt0133093", tmdb: 603 },
      title: "The Matrix: Reloaded!",
      year: 2003,
      type: "movie",
      poster: "https://example.com/posters/matrix.jpg",
      score: 7.2,
    },
  },
  {
    name: "Anime",
    raw: {
      ids: { tmdb: 67890 },
      title: "千と千尋の神隠し",
      year: 2001,
      type: "movie",
      poster: "https://example.com/posters/anime.jpg",
      score: 8.6,
    },
  },
  {
    name: "TV series",
    raw: {
      ids: { tmdb: 78901 },
      title: "Example Series",
      year: 2024,
      type: "series",
      poster: "https://example.com/posters/series.jpg",
      score: 8.4,
    },
  },
] as const;

export const malformedMovieFixtures = [
  { name: "null record", raw: null },
  { name: "array instead of record", raw: [] },
  { name: "missing title", raw: { ids: { tmdb: 603 } } },
  { name: "blank title", raw: { ids: { tmdb: 603 }, title: "   " } },
  { name: "missing IDs", raw: { title: "Unknown Movie" } },
  {
    name: "invalid IMDb ID but valid TMDB ID",
    raw: { ids: { imdb: "not-an-id", tmdb: 603 }, title: "Example Movie" },
  },
  {
    name: "invalid poster URL",
    raw: {
      ids: { tmdb: 603 },
      title: "Example Movie",
      poster: "javascript:alert(1)",
    },
  },
  {
    name: "out-of-range score",
    raw: { ids: { tmdb: 603 }, title: "Example Movie", score: 100 },
  },
  {
    name: "impossible year",
    raw: { ids: { tmdb: 603 }, title: "Example Movie", year: 2500 },
  },
] as const;
