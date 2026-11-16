import { ipcMain } from 'electron';

import { DatabaseClient, requireCapability } from '../libs/db/core/contracts';
import { createHandle, IpcMainLike } from './handle';

export default (connections: Record<string, DatabaseClient>, ipc: IpcMainLike = ipcMain) => {
   const handle = createHandle(ipc);

   handle('get-view-informations', async (params) => {
      return await connections[params.uid].getViewInformations(params);
   });

   handle('drop-view', async (params) => {
      await connections[params.uid].dropView(params);
   });

   handle('alter-view', async (params) => {
      await connections[params.uid].alterView(params);
   });

   handle('create-view', async (params) => {
      await connections[params.uid].createView(params);
   });

   handle('get-materialized-view-informations', async (params) => {
      return await requireCapability(connections[params.uid], 'materializedViews').getMaterializedViewInformations(params);
   });

   handle('drop-materialized-view', async (params) => {
      await requireCapability(connections[params.uid], 'materializedViews').dropMaterializedView(params);
   });

   handle('alter-materialized-view', async (params) => {
      await requireCapability(connections[params.uid], 'materializedViews').alterMaterializedView(params);
   });

   handle('create-materialized-view', async (params) => {
      await requireCapability(connections[params.uid], 'materializedViews').createMaterializedView(params);
   });
};
