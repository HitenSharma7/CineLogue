import type { Genre } from "./genre.types";

export const GENRE_CATALOGUE: Genre[] = [
  { slug: "action", name: "Action", description: "Adrenaline-fuelled adventures.", displayOrder: 1 },
  { slug: "adventure", name: "Adventure", description: "Explore the unknown.", displayOrder: 2 },
  { slug: "animation", name: "Animation", description: "Animated worlds and stories.", displayOrder: 3 },
  { slug: "comedy", name: "Comedy", description: "Stories that make you laugh.", displayOrder: 4 },
  { slug: "crime", name: "Crime", description: "Criminal minds and investigations.", displayOrder: 5 },
  { slug: "documentary", name: "Documentary", description: "Real people and real stories.", displayOrder: 6 },
  { slug: "drama", name: "Drama", description: "Stories driven by emotion.", displayOrder: 7 },
  { slug: "family", name: "Family", description: "Stories for everyone.", displayOrder: 8 },
  { slug: "fantasy", name: "Fantasy", description: "Worlds beyond imagination.", displayOrder: 9 },
  { slug: "history", name: "History", description: "Stories from the past.", displayOrder: 10 },
  { slug: "horror", name: "Horror", description: "Enter the world of fear.", displayOrder: 11 },
  { slug: "mystery", name: "Mystery", description: "Uncover hidden secrets.", displayOrder: 12 },
  { slug: "romance", name: "Romance", description: "Stories of love and connection.", displayOrder: 13 },
  { slug: "science-fiction", name: "Science Fiction", description: "Beyond the boundaries of reality.", displayOrder: 14 },
  { slug: "thriller", name: "Thriller", description: "Suspense at every turn.", displayOrder: 15 },
  { slug: "war", name: "War", description: "Stories of conflict and courage.", displayOrder: 16 },
];

export function getGenreBySlug(slug: string): Genre | undefined {
  return GENRE_CATALOGUE.find((genre) => genre.slug === slug);
}
export function getAllGenres(): Genre[] {
  return GENRE_CATALOGUE;
}