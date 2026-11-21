/** WCAG 2 contrast helpers for hex colors (#rgb, #rrggbb) */

export interface RgbColor { r: number; g: number; b: number }

export const parseHexColor = (hex: string): RgbColor | null => {
   const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
   if (!match) return null;
   let value = match[1];
   if (value.length === 3) value = value.split('').map(c => c + c).join('');
   return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16)
   };
};

/** WCAG relative luminance (0 = black, 1 = white) */
export const relativeLuminance = ({ r, g, b }: RgbColor): number => {
   const channel = (c: number) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
   };
   return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

/** WCAG contrast ratio between two colors, from 1 to 21 */
export const contrastRatio = (a: RgbColor, b: RgbColor): number => {
   const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
   return (hi + 0.05) / (lo + 0.05);
};

export const LIGHT_TEXT = '#fdfdfd'; // same as the .text-light utility
export const DARK_TEXT = '#303742';

/**
 * Text color to use on a colored background (e.g. the connection folder accent):
 * white while it keeps at least `minContrast` (WCAG 3:1 for large/UI text), dark text otherwise.
 */
export const readableTextOn = (background: string, minContrast = 3): string => {
   const bg = parseHexColor(background);
   if (!bg) return LIGHT_TEXT;
   return contrastRatio(bg, parseHexColor(LIGHT_TEXT)) >= minContrast ? LIGHT_TEXT : DARK_TEXT;
};
