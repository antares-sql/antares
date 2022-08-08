import { BrowserWindow, globalShortcut } from 'electron';
import * as Store from 'electron-store';
import { ShortcutRecord, shortcuts as defaultShortcuts } from 'common/shortcuts';
const shortcutsStore = new Store({ name: 'shortcuts' });
const isDevelopment = process.env.NODE_ENV !== 'production';

export class ShortcutRegister {
   private _shortcuts: ShortcutRecord[];
   private _mainWindow: BrowserWindow;

   constructor (args: { mainWindow: BrowserWindow }) {
      this._mainWindow = args.mainWindow;
      this.shortcuts = shortcutsStore.get('shortcuts', defaultShortcuts) as ShortcutRecord[];
   }

   get shortcuts () {
      return this._shortcuts;
   }

   private set shortcuts (value: ShortcutRecord[]) {
      this._shortcuts = value;
      shortcutsStore.set('shortcuts', value);
   }

   init () {
      for (const shortcut of this.shortcuts) {
         if (shortcut.os.includes(process.platform)) {
            for (const key of shortcut.keys) {
               try {
                  globalShortcut.register(key, () => {
                     this._mainWindow.webContents.send(shortcut.event);
                     if (isDevelopment) console.log('EVENT:', shortcut);
                  });
               }
               catch (error) {
                  this.restoreDefaults();
                  throw error;
               }
            }
         }
      }
   }

   reload () {
      this.unregister();
      this.init();
   }

   updateShortcuts (shortcuts: ShortcutRecord[]) {
      this.shortcuts = shortcuts;
      this.reload();
   }

   restoreDefaults () {
      this.shortcuts = defaultShortcuts;
      this.reload();
   }

   unregister () {
      globalShortcut.unregisterAll();
   }
}
