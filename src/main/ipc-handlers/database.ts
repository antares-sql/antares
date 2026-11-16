import { ipcMain } from 'electron';

import { DatabaseClient, requireCapability } from '../libs/db/core/contracts';
import { validateSender } from '../libs/misc/validateSender';

export default (connections: Record<string, DatabaseClient>) => {
   ipcMain.handle('get-databases', async (event, uid) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         const result = await requireCapability(connections[uid], 'databases').getDatabases();
         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });
};
