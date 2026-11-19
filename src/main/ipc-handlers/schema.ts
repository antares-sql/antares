import * as workers from 'common/interfaces/workers';
import { dialog, ipcMain } from 'electron';
import * as fs from 'fs';
import { Worker } from 'worker_threads';

import { DatabaseClient, requireCapability } from '../libs/db/core/contracts';
import { validateSender } from '../libs/misc/validateSender';
import { createHandle, IpcMainLike } from './handle';

export default (connections: Record<string, DatabaseClient>, ipc: IpcMainLike = ipcMain) => {
   const handle = createHandle(ipc);

   let exporter: Worker = null;
   let importer: Worker = null;

   handle('create-schema', async (params) => {
      await requireCapability(connections[params.uid], 'schemas').createSchema(params);
   });

   handle('update-schema', async (params) => {
      await requireCapability(connections[params.uid], 'schemas').alterSchema(params);
   });

   handle('delete-schema', async (params) => {
      await requireCapability(connections[params.uid], 'schemas').dropSchema(params);
   });

   ipc.handle('get-schema-collation', async (event, params) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         const collation = await requireCapability(connections[params.uid], 'databaseCollation').getDatabaseCollation(
            params
         );

         return {
            status: 'success',
            response: collation
         };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   handle('get-structure', async (params) => {
      const structure: unknown = await connections[params.uid].getStructure(
         params.schemas
      );

      return structure;
   });

   handle('get-collations', async (uid) => {
      const result = await connections[uid].getCollations();

      return result;
   });

   handle('get-variables', async (uid) => {
      const result = await connections[uid].getVariables();

      return result;
   });

   handle('get-engines', async (uid) => {
      const result: unknown = await connections[uid].getEngines();

      return result;
   });

   handle('get-version', async (uid) => {
      const result = await connections[uid].getVersion();

      return result;
   });

   handle('get-processes', async (uid) => {
      const result = await connections[uid].getProcesses();

      return result;
   });

   handle('kill-process', async ({ uid, pid }) => {
      const result = await connections[uid].killProcess(pid);

      return result;
   });

   ipc.handle('use-schema', async (event, { uid, schema }) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      if (!schema) return;

      try {
         await connections[uid].use(schema);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipc.handle('raw-query', async (event, { uid, query, schema, tabUid, autocommit }) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      if (!query) return;

      try {
         const result = await connections[uid].raw(query, {
            nest: true,
            details: true,
            comments: false,
            schema,
            tabUid,
            autocommit
         });

         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipc.handle('export', (event, { uid, type, tables, ...rest }) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      if (exporter !== null)
         return { status: 'error', response: 'An export is already running' };

      return new Promise((resolve/*, reject */) => {
         (async () => {
            if (fs.existsSync(rest.outputFile)) { // If file exists ask for replace
               const result = await dialog.showMessageBox({
                  type: 'warning',
                  message: `File ${rest.outputFile} already exists. Do you want to replace it?`,
                  detail: 'A file with the same name already exists in the target folder. Replacing it will overwrite its current contents.',
                  buttons: ['Cancel', 'Replace'],
                  defaultId: 0,
                  cancelId: 0
               });

               if (result.response !== 1) {
                  resolve({
                     type: 'error',
                     response: 'Operation aborted'
                  });
                  return;
               }
            }

            // Init exporter thread
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const worker: Worker = new Worker(new URL('../workers/exporter', import.meta.url));
            exporter = worker;
            // Events of this worker must not touch a newer one started in the meantime
            const release = () => {
               if (exporter === worker) exporter = null;
            };

            worker.postMessage({
               type: 'init',
               client: {
                  name: type,
                  config: await requireCapability(connections[uid], 'dbConfig').getDbConfig()
               },
               tables,
               options: rest
            });

            // Exporter message listener
            worker.on('message', (message: workers.WorkerIpcMessage) => {
               const { type, payload } = message;

               switch (type) {
                  case 'export-progress':
                     event.sender.send('export-progress', payload);
                     break;
                  case 'end':
                     // The worker closes its connection and exits: terminate it only if it hangs
                     release();
                     setTimeout(() => worker.terminate(), 10000).unref();
                     resolve({ status: 'success', response: payload });
                     break;
                  case 'cancel':
                     release();
                     worker.terminate();
                     resolve({ status: 'error', response: 'Operation cancelled' });
                     break;
                  case 'error':
                     release();
                     worker.terminate();
                     resolve({ status: 'error', response: payload });
                     break;
               }
            });

            // An uncaught error or a crash (e.g. out of memory) of the thread: without these the UI waits forever
            worker.on('error', err => {
               release();
               resolve({ status: 'error', response: err.toString() });
            });

            worker.on('exit', code => {
               release();
               resolve({ status: 'error', response: `Operation ended with code: ${code}` });
            });
         })();
      });
   });

   ipc.handle('abort-export', async (event) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      let willAbort = false;

      if (exporter) {
         const result = await dialog.showMessageBox({
            type: 'warning',
            message: 'Are you sure you want to abort the export',
            buttons: ['Cancel', 'Abort'],
            defaultId: 0,
            cancelId: 0
         });

         if (result.response === 1) {
            willAbort = true;
            exporter.postMessage({ type: 'cancel' });
         }
      }

      return { status: 'success', response: { willAbort } };
   });

   ipc.handle('import-sql', async (event, options) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      if (importer !== null)
         return { status: 'error', response: 'An import is already running' };

      return new Promise((resolve/*, reject */) => {
         (async () => {
            const dbConfig = await requireCapability(connections[options.uid], 'dbConfig').getDbConfig();

            // Init importer thread
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const worker: Worker = new Worker(new URL('../workers/importer', import.meta.url));
            importer = worker;
            // Events of this worker must not touch a newer one started in the meantime
            const release = () => {
               if (importer === worker) importer = null;
            };

            worker.postMessage({
               type: 'init',
               dbConfig,
               options
            });

            // Importer message listener
            worker.on('message', (message: workers.WorkerIpcMessage) => {
               const { type, payload } = message;

               switch (type) {
                  case 'import-progress':
                     event.sender.send('import-progress', payload);
                     break;
                  case 'query-error':
                     event.sender.send('query-error', payload);
                     break;
                  case 'end':
                     // The worker closes its connection and exits: terminate it only if it hangs
                     release();
                     setTimeout(() => worker.terminate(), 10000).unref();
                     resolve({ status: 'success', response: payload });
                     break;
                  case 'cancel':
                     release();
                     worker.terminate();
                     resolve({ status: 'error', response: 'Operation cancelled' });
                     break;
                  case 'error':
                     release();
                     worker.terminate();
                     resolve({ status: 'error', response: payload });
                     break;
               }
            });

            // An uncaught error or a crash (e.g. out of memory) of the thread: without these the UI waits forever
            worker.on('error', err => {
               release();
               resolve({ status: 'error', response: err.toString() });
            });

            worker.on('exit', code => {
               release();
               resolve({ status: 'error', response: `Operation ended with code: ${code}` });
            });
         })();
      });
   });

   ipc.handle('abort-import-sql', async (event) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      let willAbort = false;

      if (importer) {
         const result = await dialog.showMessageBox({
            type: 'warning',
            message: 'Are you sure you want to abort the import',
            buttons: ['Cancel', 'Abort'],
            defaultId: 0,
            cancelId: 0
         });

         if (result.response === 1) {
            willAbort = true;
            importer.postMessage({ type: 'cancel' });
         }
      }

      return { status: 'success', response: { willAbort } };
   });

   ipc.handle('kill-tab-query', async (event, { uid, tabUid }) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      if (!tabUid) return;

      try {
         await requireCapability(connections[uid], 'cancelQueries').killTabQuery(tabUid);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipc.handle('commit-tab', async (event, { uid, tabUid }) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      if (!tabUid) return;

      try {
         await connections[uid].commitTab(tabUid);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipc.handle('rollback-tab', async (event, { uid, tabUid }) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      if (!tabUid) return;

      try {
         await connections[uid].rollbackTab(tabUid);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipc.handle('destroy-connection-to-commit', async (event, { uid, tabUid }) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      if (!tabUid) return;

      try {
         await connections[uid].destroyConnectionToCommit(tabUid);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });
};
