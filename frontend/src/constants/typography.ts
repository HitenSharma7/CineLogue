/** Font sizes are base values; Text scales them with the user's font size
 *  setting automatically (allowFontScaling default). Line heights are ratios. */
export const TYPE = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '800' as const, letterSpacing: -0.5 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '700' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
  button: { fontSize: 16, lineHeight: 20, fontWeight: '700' as const },
} as const;
export type TypeVariant = keyof typeof TYPE;
