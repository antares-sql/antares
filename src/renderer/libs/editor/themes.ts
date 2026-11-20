import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { Tag, tags as t } from '@lezer/highlight';

import { aceThemes } from './themes/aceThemes';
import { EditorThemeDefinition, ThemeTokenKey, ThemeTokenStyle } from './themeTypes';

export const editorThemes: EditorThemeDefinition[] = aceThemes;

export const getEditorTheme = (code: string): EditorThemeDefinition => {
   return editorThemes.find(theme => theme.code === code) ??
      editorThemes.find(theme => theme.code === (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'twilight' : 'sqlserver'));
};

/** Highlighting tags styled by each semantic token (sub-tags inherit the style of their parent) */
const tokenTags: Record<ThemeTokenKey, Tag[]> = {
   keyword: [t.keyword],
   operator: [t.operator, t.operatorKeyword],
   type: [t.typeName, t.className],
   builtin: [t.standard(t.name), t.standard(t.variableName), t.function(t.variableName)],
   number: [t.number],
   atom: [t.bool, t.null, t.atom],
   string: [t.string, t.character],
   regexp: [t.regexp, t.escape],
   comment: [t.comment],
   variable: [t.special(t.name), t.special(t.variableName), t.definition(t.variableName)],
   property: [t.propertyName, t.labelName],
   punctuation: [t.paren, t.squareBracket, t.brace],
   tag: [t.tagName],
   attribute: [t.attributeName],
   attributeValue: [t.attributeValue],
   tagPunctuation: [t.angleBracket],
   heading: [t.heading],
   emphasis: [t.emphasis],
   strong: [t.strong],
   link: [t.link, t.url],
   list: [t.list],
   quote: [t.quote],
   monospace: [t.monospace],
   meta: [t.meta, t.processingInstruction, t.documentMeta],
   invalid: [t.invalid]
};

/** Styles that make sense regardless of the theme colors */
const baseTokenStyles: Partial<Record<ThemeTokenKey, ThemeTokenStyle>> = {
   emphasis: { fontStyle: 'italic' },
   strong: { fontWeight: 'bold' },
   heading: { fontWeight: 'bold' },
   link: { textDecoration: 'underline' }
};

export const buildEditorTheme = (theme: EditorThemeDefinition): Extension => {
   const { editor } = theme;

   const view = EditorView.theme({
      '&': {
         color: editor.foreground,
         backgroundColor: editor.background
      },
      '.cm-content': {
         caretColor: editor.cursor
      },
      '.cm-cursor, .cm-dropCursor': {
         borderLeftColor: editor.cursor
      },
      '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
         backgroundColor: editor.selection
      },
      '.cm-activeLine': {
         backgroundColor: editor.activeLine ?? 'transparent'
      },
      '.cm-gutters': {
         backgroundColor: editor.gutterBackground,
         color: editor.gutterForeground,
         border: 'none'
      },
      '.cm-activeLineGutter': {
         backgroundColor: editor.gutterActiveLine ?? 'transparent'
      },
      '&.cm-focused .cm-matchingBracket': {
         backgroundColor: 'transparent',
         outline: editor.matchingBracket ? `1px solid ${editor.matchingBracket}` : 'none'
      },
      '.cm-selectionMatch': {
         backgroundColor: 'transparent',
         outline: editor.selectionMatch ? `1px solid ${editor.selectionMatch}` : 'none'
      },
      '.cm-specialChar, .cm-highlightSpace': {
         color: editor.invisible ?? editor.gutterForeground
      },
      '.cm-foldPlaceholder': {
         backgroundColor: 'transparent',
         border: `1px solid ${editor.gutterForeground}`,
         color: editor.foreground
      }
   }, { dark: theme.dark });

   const specs = (Object.keys(tokenTags) as ThemeTokenKey[])
      .filter(key => theme.tokens[key] || baseTokenStyles[key])
      .map(key => ({ tag: tokenTags[key], ...baseTokenStyles[key], ...theme.tokens[key] }));

   return [view, syntaxHighlighting(HighlightStyle.define(specs))];
};

export const editorFontSizes = {
   xsmall: '10px',
   small: '12px',
   medium: '14px',
   large: '16px',
   xlarge: '18px',
   xxlarge: '20px'
};

export const buildFontTheme = (size: keyof typeof editorFontSizes): Extension => EditorView.theme({
   '&': {
      fontSize: editorFontSizes[size] ?? editorFontSizes.medium
   },
   '.cm-scroller': {
      fontFamily: '\'Monaco\', \'Menlo\', \'Ubuntu Mono\', \'Consolas\', \'Source Code Pro\', \'source-code-pro\', monospace'
   }
});
