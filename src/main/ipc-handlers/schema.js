import fs from 'fs';
import path from 'path';
import { fork } from 'child_process';
import { ipcMain, dialog, Notification } from 'electron';

// @TODO:  need some factories
import MysqlImporter from '../libs/importers/sql/MysqlImporter';
const isDevelopment = process.env.NODE_ENV !== 'production';

export default connections => {
   let exporter = null;
   let importer = null;

   ipcMain.handle('create-schema', async (event, params) => {
      try {
         await connections[params.uid].createSchema(params);

         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('update-schema', async (event, params) => {
      try {
         await connections[params.uid].alterSchema(params);

         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('delete-schema', async (event, params) => {
      try {
         await connections[params.uid].dropSchema(params);

         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('get-schema-collation', async (event, params) => {
      try {
         const collation = await connections[params.uid].getDatabaseCollation(
            params
         );

         return {
            status: 'success',
            response: collation.rows.length
               ? collation.rows[0].DEFAULT_COLLATION_NAME
               : ''
         };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('get-structure', async (event, params) => {
      try {
         const structure = await connections[params.uid].getStructure(
            params.schemas
         );

         return { status: 'success', response: structure };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('get-collations', async (event, uid) => {
      try {
         const result = await connections[uid].getCollations();

         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('get-variables', async (event, uid) => {
      try {
         const result = await connections[uid].getVariables();

         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('get-engines', async (event, uid) => {
      try {
         const result = await connections[uid].getEngines();

         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('get-version', async (event, uid) => {
      try {
         const result = await connections[uid].getVersion();

         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('get-processes', async (event, uid) => {
      try {
         const result = await connections[uid].getProcesses();

         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('kill-process', async (event, { uid, pid }) => {
      try {
         const result = await connections[uid].killProcess(pid);

         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('use-schema', async (event, { uid, schema }) => {
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
      if (!query) return;

      try {
         const result = await connections[uid].raw(query, {
            nest: true,
            details: true,
            schema,
            tabUid,
            autocommit,
            comments: false
         });

         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('export', (event, { uid, type, tables, ...rest }) => {
      if (exporter !== null) return;

      return new Promise((resolve, reject) => {
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

            // Init exporter process
            exporter = fork(isDevelopment ? './dist/exporter.js' : path.resolve(__dirname, './exporter.js'));
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
            exporter.on('message', ({ type, payload }) => {
               switch (type) {
                  case 'export-progress':
                     event.sender.send('export-progress', payload);
                     break;
                  case 'end':
                     exporter.kill();
                     exporter = null;
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

   ipcMain.handle('abort-export', async event => {
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
      if (importer !== null) return;

      switch (options.type) {
         case 'mysql':
         case 'maria':
            importer = new MysqlImporter(connections[options.uid], options);
            break;
         default:
            return {
               status: 'error',
               response: `${type} importer not aviable`
            };
      }

      return new Promise((resolve, reject) => {
         importer.once('error', err => {
            reject(err);
         });

         importer.once('end', () => {
            resolve({ cancelled: importer.isCancelled });
         });

         importer.on('progress', state => {
            event.sender.send('import-progress', state);
         });

         importer.run();
      })
         .then(response => {
            if (!response.cancelled) {
               new Notification({
                  title: 'Import finished',
                  body: `Finished importing ${path.basename(options.file)}`
               }).show();
            }
            return { status: 'success', response };
         })
         .catch(err => {
            new Notification({
               title: 'Import error',
               body: err.toString()
            }).show();

            return { status: 'error', response: err.toString() };
         })
         .finally(() => {
            importer.removeAllListeners();
            importer = null;
         });
   });

   ipcMain.handle('abort-import-sql', async event => {
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
            importer.cancel();
         }
      }

      return { status: 'success', response: { willAbort } };
   });
   ipcMain.handle('kill-tab-query', async (event, { uid, tabUid }) => {
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
