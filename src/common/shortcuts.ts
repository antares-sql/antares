interface ShortcutRecord {
   event: string;
   keys: Electron.Accelerator[];
   description?: string;
   l18nSlug: string;
   l18nParam?: string | number;
   os: NodeJS.Platform[];
}

const shortcuts: ShortcutRecord[] = [
   {
      event: 'open-new-tab',
      keys: ['CommandOrControl+T'],
      description: 'Open a new query tab',
      l18nSlug: 'message.openNewTab',
      os: ['darwin', 'linux', 'win32']
   },
   {
      event: 'close-tab',
      keys: ['CommandOrControl+W'],
      description: 'Close tab',
      l18nSlug: 'message.closeTab',
      os: ['darwin', 'linux', 'win32']
   },
   {
      event: 'next-tab',
      keys: ['Alt+CommandOrControl+Right'],
      description: 'Next tab',
      l18nSlug: 'message.nextTab',
      os: ['darwin', 'win32']
   },
   {
      event: 'prev-tab',
      keys: ['Alt+CommandOrControl+Left'],
      description: 'Previous tab',
      l18nSlug: 'message.previousTab',
      os: ['darwin', 'win32']
   },
   {
      event: 'next-tab',
      keys: ['CommandOrControl+PageDown'],
      description: 'Next tab',
      l18nSlug: 'message.nextTab',
      os: ['linux', 'win32']
   },
   {
      event: 'prev-tab',
      keys: ['CommandOrControl+PageUp'],
      description: 'Previous tab',
      l18nSlug: 'message.previousTab',
      os: ['linux', 'win32']
   },
   {
      event: 'open-connections-modal',
      keys: ['Shift+CommandOrControl+Space'],
      description: 'Show all connections',
      l18nSlug: 'message.allConnections',
      os: ['darwin', 'linux', 'win32']
   },
   {
      event: 'toggle-console',
      keys: ['CommandOrControl+F12'],
      description: 'Toggle console',
      l18nSlug: 'message.toggleConsole',
      os: ['darwin', 'linux', 'win32']
   },
   {
      event: 'toggle-console',
      keys: ['CommandOrControl+`'],
      description: 'Toggle console',
      l18nSlug: 'message.toggleConsole',
      os: ['darwin', 'linux', 'win32']
   }
];

for (let i = 1; i <= 9; i++) {
   shortcuts.push(
      {
         event: `select-tab-${i}`,
         keys: [`CommandOrControl+${i}`],
         description: `Select tab number ${i}`,
         l18nSlug: 'message.selectTabNumber',
         l18nParam: i,
         os: ['darwin', 'linux', 'win32']
      });
}

export { shortcuts, ShortcutRecord };
