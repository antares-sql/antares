import { ChildProcess, ChildProcessWithoutNullStreams, fork } from 'child_process';
import * as antares from 'common/interfaces/antares';
import * as workers from 'common/interfaces/workers';
import { dialog, ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

import { validateSender } from '../libs/misc/validateSender';

const isDevelopment = process.env.NODE_ENV !== 'production';
const isFlatpak = process.platform === 'linux' && process.env.FLATPAK_ID;

export default (connections: {[key: string]: antares.Client}) => {
   let exporter: ChildProcessWithoutNullStreams = null;
   let importer: ChildProcess = null;

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
         exporter.kill();
         return;
      }

      return new Promise((resolve/*, reject */) => {
         (async () => {
            if (isFlatpak) {
               resolve({ status: 'error', response: 'Temporarily unavailable on Flatpak' });
               return;
            }

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

            // Init exporter process
            exporter = fork(isDevelopment ? './dist/exporter.js' : './exporter.js', [], {
               execArgv: isDevelopment ? ['--inspect=9224'] : undefined
            });

            exporter.send({
               type: 'init',
               client: {
                  name: type,
                  config: await connections[uid].getDbConfig()
               },
               tables,
               options: rest
            });

            // Exporter message listener
            exporter.on('message', ({ type, payload }: workers.WorkerIpcMessage) => {
               switch (type) {
                  case 'export-progress':
                     event.sender.send('export-progress', payload);
                     break;
                  case 'end':
                     setTimeout(() => { // Ensures that writing process has finished
                        exporter.kill();
                        exporter = null;
                     }, 2000);
                     resolve({ status: 'success', response: payload });
                     break;
                  case 'cancel':
                     exporter.kill();
                     exporter = null;
                     resolve({ status: 'error', response: 'Operation cancelled' });
                     break;
                  case 'error':
                     exporter.kill();
                     exporter = null;
                     resolve({ status: 'error', response: payload });
                     break;
               }
            });

            exporter.on('exit', code => {
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
            exporter.send({ type: 'cancel' });
         }
      }

      return { status: 'success', response: { willAbort } };
   });

   ipcMain.handle('import-sql', async (event, options) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      if (importer !== null) {
         importer.kill();
         return;
      }

      return new Promise((resolve/*, reject */) => {
         (async () => {
            if (isFlatpak) {
               resolve({ status: 'warning', response: 'Temporarily unavailable on Flatpak' });
               return;
            }

            const dbConfig = await connections[options.uid].getDbConfig();

            // Init importer process
            importer = fork(isDevelopment ? './dist/importer.js' : path.resolve(__dirname, './importer.js'), [], {
               execArgv: isDevelopment ? ['--inspect=9224'] : undefined
            });

            importer.send({
               type: 'init',
               dbConfig,
               options
            });

            // Importer message listener
            importer.on('message', ({ type, payload }: workers.WorkerIpcMessage) => {
               switch (type) {
                  case 'import-progress':
                     event.sender.send('import-progress', payload);
                     break;
                  case 'query-error':
                     event.sender.send('query-error', payload);
                     break;
                  case 'end':
                     setTimeout(() => { // Ensures that writing process has finished
                        importer?.kill();
                        importer = null;
                     }, 2000);
                     resolve({ status: 'success', response: payload });
                     break;
                  case 'cancel':
                     importer.kill();
                     importer = null;
                     resolve({ status: 'error', response: 'Operation cancelled' });
                     break;
                  case 'error':
                     importer.kill();
                     importer = null;
                     resolve({ status: 'error', response: payload });
                     break;
               }
            });

            importer.on('exit', code => {
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
            importer.send({ type: 'cancel' });
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
