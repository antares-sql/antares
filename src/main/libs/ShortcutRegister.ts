import { ShortcutRecord, shortcuts } from 'common/shortcuts';
import { BrowserWindow, globalShortcut, Menu, MenuItem, MenuItemConstructorOptions } from 'electron';
import * as Store from 'electron-store';

const shortcutsStore = new Store({ name: 'shortcuts' });
const isDevelopment = process.env.NODE_ENV !== 'production';
const defaultShortcuts = shortcuts.filter(s => s.os.includes(process.platform));

export type ShortcutMode = 'local' | 'global'
export type OsMenu = {
   [key in NodeJS.Platform]?: MenuItemConstructorOptions[];
};

export class ShortcutRegister {
   private _shortcuts: ShortcutRecord[];
   private _mainWindow: BrowserWindow;
   private _menu: Menu;
   private _menuTemplate: OsMenu;
   private _mode: ShortcutMode;
   private static _instance: ShortcutRegister;

   private constructor (args: { mainWindow: BrowserWindow; menuTemplate?: OsMenu; mode: ShortcutMode }) {
      this._mainWindow = args.mainWindow;
      this._menuTemplate = args.menuTemplate || {};
      this._mode = args.mode;
      this.shortcuts = shortcutsStore.get('shortcuts', defaultShortcuts) as ShortcutRecord[];
   }

   public static getInstance (args?: { mainWindow?: BrowserWindow; menuTemplate?: OsMenu; mode?: ShortcutMode }) {
      if (!ShortcutRegister._instance && args.menuTemplate !== undefined && args.mode !== undefined) {
         ShortcutRegister._instance = new ShortcutRegister({
            mainWindow: args.mainWindow,
            menuTemplate: args.menuTemplate,
            mode: args.mode
         });
      }

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
      this._mainWindow.webContents.send('update-shortcuts', this.shortcuts);

      this.buildBaseMenu();

      if (this._mode === 'global')
         this.setGlobalShortcuts();
      else if (this._mode === 'local')
         this.setLocalShortcuts();
      else
         throw new Error(`Unknown mode "${this._mode}"`);

      Menu.setApplicationMenu(this._menu);
   }

   private buildBaseMenu () {
      if (Object.keys(this._menuTemplate).includes(process.platform))
         this._menu = Menu.buildFromTemplate(this._menuTemplate[process.platform]);
      else
         this._menu = new Menu();
   }

   private setLocalShortcuts () {
      const isMenuVisible = process.platform === 'darwin';
      const submenu = [];
      for (const shortcut of this.shortcuts) {
         if (shortcut.os.includes(process.platform)) {
            for (const key of shortcut.keys) {
               try {
                  submenu.push({
                     label: String(shortcut.event),
                     accelerator: key,
                     visible: isMenuVisible,
                     click: () => {
                        if (shortcut.isFunction) {
                           if (shortcut.event in this) {
                              type exporterMethods = 'setFullScreen' | 'setZoomIn' | 'setZoomOut' | 'setZoomReset';
                              this[shortcut.event as exporterMethods]();
                           }
                        }
                        else
                           this._mainWindow.webContents.send(shortcut.event);

                        if (isDevelopment) console.log('LOCAL EVENT:', shortcut);
                     }
                  });
               }
               catch (error) {
                  if (isDevelopment) console.log(error);
                  this.restoreDefaults();
                  throw error;
               }
            }
         }
      }
      this._menu.append(new MenuItem({
         label: 'Shortcut',
         visible: isMenuVisible,
         submenu
      }));
   }

   private setGlobalShortcuts () {
      for (const shortcut of this.shortcuts) {
         if (shortcut.os.includes(process.platform)) {
            for (const key of shortcut.keys) {
               try {
                  globalShortcut.register(key, () => {
                     this._mainWindow.webContents.send(shortcut.event);
                     if (isDevelopment) console.log('GLOBAL EVENT:', shortcut);
                  });
               }
               catch (error) {
                  if (isDevelopment) console.log(error);
                  this.restoreDefaults();
                  throw error;
               }
            }
         }
      }
   }

   setFullScreen () {
      this._mainWindow.setFullScreen(!this._mainWindow.isFullScreen());
   }

   setZoomIn () {
      const currentZoom = this._mainWindow.webContents.getZoomLevel();
      this._mainWindow.webContents.setZoomLevel(currentZoom + 1);
   }

   setZoomOut () {
      const currentZoom = this._mainWindow.webContents.getZoomLevel();
      this._mainWindow.webContents.setZoomLevel(currentZoom - 1);
   }

   setZoomReset () {
      this._mainWindow.webContents.setZoomLevel(0);
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
      if (this._mode === 'global') globalShortcut.unregisterAll();
   }
}
