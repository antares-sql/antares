import { ipcMain } from 'electron';

import { DatabaseClient, requireCapability } from '../libs/db/core/contracts';
import { createHandle, IpcMainLike } from './handle';

export default (connections: Record<string, DatabaseClient>, ipc: IpcMainLike = ipcMain) => {
   const handle = createHandle(ipc);

   handle('get-routine-informations', async (params) => {
      return await requireCapability(connections[params.uid], 'routines').getRoutineInformations(params);
   });

   handle('drop-routine', async (params) => {
      await requireCapability(connections[params.uid], 'routines').dropRoutine(params);
   });

   handle('alter-routine', async (params) => {
      await requireCapability(connections[params.uid], 'routines').alterRoutine(params);
   });

   handle('create-routine', async (params) => {
      await requireCapability(connections[params.uid], 'routines').createRoutine(params);
   });
};
