import SSHConfig from '@fabio286/ssh2-promise/lib/sshConfig';
import * as antares from 'common/interfaces/antares';
import { ImportOptions } from 'common/interfaces/importer';
import * as log from 'electron-log/main';
import * as mysql from 'mysql2';
import * as pg from 'pg';
import { parentPort } from 'worker_threads';

import { MySQLClient } from '../libs/clients/MySQLClient';
import { PostgreSQLClient } from '../libs/clients/PostgreSQLClient';
import { ClientsFactory } from '../libs/ClientsFactory';
import MySQLImporter from '../libs/importers/sql/MySQLlImporter';
import PostgreSQLImporter from '../libs/importers/sql/PostgreSQLImporter';
let importer: antares.Importer;

log.transports.file.fileName = 'workers.log';
log.transports.console = null;
log.errorHandler.startCatching();

const importHandler = async (data: {
   type: string;
   dbConfig: mysql.ConnectionOptions & { schema: string; ssl?: mysql.SslOptions; ssh?: SSHConfig; readonly: boolean }
      | pg.ClientConfig & { schema: string; ssl?: mysql.SslOptions; ssh?: SSHConfig; readonly: boolean }
      | { databasePath: string; readonly: boolean };
   options: ImportOptions;
}) => {
   const { type, dbConfig, options } = data;
   if (type === 'init') {
      try {
         const connection = await ClientsFactory.getClient({
            client: options.type,
            params: {
               ...dbConfig,
               schema: options.schema
            },
            poolSize: 1
         }) as MySQLClient | PostgreSQLClient;

         const pool = await connection.getConnectionPool();

         switch (options.type) {
            case 'mysql':
            case 'maria':
               importer = new MySQLImporter(pool as unknown as mysql.Pool, options);
               break;
            case 'pg':
               importer = new PostgreSQLImporter(pool as unknown as pg.PoolClient, options);
               break;
            default:
               parentPort.postMessage({
                  type: 'error',
                  payload: `"${options.type}" importer not aviable`
               });
               return;
         }

         importer.once('error', err => {
            log.error(err.toString());
            parentPort.postMessage({
               type: 'error',
               payload: err.toString()
            });
         });

         importer.once('end', () => {
            parentPort.postMessage({
               type: 'end',
               payload: { cancelled: importer.isCancelled }
            });
         });

         importer.once('cancel', () => {
            parentPort.postMessage({ type: 'cancel' });
         });

         importer.on('progress', state => {
            parentPort.postMessage({
               type: 'import-progress',
               payload: state
            });
         });

         importer.on('query-error', state => {
            parentPort.postMessage({
               type: 'query-error',
               payload: state
            });
         });

         importer.run();
      }
      catch (err) {
         log.error(err.toString());
         parentPort.postMessage({
            type: 'error',
            payload: err.toString()
         });
      }
   }
   else if (type === 'cancel')
      importer.cancel();
};

parentPort.on('message', importHandler);
