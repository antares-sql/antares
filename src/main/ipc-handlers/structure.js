import { ipcMain } from 'electron';
import InformationSchema from '../models/InformationSchema';
import Generic from '../models/Generic';

// TODO: remap objects based on client

export default (connections) => {
   ipcMain.handle('getTableColumns', async (event, { uid, schema, table }) => {
      try {
         const result = await InformationSchema.getTableColumns(connections[uid], schema, table);
         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('getTableData', async (event, { uid, schema, table }) => {
      try {
         const result = await Generic.getTableData(connections[uid], schema, table);
         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });
};
