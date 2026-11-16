import { ipcMain } from 'electron';

import { DatabaseClient, requireCapability } from '../libs/db/core/contracts';
import { createHandle, IpcMainLike } from './handle';

export default (connections: Record<string, DatabaseClient>, ipc: IpcMainLike = ipcMain) => {
   const handle = createHandle(ipc);

   handle('get-trigger-informations', async (params) => {
      return await connections[params.uid].getTriggerInformations(params);
   });

   handle('drop-trigger', async (params) => {
      await connections[params.uid].dropTrigger(params);
   });

   handle('alter-trigger', async (params) => {
      await connections[params.uid].alterTrigger(params);
   });

   handle('create-trigger', async (params) => {
      await connections[params.uid].createTrigger(params);
   });

   handle('toggle-trigger', async (params) => {
      if (!params.enabled)
         await requireCapability(connections[params.uid], 'triggerToggle').enableTrigger(params);
      else
         await requireCapability(connections[params.uid], 'triggerToggle').disableTrigger(params);
   });
};
