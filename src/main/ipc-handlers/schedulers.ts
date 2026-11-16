import { ipcMain } from 'electron';

import { DatabaseClient, requireCapability } from '../libs/db/core/contracts';
import { createHandle, IpcMainLike } from './handle';

export default (connections: Record<string, DatabaseClient>, ipc: IpcMainLike = ipcMain) => {
   const handle = createHandle(ipc);

   handle('get-scheduler-informations', async (params) => {
      return await requireCapability(connections[params.uid], 'schedulers').getEventInformations(params);
   });

   handle('drop-scheduler', async (params) => {
      await requireCapability(connections[params.uid], 'schedulers').dropEvent(params);
   });

   handle('alter-scheduler', async (params) => {
      await requireCapability(connections[params.uid], 'schedulers').alterEvent(params);
   });

   handle('create-scheduler', async (params) => {
      await requireCapability(connections[params.uid], 'schedulers').createEvent(params);
   });

   handle('toggle-scheduler', async (params) => {
      if (!params.enabled)
         await requireCapability(connections[params.uid], 'schedulers').enableEvent({ ...params });
      else
         await requireCapability(connections[params.uid], 'schedulers').disableEvent({ ...params });
   });
};
