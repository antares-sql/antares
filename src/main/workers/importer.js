import { ClientsFactory } from '../libs/ClientsFactory';
import fs from 'fs';
import MysqlImporter from '../libs/importers/sql/MysqlImporter';
let importer;

process.on('message', async ({ type, dbConfig, options }) => {
   if (type === 'init') {
      const connection = await ClientsFactory.getConnection({
         client: options.type,
         params: dbConfig,
         poolSize: 1
      });
      await connection.connect();

      // TODO: importer factory class
      switch (options.type) {
         case 'mysql':
         case 'maria':
            importer = new MysqlImporter(connection, options);
            break;
         default:
            process.send({
               type: 'error',
               payload: `"${options.type}" importer not aviable`
            });
            return;
      }

      importer.once('error', err => {
         console.error(err);
         process.send({
            type: 'error',
            payload: err.toString()
         });
      });

      importer.once('end', () => {
         process.send({
            type: 'end',
            payload: { cancelled: importer.isCancelled }
         });
         connection.destroy();
      });

      importer.once('cancel', () => {
         fs.unlinkSync(importer.outputFile);
         process.send({ type: 'cancel' });
      });

      importer.on('progress', state => {
         process.send({
            type: 'import-progress',
            payload: state
         });
      });

      importer.run();
   }
   else if (type === 'cancel')
      importer.cancel();
});
