/**
 * Theme tokens: the public contract between Antares and theme files (built-in, imported or from the gallery).
 * The CSS custom properties are named `--<token>`; their default values live in
 * src/renderer/scss/themes/{dark,light}-theme.scss (colors) and _shape-tokens.scss (shape).
 * A unit test checks that these lists match the SCSS files. Never rename a token: add a new one.
 */

/** UI color tokens, grouped as in the theme files */
export const uiColorTokenGroups = {
   surfaces: [
      'bg-app',
      'bg-panel',
      'bg-panel-hover',
      'bg-surface',
      'bg-raised',
      'bg-titlebar',
      'bg-settingbar',
      'settingbar-text',
      'bg-tabbar',
      'bg-card',
      'bg-hover',
      'bg-hover-strong',
      'bg-overlay'
   ],
   text: ['text', 'text-muted', 'text-placeholder'],
   status: ['success', 'warning', 'error'],
   borders: ['border', 'border-subtle', 'separator', 'divider', 'shadow-color'],
   inputs: ['input-bg', 'input-bg-readonly', 'input-bg-disabled'],
   popups: [
      'menu-hover-bg',
      'menu-hover-text',
      'modal-header-bg',
      'modal-header-text',
      'context-bg',
      'context-text',
      'context-hover',
      'context-border',
      'tooltip-bg',
      'tooltip-text'
   ],
   buttons: ['btn-dark-bg', 'btn-dark-bg-hover', 'btn-gray-bg', 'btn-gray-bg-hover', 'btn-text'],
   code: ['code-bg', 'code-border', 'code-text'],
   scrollbars: ['scrollbar-track', 'scrollbar-thumb', 'scrollbar-thumb-hover'],
   grid: ['grid-header-bg', 'grid-header-border', 'grid-row-bg', 'grid-border', 'grid-cell-focus', 'grid-cell-focus-bg'],
   tables: ['table-border', 'table-row-alt', 'table-row-hover', 'table-row-active', 'table-row-selected'],
   diagram: [
      'diagram-dot',
      'diagram-table-bg',
      'diagram-table-border',
      'diagram-header-bg',
      'diagram-row-linked',
      'diagram-row-hover',
      'diagram-relation'
   ],
   dataTypes: ['type-string', 'type-number', 'type-date', 'type-bit', 'type-blob', 'type-array', 'type-enum', 'type-unknown'],
   charts: ['size-chart-fill', 'size-chart-track']
} as const;

export type UiColorToken = typeof uiColorTokenGroups[keyof typeof uiColorTokenGroups][number];

export const uiColorTokens: readonly UiColorToken[] = Object.values(uiColorTokenGroups).flat();

/** Shape tokens with the allowed range, in px (rem values are converted with the 20px root size) */
export const shapeTokenRanges = {
   radius: { min: 0, max: 20 },
   'radius-lg': { min: 0, max: 24 },
   'border-width': { min: 0, max: 5 },
   'border-width-lg': { min: 0, max: 6 },
   'grid-border-width': { min: 0, max: 6 },
   'focus-ring-width': { min: 0, max: 6 },
   'scrollbar-size': { min: 4, max: 24 }
} as const;

export type ShapeLengthToken = keyof typeof shapeTokenRanges;

/** Shape tokens whose value is a color */
export const shapeColorTokens = ['focus-ring-color'] as const;

export type ShapeColorToken = typeof shapeColorTokens[number];

export type ShapeToken = ShapeLengthToken | ShapeColorToken;

export const shapeTokens: readonly ShapeToken[] = [...Object.keys(shapeTokenRanges) as ShapeLengthToken[], ...shapeColorTokens];

/**
 * Accent (connection folder color) tokens: NOT theme tokens, a theme can never set them.
 * A color token may reference the accent with the value `accent`.
 */
export const accentTokens = ['primary-color', 'primary-color-dark', 'primary-color-shadow', 'primary-color-text'] as const;
