import { ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import Store from 'electron-store';
const persistentStore = new Store({ name: 'settings' });
const isMacOS = process.platform === 'darwin';

let mainWindow: Electron.IpcMainEvent;
autoUpdater.allowPrerelease = persistentStore.get('allow_prerelease', true) as boolean;

export default () => {
   ipcMain.on('check-for-updates', event => {
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

   ipcMain.on('restart-to-update', () => {
      autoUpdater.quitAndInstall();
   });

   // auto-updater events
   autoUpdater.on('checking-for-update', () => {
      mainWindow.reply('checking-for-update');
   });

   autoUpdater.on('update-available', () => {
      if (isMacOS)
         mainWindow.reply('link-to-download');
      else
         mainWindow.reply('update-available');
   });

   autoUpdater.on('update-not-available', () => {
      mainWindow.reply('update-not-available');
   });

   autoUpdater.on('download-progress', data => {
      mainWindow.reply('download-progress', data);
   });

   autoUpdater.on('update-downloaded', () => {
      mainWindow.reply('update-downloaded');
   });

   // autoUpdater.logger = require('electron-log');
   // autoUpdater.logger.transports.console.format = '{h}:{i}:{s} {text}';
   // autoUpdater.logger.transports.file.level = 'info';
};
