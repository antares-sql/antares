import * as antares from 'common/interfaces/antares';
import { ipcMain } from 'electron';
import * as fs from 'fs';
import { SslOptions } from 'mysql2';

import { ClientsFactory } from '../libs/ClientsFactory';
import { validateSender } from '../libs/misc/validateSender';
const isAborting: Record<string, boolean> = {};

export default (connections: Record<string, antares.Client>) => {
   ipcMain.handle('test-connection', async (event, conn: antares.ConnectionParams) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      let isLocalAborted = false;
      const abortChecker = setInterval(() => { // Intercepts abort request
         if (isAborting[conn.uid]) {
            isAborting[conn.uid] = false;
            isLocalAborted = true;
            clearInterval(abortChecker);
         }
      }, 50);

      const params = {
         host: conn.host,
         port: +conn.port,
         user: conn.user,
         password: conn.password,
         readonly: conn.readonly,
         connectionString: conn.connString,
         database: '',
         schema: '',
         databasePath: '',
         ssl: undefined as SslOptions,
         ssh: undefined as {
            host: string;
            username: string;
            password: string;
            port: number;
            privateKey: string;
            passphrase: string;
            keepaliveInterval: number;
         }
      };

      if (conn.database)
         params.database = conn.database;

      if (conn.databasePath)
         params.databasePath = conn.databasePath;

      if (conn.ssl) {
         params.ssl = {
            key: conn.key ? fs.readFileSync(conn.key).toString() : null,
            cert: conn.cert ? fs.readFileSync(conn.cert).toString() : null,
            ca: conn.ca ? fs.readFileSync(conn.ca).toString() : null,
            ciphers: conn.ciphers,
            rejectUnauthorized: !conn.untrustedConnection
         };
      }

      if (conn.ssh) {
         params.ssh = {
            host: conn.sshHost,
            username: conn.sshUser,
            password: conn.sshPass,
            port: conn.sshPort ? conn.sshPort : 22,
            privateKey: conn.sshKey ? fs.readFileSync(conn.sshKey).toString() : undefined,
            passphrase: conn.sshPassphrase,
            keepaliveInterval: conn.sshKeepAliveInterval ? conn.sshKeepAliveInterval*1000 : undefined
         };
      }

      try {
         const connection = await ClientsFactory.getClient({
            uid: conn.uid,
            client: conn.client,
            params
         });

         await connection.connect();
         if (isLocalAborted) {
            connection.destroy();
            return;
         }

         await connection.ping();

         connection.destroy();
         clearInterval(abortChecker);

         return { status: 'success' };
      }
      catch (error) {
         clearInterval(abortChecker);
         if (error instanceof AggregateError)
            throw new Error(error.errors.reduce((acc, curr) => acc +' | '+ curr.message, ''));
         else if (!isLocalAborted)
            return { status: 'error', response: error.toString() };
         else
            return { status: 'abort', response: 'Connection aborted' };
      }
   });

   ipcMain.handle('check-connection', async (event, uid) => {
      return uid in connections;
   });

   ipcMain.handle('connect', async (event, conn: antares.ConnectionParams) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      let isLocalAborted = false;
      const abortChecker = setInterval(() => { // Intercepts abort request
         if (isAborting[conn.uid]) {
            isAborting[conn.uid] = false;
            isLocalAborted = true;
            clearInterval(abortChecker);
         }
      }, 50);

      const params = {
         host: conn.host,
         port: +conn.port,
         user: conn.user,
         password: conn.password,
         application_name: 'Antares SQL',
         readonly: conn.readonly,
         connectionString: conn.connString,
         database: '',
         schema: '',
         databasePath: '',
         ssl: undefined as SslOptions,
         ssh: undefined as {
            host: string;
            username: string;
            password: string;
            port: number;
            privateKey: string;
            passphrase: string;
            keepaliveInterval: number;
         }
      };

      if (conn.database)
         params.database = conn.database;

      if (conn.databasePath)
         params.databasePath = conn.databasePath;

      if (conn.schema)
         params.schema = conn.schema;

      if (conn.ssl) {
         params.ssl = {
            key: conn.key ? fs.readFileSync(conn.key).toString() : null,
            cert: conn.cert ? fs.readFileSync(conn.cert).toString() : null,
            ca: conn.ca ? fs.readFileSync(conn.ca).toString() : null,
            ciphers: conn.ciphers,
            rejectUnauthorized: !conn.untrustedConnection
         };
      }

      if (conn.ssh) {
         params.ssh = {
            host: conn.sshHost,
            username: conn.sshUser,
            password: conn.sshPass,
            port: conn.sshPort ? conn.sshPort : 22,
            privateKey: conn.sshKey ? fs.readFileSync(conn.sshKey).toString() : null,
            passphrase: conn.sshPassphrase,
            keepaliveInterval: conn.sshKeepAliveInterval ? conn.sshKeepAliveInterval*1000 : null
         };
      }

      try {
         const connection = ClientsFactory.getClient({
            uid: conn.uid,
            client: conn.client,
            params,
            poolSize: conn.singleConnectionMode ? 0 : 5
         });

         await connection.connect();
         if (isLocalAborted) {
            connection.destroy();
            return { status: 'abort', response: 'Connection aborted' };
         }

         const structure = await connection.getStructure(new Set());
         if (isLocalAborted) {
            connection.destroy();
            return { status: 'abort', response: 'Connection aborted' };
         }

         connections[conn.uid] = connection;
         clearInterval(abortChecker);

         return { status: 'success', response: structure };
      }
      catch (err) {
         clearInterval(abortChecker);

         if (!isLocalAborted)
            return { status: 'error', response: err.toString() };
         else
            return { status: 'abort', response: 'Connection aborted' };
      }
   });

   ipcMain.on('abort-connection', (event, uid) => {
      isAborting[uid] = true;
   });

   ipcMain.handle('disconnect', (event, uid) => {
      if (!validateSender(event.senderFrame)) return { status: 'error', response: 'Unauthorized process' };

      connections[uid].destroy();
      delete connections[uid];
   });
};
