import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { Tag, tags as t } from '@lezer/highlight';
import { EditorThemeDefinition, ThemeTokenKey, ThemeTokenStyle } from 'common/themes/editorTheme';

import { aceThemes } from './themes/aceThemes';

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
      '.cm-tooltip': {
         backgroundColor: editor.background,
         color: editor.foreground,
         border: `1px solid ${editor.gutterBackground}`,
         borderRadius: '2px'
      },
      // Compact rows with centered icons, like VS Code suggestions
      '.cm-tooltip.cm-tooltip-autocomplete > ul': {
         maxHeight: '240px'
      },
      '.cm-tooltip.cm-tooltip-autocomplete > ul > li': {
         display: 'flex',
         alignItems: 'center',
         height: '20px',
         lineHeight: '20px',
         padding: '0 6px 0 4px',
         margin: '0', // Spectre.css gives a top margin to every li
         borderRadius: '2px'
      },
      '.cm-tooltip-autocomplete ul li[aria-selected]': {
         backgroundColor: theme.dark ? '#c9561a99' : editor.selection,
         color: editor.foreground
      },
      '.cm-completionMatchedText': {
         textDecoration: 'none',
         fontWeight: 'bold',
         color: theme.dark ? '#e0d00c' : '#2d69c7'
      },
      '.cm-completionDetail': {
         marginLeft: 'auto',
         paddingLeft: '2em',
         fontStyle: 'normal',
         opacity: '0.5'
      },
      '.cm-searchMatch': {
         backgroundColor: 'color-mix(in srgb, var(--primary-color) 25%, transparent)',
         outline: '1px solid color-mix(in srgb, var(--primary-color) 50%, transparent)'
      },
      '.cm-searchMatch.cm-searchMatch-selected': {
         backgroundColor: 'color-mix(in srgb, var(--primary-color) 55%, transparent)'
      },
      '.cm-search-widget': {
         backgroundColor: editor.gutterBackground,
         color: editor.foreground,
         border: `1px solid color-mix(in srgb, ${editor.foreground} 15%, transparent)`,
         borderTop: 'none'
      },
      '.cm-search-field, .cm-search-replace-row .cm-search-input': {
         backgroundColor: editor.background,
         boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${editor.foreground} 25%, transparent)`
      },
      '.cm-search-field:focus-within, .cm-search-replace-row .cm-search-input:focus': {
         boxShadow: 'inset 0 0 0 1px var(--primary-color)'
      },
      '.cm-search-button:hover': {
         backgroundColor: `color-mix(in srgb, ${editor.foreground} 12%, transparent)`
      },
      // Editor actions (format, clear), floating under the search widget
      '.cm-editor-actions': {
         backgroundColor: editor.gutterBackground,
         color: editor.foreground,
         border: `1px solid color-mix(in srgb, ${editor.foreground} 15%, transparent)`
      },
      '.cm-editor-action:hover:not(:disabled)': {
         backgroundColor: `color-mix(in srgb, ${editor.foreground} 12%, transparent)`
      },
      // "Go to line" dialog, floating like the search widget
      '.cm-goto-line.cm-dialog': {
         padding: '4px 28px 4px 8px',
         backgroundColor: editor.gutterBackground,
         color: editor.foreground,
         border: `1px solid color-mix(in srgb, ${editor.foreground} 15%, transparent)`,
         borderTop: 'none',
         borderRadius: '0 0 4px 4px',
         boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
         fontSize: '13px'
      },
      '.cm-goto-line label': {
         fontSize: 'inherit'
      },
      '.cm-goto-line .cm-textfield': {
         width: '90px',
         height: '24px',
         margin: '0 4px',
         padding: '0 6px',
         border: 'none',
         borderRadius: '2px',
         outline: 'none',
         backgroundColor: editor.background,
         color: editor.foreground,
         font: 'inherit',
         boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${editor.foreground} 25%, transparent)`
      },
      '.cm-goto-line .cm-textfield:focus': {
         boxShadow: 'inset 0 0 0 1px var(--primary-color)'
      },
      '.cm-goto-line .cm-button': {
         height: '24px',
         padding: '0 10px',
         border: 'none',
         borderRadius: '2px',
         backgroundImage: 'none',
         backgroundColor: 'var(--primary-color)',
         color: '#fff',
         font: 'inherit',
         cursor: 'pointer'
      },
      '.cm-goto-line .cm-dialog-close': {
         top: '50%',
         right: '8px',
         transform: 'translateY(-50%)',
         color: editor.foreground,
         fontSize: '16px',
         cursor: 'pointer',
         opacity: '0.85'
      },
      '.cm-search-counter.cm-search-no-results': {
         color: theme.dark ? '#f48771' : '#c72e0f',
         opacity: '1'
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
