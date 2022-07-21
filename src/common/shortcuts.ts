interface ShortcutRecord {
   event: string;
   keys: Electron.Accelerator[];
   description: string;
   os: NodeJS.Platform[];
}

const shortcuts: ShortcutRecord[] = [
   {
      event: 'open-new-tab',
      keys: ['CommandOrControl+T'],
      description: 'Open a new query tab',
      os: ['darwin', 'linux', 'win32']
   },
   {
      event: 'close-tab',
      keys: ['CommandOrControl+W'],
      description: 'Close tab',
      os: ['darwin', 'linux', 'win32']
   },
   {
      event: 'next-tab',
      keys: ['Alt+CommandOrControl+Right', 'CommandOrControl+PageDown'],
      description: 'Next tab',
      os: ['darwin', 'win32']
   },
   {
      event: 'prev-tab',
      keys: ['Alt+CommandOrControl+Left', 'CommandOrControl+PageUp'],
      description: 'Previous tab',
      os: ['darwin', 'win32']
   },
   {
      event: 'next-tab',
      keys: ['CommandOrControl+PageDown'],
      description: 'Next tab',
      os: ['linux']
   },
   {
      event: 'prev-tab',
      keys: ['CommandOrControl+PageUp'],
      description: 'Previous tab',
      os: ['linux']
   },
   {
      event: 'open-connections-modal',
      keys: ['Shift+CommandOrControl+Space'],
      description: 'Show all connections',
      os: ['darwin', 'linux', 'win32']
   },
   {
      event: 'toggle-console',
      keys: ['CommandOrControl+F12', 'CommandOrControl+`'],
      description: 'Toggle console',
      os: ['darwin', 'linux', 'win32']
   }
];

for (let i = 1; i <= 9; i++) {
   shortcuts.push(
      {
         event: `select-tab-${i}`,
         keys: [`CommandOrControl+${i}`],
         description: `Select tab number ${i}`,
         os: ['darwin', 'linux', 'win32']
      });
}

export { shortcuts };
