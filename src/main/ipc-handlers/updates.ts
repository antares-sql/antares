import { ipcMain } from 'electron';
import * as log from 'electron-log/main';
import * as Store from 'electron-store';
import { autoUpdater } from 'electron-updater';

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

   autoUpdater.on('download-progress', event => {
      mainWindow.reply('download-progress', event);
   });

   autoUpdater.on('update-downloaded', () => {
      mainWindow.reply('update-downloaded');
   });

   log.transports.file.level = 'info';
   // log.transports.console.format = '{h}:{i}:{s} {text}';
   autoUpdater.logger = log;
};
