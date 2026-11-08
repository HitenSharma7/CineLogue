
import type { ImageSourcePropType } from 'react-native';

import { darken, lighten, mix } from '@/utils/color';

export type ArtKind =
  | 'rings'
  | 'stripes'
  | 'orbit'
  | 'sun'
  | 'bars'
  | 'venn'
  | 'diamonds'
  | 'dots'
  | 'crescent'
  | 'chevrons';

export type Genre = {
  slug: string;
  name: string;
  description: string;
  accent: string;
  image?: ImageSourcePropType;
  art: ArtKind;
  variant: 0 | 1 | 2;
};

export type Mood = {
  key: string;
  label: string;
  hint: string;
  genreSlug: string;
};

export type Palette = {
  base: string;
  mid: string;
  deep: string;
  light: string;
  glow: string;
};

const GENRE_IMAGES = {
  action: require('../../assets/images/genres/action.webp'),
  adventure: require('../../assets/images/genres/adventure.webp'),
  animation: require('../../assets/images/genres/animation.webp'),
  comedy: require('../../assets/images/genres/comedy.webp'),
  crime: require('../../assets/images/genres/crime.webp'),
  documentary: require('../../assets/images/genres/documentary.webp'),
  drama: require('../../assets/images/genres/drama.webp'),
  family: require('../../assets/images/genres/family.webp'),
  fantasy: require('../../assets/images/genres/fantasy.webp'),
  history: require('../../assets/images/genres/history.webp'),
  horror: require('../../assets/images/genres/horror.webp'),
  mystery: require('../../assets/images/genres/mystery.webp'),
  romance: require('../../assets/images/genres/romance.webp'),
  'science-fiction': require('../../assets/images/genres/science-fiction.webp'),
  thriller: require('../../assets/images/genres/thriller.webp'),
  war: require('../../assets/images/genres/war.webp'),
} as const;

export const GENRES: readonly Genre[] = [
  {
    slug: 'action',
    name: 'Action',
    description: 'Adrenaline-fuelled adventures',
    accent: '#9D3B32',
    image: GENRE_IMAGES.action,
    art: 'chevrons',
    variant: 0,
  },
  {
    slug: 'adventure',
    name: 'Adventure',
    description: 'Explore the unknown',
    accent: '#326C63',
    image: GENRE_IMAGES.adventure,
    art: 'orbit',
    variant: 1,
  },
  {
    slug: 'animation',
    name: 'Animation',
    description: 'Animated worlds and stories',
    accent: '#7653A5',
    image: GENRE_IMAGES.animation,
    art: 'dots',
    variant: 0,
  },
  {
    slug: 'comedy',
    name: 'Comedy',
    description: 'Stories that make you laugh',
    accent: '#A76A27',
    image: GENRE_IMAGES.comedy,
    art: 'sun',
    variant: 1,
  },
  {
    slug: 'crime',
    name: 'Crime',
    description: 'Criminal minds and investigations',
    accent: '#515D78',
    image: GENRE_IMAGES.crime,
    art: 'rings',
    variant: 0,
  },
  {
    slug: 'documentary',
    name: 'Documentary',
    description: 'Real people and real stories',
    accent: '#397A80',
    image: GENRE_IMAGES.documentary,
    art: 'bars',
    variant: 0,
  },
  {
    slug: 'drama',
    name: 'Drama',
    description: 'Stories driven by emotion',
    accent: '#87465B',
    image: GENRE_IMAGES.drama,
    art: 'venn',
    variant: 1,
  },
  {
    slug: 'family',
    name: 'Family',
    description: 'Stories for everyone',
    accent: '#688347',
    image: GENRE_IMAGES.family,
    art: 'sun',
    variant: 0,
  },
  {
    slug: 'fantasy',
    name: 'Fantasy',
    description: 'Worlds beyond imagination',
    accent: '#6250A0',
    image: GENRE_IMAGES.fantasy,
    art: 'orbit',
    variant: 2,
  },
  {
    slug: 'history',
    name: 'History',
    description: 'Stories from the past',
    accent: '#866743',
    image: GENRE_IMAGES.history,
    art: 'stripes',
    variant: 1,
  },
  {
    slug: 'horror',
    name: 'Horror',
    description: 'Enter the world of fear and suspense',
    accent: '#673A48',
    image: GENRE_IMAGES.horror,
    art: 'crescent',
    variant: 2,
  },
  {
    slug: 'mystery',
    name: 'Mystery',
    description: 'Uncover hidden secrets beyond the obvious',
    accent: '#515D78',
    image: GENRE_IMAGES.mystery,
    art: 'diamonds',
    variant: 0,
  },
  {
    slug: 'romance',
    name: 'Romance',
    description: 'Stories of love and connection',
    accent: '#A84F75',
    image: GENRE_IMAGES.romance,
    art: 'venn',
    variant: 0,
  },
  {
    slug: 'science-fiction',
    name: 'Science Fiction',
    description: 'Beyond the boundaries of reality',
    accent: '#397D91',
    image: GENRE_IMAGES['science-fiction'],
    art: 'orbit',
    variant: 1,
  },
  {
    slug: 'thriller',
    name: 'Thriller',
    description: 'Suspense at every turn',
    accent: '#A45C36',
    image: GENRE_IMAGES.thriller,
    art: 'rings',
    variant: 1,
  },
  {
    slug: 'war',
    name: 'War',
    description: 'Stories of conflict and courage',
    accent: '#68734B',
    image: GENRE_IMAGES.war,
    art: 'chevrons',
    variant: 2,
  },
];

