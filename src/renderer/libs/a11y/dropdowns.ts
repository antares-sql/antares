import { isKeyboardModality } from '@/libs/a11y/inputModality';

/**
 * Keyboard support for every Spectre dropdown (`.dropdown` > `.dropdown-toggle` + `.menu`), which opens
 * while its toggle is focused:
 * - the menu stays open while the focus is inside it (`menu-open`), so its items can be reached;
 * - ↓ on the toggle enters the menu, ↑/↓/Home/End move between items, Escape goes back to the toggle;
 * - choosing an item closes the menu and gives the focus back to the toggle.
 * Installed once on the document, so it also covers dropdowns rendered later.
 */
const ITEM_SELECTOR = '.menu-item > a, [role="menuitem"], .menu button';
const DISMISSED = 'menu-dismissed';
const OPEN = 'menu-open';

const menuItems = (dropdown: Element) => [...dropdown.querySelectorAll<HTMLElement>(`:scope > .menu :is(${ITEM_SELECTOR})`)]
   .filter(el => !el.classList.contains('disabled') && !(el as HTMLButtonElement).disabled && el.offsetParent !== null);

const toggleOf = (dropdown: Element) => dropdown.querySelector<HTMLElement>(':scope > .dropdown-toggle');

const focusItem = (el: HTMLElement) => {
   // Keeps the menu shown while the focus leaves the toggle (the menu is shown by toggle:focus)
   el?.closest('.dropdown')?.classList.add(OPEN);
   if (!el) return;
   if (!el.hasAttribute('tabindex') && !['A', 'BUTTON'].includes(el.tagName)) el.tabIndex = -1;
   if (el.tagName === 'A' && !el.hasAttribute('href') && !el.hasAttribute('tabindex')) el.tabIndex = -1;
   el.focus();
};

const dismiss = (dropdown: Element, refocus: boolean) => {
   dropdown.classList.remove(OPEN);
   dropdown.classList.add(DISMISSED);
   if (refocus) toggleOf(dropdown)?.focus();
};

const onKeydown = (event: KeyboardEvent) => {
   const target = event.target as HTMLElement;
   const dropdown = target.closest?.('.dropdown');
   if (!dropdown) return;
   const toggle = toggleOf(dropdown);
   const inMenu = !!target.closest('.menu') && dropdown.contains(target.closest('.menu'));

   if (target === toggle) {
      if (event.key === 'ArrowDown') {
         event.preventDefault();
         dropdown.classList.remove(DISMISSED);
         // The menu is shown only after the toggle is focused: wait for the style to apply
         requestAnimationFrame(() => focusItem(menuItems(dropdown)[0]));
      }
      else if (event.key === 'Escape' && !dropdown.classList.contains(DISMISSED)) {
         event.stopPropagation();
         dismiss(dropdown, false);
      }
      return;
   }

   if (!inMenu) return;
   const items = menuItems(dropdown);
   const index = items.indexOf(target);

   switch (event.key) {
      case 'ArrowDown':
         focusItem(items[(index + 1) % items.length]);
         break;
      case 'ArrowUp':
         focusItem(items[(index - 1 + items.length) % items.length]);
         break;
      case 'Home':
         focusItem(items[0]);
         break;
      case 'End':
         focusItem(items[items.length - 1]);
         break;
      case 'Escape':
         event.stopPropagation();
         dismiss(dropdown, true);
         break;
      default:
         return;
   }
   event.preventDefault();
};

const onClick = (event: MouseEvent) => {
   const target = event.target as HTMLElement;
   const item = target.closest?.(ITEM_SELECTOR);
   const dropdown = item?.closest('.dropdown');
   if (!dropdown || !item.closest('.menu') || item.closest('.form-group, .menu-badge')) return;
   // Back to the toggle only for keyboard users, a mouse user doesn't need it
   dismiss(dropdown, isKeyboardModality() && dropdown.contains(document.activeElement) && document.activeElement !== toggleOf(dropdown));
};

const onFocusOut = (event: FocusEvent) => {
   const dropdown = (event.target as HTMLElement).closest?.('.dropdown');
   if (dropdown && !dropdown.contains(event.relatedTarget as Node)) dropdown.classList.remove(DISMISSED, OPEN);
};

const onPointerDown = (event: PointerEvent) => {
   // A new click on the toggle opens the menu again
   const toggle = (event.target as HTMLElement).closest?.('.dropdown-toggle');
   toggle?.closest('.dropdown')?.classList.remove(DISMISSED);
};

export const installDropdownKeyboard = () => {
   document.addEventListener('keydown', onKeydown, true);
   document.addEventListener('click', onClick);
   document.addEventListener('focusout', onFocusOut);
   document.addEventListener('pointerdown', onPointerDown, true);
};
