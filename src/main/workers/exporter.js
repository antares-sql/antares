import { ClientsFactory } from '../libs/ClientsFactory';
import MysqlExporter from '../libs/exporters/sql/MysqlExporter.js';
import fs from 'fs';
let exporter;

process.on('message', async ({ type, client, tables, options }) => {
   if (type === 'init') {
      const connection = await ClientsFactory.getClient({
         client: client.name,
         params: client.config,
         poolSize: 5
      });
      await connection.connect();

      switch (client.name) {
         case 'mysql':
         case 'maria':
            exporter = new MysqlExporter(connection, tables, options);
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
