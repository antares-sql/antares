import { ipcMain } from 'electron';

import { DatabaseClient, requireCapability } from '../libs/db/core/contracts';
import { validateSender } from '../libs/misc/validateSender';
import { createHandle, IpcMainLike } from './handle';

export default (connections: Record<string, DatabaseClient>, ipc: IpcMainLike = ipcMain) => {
   const handle = createHandle(ipc);

   // Users for the definer selects
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

   // Users management
   handle('get-users-management-info', async (uid) => {
      return await requireCapability(connections[uid], 'users').getUsersManagementInfo();
   });

   handle('get-users-list', async (uid) => {
      return await requireCapability(connections[uid], 'users').getUsersList();
   });

   handle('get-user-details', async ({ uid, user }) => {
      return await requireCapability(connections[uid], 'users').getUserDetails(user);
   });

   handle('create-user', async ({ uid, ...params }) => {
      await requireCapability(connections[uid], 'users').createUser(params);
   });

   handle('alter-user', async ({ uid, ...params }) => {
      await requireCapability(connections[uid], 'users').alterUser(params);
   });

   handle('drop-user', async ({ uid, user }) => {
      await requireCapability(connections[uid], 'users').dropUser(user);
   });
};
