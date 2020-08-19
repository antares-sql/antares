
import { ipcMain } from 'electron';
import { AntaresConnector } from '../libs/AntaresConnector';
import InformationSchema from '../models/InformationSchema';
import Generic from '../models/Generic';

export default connections => {
   ipcMain.handle('test-connection', async (event, conn) => {
      const Connection = new AntaresConnector({
         client: conn.client,
         params: {
            host: conn.host,
            port: +conn.port,
            user: conn.user,
            password: conn.password
         }
      });

      await Connection.connect();

      try {
         await InformationSchema.testConnection(Connection);

         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err };
      }
   });

   ipcMain.handle('check-connection', async (event, uid) => {
      return uid in connections;
   });

   ipcMain.handle('connect', async (event, conn) => {
      const Connection = new AntaresConnector({
         client: conn.client,
         params: {
            host: conn.host,
            port: +conn.port,
            user: conn.user,
            password: conn.password
         },
         poolSize: 3
      });

      try {
         await Connection.connect();

         const { rows: structure } = await InformationSchema.getStructure(Connection);
         connections[conn.uid] = Connection;
         return { status: 'success', response: structure };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('disconnect', (event, uid) => {
      connections[uid].destroy();
      delete connections[uid];
   });

   ipcMain.handle('refresh', async (event, uid) => {
      try {
         const { rows: structure } = await InformationSchema.getStructure(connections[uid]);
         return { status: 'success', response: structure };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('raw-query', async (event, { uid, query, schema }) => {
      if (!query) return;
      try {
         const result = await Generic.raw(connections[uid], query, schema);
         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });
};
