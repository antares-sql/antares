import { ipcMain } from 'electron';
import InformationSchema from '../models/InformationSchema';
import Tables from '../models/Tables';

// TODO: remap objects based on client

export default (connections) => {
   ipcMain.handle('getTableColumns', async (event, { uid, schema, table }) => {
      try {
         const result = await InformationSchema.getTableColumns(connections[uid], schema, table);// TODO: uniform column properties
         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('getTableData', async (event, { uid, schema, table }) => {
      try {
         const result = await Tables.getTableData(connections[uid], schema, table);
         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('get-key-usage', async (event, { uid, schema, table }) => {
      try {
         const result = await InformationSchema.getKeyUsage(connections[uid], schema, table);
         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('updateTableCell', async (event, params) => {
      try {
         const result = await Tables.updateTableCell(connections[params.uid], params);
         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('deleteTableRows', async (event, params) => {
      try {
         const result = await Tables.deleteTableRows(connections[params.uid], params);
         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('insertTableRows', async (event, params) => {
      try {
         await Tables.insertTableRows(connections[params.uid], params);
         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('get-foreign-list', async (event, params) => {
      try {
         const results = await Tables.getForeignList(connections[params.uid], params);
         return { status: 'success', response: results };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });
};