export const GENRE_BY_SLUG: Record<string, Genre> = Object.fromEntries(
  GENRES.map((genre) => [genre.slug, genre]),
);

export const MOODS: readonly Mood[] = [
  {
    key: 'family',
    label: 'Family night',
    hint: 'Something everyone can enjoy',
    genreSlug: 'family',
  },
  {
    key: 'truth',
    label: 'Based on truth',
    hint: 'Real people and remarkable events',
    genreSlug: 'history',
  },
  {
    key: 'escape',
    label: 'Escape reality',
    hint: 'Discover worlds beyond imagination',
    genreSlug: 'fantasy',
  },
  {
    key: 'adrenaline',
    label: 'Need adrenaline',
    hint: 'Fast-paced action and excitement',
    genreSlug: 'action',
  },
  {
    key: 'mind-games',
    label: 'Mind games',
    hint: 'Mysteries that keep you thinking',
    genreSlug: 'mystery',
  },
  {
    key: 'scares',
    label: 'Something scary',
    hint: 'For a darker movie night',
    genreSlug: 'horror',
  },
];

/**
 * Creates a consistent colour palette from a genre accent.
 */
const paletteCache = new Map<string, Palette>();

export function paletteOf(accent: string): Palette {
  const cached = paletteCache.get(accent);

  if (cached) {
    return cached;
  }

  const palette: Palette = {
    base: accent,
    mid: darken(accent, 0.2),
    deep: darken(accent, 0.58),
    light: lighten(accent, 0.72),
    glow: lighten(accent, 0.28),
  };

  paletteCache.set(accent, palette);

  return palette;
}

/**
 * Returns five featured genres, rotating deterministically each day.
 */
export function getFeatured(date: Date = new Date()): Genre[] {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const today = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const dayOfYear = Math.floor((today - start) / 86_400_000);
  const offset = dayOfYear % GENRES.length;

  return Array.from(
    { length: 5 },
    (_, index) => GENRES[(offset + index) % GENRES.length],
  );
}

/**
 * Deterministic genre of the day, rotating daily.
 */
export function genreOfTheDay(date: Date = new Date()): Genre {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const today = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const dayOfYear = Math.floor((today - start) / 86_400_000);

  return GENRES[dayOfYear % GENRES.length];
}
