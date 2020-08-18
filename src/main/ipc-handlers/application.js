import { app, ipcMain } from 'electron';

export default () => {
   ipcMain.on('close-app', () => {
      app.exit();
   });
};
