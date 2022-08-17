import { BrowserWindow, globalShortcut } from 'electron';
import * as Store from 'electron-store';
import { ShortcutRecord, shortcuts } from 'common/shortcuts';

const shortcutsStore = new Store({ name: 'shortcuts' });
const isDevelopment = process.env.NODE_ENV !== 'production';
const defaultShortcuts = shortcuts.filter(s => s.os.includes(process.platform));

export class ShortcutRegister {
   private _shortcuts: ShortcutRecord[];
   private _mainWindow: BrowserWindow;
   private static _instance: ShortcutRegister;

   private constructor (args: { mainWindow: BrowserWindow }) {
      this._mainWindow = args.mainWindow;
      this.shortcuts = shortcutsStore.get('shortcuts', defaultShortcuts) as ShortcutRecord[];
   }

   public static getInstance (args: { mainWindow: BrowserWindow }) {
      if (!ShortcutRegister._instance)
         ShortcutRegister._instance = new ShortcutRegister(args);

      return ShortcutRegister._instance;
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

      this._mainWindow.webContents.send('update-shortcuts', this.shortcuts);
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
