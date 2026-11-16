import { app, dialog, ipcMain, safeStorage } from 'electron';
import * as Store from 'electron-store';
import * as fs from 'fs';

import { validateSender } from '../libs/misc/validateSender';
import { ShortcutRegister } from '../libs/ShortcutRegister';
import { IpcMainLike } from './handle';

export default (ipc: IpcMainLike = ipcMain) => {
   ipc.on('close-app', (event) => {
      if (!validateSender(event.senderFrame)) {
         return {
            status: 'error',
            response: 'Unauthorized process'
         };
      }
      app.exit();
   });

   ipc.on('set-key', (event, key) => {
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

   ipc.on('get-key', (event) => {
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

      // Plain-text key saved when safeStorage is unavailable
      const key = sessionStore.get('key');
      event.returnValue = typeof key === 'string' && key ? key : false;
   });

   ipc.handle('show-open-dialog', (event, options) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };
      return dialog.showOpenDialog(options);
   });

   ipc.handle('show-save-dialog', (event, options) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };
      return dialog.showSaveDialog(options);
   });

   ipc.handle('get-download-dir-path', (event) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };
      return app.getPath('downloads');
   });

   ipc.handle('resotre-default-shortcuts', (event) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };
      const shortCutRegister = ShortcutRegister.getInstance();
      shortCutRegister.restoreDefaults();
   });

   ipc.handle('reload-shortcuts', (event) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };
      const shortCutRegister = ShortcutRegister.getInstance();
      shortCutRegister.reload();
   });

   ipc.handle('update-shortcuts', (event, shortcuts) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };
      const shortCutRegister = ShortcutRegister.getInstance();
      shortCutRegister.updateShortcuts(shortcuts);
   });

   ipc.handle('unregister-shortcuts', (event) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };
      const shortCutRegister = ShortcutRegister.getInstance();
      shortCutRegister.unregister();
   });

   ipc.handle('read-file', (event, { filePath, encoding }) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };
      try {
         const content = fs.readFileSync(filePath, encoding);
         return content;
      }
      catch (error) {
         return { status: 'error', response: error.toString() };
      }
   });

   ipc.handle('write-file', (event, filePath, content) => {
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
