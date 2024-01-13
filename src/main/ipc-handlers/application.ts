import { app, dialog, ipcMain, safeStorage } from 'electron';
import * as Store from 'electron-store';

import { validateSender } from '../libs/misc/validateSender';
import { ShortcutRegister } from '../libs/ShortcutRegister';

export default () => {
   ipcMain.on('close-app', (event) => {
      if (!validateSender(event.senderFrame)) {
         return {
            status: 'error',
            response: 'Unauthorized process'
         };
      }
      app.exit();
   });

   ipcMain.on('set-key', (event, key) => {
      if (safeStorage.isEncryptionAvailable()) {
         const sessionStore = new Store({
            name: 'session',
            fileExtension: ''
         });
         const encrypted = safeStorage.encryptString(key);
         sessionStore.set('key', encrypted);
         event.returnValue = true;
      }
   });

   ipcMain.on('get-key', (event) => {
      if (!safeStorage.isEncryptionAvailable()) {
         event.returnValue = false;
         return;
      }
      const sessionStore = new Store({
         name: 'session',
         fileExtension: ''
      });

      try {
         const encrypted = sessionStore.get('key') as string;
         const key = safeStorage.decryptString(Buffer.from(encrypted, 'utf-8'));
         event.returnValue = key;
      }
      catch (error) {
         event.returnValue = false;
      }
   });

   ipcMain.handle('show-open-dialog', (event, options) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };
      return dialog.showOpenDialog(options);
   });

   ipcMain.handle('get-download-dir-path', (event) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };
      return app.getPath('downloads');
   });

   ipcMain.handle('resotre-default-shortcuts', (event) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };
      const shortCutRegister = ShortcutRegister.getInstance();
      shortCutRegister.restoreDefaults();
   });

   ipcMain.handle('reload-shortcuts', (event) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };
      const shortCutRegister = ShortcutRegister.getInstance();
      shortCutRegister.reload();
   });

   ipcMain.handle('update-shortcuts', (event, shortcuts) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };
      const shortCutRegister = ShortcutRegister.getInstance();
      shortCutRegister.updateShortcuts(shortcuts);
   });

   ipcMain.handle('unregister-shortcuts', (event) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };
      const shortCutRegister = ShortcutRegister.getInstance();
      shortCutRegister.unregister();
   });
};
