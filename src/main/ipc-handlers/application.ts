import * as crypto from 'crypto';
import { app, ipcMain, dialog, safeStorage } from 'electron';
import * as Store from 'electron-store';
import { ShortcutRegister } from '../libs/ShortcutRegister';

export default () => {
   ipcMain.on('close-app', () => {
      app.exit();
   });

   ipcMain.on('get-key', (event) => {
      const secretStore = new Store({
         name: 'antares',
         encryptionKey: 'segreto_di_pulcinella', // Just to obfuscate
         clearInvalidConfig: true
      });

      let key: string;
      const encryptedKey = secretStore.get('encrypted', false) as string | false;

      if (encryptedKey) {
         try {
            key = safeStorage.decryptString(Buffer.from(encryptedKey, 'latin1'));
         }
         catch (err) {
            secretStore.delete('encrypted');
            throw new Error(err);
         }
      }
      else {
         key = safeStorage.encryptString(crypto.randomBytes(16).toString('hex')).toString('latin1');
         secretStore.set('encrypted', key);
      }

      event.returnValue = key;
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
