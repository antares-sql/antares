import * as antares from 'common/interfaces/antares';
import { ipcMain } from 'electron';

export default (connections: {[key: string]: antares.Client}) => {
   ipcMain.handle('get-databases', async (event, uid) => {
      try {
         const result = await connections[uid].getDatabases();
         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });
};
