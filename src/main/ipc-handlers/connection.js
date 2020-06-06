
import { ipcMain } from 'electron';
import knex from 'knex';
import InformationSchema from '../models/InformationSchema';
import { RawQuery } from '../models/RawQuery';

const connections = {};

export default () => {
   ipcMain.handle('testConnection', async (event, conn) => {
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
         await InformationSchema.testConnection(connection);

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
         const structure = await InformationSchema.getStructure(connection);
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

   ipcMain.handle('refresh', async (event, uid) => {
      try {
         const structure = await InformationSchema.getStructure(connections[uid]);
         return { status: 'success', response: structure };
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });

   ipcMain.on('runQuery', async (event, { connection, query, database }) => {
      const knexIstance = connections[connection.uid];
      const Query = new RawQuery({ knexIstance, database });
      try {
         Query.runQuery(query);

         Query.on('row', row => {
            event.sender.send('row', row);
         });
      }
      catch (err) {
         return { status: 'error', response: err.toString() };
      }
   });
};
