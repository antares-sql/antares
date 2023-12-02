import * as antares from 'common/interfaces/antares';
import * as workers from 'common/interfaces/workers';
import { dialog, ipcMain } from 'electron';
import * as fs from 'fs';
import { Worker } from 'worker_threads';

import { validateSender } from '../libs/misc/validateSender';

export default (connections: {[key: string]: antares.Client}) => {
   let exporter: Worker = null;
   let importer: Worker = null;

   ipcMain.handle('create-schema', async (event, params) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         await connections[params.uid].createSchema(params);

         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('update-schema', async (event, params) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         await connections[params.uid].alterSchema(params);

         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('delete-schema', async (event, params) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         await connections[params.uid].dropSchema(params);

         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('get-schema-collation', async (event, params) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         const collation = await connections[params.uid].getDatabaseCollation(
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

   ipcMain.handle('get-structure', async (event, params) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         const structure: unknown = await connections[params.uid].getStructure(
            params.schemas
         );

         return { status: 'success', response: structure };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('get-collations', async (event, uid) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         const result = await connections[uid].getCollations();

         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('get-variables', async (event, uid) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         const result = await connections[uid].getVariables();

         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('get-engines', async (event, uid) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         const result: unknown = await connections[uid].getEngines();

         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('get-version', async (event, uid) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         const result = await connections[uid].getVersion();

         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('get-processes', async (event, uid) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         const result = await connections[uid].getProcesses();

         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('kill-process', async (event, { uid, pid }) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      try {
         const result = await connections[uid].killProcess(pid);

         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('use-schema', async (event, { uid, schema }) => {
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

   ipcMain.handle('raw-query', async (event, { uid, query, schema, tabUid, autocommit }) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      if (!query) return;

      try {
         const result = await connections[uid].raw(query, {
            nest: true,
            details: true,
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

   ipcMain.handle('export', (event, { uid, type, tables, ...rest }) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      if (exporter !== null) {
         exporter.terminate();
         return;
      }

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
            exporter = new Worker(new URL('../workers/exporter', import.meta.url));

            exporter.postMessage({
               type: 'init',
               client: {
                  name: type,
                  config: await connections[uid].getDbConfig()
               },
               tables,
               options: rest
            });

            // Exporter message listener
            exporter.stdout.on('data', (buff: Buffer) => {
               let message;
               try { // Ignore non-JSON data (console.log output)
                  message = JSON.parse(buff.toString());
               }
               catch (_) {
                  if (process.env.NODE_ENV === 'development') console.log('EXPORTER:', buff.toString());
                  return;
               }

               const { type, payload } = message as workers.WorkerIpcMessage;

               switch (type) {
                  case 'export-progress':
                     event.sender.send('export-progress', payload);
                     break;
                  case 'end':
                     setTimeout(() => { // Ensures that writing thread has finished
                        exporter?.terminate();
                        exporter = null;
                     }, 2000);
                     resolve({ status: 'success', response: payload });
                     break;
                  case 'cancel':
                     exporter?.terminate();
                     exporter = null;
                     resolve({ status: 'error', response: 'Operation cancelled' });
                     break;
                  case 'error':
                     exporter?.terminate();
                     exporter = null;
                     resolve({ status: 'error', response: payload });
                     break;
               }
            });

            exporter.on('close', code => {
               exporter = null;
               resolve({ status: 'error', response: `Operation ended with code: ${code}` });
            });
         })();
      });
   });

   ipcMain.handle('abort-export', async (event) => {
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

   ipcMain.handle('import-sql', async (event, options) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      if (importer !== null) {
         importer.terminate();
         return;
      }

      return new Promise((resolve/*, reject */) => {
         (async () => {
            const dbConfig = await connections[options.uid].getDbConfig();

            // Init importer thread
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            importer = new Worker(new URL('../workers/importer', import.meta.url));

            importer.postMessage({
               type: 'init',
               dbConfig,
               options
            });

            // Importer message listener
            importer.stdout.on('data', (buff: Buffer) => {
               let message;
               try { // Ignore non-JSON data (console.log output)
                  message = JSON.parse(buff.toString());
               }
               catch (_) {
                  if (process.env.NODE_ENV === 'development') console.log('IMPORTER:', buff.toString());
                  return;
               }

               const { type, payload } = message as workers.WorkerIpcMessage;

               switch (type) {
                  case 'import-progress':
                     event.sender.send('import-progress', payload);
                     break;
                  case 'query-error':
                     event.sender.send('query-error', payload);
                     break;
                  case 'end':
                     setTimeout(() => { // Ensures that writing process has finished
                        importer?.terminate();
                        importer = null;
                     }, 2000);
                     resolve({ status: 'success', response: payload });
                     break;
                  case 'cancel':
                     importer.terminate();
                     importer = null;
                     resolve({ status: 'error', response: 'Operation cancelled' });
                     break;
                  case 'error':
                     importer.terminate();
                     importer = null;
                     resolve({ status: 'error', response: payload });
                     break;
               }
            });

            importer.on('close', code => {
               importer = null;
               resolve({ status: 'error', response: `Operation ended with code: ${code}` });
            });
         })();
      });
   });

   ipcMain.handle('abort-import-sql', async (event) => {
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

   ipcMain.handle('kill-tab-query', async (event, { uid, tabUid }) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      if (!tabUid) return;

      try {
         await connections[uid].killTabQuery(tabUid);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('commit-tab', async (event, { uid, tabUid }) => {
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

   ipcMain.handle('rollback-tab', async (event, { uid, tabUid }) => {
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

   ipcMain.handle('destroy-connection-to-commit', async (event, { uid, tabUid }) => {
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
