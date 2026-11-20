/**
 * Converts the Ace editor themes used by Antares into engine-agnostic theme
 * definitions (src/renderer/libs/editor/themes/aceThemes.ts).
 *
 * For every semantic token the effective style is resolved the way the browser
 * does with Ace's CSS: a token like `constant.numeric` gets the classes
 * `ace_constant ace_numeric`, every rule whose selector is made only of those
 * classes applies, more classes = higher specificity, then source order.
 *
 * Usage: node scripts/convertAceThemes.js (needs ace-builds in node_modules)
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const themes = [
   // Light
   ['chrome', 'Chrome'],
   ['clouds', 'Clouds'],
   ['crimson_editor', 'Crimson Editor'],
   ['dawn', 'Dawn'],
   ['dreamweaver', 'Dreamweaver'],
   ['eclipse', 'Eclipse'],
   ['github', 'GitHub'],
   ['iplastic', 'IPlastic'],
   ['solarized_light', 'Solarized Light'],
   ['textmate', 'TextMate'],
   ['tomorrow', 'Tomorrow'],
   ['xcode', 'Xcode'],
   ['kuroir', 'Kuroir'],
   ['katzenmilch', 'KatzenMilch'],
   ['sqlserver', 'SQL Server'],
   // Dark
   ['ambiance', 'Ambiance'],
   ['chaos', 'Chaos'],
   ['clouds_midnight', 'Clouds Midnight'],
   ['dracula', 'Dracula'],
   ['cobalt', 'Cobalt'],
   ['gruvbox', 'Gruvbox'],
   ['gob', 'Green on Black'],
   ['idle_fingers', 'Idle Fingers'],
   ['kr_theme', 'krTheme'],
   ['merbivore', 'Merbivore'],
   ['mono_industrial', 'Mono Industrial'],
   ['monokai', 'Monokai'],
   ['nord_dark', 'Nord Dark'],
   ['pastel_on_dark', 'Pastel on Dark'],
   ['solarized_dark', 'Solarized Dark'],
   ['terminal', 'Terminal'],
   ['tomorrow_night', 'Tomorrow Night'],
   ['tomorrow_night_blue', 'Tomorrow Night Blue'],
   ['tomorrow_night_bright', 'Tomorrow Night Bright'],
   ['tomorrow_night_eighties', 'Tomorrow Night 80s'],
   ['twilight', 'Twilight'],
   ['vibrant_ink', 'Vibrant Ink']
];

/** Semantic token → Ace token scope (the one Ace's modes emit for it) */
const tokenScopes = {
   keyword: 'keyword',
   operator: 'keyword.operator',
   type: 'storage.type',
   builtin: 'support.function',
   number: 'constant.numeric',
   atom: 'constant.language',
   string: 'string',
   regexp: 'string.regexp',
   comment: 'comment',
   variable: 'variable',
   property: 'variable',
   punctuation: 'paren',
   tag: 'meta.tag.tag-name.xml',
   attribute: 'entity.other.attribute-name.xml',
   attributeValue: 'string.attribute-value.xml',
   tagPunctuation: 'meta.tag.punctuation.tag-open.xml',
   heading: 'markup.heading',
   emphasis: 'string.emphasis',
   strong: 'string.strong',
   link: 'markup.underline',
   list: 'markup.list',
   quote: 'string.blockquote',
   monospace: 'support.function',
   meta: 'xml-pe',
   invalid: 'invalid'
};

