/**
 * Canonical form of key combinations (`ctrl+meta+alt+shift+key`, lowercase), to
 * compare CodeMirror key names (`Mod-Shift-z`) with Electron accelerators
 * (`CommandOrControl+Shift+Z`).
 */
const aliases: Record<string, string> = {
   up: 'arrowup',
   down: 'arrowdown',
   left: 'arrowleft',
   right: 'arrowright',
   return: 'enter',
   esc: 'escape',
   plus: '+',
   ' ': 'space'
};

const normalizeKey = (parts: string[], isMac: boolean) => {
   const modifiers = new Set<string>();
   let key = '';
   for (const part of parts) {
      const lower = part.toLowerCase();
      switch (lower) {
         case 'mod':
         case 'commandorcontrol':
         case 'cmdorctrl':
            modifiers.add(isMac ? 'meta' : 'ctrl');
            break;
         case 'cmd':
         case 'command':
         case 'meta':
         case 'super':
            modifiers.add('meta');
            break;
         case 'ctrl':
         case 'control':
            modifiers.add('ctrl');
            break;
         case 'alt':
         case 'option':
            modifiers.add('alt');
            break;
         case 'shift':
            modifiers.add('shift');
            break;
         default:
            key = aliases[lower] ?? lower;
      }
   }
   return [...['ctrl', 'meta', 'alt', 'shift'].filter(m => modifiers.has(m)), key].join('+');
};

/** CodeMirror key name, e.g. `Mod-Alt-ArrowUp` or `Mod--` */
export const fromCodeMirror = (key: string, isMac: boolean) => normalizeKey(key.split(/-(?!$)/), isMac);

/** Electron accelerator, e.g. `CommandOrControl+Up` or `CommandOrControl+Plus` */
export const fromAccelerator = (accelerator: string, isMac: boolean) => normalizeKey(accelerator.split(/\+(?!$)/), isMac);
