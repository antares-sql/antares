import { themeTokenKeys } from 'common/themes/editorTheme';
import { folderColorSlotOf } from 'common/themes/folderColors';
import { isThemeColor, lengthToPx, resolveEditorTheme, themeCssVariables, validateTheme } from 'common/themes/theme';
import { shapeTokens, uiColorTokens } from 'common/themes/tokens';
import fs = require('fs');
import path = require('path');
import { describe, expect, it } from 'vitest';

const themesDir = path.resolve('src/renderer/scss/themes');
const tokensIn = (file: string) => [...fs.readFileSync(path.join(themesDir, file), 'utf8').matchAll(/^\s+--([a-z0-9-]+):/gm)].map(m => m[1]);

const minimal = { schemaVersion: 1, id: 'my-theme', name: 'My theme', appearance: 'dark' };

describe('theme tokens', () => {
   it('match the color tokens of every built-in theme, in the same order', () => {
      expect(tokensIn('dark-theme.scss')).toEqual([...uiColorTokens]);
      expect(tokensIn('light-theme.scss')).toEqual([...uiColorTokens]);
   });

   it('match the shape tokens', () => {
      expect(tokensIn('_shape-tokens.scss').sort()).toEqual([...shapeTokens].sort());
   });
});

describe('isThemeColor', () => {
   it('accepts plain colors', () => {
      for (const c of ['#fff', '#1d1d1dcc', 'rgb(63 63 63 / 50%)', 'rgba(0, 0, 0, 0.3)', 'hsl(210deg 20% 30%)', 'seagreen', 'transparent', 'accent'])
         expect(isThemeColor(c), c).toBe(true);
   });

   it('rejects anything that is not a plain color', () => {
      for (const c of ['url(http://x/y.png)', 'var(--primary-color)', 'red; background: url(x)', 'expression(alert(1))', 'inherit', '#12', '', 42, null])
         expect(isThemeColor(c), String(c)).toBe(false);
   });
});

describe('lengthToPx', () => {
   it('converts px and rem', () => {
      expect(lengthToPx('6px')).toBe(6);
      expect(lengthToPx('0.3rem')).toBe(6);
      expect(lengthToPx('0')).toBe(0);
      expect(lengthToPx('5')).toBeNull();
      expect(lengthToPx('calc(1px + 1px)')).toBeNull();
   });
});

describe('validateTheme', () => {
   it('requires id, name and appearance', () => {
      expect(validateTheme({}).errors).toHaveLength(3);
      expect(validateTheme({ ...minimal, id: 'Bad Id' }).theme).toBeNull();
      expect(validateTheme({ ...minimal, appearance: 'blue' }).theme).toBeNull();
      expect(validateTheme('nope').theme).toBeNull();
   });

   it('rejects newer schema versions', () => {
      expect(validateTheme({ ...minimal, schemaVersion: 99 }).theme).toBeNull();
   });

   it('keeps valid tokens and drops the rest with a warning', () => {
      const { theme, warnings } = validateTheme({
         ...minimal,
         colors: { 'bg-app': '#000', text: 'url(x)', 'primary-color': '#f00', unknown: '#fff' },
         shape: { radius: '0', 'border-width': '2px', 'scrollbar-size': '100px', 'focus-ring-color': 'yellow' }
      });
      expect(theme.colors).toEqual({ 'bg-app': '#000' });
      expect(theme.shape).toEqual({ radius: '0', 'border-width': '2px', 'focus-ring-color': 'yellow' });
      expect(warnings).toHaveLength(4);
   });

   it('never accepts the accent tokens', () => {
      const { theme } = validateTheme({ ...minimal, colors: { 'primary-color': '#000', 'primary-color-text': '#000' } });
      expect(theme.colors).toEqual({});
   });

   it('validates the editor section', () => {
      const { theme, warnings } = validateTheme({
         ...minimal,
         editor: {
            colors: { background: '#272822', foreground: '#f8f8f2', bogus: '#fff' },
            syntax: {
               keyword: { color: '#f92672', fontWeight: 'bold' },
               comment: { color: '#75715e', fontStyle: 'oblique' },
               nope: { color: '#fff' }
            }
         }
      });
      expect(theme.editor.colors).toEqual({ background: '#272822', foreground: '#f8f8f2' });
      expect(theme.editor.syntax).toEqual({ keyword: { color: '#f92672', fontWeight: 'bold' }, comment: { color: '#75715e' } });
      expect(warnings).toHaveLength(3);
   });
});

describe('accent palette', () => {
   it('accepts #rrggbb colors for known palette slots only', () => {
      const { theme, warnings } = validateTheme({
         ...minimal,
         accent: { default: '#0072B2', rose: '#D55E00', grass: 'green', unknown: '#000000' }
      });
      expect(theme.accent).toEqual({ default: '#0072B2', rose: '#D55E00' });
      expect(warnings).toHaveLength(2);
   });

   it('maps stored folder colors to their slot', () => {
      expect(folderColorSlotOf('#ed5565')).toBe('grape-fruit');
      expect(folderColorSlotOf('#E36929')).toBe('default');
      expect(folderColorSlotOf('#123456')).toBeNull();
      expect(folderColorSlotOf(undefined)).toBeNull();
   });
});

describe('theme application', () => {
   it('maps tokens to CSS variables and `accent` to the folder color', () => {
      const { theme } = validateTheme({ ...minimal, colors: { 'bg-app': '#000', 'menu-hover-text': 'accent' }, shape: { radius: '0' } });
      expect(themeCssVariables(theme)).toEqual({ '--bg-app': '#000', '--menu-hover-text': 'var(--primary-color)', '--radius': '0' });
   });

   it('merges the editor section over the base editor theme', () => {
      const base = {
         code: 'base',
         name: 'Base',
         dark: true,
         editor: { background: '#000', foreground: '#fff', cursor: '#fff', selection: '#333', gutterBackground: '#111', gutterForeground: '#888' },
         tokens: { keyword: { color: '#f00' }, string: { color: '#0f0' } }
      };
      const { theme } = validateTheme({ ...minimal, editor: { colors: { background: '#222' }, syntax: { keyword: { color: '#00f' } } } });
      const editor = resolveEditorTheme(theme, base);
      expect(editor.code).toBe('my-theme');
      expect(editor.editor.background).toBe('#222');
      expect(editor.editor.foreground).toBe('#fff');
      expect(editor.tokens).toEqual({ keyword: { color: '#00f' }, string: { color: '#0f0' } });
      expect(themeTokenKeys).toContain('keyword');
   });
});
