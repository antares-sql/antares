import { app, ipcMain, dialog } from 'electron';
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
      const shortCutRegister = ShortcutRegister.getInstance();
      shortCutRegister.restoreDefaults();
   });

   ipcMain.handle('reload-shortcuts', () => {
      const shortCutRegister = ShortcutRegister.getInstance();
      shortCutRegister.reload();
   });

   ipcMain.handle('update-shortcuts', (event, shortcuts) => {
      const shortCutRegister = ShortcutRegister.getInstance();
      shortCutRegister.updateShortcuts(shortcuts);
   });

   ipcMain.handle('unregister-shortcuts', () => {
      const shortCutRegister = ShortcutRegister.getInstance();
      shortCutRegister.unregister();
   });
};
