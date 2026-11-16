import * as antares from 'common/interfaces/antares';
import { ipcMain } from 'electron';

import { buildClientParams } from '../libs/db/core/connectionParams';
import { DatabaseClient } from '../libs/db/core/contracts';
import { createClient } from '../libs/db/EngineRegistry';
import { validateSender } from '../libs/misc/validateSender';
import { IpcMainLike } from './handle';
const isAborting: Record<string, boolean> = {};

export default (connections: Record<string, DatabaseClient>, ipc: IpcMainLike = ipcMain) => {
   ipc.handle('test-connection', async (event, conn: antares.ConnectionParams) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      let isLocalAborted = false;
      const abortChecker = setInterval(() => { // Intercepts abort request
         if (isAborting[conn.uid]) {
            isAborting[conn.uid] = false;
            isLocalAborted = true;
            clearInterval(abortChecker);
         }
      }, 50);

      try {
         const params = buildClientParams(conn);

         const connection = await createClient({
            uid: conn.uid,
            client: conn.client,
            params
         });

         await connection.connect();
         if (isLocalAborted) {
            connection.destroy();
            return;
         }

         await connection.ping();

         connection.destroy();
         clearInterval(abortChecker);

         return { status: 'success' };
      }
      catch (error) {
         clearInterval(abortChecker);
         if (error instanceof AggregateError)
            throw new Error(error.errors.reduce((acc, curr) => acc +' | '+ curr.message, ''));
         else if (!isLocalAborted)
            return { status: 'error', response: error.toString() };
         else
            return { status: 'abort', response: 'Connection aborted' };
      }
   });

   ipc.handle('check-connection', async (event, uid) => {
      return uid in connections;
   });

   ipc.handle('connect', async (event, conn: antares.ConnectionParams) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      let isLocalAborted = false;
      const abortChecker = setInterval(() => { // Intercepts abort request
         if (isAborting[conn.uid]) {
            isAborting[conn.uid] = false;
            isLocalAborted = true;
            clearInterval(abortChecker);
         }
      }, 50);

      try {
         const params = buildClientParams(conn);

         const connection = createClient({
            uid: conn.uid,
            client: conn.client,
            params,
            poolSize: conn.singleConnectionMode ? 0 : 5
         });

         await connection.connect();
         if (isLocalAborted) {
            connection.destroy();
            return { status: 'abort', response: 'Connection aborted' };
         }

         const structure = await connection.getStructure(new Set());
         if (isLocalAborted) {
            connection.destroy();
            return { status: 'abort', response: 'Connection aborted' };
         }

         connections[conn.uid] = connection;
         clearInterval(abortChecker);

         return { status: 'success', response: structure };
      }
      catch (err) {
         clearInterval(abortChecker);

         if (!isLocalAborted)
            return { status: 'error', response: err.toString() };
         else
            return { status: 'abort', response: 'Connection aborted' };
      }
   });

   ipc.on('abort-connection', (event, uid) => {
      isAborting[uid] = true;
   });

   ipc.handle('disconnect', (event, uid) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      connections[uid].destroy();
      delete connections[uid];
   });
};
