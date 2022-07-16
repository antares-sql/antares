interface ShortcutRecord {
   event: string;
   keys: Electron.Accelerator[];
   description: string;
}

const shortcuts: ShortcutRecord[] = [
   {
      event: 'open-new-tab',
      keys: ['CommandOrControl+T'],
      description: 'Open a new query tab'
   },
   {
      event: 'close-tab',
      keys: ['CommandOrControl+W'],
      description: 'Close tab'
   },
   {
      event: 'next-tab',
      keys: ['Alt+CommandOrControl+Right', 'CommandOrControl+PageDown'],
      description: 'Next tab'
   },
   {
      event: 'prev-tab',
      keys: ['Alt+CommandOrControl+Left', 'CommandOrControl+PageUp'],
      description: 'Previous tab'
   },
   {
      event: 'open-connections-modal',
      keys: ['Shift+CommandOrControl+Space'],
      description: 'Show all connections'
   },
   {
      event: 'toggle-console',
      keys: ['CommandOrControl+F12', 'CommandOrControl+`'],
      description: 'Toggle console'
   }
];

for (let i = 1; i <= 9; i++) {
   shortcuts.push(
      {
         event: `select-tab-${i}`,
         keys: [`CommandOrControl+${i}`],
         description: `Select tab number ${i}`
      });
}

export { shortcuts };
