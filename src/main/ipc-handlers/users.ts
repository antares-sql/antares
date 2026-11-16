import { ipcMain } from 'electron';

import { DatabaseClient } from '../libs/db/core/contracts';
import { validateSender } from '../libs/misc/validateSender';
import { IpcMainLike } from './handle';

export default (connections: Record<string, DatabaseClient>, ipc: IpcMainLike = ipcMain) => {
   ipc.handle('get-users', async (event, uid) => {
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
