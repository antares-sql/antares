import keytar from 'keytar';
import { app, ipcMain } from 'electron';

export default () => {
   ipcMain.on('close-app', () => {
      app.exit();
   });

   ipcMain.on('get-key', async event => {
      let key = false;

      try {
         key = await keytar.getPassword('antares', 'user');
      }
      catch (err) {
         console.log(err);
      }
      event.returnValue = key;
   });
};
