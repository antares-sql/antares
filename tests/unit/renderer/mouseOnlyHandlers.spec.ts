import fs = require('fs');
import path = require('path');
import { describe, expect, it } from 'vitest';

/**
 * Guard against controls that only work with the mouse (see DESIGN.md → Accessible components):
 * an element with a click/dblclick/mousedown handler must be natively interactive or get
 * `v-button`, a `role` or a `tabindex` (keyboard handling comes with them).
 * Offenders are keyed `Component.vue:<tag>:<handler>`; BASELINE lists the accepted ones, each with its reason.
 */
const COMPONENTS = path.resolve(__dirname, '../../../src/renderer/components');

const NATIVE = new Set(['button', 'input', 'select', 'textarea', 'option', 'label', 'summary']);
const VOID = new Set(['input', 'img', 'br', 'hr', 'meta', 'link', 'source', 'col', 'area', 'wbr']);
const HANDLER = /^(?:@|v-on:)(click|dblclick|mousedown)(?:\.[\w.]+)?$/;
const KEYBOARD_ATTRS = /^(v-button|tabindex|:tabindex|role|:role)$/;

interface Tag { name: string; attrs: Map<string, string> }

const parseAttrs = (src: string) => {
   const attrs = new Map<string, string>();
   const re = /([^\s"'=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g;
   let m: RegExpExecArray;
   while ((m = re.exec(src))) attrs.set(m[1], m[2] ?? m[3] ?? '');
   return attrs;
};

const classes = (tag: Tag) => (tag.attrs.get('class') || '').split(/\s+/);

/** First meaningful identifier of a handler expression (the emitted event for `$emit('x')`) */
const handlerName = (value: string) => {
   const emitted = value.match(/^\s*\$?emit\(\s*'([^']+)'/);
   if (emitted) return emitted[1];
   return (value.match(/[A-Za-z_$][\w$]*/) || [''])[0];
};

const isExempt = (tag: Tag, ancestors: Tag[]) => {
   if (NATIVE.has(tag.name)) return true;
   if (tag.name === 'a' && (tag.attrs.has('href') || tag.attrs.has(':href'))) return true;
   if ([...tag.attrs.keys()].some(attr => KEYBOARD_ATTRS.test(attr))) return true;
   // Keyboard handled by BaseContextMenu
   if (classes(tag).includes('context-element')) return true;
   // Closed with Escape, like every modal
   if (classes(tag).includes('modal-overlay')) return true;
   const parent = ancestors[ancestors.length - 1];
   // Tab bars with v-tablist: the tab (or its inner link) is activated by the directive
   const tabItem = classes(tag).includes('tab-item') ? tag : (parent && classes(parent).includes('tab-item') ? parent : null);
   if (tabItem && ancestors.some(a => a.attrs.has('v-tablist'))) return true;
   // Dropdown menu items: libs/a11y/dropdowns.ts
   if (tag.name === 'a' && parent && classes(parent).includes('menu-item') && ancestors.some(a => classes(a).includes('dropdown')))
      return true;
   return false;
};

const findOffenders = () => {
   const offenders = new Set<string>();
   for (const file of fs.readdirSync(COMPONENTS).filter(f => f.endsWith('.vue'))) {
      const src = fs.readFileSync(path.join(COMPONENTS, file), 'utf8');
      const start = src.indexOf('<template');
      const end = src.lastIndexOf('</template>');
      if (start < 0) continue;
      const template = src.slice(src.indexOf('>', start) + 1, end).replace(/<!--[\s\S]*?-->/g, '');

      const stack: Tag[] = [];
      const tagRe = /<(\/?)([A-Za-z][\w-]*)((?:\s+[^\s"'=<>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'))?)*)\s*(\/?)>/g;
      let m: RegExpExecArray;
      while ((m = tagRe.exec(template))) {
         const [, closing, name, attrSrc, selfClosing] = m;
         if (closing) {
            const index = stack.map(t => t.name).lastIndexOf(name);
            if (index >= 0) stack.length = index;
            continue;
         }
         const tag: Tag = { name, attrs: parseAttrs(attrSrc) };
         for (const [attr, value] of tag.attrs) {
            if (!HANDLER.test(attr) || !value.trim()) continue; // modifier-only handlers (.stop, .prevent)
            if (/^\s*\$event\.(stopPropagation|preventDefault)\(\)\s*$/.test(value)) continue;
            if (!isExempt(tag, stack)) offenders.add(`${file}:${name}:${handlerName(value)}`);
         }
         if (!selfClosing && !VOID.has(name.toLowerCase())) stack.push(tag);
      }
   }
   return [...offenders].sort();
};

/** Accepted mouse-only handlers: each needs a reason */
const BASELINE: string[] = [
   // Context menu backdrop: Escape closes the menu
   'BaseContextMenu.vue:a:close',
   // Only tracks a mouse press inside the option list
   'BaseSelect.vue:div:isMouseDown',
   'BaseSelect.vue:li:select',
   'BaseUploadInput.vue:BaseIcon:clear',
   'DebugConsole.vue:div:openDevTools',
   'DebugConsole.vue:div:reload',
   'ModalAllConnections.vue:BaseIcon:askToDelete',
   'ModalAllConnections.vue:BaseIcon:searchTerm',
   'ModalConnectionAppearance.vue:BaseIcon:openFile',
   'ModalConnectionAppearance.vue:BaseIcon:setIcon',
   'ModalFolderAppearance.vue:div:localFolder',
   'ModalHistory.vue:BaseIcon:searchTerm',
   'ModalProcessesList.vue:div:sort',
   'ModalProcessesListRow.vue:div:selectRow',
   'ModalProcessesListRow.vue:span:dblClick',
   'ModalSettings.vue:a:openOutside',
   'ModalSettingsThemes.vue:div:changeApplicationTheme',
   'ModalUsersManagement.vue:a:requestAction',
   'ScratchpadNote.vue:BaseIcon:toggle-note',
   'TheScratchpad.vue:BaseIcon:searchTerm',
   'TheScratchpad.vue:div:isAddModal',
   'TheScratchpad.vue:div:setTag',
   'TheScratchpad.vue:div:showArchived',
   'TheTitleBar.vue:div:openDevTools',
   'TheTitleBar.vue:div:reload',
   'TheTitleBar.vue:div:toggleFullScreen',
   'Workspace.vue:a:openAsPermanentTab',
   'Workspace.vue:span:closeTab',
   'WorkspaceTabPropsFunctionParamsModal.vue:div:selectParameter',
   'WorkspaceTabPropsRoutineParamsModal.vue:div:selectParameter',
   'WorkspaceTabPropsTableChecksModal.vue:div:selectCheck',
   'WorkspaceTabPropsTableForeignModal.vue:div:selectForeign',
   'WorkspaceTabPropsTableIndexesModal.vue:div:selectIndex',
   'WorkspaceTabPropsTableRow.vue:span:editON',
   'WorkspaceTabQuery.vue:a:openHistoryModal',
   'WorkspaceTabQuery.vue:a:openSavedModal',
   'WorkspaceTabQuery.vue:a:saveFile',
   'WorkspaceTabQuery.vue:a:saveQuery',
   // Results grid: Enter on the focused cell edits it
   'WorkspaceTabQueryTableRow.vue:span:editON',
   'WorkspaceTabSchemaDiagram.vue:g:openTableData',
   'WorkspaceTabSchemaDiagram.vue:g:startTableDrag',
   'WorkspaceTabSchemaDiagram.vue:span:zoomAt',
   'WorkspaceTabSchemaDiagram.vue:svg:startPan'
];

describe('mouse-only handlers', () => {
   const offenders = findOffenders();

   it('has no new mouse-only handlers', () => {
      expect(offenders.filter(key => !BASELINE.includes(key))).toEqual([]);
   });

   it('baseline has no stale entries', () => {
      expect(BASELINE.filter(key => !offenders.includes(key))).toEqual([]);
   });
});
