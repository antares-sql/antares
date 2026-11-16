import { ipcMain } from 'electron';

import { DatabaseClient, requireCapability } from '../libs/db/core/contracts';
import { validateSender } from '../libs/misc/validateSender';

export default (connections: Record<string, DatabaseClient>) => {
   ipcMain.handle('get-scheduler-informations', async (event, params) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         const result = await requireCapability(connections[params.uid], 'schedulers').getEventInformations(params);
         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('drop-scheduler', async (event, params) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         await requireCapability(connections[params.uid], 'schedulers').dropEvent(params);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('alter-scheduler', async (event, params) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         await requireCapability(connections[params.uid], 'schedulers').alterEvent(params);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('create-scheduler', async (event, params) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         await requireCapability(connections[params.uid], 'schedulers').createEvent(params);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('toggle-scheduler', async (event, params) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         if (!params.enabled)
            await requireCapability(connections[params.uid], 'schedulers').enableEvent({ ...params });
         else
            await requireCapability(connections[params.uid], 'schedulers').disableEvent({ ...params });
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });
};
