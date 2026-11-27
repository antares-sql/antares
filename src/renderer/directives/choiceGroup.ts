import { Directive } from 'vue';

/**
 * One tab stop and arrow keys for a group of choices, whose items are marked in the template:
 * - `v-radiogroup`: items `role="radio"` with `:aria-checked` (pickers: themes, icons, colors, filters);
 * - `v-listbox`: items `role="option"` with `:aria-selected` (selectable side lists).
 * The arrows move to the next/previous enabled item and select it (they fire its `click`), Home/End go to
 * the first/last one, Space and Enter click the focused item. Radio groups wrap and also use Left/Right
 * (mirrored in RTL); listboxes use Up/Down only and Delete clicks the `[data-option-delete]` element of the
 * focused option, then the focus goes to a neighbour.
 * The checked/selected item (or the first) is the tab stop. The value is the accessible name of the group.
 * A mouse click selects an item without focusing it, so the items look as they did before being focusable.
 */
interface GroupConfig {
   role: 'radiogroup' | 'listbox';
   itemRole: 'radio' | 'option';
   state: 'aria-checked' | 'aria-selected';
   horizontal: boolean;
   wrap: boolean;
}

/** Fires the click handlers of an item (`click()` exists only on HTML elements, items may be SVG icons) */
const activate = (el: Element) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

const createChoiceGroup = (config: GroupConfig): Directive<HTMLElement, string | undefined> => {
   /** Enabled items of this group (not of nested groups); `visibleOnly` for keyboard moves */
   const itemsOf = (group: HTMLElement, visibleOnly = true) => [...group.querySelectorAll<HTMLElement>(`[role="${config.itemRole}"]`)]
      .filter(item => item.closest(`[role="${config.role}"]`) === group &&
         (!visibleOnly || item.getClientRects().length > 0) &&
         item.getAttribute('aria-disabled') !== 'true');

   // Independent of visibility: the group may be mounted in a hidden tab
   const sync = (group: HTMLElement) => {
      const items = itemsOf(group, false);
      const tabStop = items.find(item => item === document.activeElement) ||
         items.find(item => item.getAttribute(config.state) === 'true') ||
         items[0];
      for (const item of items) item.tabIndex = item === tabStop ? 0 : -1;
   };

   const moveTo = (current: HTMLElement, target: HTMLElement) => {
      if (!target || target === current) return;
      current.tabIndex = -1;
      target.tabIndex = 0;
      target.focus();
      activate(target); // Selection follows the focus
   };

   const onKeydown = (event: KeyboardEvent) => {
      const group = event.currentTarget as HTMLElement;
      const current = event.target as HTMLElement;
      if (current.getAttribute('role') !== config.itemRole) return;
      const items = itemsOf(group);
      const index = items.indexOf(current);
      if (index < 0) return;

      const step = (delta: number) => {
         const next = index + delta;
         if (config.wrap) return items[(next + items.length) % items.length];
         return items[Math.max(0, Math.min(items.length - 1, next))];
      };

      let target: HTMLElement;
      switch (event.key) {
         case 'ArrowDown':
            target = step(1);
            break;
         case 'ArrowUp':
            target = step(-1);
            break;
         case 'ArrowRight':
         case 'ArrowLeft': {
            if (!config.horizontal) return;
            const isRtl = getComputedStyle(group).direction === 'rtl';
            target = step((event.key === 'ArrowRight') !== isRtl ? 1 : -1);
            break;
         }
         case 'Home':
            target = items[0];
            break;
         case 'End':
            target = items[items.length - 1];
            break;
         case ' ':
         case 'Enter':
            event.preventDefault();
            activate(current);
            return;
         case 'Delete': {
            const remove = config.role === 'listbox' && current.querySelector<HTMLElement>('[data-option-delete]');
            if (!remove) return;
            event.preventDefault();
            activate(remove);
            // The option is removed on the next render: move to the neighbour that takes its place
            requestAnimationFrame(() => {
               if (group.contains(document.activeElement) && document.activeElement !== group) return;
               const remaining = itemsOf(group);
               const neighbour = remaining[Math.min(index, remaining.length - 1)];
               if (neighbour) {
                  neighbour.tabIndex = 0;
                  neighbour.focus();
                  activate(neighbour);
               }
            });
            return;
         }
         default:
            return;
      }

      event.preventDefault();
      moveTo(current, target);
   };

   const onMousedown = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const item = target.closest(`[role="${config.itemRole}"]`);
      // Native controls inside an item (e.g. the actions of a theme card) still take the focus
      if (item && !target.closest('button, a[href], input, select, textarea')) event.preventDefault();
   };

   const onFocusOut = (event: FocusEvent) => {
      const group = event.currentTarget as HTMLElement;
      if (!group.contains(event.relatedTarget as Node)) sync(group);
   };

   const observers = new WeakMap<HTMLElement, MutationObserver>();

   const setLabel = (el: HTMLElement, label: string | undefined) => {
      if (label) el.setAttribute('aria-label', label);
   };

   return {
      mounted (el, binding) {
         el.setAttribute('role', config.role);
         setLabel(el, binding.value);
         sync(el);
         el.addEventListener('keydown', onKeydown);
         el.addEventListener('mousedown', onMousedown);
         el.addEventListener('focusout', onFocusOut);
         const observer = new MutationObserver(() => {
            if (!el.contains(document.activeElement)) sync(el);
         });
         observer.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: [config.state, 'aria-disabled', 'style', 'class'] });
         observers.set(el, observer);
      },
      updated (el, binding) {
         if (binding.value !== binding.oldValue) setLabel(el, binding.value);
      },
      unmounted (el) {
         el.removeEventListener('keydown', onKeydown);
         el.removeEventListener('mousedown', onMousedown);
         el.removeEventListener('focusout', onFocusOut);
         observers.get(el)?.disconnect();
      }
   };
};

export const vRadiogroup = createChoiceGroup({
   role: 'radiogroup',
   itemRole: 'radio',
   state: 'aria-checked',
   horizontal: true,
   wrap: true
});

export const vListbox = createChoiceGroup({
   role: 'listbox',
   itemRole: 'option',
   state: 'aria-selected',
   horizontal: false,
   wrap: false
});
