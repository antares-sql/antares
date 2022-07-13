interface ShortcutRecord {
   event: string;
   keys: Electron.Accelerator;
   description: string;
}

export const shortcuts: ShortcutRecord[] = [
   {
      event: 'open-connections-modal',
      keys: 'CommandOrControl+Space',
      description: 'Show all connections'
   }
];
