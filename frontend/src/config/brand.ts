/**
 * Single source of truth for branding. Change the name/taglines here only.
 * Name is a working name: trademark/domain availability has NOT been verified.
 */
export const BRAND = {
  name: 'CINELOGUE',
  displayName: 'Cinelogue',
  tagline: 'The Land of Cinephiles',
  // Splash signature line (Hinglish, as requested). Two lines, kept verbatim.
  splashLines: [
    'Na kisi se jhagda, na kisi se fight,',
    'Das baje nayi movie, barah baje good night.',
  ],
  // Original Devanagari form, kept for reference / future locale toggle.
  splashLinesDevanagari: [
    'ना किसी से झगड़ा, ना किसी से फाइट,',
    'दस बजे नई मूवी, बारह बजे गुड नाइट।',
  ],
  // Brand name candidates considered (for the record).
  candidates: ['Cinelogue', 'Reelkul', 'Filmora Club', 'Kahaani', 'Cinemate'],
} as const;
