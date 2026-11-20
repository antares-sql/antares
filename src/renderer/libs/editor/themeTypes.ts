/** Semantic token kinds an editor theme can style */
export const themeTokenKeys = [
   'keyword',
   'operator',
   'type',
   'builtin',
   'number',
   'atom',
   'string',
   'regexp',
   'comment',
   'variable',
   'property',
   'punctuation',
   'tag',
   'attribute',
   'attributeValue',
   'tagPunctuation',
   'heading',
   'emphasis',
   'strong',
   'link',
   'list',
   'quote',
   'monospace',
   'meta',
   'invalid'
] as const;

export type ThemeTokenKey = typeof themeTokenKeys[number];

export interface ThemeTokenStyle {
   color?: string;
   backgroundColor?: string;
   fontStyle?: string;
   fontWeight?: string;
   textDecoration?: string;
}

/**
 * Engine-agnostic editor theme: plain data, so themes can also be
 * loaded from user files in the future.
 */
export interface EditorThemeDefinition {
   code: string;
   name: string;
   dark: boolean;
   editor: {
      background: string;
      foreground: string;
      cursor: string;
      selection: string;
      gutterBackground: string;
      gutterForeground: string;
      gutterActiveLine?: string;
      activeLine?: string;
      matchingBracket?: string;
      selectionMatch?: string;
      invisible?: string;
   };
   tokens: Partial<Record<ThemeTokenKey, ThemeTokenStyle>>;
}
