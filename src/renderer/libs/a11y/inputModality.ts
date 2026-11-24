/**
 * Last input modality on <html data-input-modality="keyboard|pointer">.
 * Chromium shows :focus-visible also when a script moves the focus after a click (menus focusing their
 * first item, dialogs focusing a field or giving the focus back...): the keyboard focus styles are
 * gated on this attribute, so they appear only for keyboard users.
 */
const MODIFIERS = ['Shift', 'Control', 'Alt', 'Meta', 'AltGraph', 'CapsLock'];

export const installInputModality = () => {
   const root = document.documentElement;
   const set = (modality: 'keyboard' | 'pointer') => {
      if (root.dataset.inputModality !== modality) root.dataset.inputModality = modality;
   };

   set('pointer');
   window.addEventListener('keydown', (e) => {
      if (!MODIFIERS.includes(e.key)) set('keyboard');
   }, true);
   window.addEventListener('pointerdown', () => set('pointer'), true);
};
