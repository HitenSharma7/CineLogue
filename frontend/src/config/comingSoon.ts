import type { PickConfig } from '@/config/editorsPicks';

/**
 * Curated seed list for the Home "Coming Soon" shelf.
 *
 * Metadata (including release dates and posters) is fetched live through the
 * existing title-details endpoint. The Home screen filters out entries whose
 * release date is missing or no longer in the future.
 *
 * Keep this list maintained until a verified provider discovery endpoint or
 * database-backed upcoming catalogue is available.
 */
export const COMING_SOON_TITLE = 'Coming Soon';
export const COMING_SOON_SUBTITLE = 'Upcoming releases · dates may change.';

export const COMING_SOON: readonly PickConfig[] = [
  { id: 'tt35935357' }, // The Beekeeper 2
  { id: 'tt16744566' }, // Sonic the Hedgehog 4
  { id: 'tt32561550' }, // Godzilla x Kong: Supernova
  { id: 'tt29873948' }, // The Legend of Zelda
  { id: 'tt16360004' }, // Spider-Man: Beyond the Spider-Verse
  { id: 'tt6113186' }, // Shrek 5
];
