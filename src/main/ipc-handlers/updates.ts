import { ipcMain } from 'electron';
import * as Store from 'electron-store';
import { autoUpdater } from 'electron-updater';

import { validateSender } from '../libs/misc/validateSender';

const persistentStore = new Store({
   name: 'settings',
   clearInvalidConfig: true,
   migrations: {
      '0.7.15': store => {
         store.set('allow_prerelease', false);
      }
   }
});

const isMacOS = process.platform === 'darwin';
let mainWindow: Electron.IpcMainEvent;
autoUpdater.allowPrerelease = persistentStore.get('allow_prerelease', false) as boolean;

export default () => {
   ipcMain.on('check-for-updates', event => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      mainWindow = event;
      if (process.windowsStore || (process.platform === 'linux' && !process.env.APPIMAGE))
         mainWindow.reply('no-auto-update');
      else if (isMacOS) { // Temporary solution on MacOS for unsigned app updates
         autoUpdater.autoDownload = false;
      }
      else {
         autoUpdater.checkForUpdatesAndNotify().catch(() => {
            mainWindow.reply('check-failed');
         });
      }
   });

   ipcMain.on('restart-to-update', (event) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };
      autoUpdater.quitAndInstall();
   });

   // auto-updater events
   autoUpdater.on('checking-for-update', (event) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };
      mainWindow.reply('checking-for-update');
   });

   autoUpdater.on('update-available', (event) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      if (isMacOS)
         mainWindow.reply('link-to-download');
      else
         mainWindow.reply('update-available');
   });

   autoUpdater.on('update-not-available', (event) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };
      mainWindow.reply('update-not-available');
   });

   autoUpdater.on('download-progress', event => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };
      mainWindow.reply('download-progress', event);
   });

   autoUpdater.on('update-downloaded', (event) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };
      mainWindow.reply('update-downloaded');
   });

   // autoUpdater.logger = require('electron-log');
   // autoUpdater.logger.transports.console.format = '{h}:{i}:{s} {text}';
   // autoUpdater.logger.transports.file.level = 'info';
};
