import { ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';

let mainWindow;
autoUpdater.allowPrerelease = true;

export default () => {
   ipcMain.on('check-for-updates', event => {
      mainWindow = event;

      autoUpdater.checkForUpdatesAndNotify().catch(() => {
         mainWindow.reply('check-failed');
      });
   });

   ipcMain.on('restart-to-update', () => {
      autoUpdater.quitAndInstall();
   });

   // auto-updater events
   autoUpdater.on('checking-for-update', () => {
      mainWindow.reply('checking-for-update');
   });

   autoUpdater.on('update-available', () => {
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

   autoUpdater.logger = require('electron-log');
   autoUpdater.logger.transports.console.format = '{h}:{i}:{s} {text}';
   autoUpdater.logger.transports.file.level = 'info';
};
