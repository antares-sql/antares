import { ipcMain } from 'electron';

import { DatabaseClient, requireCapability } from '../libs/db/core/contracts';
import { createHandle, IpcMainLike } from './handle';

export default (connections: Record<string, DatabaseClient>, ipc: IpcMainLike = ipcMain) => {
   const handle = createHandle(ipc);

   handle('get-function-informations', async (params) => {
      return await requireCapability(connections[params.uid], 'functions').getFunctionInformations(params);
   });

   handle('drop-function', async (params) => {
      await requireCapability(connections[params.uid], 'functions').dropFunction(params);
   });

   handle('alter-function', async (params) => {
      await requireCapability(connections[params.uid], 'functions').alterFunction(params);
   });

   handle('alter-trigger-function', async (params) => {
      await requireCapability(connections[params.uid], 'triggerFunctions').alterTriggerFunction(params);
   });

   handle('create-function', async (params) => {
      await requireCapability(connections[params.uid], 'functions').createFunction(params);
   });

   handle('create-trigger-function', async (params) => {
      await requireCapability(connections[params.uid], 'triggerFunctions').createTriggerFunction(params);
   });
};
