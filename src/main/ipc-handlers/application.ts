import { app, ipcMain, dialog } from 'electron';

export default () => {
   ipcMain.on('close-app', () => {
      app.exit();
   });

   ipcMain.handle('show-open-dialog', (event, options) => {
      return dialog.showOpenDialog(options);
   });

   ipcMain.handle('get-download-dir-path', () => {
      return app.getPath('downloads');
   });
};
