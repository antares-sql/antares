import { ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';

let mainWindow;

export default () => {
   ipcMain.on('checkForUpdates', event => {
      mainWindow = event;

      autoUpdater.checkForUpdatesAndNotify().catch(() => {
         mainWindow.reply('checkFailed');
      });
   });

   ipcMain.on('restartToUpdate', () => {
      autoUpdater.quitAndInstall();
   });

   // auto-updater events
   autoUpdater.on('checking-for-update', () => {
      mainWindow.reply('checkingForUpdate');
   });

   autoUpdater.on('update-available', () => {
      mainWindow.reply('updateAvailable');
   });

   autoUpdater.on('update-not-available', () => {
      mainWindow.reply('updateNotAvailable');
   });

   autoUpdater.on('download-progress', (data) => {
      mainWindow.reply('downloadProgress', data);
   });

   autoUpdater.on('update-downloaded', () => {
      mainWindow.reply('updateDownloaded');
   });

   autoUpdater.logger = require('electron-log');
   autoUpdater.logger.transports.console.format = '{h}:{i}:{s} {text}';
   autoUpdater.logger.transports.file.level = 'info';
};
