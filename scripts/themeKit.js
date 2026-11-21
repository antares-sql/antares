#!/usr/bin/env node
/**
 * Theme kit for the theme gallery (https://github.com/antares-sql/themes).
 *
 *   node scripts/themeKit.js <gallery dir> [--ace]
 *
 * Writes, from the sources of this repository (the single source of truth):
 *   schema/theme.schema.json   JSON Schema of a theme file, built from src/common/themes
 *   base/dark.json, light.json the built-in themes with every token value (from the SCSS themes):
 *                              a complete starting point to create a theme
 * With --ace it also converts the editor themes ported from Ace into full themes in themes/<id>/theme.json:
 * the UI colors are derived from the editor background, foreground and syntax colors.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const jiti = require('jiti')(__filename, { alias: { common: path.join(root, 'src/common') } });

const { uiColorTokens, uiColorTokenGroups, shapeTokenRanges, shapeColorTokens } = jiti('../src/common/themes/tokens.ts');
const { themeTokenKeys } = jiti('../src/common/themes/editorTheme.ts');
const { THEME_SCHEMA_VERSION, validateTheme } = jiti('../src/common/themes/theme.ts');

const SCHEMA_URL = 'https://raw.githubusercontent.com/antares-sql/themes/main/schema/theme.schema.json';
const BASE_EDITOR = { dark: 'twilight', light: 'sqlserver' };

const [outDir, ...flags] = process.argv.slice(2);
if (!outDir) {
   console.error('Usage: node scripts/themeKit.js <gallery dir> [--ace]');
   process.exit(1);
}

const writeJson = (file, data) => {
   fs.mkdirSync(path.dirname(file), { recursive: true });
   fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
   console.log('written', path.relative(outDir, file));
};

// ---------------------------------------------------------------- JSON Schema

const colorSchema = { $ref: '#/definitions/color' };
const lengthSchema = { $ref: '#/definitions/length' };
const editorColorKeys = ['background', 'foreground', 'cursor', 'selection', 'gutterBackground', 'gutterForeground', 'gutterActiveLine', 'activeLine', 'matchingBracket', 'selectionMatch', 'invisible'];

const schema = {
   $schema: 'http://json-schema.org/draft-07/schema#',
   $id: SCHEMA_URL,
   title: 'Antares SQL theme',
   description: 'A theme for Antares SQL: interface colors, shape and code editor colors. Missing values fall back to the built-in theme with the same appearance.',
   type: 'object',
   required: ['id', 'name', 'appearance'],
   properties: {
      $schema: { type: 'string' },
      schemaVersion: { type: 'integer', minimum: 1, maximum: THEME_SCHEMA_VERSION, default: THEME_SCHEMA_VERSION },
      id: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$', maxLength: 64, description: 'Unique id: lowercase letters, digits and dashes' },
      name: { type: 'string', minLength: 1, maxLength: 64 },
      appearance: { enum: ['dark', 'light'], description: 'Base theme: missing values are taken from it' },
      author: { type: 'string', maxLength: 100 },
      description: { type: 'string', maxLength: 500 },
      version: { type: 'string', maxLength: 100 },
      license: { type: 'string', maxLength: 100 },
      tags: { type: 'array', maxItems: 10, items: { type: 'string', pattern: '^[a-z0-9-]{1,30}$' } },
      colors: {
         type: 'object',
         description: 'Interface colors. The value "accent" means the connection folder color, which themes can\'t change',
         additionalProperties: false,
         properties: Object.fromEntries(uiColorTokens.map(token => [token, colorSchema]))
      },
      shape: {
         type: 'object',
         additionalProperties: false,
         properties: {
            ...Object.fromEntries(Object.entries(shapeTokenRanges).map(([token, { min, max }]) => [token, { ...lengthSchema, description: `From ${min}px to ${max}px (1rem = 20px)` }])),
            ...Object.fromEntries(shapeColorTokens.map(token => [token, colorSchema]))
         }
      },
      editor: {
         type: 'object',
         additionalProperties: false,
         properties: {
            colors: {
               type: 'object',
               additionalProperties: false,
               properties: Object.fromEntries(editorColorKeys.map(key => [key, { $ref: '#/definitions/plainColor' }]))
            },
            syntax: {
               type: 'object',
               additionalProperties: false,
               properties: Object.fromEntries(themeTokenKeys.map(key => [key, { $ref: '#/definitions/syntaxStyle' }]))
            }
         }
      }
   },
   definitions: {
      plainColor: {
         type: 'string',
         maxLength: 64,
         description: 'Hex, rgb()/rgba()/hsl()/hsla() or a CSS color name',
         pattern: '^\\s*(#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|(rgb|rgba|hsl|hsla)\\(\\s*[-+0-9.%,/\\s]*(deg|turn|rad)?[-+0-9.%,/\\s]*\\)|[a-zA-Z]{3,20})\\s*$'
      },
      color: { $ref: '#/definitions/plainColor', description: 'A color, or "accent" for the connection folder color' },
      length: { type: 'string', pattern: '^\\s*(\\d*\\.?\\d+(px|rem)|0)\\s*$' },
      syntaxStyle: {
         type: 'object',
         additionalProperties: false,
         properties: {
            color: { $ref: '#/definitions/plainColor' },
            backgroundColor: { $ref: '#/definitions/plainColor' },
            fontStyle: { enum: ['normal', 'italic'] },
            fontWeight: { enum: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'] },
            textDecoration: { enum: ['none', 'underline', 'line-through'] }
         }
      }
   }
};

writeJson(path.join(outDir, 'schema/theme.schema.json'), schema);

// ---------------------------------------------------------------- Built-in themes, fully expanded

const scssTokens = file => {
   const css = fs.readFileSync(path.join(root, 'src/renderer/scss/themes', file), 'utf8');
   return Object.fromEntries([...css.matchAll(/^\s+--([a-z0-9-]+):\s*([^;]+);/gm)].map(m => [m[1], m[2].trim()]));
};
const shapeDefaults = scssTokens('_shape-tokens.scss');
const { aceThemes } = jiti('../src/renderer/libs/editor/themes/aceThemes.ts');
const editorSection = editor => ({ colors: { ...editor.editor }, syntax: JSON.parse(JSON.stringify(editor.tokens)) });

const baseThemes = {};
for (const appearance of ['dark', 'light']) {
   const tokens = scssTokens(`${appearance}-theme.scss`);
   const colors = {};
   for (const token of uiColorTokens) {
      // SCSS values that reference the accent become "accent"
      colors[token] = tokens[token] === 'var(--primary-color)' ? 'accent' : tokens[token];
   }
   const theme = {
      $schema: SCHEMA_URL,
      schemaVersion: THEME_SCHEMA_VERSION,
      id: appearance,
      name: appearance === 'dark' ? 'Dark' : 'Light',
      appearance,
      author: 'Antares SQL',
      description: `The built-in ${appearance} theme with every value: a complete starting point for a new theme`,
      license: 'MIT',
      colors,
      shape: Object.fromEntries(Object.entries(shapeDefaults).filter(([token]) => token !== 'focus-ring-color')),
      editor: editorSection(aceThemes.find(t => t.code === BASE_EDITOR[appearance]))
   };
   const { theme: valid, warnings } = validateTheme(theme);
   if (!valid || warnings.length) throw new Error(`Base theme ${appearance} is not valid: ${warnings.join('; ')}`);
   baseThemes[appearance] = theme;
   writeJson(path.join(outDir, `base/${appearance}.json`), theme);
}

// ---------------------------------------------------------------- Ace editor themes → full themes

if (flags.includes('--ace')) {
   const named = {
      black: '#000000',
      white: '#ffffff',
      blue: '#0000ff',
      red: '#ff0000',
      yellow: '#ffff00',
      tomato: '#ff6347',
      steelblue: '#4682b4',
      orangered: '#ff4500',
      gray: '#808080',
      grey: '#808080',
      green: '#008000',
      silver: '#c0c0c0',
      navy: '#000080',
      purple: '#800080',
      maroon: '#800000',
      teal: '#008080',
      olive: '#808000',
      orange: '#ffa500',
      darkblue: '#00008b',
      deeppink: '#ff1493'
   };
   const parse = value => {
      const v = String(value).trim().toLowerCase();
      if (named[v]) return parse(named[v]);
      let m = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(v);
      if (m) {
         let h = m[1];
         if (h.length <= 4) h = h.split('').map(c => c + c).join('');
         return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 };
      }
      m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/.exec(v);
      if (m) {
         const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
         return { r: +m[1], g: +m[2], b: +m[3], a };
      }
      throw new Error(`Unsupported color "${value}": add it to the named colors of themeKit.js`);
   };
   const hex = c => '#' + [c.r, c.g, c.b].map(n => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0')).join('');
   /** a mixed with b: p = 0 → a, p = 1 → b */
   const mix = (a, b, p) => hex({ r: a.r + (b.r - a.r) * p, g: a.g + (b.g - a.g) * p, b: a.b + (b.b - a.b) * p });
   const alpha = (c, a) => `rgb(${Math.round(c.r)} ${Math.round(c.g)} ${Math.round(c.b)} / ${Math.round(a * 100)}%)`;
   const luminance = c => {
      const ch = x => {
         const s = x / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b);
   };
   const contrast = (a, b) => {
      const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05);
   };
   /** Flattens a translucent color over a background */
   const over = (c, bg) => ({ r: bg.r + (c.r - bg.r) * c.a, g: bg.g + (c.g - bg.g) * c.a, b: bg.b + (c.b - bg.b) * c.a, a: 1 });

   const deriveColors = (editor, appearance) => {
      const bg = parse(editor.editor.background);
      const fg = over(parse(editor.editor.foreground), bg);
      const black = parse('#000');
      const white = parse('#fff');
      const dark = appearance === 'dark';
      const toward = (p) => mix(bg, fg, p); // from the background toward the text
      const syntax = (key, fallback) => {
         const c = editor.tokens[key]?.color;
         if (!c) return fallback;
         const parsed = over(parse(c), bg);
         return contrast(parsed, bg) >= 2.5 ? hex(parsed) : fallback;
      };
      const base = baseThemes[appearance].colors;
      const chromeBg = dark ? mix(bg, black, 0.25) : mix(fg, bg, 0.22); // setting bar: darker than the background
      return {
         'bg-app': hex(bg),
         'bg-panel': dark ? toward(0.05) : mix(bg, black, 0.03),
         'bg-panel-hover': toward(0.14),
         'bg-surface': hex(bg),
         'bg-raised': dark ? toward(0.1) : mix(bg, white, 0.6),
         'bg-titlebar': dark ? toward(0.1) : mix(bg, black, 0.05),
         'bg-settingbar': chromeBg,
         'settingbar-text': contrast(parse(chromeBg), white) >= contrast(parse(chromeBg), black) ? '#ffffff' : '#000000',
         'bg-tabbar': dark ? toward(0.1) : hex(bg),
         'bg-card': toward(0.08),
         'bg-hover': alpha(fg, 0.06),
         'bg-hover-strong': alpha(fg, 0.12),
         'bg-overlay': dark ? alpha(white, 0.12) : alpha(parse(mix(fg, black, 0.5)), 0.6),
         text: hex(fg),
         'text-muted': toward(0.7),
         success: base.success,
         warning: base.warning,
         error: base.error,
         border: toward(0.22),
         'border-subtle': toward(0.1),
         separator: toward(0.2),
         divider: alpha(fg, 0.12),
         'shadow-color': '#000000',
         'input-bg': dark ? toward(0.06) : mix(bg, black, 0.02),
         'input-bg-readonly': dark ? hex(bg) : mix(bg, black, 0.04),
         'input-bg-disabled': toward(dark ? 0.03 : 0.3),
         'menu-hover-bg': toward(0.06),
         'menu-hover-text': 'accent',
         'modal-header-bg': dark ? toward(0.1) : chromeBg,
         'modal-header-text': dark ? hex(fg) : (contrast(parse(chromeBg), white) >= 4.5 ? '#ffffff' : '#000000'),
         'context-bg': dark ? toward(0.05) : mix(bg, white, 0.6),
         'context-text': hex(fg),
         'context-hover': alpha(fg, 0.1),
         'context-border': toward(0.2),
         'tooltip-bg': base['tooltip-bg'],
         'tooltip-text': base['tooltip-text'],
         'btn-dark-bg': dark ? toward(0.2) : mix(fg, bg, 0.45),
         'btn-dark-bg-hover': dark ? toward(0.1) : mix(fg, bg, 0.25),
         'btn-gray-bg': dark ? toward(0.1) : mix(fg, bg, 0.25),
         'btn-gray-bg-hover': dark ? toward(0.04) : mix(fg, bg, 0.15),
         'btn-text': '#ffffff',
         'code-bg': dark ? mix(bg, black, 0.35) : mix(bg, black, 0.05),
         'code-border': toward(0.2),
         'code-text': syntax('string', toward(0.8)),
         'scrollbar-track': toward(0.08),
         'scrollbar-thumb': alpha(fg, 0.35),
         'scrollbar-thumb-hover': alpha(fg, 0.7),
         'grid-header-bg': dark ? hex(bg) : mix(bg, black, 0.12),
         'grid-header-border': dark ? toward(0.05) : 'transparent',
         'grid-row-bg': toward(0.04),
         'grid-border': dark ? hex(bg) : alpha(fg, 0.12),
         'grid-cell-focus': toward(0.55),
         'grid-cell-focus-bg': dark ? alpha(black, 0.3) : mix(bg, white, 0.7),
         'table-border': toward(0.15),
         'table-row-alt': toward(0.03),
         'table-row-hover': toward(0.08),
         'table-row-active': toward(0.05),
         'table-row-selected': alpha(fg, 0.15),
         'diagram-dot': alpha(fg, 0.1),
         'diagram-table-bg': toward(0.05),
         'diagram-table-border': toward(0.3),
         'diagram-header-bg': toward(0.14),
         'diagram-row-linked': alpha(fg, 0.04),
         'diagram-row-hover': alpha(fg, 0.08),
         'diagram-relation': toward(0.5),
         // Column types reuse the syntax colors, so the grid matches the editor
         'type-string': syntax('string', base['type-string']),
         'type-number': syntax('number', base['type-number']),
         'type-date': syntax('builtin', base['type-date']),
         'type-bit': syntax('atom', base['type-bit']),
         'type-blob': syntax('type', base['type-blob']),
         'type-array': syntax('variable', base['type-array']),
         'type-enum': syntax('keyword', base['type-enum']),
         'type-unknown': syntax('comment', base['type-unknown']),
         'size-chart-fill': syntax('string', base['size-chart-fill']),
         'size-chart-track': toward(0.25)
      };
   };

   const index = [];
   for (const editor of aceThemes) {
      const appearance = editor.dark ? 'dark' : 'light';
      const id = editor.code.replace(/_/g, '-');
      const theme = {
         $schema: SCHEMA_URL,
         schemaVersion: THEME_SCHEMA_VERSION,
         id,
         name: editor.name,
         appearance,
         author: 'Antares SQL',
         description: `${editor.name} for Antares: the code editor theme ported from the Ace editor, with a matching interface.`,
         license: 'BSD-3-Clause',
         tags: ['ace'],
         colors: deriveColors(editor, appearance),
         editor: editorSection(editor)
      };
      const { theme: valid, warnings, errors } = validateTheme(theme);
      if (!valid || warnings.length) throw new Error(`${id} is not valid: ${[...errors, ...warnings].join('; ')}`);
      const low = contrast(parse(theme.colors.text), parse(theme.colors['bg-app']));
      if (low < 4.5) console.warn(`  ${id}: text contrast ${low.toFixed(2)}:1`);
      writeJson(path.join(outDir, `themes/${id}/theme.json`), theme);
      index.push(id);
   }
   console.log(`${index.length} themes converted`);
}

console.log('Token groups:', Object.keys(uiColorTokenGroups).join(', '));
