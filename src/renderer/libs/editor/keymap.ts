import { copyLineDown, deleteLine, toggleBlockComment } from '@codemirror/commands';
import { foldAll, unfoldAll } from '@codemirror/language';
import { gotoLine } from '@codemirror/search';
import { EditorSelection } from '@codemirror/state';
import { Command, EditorView, KeyBinding } from '@codemirror/view';
import { ShortcutRecord, shortcuts as defaultShortcuts } from 'common/shortcuts';

import { useSettingsStore } from '@/stores/settings';

import { fromAccelerator, fromCodeMirror } from './keyNames';
import { openReplacePanel } from './searchPanel';

const platform = process.platform;
const isMac = platform === 'darwin';

/** App shortcuts the editor keeps for itself when focused, as Ace did */
const editorWinsEvents = ['open-filter'];

const changeCase = (upper: boolean): Command => (view: EditorView) => {
   if (view.state.readOnly) return false;
   view.dispatch(view.state.changeByRange(range => {
      const target = range.empty ? view.state.wordAt(range.head) : range;
      if (!target) return { range };
      const text = view.state.sliceDoc(target.from, target.to);
      return {
         changes: { from: target.from, to: target.to, insert: upper ? text.toUpperCase() : text.toLowerCase() },
         range: EditorSelection.range(range.anchor, range.head)
      };
   }));
   return true;
};

/** Ace default bindings CodeMirror lacks or binds to something else */
export const aceKeymap: KeyBinding[] = [
   { key: 'Mod-d', run: deleteLine },
   { key: 'Mod-Shift-d', run: copyLineDown },
   { key: 'Mod-l', run: gotoLine },
   { key: 'Mod-h', mac: 'Mod-Alt-f', run: openReplacePanel },
   { key: 'Mod-Shift-/', run: toggleBlockComment },
   { key: 'Mod-?', run: toggleBlockComment },
   { key: 'Ctrl-u', run: changeCase(true) },
   { key: 'Ctrl-Shift-u', run: changeCase(false) },
   { key: 'Alt-0', run: foldAll },
   { key: 'Alt-Shift-0', run: unfoldAll }
];

const toKey = (key: string) => fromCodeMirror(key, isMac);

let cachedRecords: ShortcutRecord[] = null;
let cachedKeys = new Set<string>();

/** Key combinations of the app shortcuts (menu accelerators) */
const appShortcutKeys = () => {
   const stored = useSettingsStore().shortcuts;
   const records = stored?.length ? stored : defaultShortcuts.filter(shortcut => shortcut.os.includes(platform));
   if (records !== cachedRecords) {
      cachedRecords = records;
      cachedKeys = new Set(records
         .filter(shortcut => !editorWinsEvents.includes(shortcut.event))
         .flatMap(shortcut => (shortcut.keys as string[]).map(key => fromAccelerator(key, isMac))));
   }
   return cachedKeys;
};

const platformKey = (binding: KeyBinding) =>
   (isMac ? binding.mac : platform === 'win32' ? binding.win : binding.linux) ?? binding.key;

const yieldToApp = (command: Command, key: string): Command => {
   const normalized = toKey(key);
   return view => appShortcutKeys().has(normalized) ? false : command(view);
};

/**
 * Electron runs a menu accelerator only if the page didn't handle the key: an
 * editor binding on the same keys as an app shortcut (e.g. Ctrl+Enter, Ctrl+G)
 * would silently disable it. The returned bindings decline those keys, so they
 * reach the app (shortcuts can be customized, so this is checked on each key).
 */
export const yieldingToAppShortcuts = (bindings: readonly KeyBinding[]): KeyBinding[] => bindings.map(binding => {
   const key = platformKey(binding);
   if (!key) return binding;
   return {
      ...binding,
      key,
      mac: undefined,
      win: undefined,
      linux: undefined,
      // Don't swallow the key when the app should get it
      preventDefault: false,
      run: binding.run && yieldToApp(binding.run, key),
      shift: binding.shift && yieldToApp(binding.shift, `Shift-${key}`)
   };
});
