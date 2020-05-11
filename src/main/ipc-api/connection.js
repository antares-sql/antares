
import { ipcMain } from 'electron';
import knex from 'knex';

export default () => {
   ipcMain.handle('testConnection', async (event, conn) => {
      try {
         await knex({
            client: conn.client,
            connection: {
               host: conn.host,
               port: +conn.port,
               user: conn.user,
               password: conn.password
            }
         }).raw('SELECT 1+1 AS result');

         return { status: 'success' };
      }
      catch (err) {
         return { status: 'error', response: err };
      }
   });
};
