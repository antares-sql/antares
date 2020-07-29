import { app, ipcMain } from 'electron';

export default () => {
   ipcMain.on('closeApp', () => {
      app.exit();
   });
};
