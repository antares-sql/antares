import { app, ipcMain, dialog } from 'electron';

export default () => {
   ipcMain.on('close-app', () => {
      app.exit();
   });

   ipcMain.on('get-key', async event => {
      const key = false;
      event.returnValue = key;
   });

   ipcMain.handle('showOpenDialog', (event, options) => {
      return dialog.showOpenDialog(options);
   });

   ipcMain.handle('get-download-dir-path', () => {
      return app.getPath('downloads');
   });
};
