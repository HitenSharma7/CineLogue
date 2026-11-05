export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const RADII = { sm: 8, md: 12, lg: 20, xl: 28, pill: 999 } as const;
export const MIN_TOUCH_TARGET = 44;

/** Window-width breakpoints (dp). Evaluated against useWindowDimensions, so
 *  split-screen, foldables and resizable windows are handled automatically. */
export const BREAKPOINTS = {
  compact: 0, // small phones
  medium: 380, // standard phones
  large: 430, // large phones / small foldable cover
  tablet: 600, // small tablets, unfolded foldables
  desktop: 900, // large tablets / landscape tablets
} as const;

export const MAX_CONTENT_WIDTH = 1200;
export const POSTER_ASPECT = 2 / 3;
