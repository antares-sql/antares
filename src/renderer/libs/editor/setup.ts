import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, foldGutter, foldKeymap, indentOnInput, indentUnit } from '@codemirror/language';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { EditorState, Extension } from '@codemirror/state';
import {
   crosshairCursor,
   drawSelection,
   dropCursor,
   EditorView,
   highlightActiveLine,
   highlightActiveLineGutter,
   highlightSpecialChars,
   keymap,
   lineNumbers,
   rectangularSelection
} from '@codemirror/view';

import { searchPanel } from './searchPanel';

export interface BaseSetupOptions {
   gutter?: boolean;
}

/** Editing behaviour shared by every editor (mirrors Ace's defaults) */
export const baseSetup = ({ gutter = true }: BaseSetupOptions = {}): Extension => [
   gutter ? [lineNumbers(), highlightActiveLineGutter(), foldGutter()] : [],
   highlightSpecialChars(),
   history(),
   drawSelection(),
   dropCursor(),
   EditorState.allowMultipleSelections.of(true),
   EditorState.tabSize.of(4),
   indentUnit.of('    '),
   indentOnInput(),
   bracketMatching(),
   closeBrackets(),
   rectangularSelection(),
   crosshairCursor(),
   highlightActiveLine(),
   highlightSelectionMatches(),
   searchPanel(),
   keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...foldKeymap,
      indentWithTab
   ]),
   EditorView.theme({
      '&': { height: '100%' },
      '&.cm-focused': { outline: 'none' },
      '.cm-scroller': { overflow: 'auto' }
   })
];
