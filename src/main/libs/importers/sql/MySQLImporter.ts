import * as importer from 'common/interfaces/importer';
import * as mysql from 'mysql2/promise';

import { MySQLClient } from '../../clients/MySQLClient';
import { ScriptImporter } from './ScriptImporter';

/**
 * Runs an SQL script on a MySQL/MariaDB database, like the mysql client: each statement runs on its
 * own (the transactions are the ones of the script), DELIMITER changes the statement terminator.
 */
export default class MySQLImporter extends ScriptImporter {
   protected readonly _dialect = 'mysql';
   private readonly _client: MySQLClient;
   private _connection?: mysql.Connection;

   constructor (client: MySQLClient, options: importer.ImportOptions) {
      super(options);
      this._client = client;
   }

   /** A connection on the selected schema (the database of the connection params) */
   protected async open () {
      this._connection = await this._client.getSingleConnection();
   }

   protected async execute (sql: string) {
      await this._connection.query(sql);
   }

   protected async close () {
      const connection = this._connection;
      this._connection = undefined;
      // A transaction left open by the script is rolled back, like the mysql client does
      await connection?.end().catch((): null => null);
   }
}
