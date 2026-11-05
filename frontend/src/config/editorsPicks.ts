import type { TitleType } from '@/type/movie';

/**
 * EDITOR'S PICKS: the ONE place to change what Home features.
 *
 * - This is a hand-curated list, NOT trending / top-rated / recommended.
 *   Do not rename the label to imply popularity or ranking.
 * - Only IDs live here. Title, year, poster and synopsis are fetched live
 *   through the backend's details endpoint, so nothing is hardcoded.
 * - Order matters: the first HERO_COUNT picks that have a poster become the
 *   hero carousel; every pick appears in the "Editor's Picks" shelf.
 * - IDs are IMDb ids. `type` is optional for IMDb ids (required only for TMDb ids).
 * - If an id is wrong, the app simply shows whatever the API returns for it,
 *   or skips it when the request fails. Verify against your backend.
 */
export const EDITORS_PICKS_LABEL = "Editor's Picks";
export const EDITORS_PICKS_SUBTITLE = 'Hand-picked, not algorithmic.';
export const HERO_COUNT = 5;

export type PickConfig = { id: string; type?: TitleType };

export const EDITORS_PICKS: readonly PickConfig[] = [
  { id: 'tt15239678' }, // Dune: Part Two
  { id: 'tt0816692' }, // Interstellar
  { id: 'tt15398776' }, // Oppenheimer
  { id: 'tt0468569' }, // The Dark Knight
  { id: 'tt1375666' }, // Inception
  { id: 'tt9362722' }, // Spider-Man: Across the Spider-Verse
  { id: 'tt1856101' }, // Blade Runner 2049
  { id: 'tt1877830' }, // The Batman
  { id: 'tt6751668' }, // Parasite
  { id: 'tt1160419' }, // Dune
];
