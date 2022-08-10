export const shortcutEvents: { [key: string]: { l18n: string; l18nParam?: string | number }} = {
   'open-new-tab': { l18n: 'message.openNewTab' },
   'close-tab': { l18n: 'message.closeTab' },
   'next-tab': { l18n: 'message.nextTab' },
   'prev-tab': { l18n: 'message.previousTab' },
   'open-connections-modal': { l18n: 'message.allConnections' },
   'toggle-console': { l18n: 'message.toggleConsole' }
};

interface ShortcutRecord {
   event: string;
   keys: Electron.Accelerator[];
   /** Needed for default shortcuts */
   os: NodeJS.Platform[];
}

/**
 * Default shortcuts
 */
const shortcuts: ShortcutRecord[] = [
   {
      event: 'open-new-tab',
      keys: ['CommandOrControl+T'],
      os: ['darwin', 'linux', 'win32']
   },
   {
      event: 'close-tab',
      keys: ['CommandOrControl+W'],
      os: ['darwin', 'linux', 'win32']
   },
   {
      event: 'next-tab',
      keys: ['Alt+CommandOrControl+Right'],
      os: ['darwin', 'win32']
   },
   {
      event: 'prev-tab',
      keys: ['Alt+CommandOrControl+Left'],
      os: ['darwin', 'win32']
   },
   {
      event: 'next-tab',
      keys: ['CommandOrControl+PageDown'],
      os: ['linux', 'win32']
   },
   {
      event: 'prev-tab',
      keys: ['CommandOrControl+PageUp'],
      os: ['linux', 'win32']
   },
   {
      event: 'open-connections-modal',
      keys: ['Shift+CommandOrControl+Space'],
      os: ['darwin', 'linux', 'win32']
   },
   {
      event: 'toggle-console',
      keys: ['CommandOrControl+F12'],
      os: ['darwin', 'linux', 'win32']
   },
   {
      event: 'toggle-console',
      keys: ['CommandOrControl+`'],
      os: ['darwin', 'linux', 'win32']
   }
];

for (let i = 1; i <= 9; i++) {
   shortcutEvents[`select-tab-${i}`] = {
      l18n: 'message.selectTabNumber',
      l18nParam: i
   };

   shortcuts.push({
      event: `select-tab-${i}`,
      keys: [`CommandOrControl+${i}`],
      os: ['darwin', 'linux', 'win32']
   });
}

export { shortcuts, ShortcutRecord };
