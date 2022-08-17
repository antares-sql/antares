import { app, ipcMain, dialog, BrowserWindow } from 'electron';
import { ShortcutRegister } from '../libs/ShortcutRegister';

export default () => {
   ipcMain.on('close-app', () => {
      app.exit();
   });

   ipcMain.handle('show-open-dialog', (event, options) => {
      return dialog.showOpenDialog(options);
   });

   ipcMain.handle('get-download-dir-path', () => {
      return app.getPath('downloads');
   });

   ipcMain.handle('resotre-default-shortcuts', () => {
      const mainWindow = BrowserWindow.getAllWindows()[0];
      const shortCutRegister = ShortcutRegister.getInstance({ mainWindow });
      shortCutRegister.restoreDefaults();
   });

   ipcMain.handle('reload-shortcuts', () => {
      const mainWindow = BrowserWindow.getAllWindows()[0];
      const shortCutRegister = ShortcutRegister.getInstance({ mainWindow });
      shortCutRegister.reload();
   });

   ipcMain.handle('update-shortcuts', (event, shortcuts) => {
      const mainWindow = BrowserWindow.getAllWindows()[0];
      const shortCutRegister = ShortcutRegister.getInstance({ mainWindow });
      shortCutRegister.updateShortcuts(shortcuts);
   });

   ipcMain.handle('unregister-shortcuts', () => {
      const mainWindow = BrowserWindow.getAllWindows()[0];
      const shortCutRegister = ShortcutRegister.getInstance({ mainWindow });
      shortCutRegister.unregister();
   });
};
