import * as antares from 'common/interfaces/antares';
import * as log from 'electron-log/main';
import * as fs from 'fs';
import { nextTick } from 'process';

import { MySQLClient } from '../libs/clients/MySQLClient';
import { PostgreSQLClient } from '../libs/clients/PostgreSQLClient';
import { ClientsFactory } from '../libs/ClientsFactory';
import MysqlExporter from '../libs/exporters/sql/MysqlExporter';
import PostgreSQLExporter from '../libs/exporters/sql/PostgreSQLExporter';
let exporter: antares.Exporter;

log.transports.file.fileName = 'workers.log';
log.transports.console = null;
log.errorHandler.startCatching();

process.stdin.on('data', async buff => {
   const { type, client, tables, options } = JSON.parse(buff.toString());

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
               process.stdout.write(JSON.stringify({
                  type: 'error',
                  payload: `"${client.name}" exporter not aviable`
               }));
               return;
         }

         exporter.once('error', err => {
            log.error(err.toString());
            process.stdout.write(JSON.stringify({
               type: 'error',
               payload: err.toString()
            }));
         });

         exporter.once('end', () => {
            nextTick(() => {
               process.stdout.write(JSON.stringify({
                  type: 'end',
                  payload: { cancelled: exporter.isCancelled }
               }));
               connection.destroy();
            });
         });

         exporter.once('cancel', () => {
            nextTick(() => {
               fs.unlinkSync(exporter.outputFile);
               process.stdout.write(JSON.stringify({ type: 'cancel' }));
            });
         });

         exporter.on('progress', state => {
            process.stdout.write(JSON.stringify({
               type: 'export-progress',
               payload: state
            }));
         });

         exporter.run();
      }
      catch (err) {
         log.error(err.toString());
         process.stdout.write(JSON.stringify({
            type: 'error',
            payload: err.toString()
         }));
      }
   }
   else if (type === 'cancel')
      exporter.cancel();
});
