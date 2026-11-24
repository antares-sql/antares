/**
 * F6 / Shift+F6 move the focus between the main areas of the window, like in browsers and IDEs:
 * setting bar → database explorer → open tabs → content of the selected tab → status bar.
 * Each area receives the focus on its "current" element (selected connection, active tab, ...).
 * Disabled while a modal dialog is open.
 */
const visible = (el: Element): el is HTMLElement => !!el && el.getClientRects().length > 0;

const firstVisible = (selector: string) => [...document.querySelectorAll<HTMLElement>(selector)].find(visible);

const FOCUSABLE = 'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

interface Region {
   container: () => HTMLElement;
   focus: (container: HTMLElement) => HTMLElement;
}

const regions: Region[] = [
   {
      container: () => firstVisible('#settingbar'),
      focus: c => c.querySelector<HTMLElement>('[aria-current="true"]') || c.querySelector<HTMLElement>('[role="button"]')
   },
   {
      container: () => firstVisible('.workspace-explorebar'),
      focus: c => c.querySelector<HTMLElement>('.workspace-explorebar-body') || c
   },
   {
      container: () => firstVisible('.workspace-tabs [role="tablist"]'),
      focus: c => c.querySelector<HTMLElement>('[role="tab"][tabindex="0"]') || c.querySelector<HTMLElement>(FOCUSABLE)
   },
   {
      container: () => firstVisible('.workspace-tabs .workspace-query-tab') || firstVisible('.workspace-tabs .empty, #main-content .workspace-add-connection, #main-content .connection-panel'),
      // The query editor first, otherwise the first control
      focus: c => [...c.querySelectorAll<HTMLElement>('.cm-content')].find(visible) || [...c.querySelectorAll<HTMLElement>(FOCUSABLE)].find(visible)
   },
   {
      container: () => firstVisible('#footer'),
      focus: c => [...c.querySelectorAll<HTMLElement>(FOCUSABLE)].find(visible)
   }
];

const onKeydown = (event: KeyboardEvent) => {
   if (event.key !== 'F6' || event.ctrlKey || event.altKey || event.metaKey) return;
   if (firstVisible('[aria-modal="true"]')) return;

   const available = regions
      .map(region => ({ region, container: region.container() }))
      .filter(({ container }) => container);
   if (!available.length) return;

   event.preventDefault();
   const active = document.activeElement;
   const current = available.findIndex(({ container }) => container.contains(active));
   const step = event.shiftKey ? -1 : 1;

   // From outside every area: F6 goes to the first one, Shift+F6 to the last one
   let index = current === -1 ? (event.shiftKey ? available.length - 1 : 0) : current + step;
   for (let i = 0; i < available.length; i++, index += step) {
      const { region, container } = available[(index + available.length) % available.length];
      const target = region.focus(container);
      if (target) {
         target.focus();
         if (document.activeElement === target || container.contains(document.activeElement)) return;
      }
   }
};

export const installRegionNavigation = () => {
   window.addEventListener('keydown', onKeydown, true);
};
