/**
 * Gives an accessible name to form controls laid out the Spectre way, where the `.form-label` is a
 * sibling of the control (in another column) instead of wrapping it or pointing to it with `for`:
 * every control of a `.form-group` without a name of its own gets `aria-labelledby` = the group label.
 * Covers inputs, selects, textareas, BaseSelect comboboxes and switches/checkboxes whose own label has no text.
 * Runs on DOM changes, so it also applies to forms rendered later.
 */
const CONTROLS = 'input:not([type="hidden"]), select, textarea, [role="combobox"]';
let labelId = 0;

const hasOwnName = (control: HTMLElement) => {
   if (control.hasAttribute('aria-label') || control.hasAttribute('aria-labelledby')) return true;
   if ((control as HTMLInputElement).labels?.length) {
      // A wrapping label counts only if it has some text (switches wrap just an icon), and unless it asks
      // for the group label (file pickers: their own text is just "Browse" and the chosen file)
      return [...(control as HTMLInputElement).labels]
         .some(label => label.textContent.trim() && !label.hasAttribute('data-a11y-group-label'));
   }
   return false;
};

const labelForms = (root: ParentNode) => {
   for (const label of root.querySelectorAll<HTMLLabelElement>('.form-group label.form-label:not([data-a11y-labelled])')) {
      const group = label.closest('.form-group');
      if (label.htmlFor || label.querySelector(CONTROLS) || !label.textContent.trim()) {
         label.dataset.a11yLabelled = '';
         continue;
      }

      const controls = [...group.querySelectorAll<HTMLElement>(CONTROLS)]
         .filter(control => control.closest('.form-group') === group && !hasOwnName(control));
      if (!controls.length) continue; // The control may be rendered later

      if (!label.id) label.id = `form-label-${++labelId}`;
      for (const control of controls) control.setAttribute('aria-labelledby', label.id);
      label.dataset.a11yLabelled = '';
   }
};

export const installFormLabels = () => {
   let scheduled = false;
   const run = () => {
      scheduled = false;
      labelForms(document);
   };
   const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(run);
   });
   observer.observe(document.body, { childList: true, subtree: true });
   run();
};
