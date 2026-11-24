import { Directive } from 'vue';

/**
 * ARIA tabs pattern for a Spectre tab bar (`<ul class="tab">` with `li.tab-item`, the selected one `.active`):
 * one tab stop on the active tab, arrows/Home/End move between tabs, Enter/Space select (fire `click`).
 * The value is the accessible name of the tab list. ARIA states follow the `active` class.
 */
const tabsOf = (list: HTMLElement) => [...list.querySelectorAll<HTMLElement>(':scope > .tab-item')]
   .filter(tab => tab.offsetParent !== null || tab.classList.contains('active'));

const sync = (list: HTMLElement) => {
   const tabs = tabsOf(list);
   const hasActive = tabs.some(tab => tab.classList.contains('active'));
   const focused = tabs.find(tab => tab === document.activeElement);

   tabs.forEach((tab, i) => {
      const isActive = tab.classList.contains('active');
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', String(isActive));
      // Roving tabindex: the focused tab keeps the tab stop while the user moves with the arrows
      const isTabStop = focused ? tab === focused : (isActive || (!hasActive && i === 0));
      tab.tabIndex = isTabStop ? 0 : -1;
   });
};

const onKeydown = (event: KeyboardEvent) => {
   const list = event.currentTarget as HTMLElement;
   const current = (event.target as HTMLElement).closest<HTMLElement>('.tab-item');
   if (!current || current !== event.target) return;

   const tabs = tabsOf(list);
   const index = tabs.indexOf(current);
   const isRtl = getComputedStyle(list).direction === 'rtl';
   let target: HTMLElement;

   switch (event.key) {
      case 'ArrowRight':
      case 'ArrowLeft': {
         const step = (event.key === 'ArrowRight') !== isRtl ? 1 : -1;
         target = tabs[(index + step + tabs.length) % tabs.length];
         break;
      }
      case 'Home':
         target = tabs[0];
         break;
      case 'End':
         target = tabs[tabs.length - 1];
         break;
      case 'Enter':
      case ' ':
         event.preventDefault();
         // The handler may be on the inner link: a click on it bubbles up to the tab anyway
         (current.querySelector<HTMLElement>(':scope > a') || current).click();
         return;
      default:
         return;
   }

   event.preventDefault();
   current.tabIndex = -1;
   target.tabIndex = 0;
   target.focus();
};

const onFocusOut = (event: FocusEvent) => {
   const list = event.currentTarget as HTMLElement;
   if (!list.contains(event.relatedTarget as Node)) sync(list);
};

const observers = new WeakMap<HTMLElement, MutationObserver>();

export const vTablist: Directive<HTMLElement, string | undefined> = {
   mounted (el, binding) {
      el.setAttribute('role', 'tablist');
      if (binding.value) el.setAttribute('aria-label', binding.value);
      sync(el);
      el.addEventListener('keydown', onKeydown);
      el.addEventListener('focusout', onFocusOut);
      const observer = new MutationObserver(() => sync(el));
      observer.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
      observers.set(el, observer);
   },
   updated (el, binding) {
      if (binding.value) el.setAttribute('aria-label', binding.value);
   },
   unmounted (el) {
      el.removeEventListener('keydown', onKeydown);
      el.removeEventListener('focusout', onFocusOut);
      observers.get(el)?.disconnect();
   }
};
