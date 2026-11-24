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
      if (el.getAttribute('aria-disabled') !== 'true') el.click();
   }
};

const setLabel = (el: HTMLElement, label: unknown) => {
   if (typeof label === 'string' && label) el.setAttribute('aria-label', label);
   else if (label === undefined || label === null) el.removeAttribute('aria-label');
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
