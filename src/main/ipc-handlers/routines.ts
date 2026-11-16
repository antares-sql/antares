import { ipcMain } from 'electron';

import { DatabaseClient, requireCapability } from '../libs/db/core/contracts';
import { validateSender } from '../libs/misc/validateSender';

export default (connections: Record<string, DatabaseClient>) => {
   ipcMain.handle('get-routine-informations', async (event, params) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         const result = await requireCapability(connections[params.uid], 'routines').getRoutineInformations(params);
         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('drop-routine', async (event, params) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         await requireCapability(connections[params.uid], 'routines').dropRoutine(params);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('alter-routine', async (event, params) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         await requireCapability(connections[params.uid], 'routines').alterRoutine(params);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('create-routine', async (event, params) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         await requireCapability(connections[params.uid], 'routines').createRoutine(params);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });
};
