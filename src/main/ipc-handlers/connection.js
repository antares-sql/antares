
import { ipcMain } from 'electron';
import knex from 'knex';
import InformationSchema from '../models/InformationSchema';

const connections = {};

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

   ipcMain.handle('checkConnection', async (event, uid) => {
      return uid in connections;
   });

   ipcMain.handle('connect', async (event, conn) => {
      let structure;
      const connection = knex({
         client: conn.client,
         connection: {
            host: conn.host,
            port: +conn.port,
            user: conn.user,
            password: conn.password
         },
         pool: {
            min: 1,
            max: 3
         }
      });

      try {
         structure = await InformationSchema.getStructure(connection);
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }

      connections[conn.uid] = connection;
      return { status: 'success', response: structure };
   });
};
