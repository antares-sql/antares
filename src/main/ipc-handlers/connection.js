
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
         poolSize: 3
      });

      try {
         await connection.connect();

         const { rows: structure } = await connection
            .select('*')
            .schema('information_schema')
            .from('TABLES')
            .orderBy({ TABLE_SCHEMA: 'ASC', TABLE_NAME: 'ASC' })
            .run();

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

   ipcMain.handle('get-structure', async (event, uid) => {
      try {
         const { rows: structure } = await connections[uid]
            .select('*')
            .schema('information_schema')
            .from('TABLES')
            .orderBy({ TABLE_SCHEMA: 'ASC', TABLE_NAME: 'ASC' })
            .run();

         return { status: 'success', response: structure };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.handle('raw-query', async (event, { uid, query, schema }) => {
      if (!query) return;

      try {
         if (schema)
            await connections[uid].use(schema);

         const result = await connections[uid].raw(query, true);

         return { status: 'success', response: result };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });
};
