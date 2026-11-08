import type { TitleType } from '@/type/movie';

/**
 * THE HALL OF FAME: a separate editorial collection for Home.
 *
 * This is a hand-curated starting list, not an automatically calculated
 * ranking. Details (title, year, poster and rating) are loaded through the
 * existing movie details service.
 *
 * Keep this list independent from EDITORS_PICKS so the two Home sections
 * can evolve without sharing the same titles or selection logic.
 */
export type HallOfFamePick = { id: string; type?: TitleType };

export const HALL_OF_FAME_TITLE = 'The Hall of Fame';
export const HALL_OF_FAME_SUBTITLE = 'The films that leave a mark.';

export const HALL_OF_FAME: readonly HallOfFamePick[] = [
  { id: 'tt0111161' }, // The Shawshank Redemption
  { id: 'tt0068646' }, // The Godfather
  { id: 'tt0108052' }, // Schindler's List
  { id: 'tt0167260' }, // The Lord of the Rings: The Return of the King
  { id: 'tt0110912' }, // Pulp Fiction
  { id: 'tt0109830' }, // Forrest Gump
  { id: 'tt0137523' }, // Fight Club
  { id: 'tt0245429' }, // Spirited Away
  { id: 'tt0468569' }, // The Dark Knight
  { id: 'tt6751668' }, // Parasite
];
