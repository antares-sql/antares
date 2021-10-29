import { ipcMain, dialog, Notification } from 'electron';
import path from 'path';
import fs from 'fs';

import MysqlExporter from '../libs/exporters/sql/MysqlExporter';

export default connections => {
   let exporter = null;

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

   ipcMain.handle('raw-query', async (event, { uid, query, schema }) => {
      if (!query) return;

      try {
         const result = await connections[uid].raw(query, {
            nest: true,
            details: true,
            schema,
            comments: false
         });

         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('export', async (event, { uid, ...rest }) => {
      if (exporter !== null) return;

      const type = connections[uid]._client;

      switch (type) {
         case 'mysql':
            exporter = new MysqlExporter(connections[uid], rest);
            break;
         default:
            return {
               status: 'error',
               response: `${type} exporter not aviable`
            };
      }

      const outputFileName = path.basename(rest.outputFile);

      if (fs.existsSync(rest.outputFile)) {
         const result = await dialog.showMessageBox({
            type: 'warning',
            message: `File ${outputFileName} already exists. Do you want to replace it?`,
            detail:
               'A file with the same name already exists in the target folder. Replacing it will overwrite its current contents.',
            buttons: ['Cancel', 'Replace'],
            defaultId: 0,
            cancelId: 0
         });

         if (result.response !== 1) {
            exporter = null;
            return { status: 'error', response: 'Operation aborted' };
         }
      }

      return new Promise((resolve, reject) => {
         exporter.once('error', err => {
            reject(err);
         });

         exporter.once('end', () => {
            resolve({ cancelled: exporter.isCancelled });
         });

         exporter.on('progress', state => {
            event.sender.send('export-progress', state);
         });

         exporter.run();
      })
         .then(response => {
            if (!response.cancelled) {
               new Notification({
                  title: 'Export finished',
                  body: `Finished exporting to ${outputFileName}`
               }).show();
            }
            return { status: 'success', response };
         })
         .catch(err => {
            new Notification({
               title: 'Export error',
               body: err.toString()
            }).show();

            return { status: 'error', response: err.toString() };
         })
         .finally(() => {
            exporter.removeAllListeners();
            exporter = null;
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
            exporter.cancel();
         }
      }

      return { status: 'success', response: { willAbort } };
   });
};
