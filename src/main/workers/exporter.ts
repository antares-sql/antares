import * as antares from 'common/interfaces/antares';
import * as log from 'electron-log/main';
import { parentPort } from 'worker_threads';

import { createClient, getEngine } from '../libs/db/EngineRegistry';
let exporter: antares.Exporter;

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const exportHandler = async (data: any) => {
   const { type, client, tables, options } = data;

   if (type === 'init') {
      try {
         const engine = getEngine(client.name);
         if (!engine.createExporter) {
            parentPort.postMessage({
               type: 'error',
               payload: `"${client.name}" exporter not aviable`
            });
            return;
         }

         const connection = createClient({
            client: client.name,
            params: client.config,
            poolSize: 5
         });
         await connection.connect();

         exporter = engine.createExporter(connection, tables, options);

         exporter.once('error', err => {
            log.error(err.toString());
            parentPort.postMessage({
               type: 'error',
               payload: err.toString()
            });
         });

         let cancelRequested = false;
         exporter.once('cancel', () => {
            cancelRequested = true;
         });

         // 'end' comes once the exporter has released its connections and closed (or deleted, if cancelled) the file
         exporter.once('end', async () => {
            if (cancelRequested) {
               // The main process terminates the thread on 'cancel': close the connection first
               await close(connection);
               parentPort.postMessage({ type: 'cancel' });
               return;
            }

            parentPort.postMessage({
               type: 'end',
               payload: { cancelled: exporter.isCancelled }
            });
            close(connection);
         });

         exporter.on('progress', state => {
            parentPort.postMessage({
               type: 'export-progress',
               payload: state
            });
         });

         exporter.run().catch((): null => null); // Errors are already reported by the 'error' event
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
      exporter.cancel();
};

parentPort.on('message', exportHandler);
