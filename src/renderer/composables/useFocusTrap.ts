import { customRef, ref } from 'vue';

import { isKeyboardModality } from '@/libs/a11y/inputModality';

const focusableElementsSelector =
  'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

let titleId = 0;

/**
 * Accessible modal dialogs: bind `trapRef` to the dialog container.
 * - keeps Tab/Shift+Tab inside the dialog (focusable elements are looked up on every key press,
 *   so content rendered later is included);
 * - marks the container as a modal dialog labelled by its `.modal-title`;
 * - focuses the first focusable element (unless `disableAutofocus`) and, when the dialog closes,
 *   gives the focus back to the element that had it before the dialog opened.
 */
const useFocusTrap = (args?: {disableAutofocus?: boolean}) => {
   let localArgs = {
      disableAutofocus: false
   };

   if (args) {
      localArgs = {
         ...localArgs,
         ...args
      };
   }

   let $trapEl: HTMLElement = null;
   let $previousFocus: HTMLElement = null;
   let openedWithKeyboard = false;
   const isInitiated = ref(false);

   const trapRef = customRef((track, trigger) => {
      return {
         get () {
            track();
            return $trapEl;
         },
         set (value) {
            if (!value) clearFocusTrap(); // Needs the old element
            $trapEl = value;
            if (value) initFocusTrap();
            trigger();
         }
      };
   });

   const focusableElements = () => [...$trapEl.querySelectorAll<HTMLElement>(focusableElementsSelector)]
      .filter(el => el.offsetParent !== null || el === document.activeElement);

   function keyHandler (e: KeyboardEvent) {
      if (e.key !== 'Tab' || !$trapEl) return;
      const active = document.activeElement;
      // A dialog or menu opened over this one handles its own focus
      if (!$trapEl.contains(active) && active !== document.body && active?.closest('[aria-modal="true"]')) return;

      const elements = focusableElements();
      if (!elements.length) return;
      const $firstFocusable = elements[0];
      const $lastFocusable = elements[elements.length - 1];

      if (e.shiftKey) {
         if (active === $firstFocusable || !$trapEl.contains(active)) {
            $lastFocusable.focus();
            e.preventDefault();
         }
      }
      else {
         if (active === $lastFocusable || !$trapEl.contains(active)) {
            $firstFocusable.focus();
            e.preventDefault();
         }
      }
   }

   function setDialogSemantics () {
      if (!$trapEl.hasAttribute('role')) $trapEl.setAttribute('role', 'dialog');
      $trapEl.setAttribute('aria-modal', 'true');
      if (!$trapEl.hasAttribute('aria-labelledby') && !$trapEl.hasAttribute('aria-label')) {
         const $title = $trapEl.querySelector<HTMLElement>('.modal-title');
         if ($title) {
            if (!$title.id) $title.id = `dialog-title-${++titleId}`;
            $trapEl.setAttribute('aria-labelledby', $title.id);
         }
      }
   }

   function initFocusTrap () {
      if (!$trapEl || isInitiated.value) return;

      $previousFocus = document.activeElement as HTMLElement;
      openedWithKeyboard = isKeyboardModality();
      setDialogSemantics();
      document.addEventListener('keydown', keyHandler);
      isInitiated.value = true;

      // Autofocus as before the close buttons became focusable: the first control that isn't one of them
      const elements = localArgs.disableAutofocus ? [] : focusableElements().filter(el => !el.classList.contains('btn-clear'));
      if (elements.length) elements[0].focus();
      else if (!$trapEl.contains(document.activeElement)) {
         // The focus must enter the dialog anyway (screen readers, Tab order): the container takes it
         if (!$trapEl.hasAttribute('tabindex')) $trapEl.tabIndex = -1;
         $trapEl.focus({ preventScroll: true });
      }
   }

   function clearFocusTrap () {
      document.removeEventListener('keydown', keyHandler);
      if (!isInitiated.value) return;
      isInitiated.value = false;

      // Gives the focus back, unless the dialog already moved it somewhere else
      const active = document.activeElement;
      const focusInDialog = !active || active === document.body || !!$trapEl?.contains(active);
      // Only for keyboard users (dialog opened and closed with the keyboard): after a click, or Esc on a
      // dialog opened with the mouse, the focus isn't moved, so the opener shows no focus ring
      if (focusInDialog && $previousFocus?.isConnected && openedWithKeyboard && isKeyboardModality()) $previousFocus.focus();
      $previousFocus = null;
   }

   return {
      trapRef,
      initFocusTrap,
      clearFocusTrap
   };
};

export { useFocusTrap };
