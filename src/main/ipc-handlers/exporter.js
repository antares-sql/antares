
import { ipcMain } from 'electron';

export default (connectionParams) => {
   ipcMain.handle('get-connection-params', async (event, params) => {
      try {
         const result = await connectionParams[params.uid];

         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });
}
