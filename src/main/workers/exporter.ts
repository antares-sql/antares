import * as antares from 'common/interfaces/antares';
import * as log from 'electron-log/main';
import * as fs from 'fs';
import { parentPort } from 'worker_threads';

import { createClient, getEngine } from '../libs/db/EngineRegistry';
let exporter: antares.Exporter;

log.transports.file.fileName = 'workers.log';
log.transports.console = null;
log.errorHandler.startCatching();

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

         exporter.once('end', () => {
            parentPort.postMessage({
               type: 'end',
               payload: { cancelled: exporter.isCancelled }
            });
         });

         exporter.once('cancel', () => {
            fs.unlinkSync(exporter.outputFile);
            parentPort.postMessage({ type: 'cancel' });
         });

         exporter.on('progress', state => {
            parentPort.postMessage({
               type: 'export-progress',
               payload: state
            });
         });

         exporter.run();
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
