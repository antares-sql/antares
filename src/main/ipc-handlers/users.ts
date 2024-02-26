import * as antares from 'common/interfaces/antares';
import { ipcMain } from 'electron';

import { validateSender } from '../libs/misc/validateSender';

export default (connections: Record<string, antares.Client>) => {
   ipcMain.handle('get-users', async (event, uid) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

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
