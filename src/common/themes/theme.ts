import { EditorThemeDefinition, ThemeTokenKey, themeTokenKeys, ThemeTokenStyle } from './editorTheme';
import { shapeColorTokens, ShapeLengthToken, ShapeToken, shapeTokenRanges, UiColorToken, uiColorTokens } from './tokens';

export const THEME_SCHEMA_VERSION = 1;

export type ThemeAppearance = 'dark' | 'light';

export type EditorChromeColors = EditorThemeDefinition['editor'];

/**
 * A theme file (JSON). Everything but the metadata is optional:
 * missing values fall back to the built-in theme with the same appearance.
 */
export interface AntaresTheme {
   schemaVersion: number;
   /** Unique id: lowercase letters, digits and dashes */
   id: string;
   name: string;
   appearance: ThemeAppearance;
   author?: string;
   description?: string;
   version?: string;
   license?: string;
   tags?: string[];
   /** UI color tokens (without the leading `--`). The value `accent` means the connection folder color */
   colors?: Partial<Record<UiColorToken, string>>;
   /** Corner radii, line widths, focus ring, scrollbars */
   shape?: Partial<Record<ShapeToken, string>>;
   /** Code editor colors */
   editor?: {
      colors?: Partial<EditorChromeColors>;
      syntax?: Partial<Record<ThemeTokenKey, ThemeTokenStyle>>;
   };
}

export interface ThemeValidationResult {
   /** The sanitized theme, or null when it can't be used */
   theme: AntaresTheme | null;
   /** Blocking problems (theme is null) */
   errors: string[];
   /** Values that were dropped */
   warnings: string[];
}

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CSS_WIDE_KEYWORDS = ['inherit', 'initial', 'unset', 'revert', 'currentcolor'];
const editorColorKeys: (keyof EditorChromeColors)[] = [
   'background',
   'foreground',
   'cursor',
   'selection',
   'gutterBackground',
   'gutterForeground',
   'gutterActiveLine',
   'activeLine',
   'matchingBracket',
   'selectionMatch',
   'invisible'
];
const syntaxStyleValues: Record<Exclude<keyof ThemeTokenStyle, 'color' | 'backgroundColor'>, RegExp> = {
   fontStyle: /^(normal|italic)$/,
   fontWeight: /^(normal|bold|[1-9]00)$/,
   textDecoration: /^(none|underline|line-through)$/
};

/**
 * Colors are data, never free CSS: hex, rgb()/rgba()/hsl()/hsla() with plain numbers, named colors
 * or `accent`. No url(), var(), expressions or anything that could load resources or escape the value.
 */
export const isThemeColor = (value: unknown): value is string => {
   if (typeof value !== 'string' || value.length > 64) return false;
   const v = value.trim().toLowerCase();
   if (/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(v)) return true;
   if (/^(rgb|rgba|hsl|hsla)\(\s*[-+0-9.%,/\s]*(deg|turn|rad)?[-+0-9.%,/\s]*\)$/.test(v)) return true;
   return /^[a-z]{3,20}$/.test(v) && !CSS_WIDE_KEYWORDS.includes(v);
};

