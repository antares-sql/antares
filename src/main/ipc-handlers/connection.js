
import { ipcMain } from 'electron';
import { ClientsFactory } from '../libs/ClientsFactory';

export default connections => {
   ipcMain.handle('test-connection', async (event, conn) => {
      const connection = ClientsFactory.getConnection({
         client: conn.client,
         params: {
            host: conn.host,
            port: +conn.port,
            user: conn.user,
            password: conn.password
         }
      });

      await connection.connect();

      try {
         await connection.select('1+1').run();
         connection.destroy();

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
      const connection = ClientsFactory.getConnection({
         client: conn.client,
         params: {
            host: conn.host,
            port: +conn.port,
            user: conn.user,
            password: conn.password
         },
         poolSize: 1
      });

      try {
         await connection.connect();

         const structure = await connection.getStructure(new Set());

         connections[conn.uid] = connection;

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
};
