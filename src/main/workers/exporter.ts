import * as antares from 'common/interfaces/antares';
import * as fs from 'fs';
import { MySQLClient } from '../libs/clients/MySQLClient';
import { PostgreSQLClient } from '../libs/clients/PostgreSQLClient';
import { ClientsFactory } from '../libs/ClientsFactory';
import MysqlExporter from '../libs/exporters/sql/MysqlExporter';
import PostgreSQLExporter from '../libs/exporters/sql/PostgreSQLExporter';
let exporter: antares.Exporter;

process.on('message', async ({ type, client, tables, options }) => {
   if (type === 'init') {
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
            process.send({
               type: 'error',
               payload: `"${client.name}" exporter not aviable`
            });
            return;
      }

      exporter.once('error', err => {
         console.error(err);
         process.send({
            type: 'error',
            payload: err.toString()
         });
      });

      exporter.once('end', () => {
         process.send({
            type: 'end',
            payload: { cancelled: exporter.isCancelled }
         });
         connection.destroy();
      });

      exporter.once('cancel', () => {
         fs.unlinkSync(exporter.outputFile);
         process.send({ type: 'cancel' });
      });

      exporter.on('progress', state => {
         process.send({
            type: 'export-progress',
            payload: state
         });
      });

      exporter.run();
   }
   else if (type === 'cancel')
      exporter.cancel();
});

process.on('beforeExit', console.log);
