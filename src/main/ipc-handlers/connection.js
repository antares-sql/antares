import fs from 'fs';
import { ipcMain } from 'electron';
import { ClientsFactory } from '../libs/ClientsFactory';

export default connections => {
   ipcMain.handle('test-connection', async (event, conn) => {
      const params = {
         host: conn.host,
         port: +conn.port,
         user: conn.user,
         password: conn.password,
         application_name: 'Antares SQL'
      };

      if (conn.database)
         params.database = conn.database;

      if (conn.ssl) {
         params.ssl = {
            key: conn.key ? fs.readFileSync(conn.key) : null,
            cert: conn.cert ? fs.readFileSync(conn.cert) : null,
            ca: conn.ca ? fs.readFileSync(conn.ca) : null,
            ciphers: conn.ciphers
         };
      }

      if (conn.ssh) {
         params.ssh = {
            host: conn.sshHost,
            username: conn.sshUser,
            password: conn.sshPass,
            port: conn.sshPort ? conn.sshPort : 22,
            identity: conn.sshKey
         };
      }

      try {
         const connection = await ClientsFactory.getConnection({
            client: conn.client,
            params
         });
         await connection.connect();

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
      const params = {
         host: conn.host,
         port: +conn.port,
         user: conn.user,
         password: conn.password,
         application_name: 'Antares SQL'
      };

      if (conn.database)
         params.database = conn.database;

      if (conn.schema)
         params.schema = conn.schema;

      if (conn.ssl) {
         params.ssl = {
            key: conn.key ? fs.readFileSync(conn.key) : null,
            cert: conn.cert ? fs.readFileSync(conn.cert) : null,
            ca: conn.ca ? fs.readFileSync(conn.ca) : null,
            ciphers: conn.ciphers
         };
      }

      if (conn.ssh) {
         params.ssh = {
            host: conn.sshHost,
            username: conn.sshUser,
            password: conn.sshPass,
            port: conn.sshPort ? conn.sshPort : 22,
            identity: conn.sshKey
         };
      }

      try {
         const connection = ClientsFactory.getConnection({
            client: conn.client,
            params,
            poolSize: 5
         });

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
