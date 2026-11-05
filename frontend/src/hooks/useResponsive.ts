import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { BREAKPOINTS, MAX_CONTENT_WIDTH, POSTER_ASPECT, SPACING } from '@/constants/layout';

export type SizeClass = 'compact' | 'medium' | 'large' | 'tablet' | 'desktop';

export function sizeClassForWidth(width: number): SizeClass {
  if (width >= BREAKPOINTS.desktop) return 'desktop';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  if (width >= BREAKPOINTS.large) return 'large';
  if (width >= BREAKPOINTS.medium) return 'medium';
  return 'compact';
}

/** Responsive abstraction. Everything derives from the live window size. */
export function useResponsive() {
  const { width, height, fontScale } = useWindowDimensions();
  return useMemo(() => {
    const sizeClass = sizeClassForWidth(width);
    const isTablet = width >= BREAKPOINTS.tablet;
    const contentWidth = Math.min(width, MAX_CONTENT_WIDTH);
    const gutter = isTablet ? SPACING.xxl : SPACING.lg;
    const inner = contentWidth - gutter * 2;

    /** Columns for a poster grid given a target poster width. */
    const gridColumns = (targetPosterWidth = 120, gap: number = SPACING.md) =>
      Math.max(2, Math.floor((inner + gap) / (targetPosterWidth + gap)));

    const posterWidth = (columns: number, gap: number = SPACING.md) =>
      Math.floor((inner - gap * (columns - 1)) / columns);

    return {
      width,
      height,
      fontScale,
      sizeClass,
      isTablet,
      isLandscape: width > height,
      contentWidth,
      gutter,
      inner,
      gridColumns,
      posterWidth,
      posterHeight: (w: number) => Math.round(w / POSTER_ASPECT),
    };
  }, [width, height, fontScale]);
}
