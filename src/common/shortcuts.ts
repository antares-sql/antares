interface ShortcutRecord {
   event: string;
   keys: Electron.Accelerator;
   description: string;
}

export const shortcuts: ShortcutRecord[] = [
   {
      event: 'open-connections-modal',
      keys: 'Shift+CommandOrControl+Space',
      description: 'Show all connections'
   }
];
