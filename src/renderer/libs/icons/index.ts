import { legacyConnectionIcons } from './aliases';
import { badges } from './badges';
import { brands } from './brands';
import { glyphs } from './glyphs';

/**
 * Icon names:
 * - `table`: a glyph
 * - `table+cog`: a glyph with a badge in the bottom-right corner (one badge per icon)
 * - `table+off`: a glyph crossed out
 * - `brand:docker`: a brand logo
 * - connection icon codes saved by Antares 0.7.x and older, see aliases.ts
 */
export const OFF_SLASH = 'M3 3l18 18';
// Badge stroke (2.25) plus 2 of clearance on each side: at 18px the gap is still 1.5px wide
export const CUT_STROKE = 6.25;
export const OFF_CUT_STROKE = 6.75;

export const resolveIconName = (name: string): string => {
   if (!name) return name;
   return legacyConnectionIcons[name] ?? name;
};

export const parseIconName = (name: string) => {
   const [glyph, modifier] = resolveIconName(name).split('+');
   return { glyph, modifier };
};

export const hasIcon = (name: string): boolean => {
   const resolved = resolveIconName(name);
   if (!resolved) return false;
   if (resolved.startsWith('brand:')) return resolved.slice(6) in brands;
   const { glyph, modifier } = parseIconName(resolved);
   if (!(glyph in glyphs)) return false;
   return !modifier || modifier === 'off' || modifier in badges;
};

/**
 * Inner markup of the 24×24 `<svg>` of an icon (empty string for unknown names).
 * The badge cut-out references the mask `<maskPrefix><badge>`, which must be in the same SVG:
 * use `iconContent()` for a single icon, `iconMasksMarkup()` for an SVG with many icons.
 */
export const iconMarkup = (name: string, maskPrefix: string): string => {
   if (!hasIcon(name)) return '';
   const resolved = resolveIconName(name);

   if (resolved.startsWith('brand:'))
      return `<path class="d" d="${brands[resolved.slice(6)]}"/>`;

   const { glyph, modifier } = parseIconName(resolved);
   if (!modifier) return glyphs[glyph];
   if (modifier === 'off')
      return `<g mask="url(#${maskPrefix}off)">${glyphs[glyph]}</g><path d="${OFF_SLASH}"/>`;
   return `<g mask="url(#${maskPrefix}${modifier})">${glyphs[glyph]}</g><g class="b">${badges[modifier]}</g>`;
};

const maskMarkup = (prefix: string, id: string): string => {
   const content = id === 'off'
      ? `<path fill="none" stroke-width="${OFF_CUT_STROKE}" d="${OFF_SLASH}"/>`
      : badges[id];
   return `<mask id="${prefix}${id}" maskUnits="userSpaceOnUse" x="-4" y="-4" width="32" height="32">` +
      '<rect x="-4" y="-4" width="32" height="32" fill="#fff"/>' +
      `<g fill="#000" stroke="#000" stroke-width="${CUT_STROKE}" stroke-linecap="round" stroke-linejoin="round">${content}</g>` +
      '</mask>';
};

/**
 * Masks that cut a glyph along the outline of its badge, for an SVG holding several icons at the same
 * scale (e.g. the schema diagram). The prefix must be unique in the document.
 */
export const iconMasksMarkup = (prefix: string): string =>
   [...Object.keys(badges), 'off'].map(id => maskMarkup(prefix, id)).join('');

let instances = 0;

/**
 * Content of a standalone 24×24 `<svg>` of an icon, with the mask of its badge inside.
 * Each icon has its own mask: Chromium renders a mask shared by SVGs of different sizes at the scale
 * of one of them, so the cut-out would be misplaced on the others.
 */
export const iconContent = (name: string, uid = `antares-icon-${++instances}-`): string => {
   const markup = iconMarkup(name, uid);
   const { modifier } = parseIconName(name);
   if (!markup || !modifier) return markup;
   return `<defs>${maskMarkup(uid, modifier)}</defs>${markup}`;
};

/** Builds an icon as a DOM element, for code that renders outside Vue (e.g. CodeMirror panels). */
export const createIconElement = (name: string, size = 24): SVGSVGElement => {
   const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
   svg.setAttribute('class', 'antares-icon');
   svg.setAttribute('viewBox', '0 0 24 24');
   svg.setAttribute('width', String(size));
   svg.setAttribute('height', String(size));
   svg.setAttribute('aria-hidden', 'true');
   svg.innerHTML = iconContent(name);
   return svg;
};

export { badges, brands, glyphs };
