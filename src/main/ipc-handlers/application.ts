import { app, dialog, ipcMain, safeStorage } from 'electron';
import * as Store from 'electron-store';
import * as fs from 'fs';

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
      const sessionStore = new Store({
         name: 'session',
         fileExtension: ''
      });

      if (safeStorage.isEncryptionAvailable()) {
         const encrypted = safeStorage.encryptString(key);
         sessionStore.set('key', encrypted);
      }
      else
         sessionStore.set('key', key);

      event.returnValue = true;
   });

   ipcMain.on('get-key', (event) => {
      const sessionStore = new Store({
         name: 'session',
         fileExtension: ''
      });

      if (safeStorage.isEncryptionAvailable()) {
         try {
            const encrypted = sessionStore.get('key') as string;
            const key = safeStorage.decryptString(Buffer.from(encrypted, 'utf-8'));
            event.returnValue = key;
            return;
         }
         catch {
            // Fall through to unencrypted fallback
         }
      }

      const key = sessionStore.get('key') as string | undefined;
      event.returnValue = key || false;
   });

   ipcMain.handle('show-open-dialog', (event, options) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };
      return dialog.showOpenDialog(options);
   });

   ipcMain.handle('show-save-dialog', (event, options) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };
      return dialog.showSaveDialog(options);
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

   ipcMain.handle('read-file', (event, { filePath, encoding }) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };
      try {
         const content = fs.readFileSync(filePath, encoding);
         return content;
      }
      catch (error) {
         return { status: 'error', response: error.toString() };
      }
   });

   ipcMain.handle('write-file', (event, filePath, content) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };
      try {
         fs.writeFileSync(filePath, content, 'utf-8');
         return { status: 'success' };
      }
      catch (error) {
         return { status: 'error', response: error.toString() };
      }
   });
};
