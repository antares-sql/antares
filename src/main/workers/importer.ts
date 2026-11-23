import SSHConfig from '@fabio286/ssh2-promise/lib/sshConfig';
import * as antares from 'common/interfaces/antares';
import { ImportOptions } from 'common/interfaces/importer';
import * as log from 'electron-log/main';
import * as mysql from 'mysql2';
import * as pg from 'pg';
import { parentPort } from 'worker_threads';

import { createClient, getEngine } from '../libs/db/EngineRegistry';
let importer: antares.Importer;

log.transports.file.fileName = 'workers.log';
log.transports.console = null;
log.errorHandler.startCatching();

/**
 * Closes the database connection and lets the thread exit by itself: terminating a thread with open
 * sockets and native modules can crash the app (#841)
 */
const close = async (connection: { destroy: () => unknown }) => {
   try {
      await connection.destroy();
   }
   catch (err) {
      log.error(err.toString());
   }
   parentPort.unref();
};

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
         const engine = getEngine(options.type);
         if (!engine.createImporter) {
            parentPort.postMessage({
               type: 'error',
               payload: `"${options.type}" importer not aviable`
            });
            return;
         }

         const connection = createClient({
            client: options.type,
            params: {
               ...dbConfig,
               schema: options.schema
            },
            poolSize: 1
         });

         importer = await engine.createImporter(connection, options);

         importer.once('error', err => {
            log.error(err.toString());
            parentPort.postMessage({
               type: 'error',
               payload: err.toString()
            });
         });

         // Importers that stop by themselves end before the thread is terminated (connections closed)
         let cancelRequested = false;
         importer.once('cancel', () => {
            if (importer.stopsOnCancel)
               cancelRequested = true;
            else
               parentPort.postMessage({ type: 'cancel' });
         });

         importer.once('end', async () => {
            if (cancelRequested) {
               await close(connection);
               parentPort.postMessage({ type: 'cancel' });
               return;
            }

            parentPort.postMessage({
               type: 'end',
               payload: { cancelled: importer.isCancelled }
            });
            close(connection);
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

         importer.run().catch((): null => null); // Errors are already reported by the 'error' event
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