const loadTheme = code => {
   const file = path.join(__dirname, '..', 'node_modules', 'ace-builds', 'src-noconflict', `theme-${code}.js`);
   const factories = {};
   const cache = {};
   const load = id => {
      if (cache[id]) return cache[id].exports;
      const mod = { exports: {} };
      cache[id] = mod;
      if (!factories[id]) return {};
      const req = dep => load(dep.startsWith('.') ? path.posix.join(path.posix.dirname(id), dep) : dep);
      factories[id](req, mod.exports, mod);
      return mod.exports;
   };
   const ace = {
      define: (id, _deps, factory) => {
         factories[id] = factory;
      },
      require: (ids, callback) => {
         const modules = ids.map(load);
         callback.apply(null, modules);
      }
   };
   factories['ace/lib/dom'] = (_r, exports) => {
      exports.importCssString = () => null;
   };
   // The default theme (textmate) keeps its CSS module inside ace.js
   const core = fs.readFileSync(path.join(path.dirname(file), 'ace.js'), 'utf8');
   const coreCss = core.match(new RegExp(`ace\\.define\\("ace/theme/${code}-css",[^{]*\\{module\\.exports = ("(?:[^"\\\\]|\\\\.)*");`));
   if (coreCss) {
      factories[`ace/theme/${code}-css`] = (_r, _e, mod) => {
         mod.exports = JSON.parse(coreCss[1]);
      };
   }
   vm.runInNewContext(fs.readFileSync(file, 'utf8'), { ace });
   const theme = load(`ace/theme/${code}`);
   return { css: theme.cssText, cssClass: theme.cssClass, isDark: !!theme.isDark };
};

const parseRules = (css, cssClass) => {
   const rules = [];
   const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
   const re = /([^{}]+)\{([^{}]*)\}/g;
   let match;
   let order = 0;
   while ((match = re.exec(clean))) {
      const decls = {};
      for (const decl of match[2].split(';')) {
         const idx = decl.indexOf(':');
         if (idx === -1) continue;
         const prop = decl.slice(0, idx).trim().toLowerCase();
         const value = decl.slice(idx + 1).replace(/!important/, '').trim();
         if (prop && value) decls[prop] = value;
      }
      for (let selector of match[1].split(',')) {
         selector = selector.trim().replace(/\s+/g, ' ');
         if (!selector.startsWith(`.${cssClass}`)) continue;
         selector = selector.slice(cssClass.length + 1);
         // Only rules for the root element or its descendants
         if (selector && !selector.startsWith(' ')) continue;
         rules.push({ selector: selector.trim(), decls, order: order++ });
      }
   }
   return rules;
};

