import * as importer from 'common/interfaces/importer';
import { removeComments } from 'common/libs/sqlScanner';

import sqlite = require('better-sqlite3');

import { SQLiteClient } from '../../clients/SQLiteClient';
import { ScriptImporter } from './ScriptImporter';

/** Statements that manage transactions or cannot run inside one */
const TRANSACTION_CONTROL = /^(BEGIN|COMMIT|END|ROLLBACK|SAVEPOINT|RELEASE|PRAGMA|VACUUM|ATTACH|DETACH)\b/i;
const COMMIT = /^(COMMIT|END)\b/i;

/**
 * Runs an SQL script on an SQLite database. Statements outside a transaction of the script are
 * grouped in a transaction opened by the importer: one commit per statement would be very slow.
 */
export default class SQLiteImporter extends ScriptImporter {
   protected readonly _dialect = 'sqlite';
   private readonly _client: SQLiteClient;
   private _db?: sqlite.Database;
   /** The current transaction was opened by the importer, not by the script */
   private _implicitTransaction = false;

   constructor (client: SQLiteClient, options: importer.ImportOptions) {
      super(options);
      this._client = client;
   }

   protected async open () {
      this._db = this._client.getConnection();
   }

   protected async execute (sql: string) {
      const code = removeComments(sql, 'sqlite').trim();

      if (TRANSACTION_CONTROL.test(code)) {
         if (this._implicitTransaction) {
            this._db.exec('COMMIT');
            this._implicitTransaction = false;
            if (COMMIT.test(code)) return; // The script commits what the importer grouped
         }
      }
      else if (!this._db.inTransaction) {
         this._db.exec('BEGIN');
         this._implicitTransaction = true;
      }

      this._db.exec(sql);
   }

   protected async close (completed: boolean) {
      const db = this._db;
      this._db = undefined;
      if (!db) return;

      try {
         if (db.inTransaction) db.exec(completed ? 'COMMIT' : 'ROLLBACK');
      }
      finally {
         db.close();
      }
   }
}
