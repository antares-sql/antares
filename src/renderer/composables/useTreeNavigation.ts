import { onBeforeUnmount, onMounted, Ref } from 'vue';

const ITEM_SELECTOR = 'summary, [data-tree-item]';

/**
 * Keyboard navigation of a tree made of nested `<details>/<summary>` (folders) and `[data-tree-item]`
 * elements (leaves), with a single tab stop (roving focus):
 * - the container is the tab stop and forwards the focus to the last focused (or selected, or first) item;
 * - ↑/↓ Home/End move between visible items, → opens a folder (or enters it), ← closes it (or goes to its parent);
 * - on a leaf, Space fires its `mousedown` handlers (select) and Enter its `dblclick` ones (open);
 *   Enter/Space on a folder toggle it natively.
 * Items must have `tabindex="-1"`; the context menu key fires `contextmenu` on the focused item natively.
 */
export const useTreeNavigation = (containerRef: Ref<HTMLElement>, options: { selectedSelector?: string } = {}) => {
   let lastFocused: HTMLElement = null;

   const visibleItems = () => [...containerRef.value.querySelectorAll<HTMLElement>(ITEM_SELECTOR)]
      .filter(el => el.offsetParent !== null);

   const focusItem = (el: HTMLElement) => {
      if (!el) return;
      el.focus();
      el.scrollIntoView({ block: 'nearest' });
   };

   const onFocus = (event: FocusEvent) => {
      const container = containerRef.value;
      if (event.target !== container) return;
      const items = visibleItems();
      const target = (lastFocused && items.includes(lastFocused) && lastFocused) ||
         (options.selectedSelector && container.querySelector<HTMLElement>(options.selectedSelector)) ||
         items[0];
      focusItem(target);
   };

   const onFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (target.matches(ITEM_SELECTOR)) {
         lastFocused = target;
         containerRef.value.tabIndex = -1; // Shift+Tab must leave the tree, not land on the container
      }
   };

   const onFocusOut = (event: FocusEvent) => {
      if (!containerRef.value.contains(event.relatedTarget as Node))
         containerRef.value.tabIndex = 0;
   };

   const onKeydown = (event: KeyboardEvent) => {
      const current = event.target as HTMLElement;
      if (!current.matches(ITEM_SELECTOR) || event.altKey || event.ctrlKey || event.metaKey) return;

      const items = visibleItems();
      const index = items.indexOf(current);
      const isFolder = current.tagName === 'SUMMARY';
      const details = isFolder ? current.parentElement as HTMLDetailsElement : null;
      const isRtl = getComputedStyle(current).direction === 'rtl';
      const forward = isRtl ? 'ArrowLeft' : 'ArrowRight';
      const backward = isRtl ? 'ArrowRight' : 'ArrowLeft';

      switch (event.key) {
         case 'ArrowDown':
            focusItem(items[index + 1]);
            break;
         case 'ArrowUp':
            focusItem(items[index - 1]);
            break;
         case 'Home':
            focusItem(items[0]);
            break;
         case 'End':
            focusItem(items[items.length - 1]);
            break;
         case forward:
            if (details && !details.open) current.click();
            else if (details) focusItem(items[index + 1]);
            break;
         case backward:
            if (details?.open) current.click();
            else {
               // Parent folder: the summary of the closest enclosing <details>
               const parent = (isFolder ? details.parentElement : current)
                  .closest('details')?.querySelector<HTMLElement>(':scope > summary');
               if (parent && containerRef.value.contains(parent)) focusItem(parent);
            }
            break;
         case ' ':
            if (isFolder) return;
            current.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
            break;
         case 'Enter':
            if (isFolder) return;
            current.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, button: 0 }));
            break;
         default:
            return;
      }

      event.preventDefault();
      event.stopPropagation();
   };

   onMounted(() => {
      const container = containerRef.value;
      container.tabIndex = 0;
      container.addEventListener('focus', onFocus);
      container.addEventListener('focusin', onFocusIn);
      container.addEventListener('focusout', onFocusOut);
      container.addEventListener('keydown', onKeydown);
   });

   onBeforeUnmount(() => {
      const container = containerRef.value;
      if (!container) return;
      container.removeEventListener('focus', onFocus);
      container.removeEventListener('focusin', onFocusIn);
      container.removeEventListener('focusout', onFocusOut);
      container.removeEventListener('keydown', onKeydown);
   });
};
