import { contrastRatio, parseHexColor } from 'common/libs/colorContrast';

const toHex = (cssColor: string): string => {
   const [r, g, b] = (cssColor.match(/[\d.]+/g) || ['0', '0', '0']).slice(0, 3).map(n => Math.round(Number(n)));
   return `#${[r, g, b].map(n => n.toString(16).padStart(2, '0')).join('')}`;
};

/**
 * Colors of the native window controls (Windows title bar overlay), read from the active theme:
 * the title bar background and black or white symbols, whichever contrasts more.
 */
export const titleBarOverlayColors = (wrapper: HTMLElement): { color: string; symbolColor: string } => {
   const probe = document.createElement('div');
   probe.style.background = 'var(--bg-titlebar)';
   probe.style.display = 'none';
   wrapper.appendChild(probe);
   const color = toHex(getComputedStyle(probe).backgroundColor);
   probe.remove();

   const bg = parseHexColor(color);
   const symbolColor = contrastRatio(bg, parseHexColor('#ffffff')) >= contrastRatio(bg, parseHexColor('#000000')) ? '#ffffff' : '#000000';
   return { color, symbolColor };
};
