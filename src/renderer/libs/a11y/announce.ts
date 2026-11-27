/**
 * Screen reader announcements for results that appear away from the focus (query finished, connection
 * established, notifications): a persistent, visually hidden `aria-live` region whose text changes.
 * A region inserted together with its text is often not announced, so it is created once at startup.
 */
let region: HTMLElement = null;

export const installAnnouncer = () => {
   if (region) return;
   region = document.createElement('div');
   region.className = 'text-assistive';
   region.setAttribute('aria-live', 'polite');
   region.setAttribute('aria-atomic', 'true');
   document.body.appendChild(region);
};

export const announce = (message: string) => {
   if (!region || !message) return;
   // Emptied first, so the same message twice in a row is announced again
   region.textContent = '';
   requestAnimationFrame(() => {
      region.textContent = message;
   });
};
