import * as antares from 'common/interfaces/antares';

import { FirebirdSQLClient } from './clients/FirebirdSQLClient';
import { MySQLClient } from './clients/MySQLClient';
import { PostgreSQLClient } from './clients/PostgreSQLClient';
import { SQLiteClient } from './clients/SQLiteClient';

export class ClientsFactory {
   static getClient (args: antares.ClientParams) {
      switch (args.client) {
         case 'mysql':
         case 'maria':
            return new MySQLClient(args);
         case 'pg':
            return new PostgreSQLClient(args);
         case 'sqlite':
            return new SQLiteClient(args);
         case 'firebird':
            return new FirebirdSQLClient(args);
         default:
            throw new Error(`Unknown database client: ${args.client}`);
      }
   }
}
