import * as antares from 'common/interfaces/antares';
import { ipcMain } from 'electron';

export default (connections: {[key: string]: antares.Client}) => {
   ipcMain.handle('get-users', async (event, uid) => {
      try {
         const result = await connections[uid].getUsers();
         return { status: 'success', response: result };
      }
      catch (err) {
         if (err.code === 'ER_TABLEACCESS_DENIED_ERROR')
            return { status: 'success', response: [] };
         return { status: 'error', response: err.toString() };
      }
   });
};
