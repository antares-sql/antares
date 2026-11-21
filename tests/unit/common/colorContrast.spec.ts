import { contrastRatio, DARK_TEXT, LIGHT_TEXT, parseHexColor, readableTextOn } from 'common/libs/colorContrast';
import { describe, expect, it } from 'vitest';

describe('colorContrast', () => {
   it('parses short and long hex colors', () => {
      expect(parseHexColor('#fff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(parseHexColor('E36929')).toEqual({ r: 227, g: 105, b: 41 });
      expect(parseHexColor('red')).toBeNull();
      expect(parseHexColor('#12345')).toBeNull();
   });

   it('computes the WCAG contrast ratio', () => {
      expect(contrastRatio(parseHexColor('#000'), parseHexColor('#fff'))).toBeCloseTo(21, 5);
      expect(contrastRatio(parseHexColor('#777'), parseHexColor('#777'))).toBe(1);
   });

   it('keeps light text on the default accent and on dark folder colors', () => {
      for (const color of ['#E36929', '#E3242B', '#038835', '#4169E1', '#59788E', '#757C88'])
         expect(readableTextOn(color), color).toBe(LIGHT_TEXT);
   });

   it('switches to dark text on light folder colors', () => {
      // the colors of the old hard-coded list in TheFooter
      for (const color of ['#FFCE54', '#FDA50F', '#BEBDB8', '#48CFAD'])
         expect(readableTextOn(color), color).toBe(DARK_TEXT);
   });

   it('falls back to light text for unparsable colors', () => {
      expect(readableTextOn('var(--x)')).toBe(LIGHT_TEXT);
   });
});
