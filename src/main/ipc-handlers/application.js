import { app, ipcMain } from 'electron';

export default () => {
   ipcMain.on('close-app', () => {
      app.exit();
   });

   ipcMain.on('get-key', async event => {
      const key = false;
      event.returnValue = key;
   });
};
