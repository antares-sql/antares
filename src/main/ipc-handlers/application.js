import keytar from 'keytar';
import { app, ipcMain } from 'electron';

export default () => {
   ipcMain.on('close-app', () => {
      app.exit();
   });

   ipcMain.on('get-key', async event => {
      const key = await keytar.getPassword('antares', 'user');
      event.returnValue = key;
   });
};