/** A length in px or rem, converted to px (null if not a plain length) */
export const lengthToPx = (value: unknown): number | null => {
   if (typeof value !== 'string') return null;
   const match = /^(\d*\.?\d+)(px|rem)?$/.exec(value.trim());
   if (!match) return null;
   const n = parseFloat(match[1]);
   if (match[2] === 'rem') return n * 20;
   return match[2] === 'px' || n === 0 ? n : null; // unitless only for 0
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
   typeof value === 'object' && value !== null && !Array.isArray(value);

const optionalString = (raw: Record<string, unknown>, key: string, max: number, warnings: string[]): string | undefined => {
   const value = raw[key];
   if (value === undefined) return undefined;
   if (typeof value === 'string' && value.length <= max) return value;
   warnings.push(`"${key}" ignored: expected a string up to ${max} characters`);
   return undefined;
};

/** Validates and sanitizes a theme file (already parsed from JSON) */
export const validateTheme = (raw: unknown): ThemeValidationResult => {
   const errors: string[] = [];
   const warnings: string[] = [];

   if (!isRecord(raw)) return { theme: null, errors: ['The theme must be a JSON object'], warnings };

   if (raw.schemaVersion !== undefined && (typeof raw.schemaVersion !== 'number' || raw.schemaVersion > THEME_SCHEMA_VERSION))
      errors.push(`Unsupported schemaVersion ${raw.schemaVersion}: this version of Antares supports up to ${THEME_SCHEMA_VERSION}`);
   if (typeof raw.id !== 'string' || raw.id.length > 64 || !ID_PATTERN.test(raw.id))
      errors.push('"id" is required: lowercase letters, digits and dashes (e.g. "my-dark-theme")');
   if (typeof raw.name !== 'string' || !raw.name.trim() || raw.name.length > 64)
      errors.push('"name" is required (up to 64 characters)');
   if (raw.appearance !== 'dark' && raw.appearance !== 'light')
      errors.push('"appearance" is required: "dark" or "light"');

   if (errors.length) return { theme: null, errors, warnings };

   const theme: AntaresTheme = {
      schemaVersion: (raw.schemaVersion as number) ?? THEME_SCHEMA_VERSION,
      id: raw.id as string,
      name: (raw.name as string).trim(),
      appearance: raw.appearance as ThemeAppearance
   };

   for (const key of ['author', 'description', 'version', 'license'] as const) {
      const value = optionalString(raw, key, key === 'description' ? 500 : 100, warnings);
      if (value !== undefined) theme[key] = value;
   }

   if (raw.tags !== undefined) {
      if (Array.isArray(raw.tags))
         theme.tags = raw.tags.filter(tag => typeof tag === 'string' && /^[a-z0-9-]{1,30}$/.test(tag)).slice(0, 10);
      else warnings.push('"tags" ignored: expected an array of strings');
   }

   if (raw.colors !== undefined) {
      if (isRecord(raw.colors)) {
         theme.colors = {};
         for (const [token, value] of Object.entries(raw.colors)) {
            if (!(uiColorTokens as readonly string[]).includes(token)) warnings.push(`colors.${token} ignored: unknown token`);
            else if (!isThemeColor(value)) warnings.push(`colors.${token} ignored: invalid color`);
            else theme.colors[token as UiColorToken] = value.trim();
         }
      }
      else warnings.push('"colors" ignored: expected an object');
   }

   if (raw.shape !== undefined) {
      if (isRecord(raw.shape)) {
         theme.shape = {};
         for (const [token, value] of Object.entries(raw.shape)) {
            if ((shapeColorTokens as readonly string[]).includes(token)) {
               if (isThemeColor(value)) theme.shape[token as ShapeToken] = value.trim();
               else warnings.push(`shape.${token} ignored: invalid color`);
            }
            else if (token in shapeTokenRanges) {
               const { min, max } = shapeTokenRanges[token as ShapeLengthToken];
               const px = lengthToPx(value);
               if (px !== null && px >= min && px <= max) theme.shape[token as ShapeToken] = (value as string).trim();
               else warnings.push(`shape.${token} ignored: expected a length between ${min}px and ${max}px`);
            }
            else warnings.push(`shape.${token} ignored: unknown token`);
         }
      }
      else warnings.push('"shape" ignored: expected an object');
   }

   if (raw.editor !== undefined) {
      if (isRecord(raw.editor)) {
         theme.editor = {};
         const { colors, syntax } = raw.editor;
         if (isRecord(colors)) {
            theme.editor.colors = {};
            for (const [key, value] of Object.entries(colors)) {
               if (!editorColorKeys.includes(key as keyof EditorChromeColors)) warnings.push(`editor.colors.${key} ignored: unknown key`);
               else if (!isThemeColor(value) || value.trim() === 'accent') warnings.push(`editor.colors.${key} ignored: invalid color`);
               else theme.editor.colors[key as keyof EditorChromeColors] = value.trim();
            }
         }
         if (isRecord(syntax)) {
            theme.editor.syntax = {};
            for (const [key, style] of Object.entries(syntax)) {
               if (!(themeTokenKeys as readonly string[]).includes(key) || !isRecord(style)) {
                  warnings.push(`editor.syntax.${key} ignored: unknown token`);
                  continue;
               }
               const clean: ThemeTokenStyle = {};
               for (const [prop, value] of Object.entries(style)) {
                  if (prop === 'color' || prop === 'backgroundColor') {
                     if (isThemeColor(value) && value.trim() !== 'accent') clean[prop] = value.trim();
                     else warnings.push(`editor.syntax.${key}.${prop} ignored: invalid color`);
                  }
                  else if (prop in syntaxStyleValues && typeof value === 'string' && syntaxStyleValues[prop as keyof typeof syntaxStyleValues].test(value))
                     clean[prop as keyof typeof syntaxStyleValues] = value;
                  else warnings.push(`editor.syntax.${key}.${prop} ignored: invalid value`);
               }
               theme.editor.syntax[key as ThemeTokenKey] = clean;
            }
         }
      }
      else warnings.push('"editor" ignored: expected an object');
   }

   return { theme, errors, warnings };
};

/** CSS custom properties of a theme, to set on #wrapper (missing tokens fall back to the built-in theme of the same appearance) */
export const themeCssVariables = (theme: AntaresTheme): Record<string, string> => {
   const vars: Record<string, string> = {};
   const value = (v: string) => v === 'accent' ? 'var(--primary-color)' : v;
   for (const [token, v] of Object.entries(theme.colors ?? {})) vars[`--${token}`] = value(v);
   for (const [token, v] of Object.entries(theme.shape ?? {})) vars[`--${token}`] = value(v);
   return vars;
};

/** The editor theme of an app theme: its editor section over the base editor theme of the same appearance */
export const resolveEditorTheme = (theme: AntaresTheme, base: EditorThemeDefinition): EditorThemeDefinition => ({
   code: theme.id,
   name: theme.name,
   dark: theme.appearance === 'dark',
   editor: { ...base.editor, ...theme.editor?.colors },
   tokens: { ...base.tokens, ...theme.editor?.syntax }
});
