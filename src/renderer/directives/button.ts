import { Directive } from 'vue';

/**
 * Makes a non-native clickable element (`<li>`, `<div>`, `<a>` without href...) behave like a button
 * for keyboard and assistive technology users: focusable with Tab, announced as a button,
 * activated with Enter or Space (which fire its `click` handlers).
 * The optional value is the accessible name, for icon-only elements: `v-button="t('general.close')"`.
 * Elements that already have a `role` or `tabindex` keep them.
 */
const onKeydown = (event: KeyboardEvent) => {
   const el = event.currentTarget as HTMLElement;
   if (event.target !== el || event.repeat) return;
   if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (el.getAttribute('aria-disabled') === 'true') return;
      // click() exists only on HTML elements: a clickable BaseIcon is an <svg>
      if (typeof el.click === 'function') el.click();
      else el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
   }
};

const setLabel = (el: HTMLElement, label: unknown) => {
   if (typeof label === 'string' && label) {
      el.setAttribute('aria-label', label);
      el.removeAttribute('aria-hidden'); // e.g. a clickable BaseIcon: its svg is hidden by default
   }
};

export const vButton: Directive<HTMLElement, string | undefined> = {
   mounted (el, binding) {
      if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
      if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
      setLabel(el, binding.value);
      el.addEventListener('keydown', onKeydown);
   },
   updated (el, binding) {
      if (binding.value !== binding.oldValue) setLabel(el, binding.value);
   },
   unmounted (el) {
      el.removeEventListener('keydown', onKeydown);
   }
};
