import { Platform, type TextStyle } from 'react-native';

/**
 * Editorial serif for display type. Didot on iOS, Noto Serif on Android.
 * To use a bundled face (Fraunces, Instrument Serif, Playfair...), load it with
 * expo-font and change this one constant; every headline follows.
 */
export const DISPLAY_FONT = Platform.select({
  ios: 'Didot',
  android: 'serif',
  default: 'Georgia',
}) as string;

export const CARD_RADIUS = 24;

export const display = (
  size: number,
  options: { italic?: boolean; weight?: TextStyle['fontWeight'] } = {},
): TextStyle => ({
  fontFamily: DISPLAY_FONT,
  fontSize: size,
  lineHeight: Math.round(size * 1.12),
  letterSpacing: -size * 0.015,
  fontWeight: options.weight ?? '700',
  fontStyle: options.italic ? 'italic' : 'normal',
});

/**
 * Largest display size (up to `max`) at which the longest single word still fits `innerWidth`.
 * Stops serif headlines like "Documentary" from breaking mid-word on narrow screens.
 */
export function fitDisplay(text: string, innerWidth: number, max: number, min = 16): number {
  const longest = Math.max(1, ...text.split(/\s+/).map((word) => word.length));
  return Math.floor(Math.min(max, Math.max(min, innerWidth / (longest * 0.62))));
}

/** Small tracked caps used for labels and numbering. */
export const eyebrow = (size = 10.5): TextStyle => ({
  fontSize: size,
  lineHeight: Math.round(size * 1.5),
  fontWeight: '700',
  letterSpacing: 2.2,
  textTransform: 'uppercase',
});

export const tabular: TextStyle = { fontVariant: ['tabular-nums'] };
export type TypeVariant =
  | 'body'
  | 'caption'
  | 'title'
  | 'heading'
  | 'display'
  | 'button';

export const TYPE: Record<TypeVariant, TextStyle> = {
  body: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '400',
  },

  caption: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400',
  },

  title: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '700',
  },

  heading: {
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '700',
  },

  display: {
    fontFamily: DISPLAY_FONT,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
  },

  button: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
};