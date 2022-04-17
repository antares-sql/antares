import * as antares from 'common/interfaces/antares';
import * as pg from 'pg';
import * as mysql from 'mysql2';
import { MySQLClient } from '../libs/clients/MySQLClient';
import { PostgreSQLClient } from '../libs/clients/PostgreSQLClient';
import { ClientsFactory } from '../libs/ClientsFactory';
import MySQLImporter from '../libs/importers/sql/MySQLlImporter';
import PostgreSQLImporter from '../libs/importers/sql/PostgreSQLImporter';
let importer: antares.Importer;

process.on('message', async ({ type, dbConfig, options }) => {
   if (type === 'init') {
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
      });

      importer.once('cancel', () => {
         process.send({ type: 'cancel' });
      });

      importer.on('progress', state => {
         process.send({
            type: 'import-progress',
            payload: state
         });
      });

      importer.on('query-error', state => {
         process.send({
            type: 'query-error',
            payload: state
         });
      });

      importer.run();
   }
   else if (type === 'cancel')
      importer.cancel();
});
