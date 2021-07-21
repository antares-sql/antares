
import { ipcMain } from 'electron';

export default connections => {
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
         const collation = await connections[params.uid].getDatabaseCollation(params);

         return { status: 'success', response: collation.rows.length ? collation.rows[0].DEFAULT_COLLATION_NAME : '' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('get-structure', async (event, params) => {
      try {
         const structure = await connections[params.uid].getStructure(params.schemas);

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
};
