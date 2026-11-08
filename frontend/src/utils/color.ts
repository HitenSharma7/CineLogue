/**
 * Tiny colour helpers. Understand #rgb / #rrggbb / #rrggbbaa and rgb()/rgba().
 * Anything else (named colours, PlatformColor) is returned untouched,
 * so a theme change can never crash the UI.
 */
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+)?\s*\)$/i;

function parse(color: string): [number, number, number] | null {
  const input = color.trim();

  const hexMatch = HEX.exec(input);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('');
    }
    const n = parseInt(hex.slice(0, 6), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  const rgbMatch = RGB.exec(input);
  if (rgbMatch) {
    return [
      Math.min(255, Number(rgbMatch[1])),
      Math.min(255, Number(rgbMatch[2])),
      Math.min(255, Number(rgbMatch[3])),
    ];
  }

  return null;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function withAlpha(color: string, alpha: number): string {
  const rgb = parse(color);
  if (!rgb) return color;
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${clamp01(alpha)})`;
}

export function mix(color: string, target: string, amount: number): string {
  const a = parse(color);
  const b = parse(target);
  if (!a || !b) return color;
  const t = clamp01(amount);
  const ch = (i: number) => Math.round(a[i] + (b[i] - a[i]) * t);
  return `rgb(${ch(0)},${ch(1)},${ch(2)})`;
}

export const darken = (color: string, amount: number) => mix(color, '#000000', amount);
export const lighten = (color: string, amount: number) => mix(color, '#FFFFFF', amount);