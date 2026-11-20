import { ipcMain } from 'electron';

import { DatabaseClient, requireCapability } from '../libs/db/core/contracts';
import { createHandle, IpcMainLike } from './handle';

export default (connections: Record<string, DatabaseClient>, ipc: IpcMainLike = ipcMain) => {
   const handle = createHandle(ipc);

   handle('get-user-type-informations', async (params) => {
      return await requireCapability(connections[params.uid], 'userTypes').getUserTypeInformations(params);
   });

   handle('create-user-type', async (params) => {
      await requireCapability(connections[params.uid], 'userTypes').createUserType(params.userType);
   });

   handle('alter-user-type', async (params) => {
      await requireCapability(connections[params.uid], 'userTypes').alterUserType(params);
   });

   handle('drop-user-type', async (params) => {
      await requireCapability(connections[params.uid], 'userTypes').dropUserType(params);
   });
};
