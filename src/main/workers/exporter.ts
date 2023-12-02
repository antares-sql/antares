import * as antares from 'common/interfaces/antares';
import * as log from 'electron-log/main';
import * as fs from 'fs';
import { parentPort } from 'worker_threads';

import { MySQLClient } from '../libs/clients/MySQLClient';
import { PostgreSQLClient } from '../libs/clients/PostgreSQLClient';
import { ClientsFactory } from '../libs/ClientsFactory';
import MysqlExporter from '../libs/exporters/sql/MysqlExporter';
import PostgreSQLExporter from '../libs/exporters/sql/PostgreSQLExporter';
let exporter: antares.Exporter;

log.transports.file.fileName = 'workers.log';
log.transports.console = null;
log.errorHandler.startCatching();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const exportHandler = async (data: any) => {
   const { type, client, tables, options } = data;

   if (type === 'init') {
      try {
         const connection = await ClientsFactory.getClient({
            client: client.name,
            params: client.config,
            poolSize: 5
         }) as MySQLClient | PostgreSQLClient;
         await connection.connect();

         switch (client.name) {
            case 'mysql':
            case 'maria':
               exporter = new MysqlExporter(connection as MySQLClient, tables, options);
               break;
            case 'pg':
               exporter = new PostgreSQLExporter(connection as PostgreSQLClient, tables, options);
               break;
            default:
               parentPort.postMessage({
                  type: 'error',
                  payload: `"${client.name}" exporter not aviable`
               }));
               return;
         }

         exporter.once('error', err => {
            log.error(err.toString());
            parentPort.postMessage({
               type: 'error',
               payload: err.toString()
            }));
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
            }));
         });

         exporter.run();
      }
      catch (err) {
         log.error(err.toString());
         parentPort.postMessage({
            type: 'error',
            payload: err.toString()
         }));
      }
   }
   else if (type === 'cancel')
      exporter.cancel();
};

parentPort.on('message', exportHandler);