const colorOf = value => {
   if (!value || /url\(|gradient|none|transparent|inherit/.test(value)) return undefined;
   const color = value.match(/(#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\))/i);
   if (color) return color[1];
   const words = value.split(/\s+/).filter(w => /^[a-z]+$/i.test(w) && !['solid', 'dotted', 'dashed', 'right', 'repeat', 'repeat-y', 'important'].includes(w));
   return words.length ? words[words.length - 1] : undefined;
};

const borderColor = value => value ? colorOf(value.replace(/^\s*\d+(px)?/, '')) : undefined;

const getChrome = (rules, selectors) => {
   const decls = {};
   for (const rule of rules) {
      const sel = rule.selector.replace(/^\.ace_marker-layer /, '');
      if (selectors.includes(sel)) Object.assign(decls, rule.decls);
   }
   return decls;
};

const resolveToken = (rules, scope) => {
   const classes = scope.split('.').map(c => `ace_${c}`);
   const matching = rules.filter(rule => {
      if (!rule.selector || rule.selector.includes(' ') || rule.selector.includes(':')) return false;
      const ruleClasses = rule.selector.split('.').filter(Boolean);
      return ruleClasses.length && ruleClasses.every(c => classes.includes(c));
   }).sort((a, b) => (a.selector.split('.').length - b.selector.split('.').length) || (a.order - b.order));

   const style = {};
   for (const { decls } of matching) {
      const color = colorOf(decls.color);
      if (color) style.color = color;
      const bg = colorOf(decls['background-color'] || decls.background);
      if (bg) style.backgroundColor = bg;
      if (decls['font-style']) style.fontStyle = decls['font-style'];
      if (decls['font-weight']) style.fontWeight = decls['font-weight'];
      if (decls['text-decoration']) style.textDecoration = decls['text-decoration'];
   }
   return Object.keys(style).length ? style : undefined;
};

const parseColor = value => {
   if (!value) return null;
   let m = value.match(/^#([0-9a-f]{3,8})$/i);
   if (m) {
      let hex = m[1];
      if (hex.length <= 4) hex = hex.split('').map(c => c + c).join('');
      return {
         r: parseInt(hex.slice(0, 2), 16),
         g: parseInt(hex.slice(2, 4), 16),
         b: parseInt(hex.slice(4, 6), 16),
         a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1
      };
   }
   m = value.match(/^rgba?\(([^)]*)\)$/i);
   if (m) {
      const [r, g, b, a] = m[1].split(',').map(v => parseFloat(v));
      return { r, g, b, a: isNaN(a) ? 1 : a };
   }
   return null;
};

/**
 * CodeMirror draws the active line above the selection layer, so an opaque
 * active line color would hide the selection. Returns the most transparent
 * rgba color that looks the same over the editor background.
 */
const toTranslucent = (value, background) => {
   const c = parseColor(value);
   const bg = parseColor(background);
   if (!c || !bg || c.a < 1) return value;
   for (let a = 0.02; a <= 1; a += 0.01) {
      const t = ['r', 'g', 'b'].map(k => (c[k] - bg[k] * (1 - a)) / a);
      if (t.every(v => v >= -0.5 && v <= 255.5))
         return `rgba(${t.map(v => Math.round(Math.min(255, Math.max(0, v)))).join(', ')}, ${a.toFixed(2)})`;
   }
   return value;
};

const convert = (code, name) => {
   const { css, cssClass, isDark } = loadTheme(code);
   const rules = parseRules(css, cssClass);

   const root = getChrome(rules, ['']);
   const background = colorOf(root['background-color'] || root.background) || (isDark ? '#1e1e1e' : '#ffffff');
   const foreground = colorOf(root.color) || (isDark ? '#ffffff' : '#000000');
   const gutter = getChrome(rules, ['.ace_gutter']);
   const cursor = getChrome(rules, ['.ace_cursor']);
   const selection = getChrome(rules, ['.ace_selection']);
   const activeLine = getChrome(rules, ['.ace_active-line']);
   const gutterActive = getChrome(rules, ['.ace_gutter-active-line']);
   const bracket = getChrome(rules, ['.ace_bracket']);
   const selectedWord = getChrome(rules, ['.ace_selected-word']);
   const invisible = getChrome(rules, ['.ace_invisible']);

   const activeLineColor = colorOf(activeLine['background-color'] || activeLine.background);

   const editor = {
      background,
      foreground,
      cursor: colorOf(cursor.color) || borderColor(cursor['border-left']) || colorOf(cursor['border-left-color']) || foreground,
      selection: colorOf(selection['background-color'] || selection.background) || (isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgb(181, 213, 255)'),
      gutterBackground: colorOf(gutter['background-color'] || gutter.background) || background,
      gutterForeground: colorOf(gutter.color) || foreground,
      gutterActiveLine: colorOf(gutterActive['background-color'] || gutterActive.background),
      activeLine: activeLineColor ? toTranslucent(activeLineColor, background) : undefined,
      matchingBracket: borderColor(bracket.border) || colorOf(bracket['border-color']),
      selectionMatch: borderColor(selectedWord.border) || colorOf(selectedWord['background-color'] || selectedWord.background),
      invisible: colorOf(invisible.color)
   };
   for (const key of Object.keys(editor))
      if (editor[key] === undefined) delete editor[key];

   const tokens = {};
   for (const [key, scope] of Object.entries(tokenScopes)) {
      const style = resolveToken(rules, scope);
      if (style) tokens[key] = style;
   }

   return { code, name, dark: isDark, editor, tokens };
};

const definitions = themes.map(([code, name]) => convert(code, name));
const out = path.join(__dirname, '..', 'src', 'renderer', 'libs', 'editor', 'themes', 'aceThemes.ts');
fs.mkdirSync(path.dirname(out), { recursive: true });
const body = JSON.stringify(definitions, null, 3)
   .replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:')
   .replace(/"/g, '\'');

fs.writeFileSync(out, `/* eslint-disable */
// Generated by scripts/convertAceThemes.js from the Ace editor themes: do not edit by hand.
import { EditorThemeDefinition } from '../themeTypes';

export const aceThemes: EditorThemeDefinition[] = ${body};
`);
console.log(`${definitions.length} themes written to ${path.relative(process.cwd(), out)}`);
