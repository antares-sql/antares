import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

import { legacyConnectionIcons } from '@/libs/icons/aliases';
import { badges, brands, glyphs, hasIcon, iconContent, iconMarkup, iconMasksMarkup } from '@/libs/icons/index';

const sourceFiles = (dir: string): string[] => readdirSync(dir).flatMap(name => {
   const path = join(dir, name);
   if (statSync(path).isDirectory()) return sourceFiles(path);
   return /\.(vue|ts)$/.test(name) ? [path] : [];
});

/**
 * Icon names written in the renderer sources: `icon-name="x"`, quoted strings inside `:icon-name="..."`
 * and the icon maps of components (string values ending up in `:icon-name`).
 */
const usedIconNames = () => {
   const names = new Map<string, string>();
   for (const file of sourceFiles(join(__dirname, '../../../src/renderer'))) {
      const source = readFileSync(file, 'utf8');
      for (const [, name] of source.matchAll(/\sicon-name="([^"]+)"/g))
         names.set(name, file);
      for (const [, expression] of source.matchAll(/:icon-name="([^"]+)"/g)) {
         // the whole expression or the branches of a ternary, not the operands of comparisons
         for (const [, name] of expression.matchAll(/(?:^|[?:]\s*)'([^']+)'/g))
            names.set(name, file);
      }
   }
   return names;
};

describe('icons', () => {
   it('every glyph and badge has markup', () => {
      for (const [name, markup] of Object.entries({ ...glyphs, ...badges }))
         expect(markup, name).toMatch(/^<(path|circle|rect|ellipse|g)\b/);
      for (const [name, path] of Object.entries(brands))
         expect(path, name).toMatch(/^M/);
   });

   it('resolves glyphs, badges, the off modifier and brands', () => {
      expect(hasIcon('table')).toBe(true);
      expect(hasIcon('table+cog')).toBe(true);
      expect(hasIcon('table+off')).toBe(true);
      expect(hasIcon('brand:docker')).toBe(true);
      expect(hasIcon('table+nope')).toBe(false);
      expect(hasIcon('nope')).toBe(false);
      expect(iconMarkup('nope', 'p-')).toBe('');
   });

   it('defines a cut-out mask for every badge', () => {
      const masks = iconMasksMarkup('tab1-cut-');
      for (const badge of [...Object.keys(badges), 'off'])
         expect(masks).toContain(`id="tab1-cut-${badge}"`);
      expect(iconMarkup('key+arrow', 'tab1-cut-')).toContain('mask="url(#tab1-cut-arrow)"');
   });

   it('a standalone icon carries the mask of its badge, with its own ids', () => {
      const content = iconContent('key+arrow', 'i1-');
      expect(content).toContain('<mask id="i1-arrow"');
      expect(content).toContain('mask="url(#i1-arrow)"');
      expect(content.match(/<mask /g)).toHaveLength(1);
      expect(iconContent('table', 'i2-')).not.toContain('<mask');
   });

   it('maps every legacy connection icon code', () => {
      for (const [code, name] of Object.entries(legacyConnectionIcons))
         expect(hasIcon(name), `${code} -> ${name}`).toBe(true);
   });

   it('every icon name used in the renderer exists', () => {
      const missing = [...usedIconNames()]
         .filter(([name]) => !hasIcon(name))
         .map(([name, file]) => `${name} (${file})`);
      expect(missing).toEqual([]);
   });
});
