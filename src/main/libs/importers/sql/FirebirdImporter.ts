import * as importer from 'common/interfaces/importer';
import { removeComments } from 'common/libs/sqlScanner';
import * as firebird from 'node-firebird';

import { FirebirdSQLClient } from '../../clients/FirebirdSQLClient';
import { ScriptImporter } from './ScriptImporter';

const COMMIT = /^COMMIT(\s+WORK)?\s*;?$/i;
const ROLLBACK = /^ROLLBACK(\s+WORK)?\s*;?$/i;
const DML = /^(INSERT|UPDATE|DELETE|MERGE|SELECT|WITH|EXECUTE\s+PROCEDURE)\b/i;
/** isql commands without a meaning for the server (SET TERM is handled by the splitter) */
const ISQL_COMMAND = /^SET\s+(SQL\s+DIALECT|NAMES|AUTODDL|BAIL|ECHO|LIST|COUNT|PLAN|PLANONLY|STATS|TIME|WARNINGS|HEADING|BLOBDISPLAY|ROWCOUNT|WIDTH|WIRE_STATS|EXPLAIN|PER_TABLE_STATS|KEEP_TRAN_PARAMS|MAXROWS|EXEC_PATH_DISPLAY)\b/i;

/**
 * Runs an isql script on a Firebird database, with the isql transaction rules: data statements run in
 * a transaction committed by COMMIT (or before the next metadata statement), metadata statements
 * (CREATE, ALTER, EXECUTE BLOCK...) are committed one by one.
 */
export default class FirebirdImporter extends ScriptImporter {
   protected readonly _dialect = 'firebird';
   private readonly _client: FirebirdSQLClient;
   private _db?: firebird.Database;
   private _transaction?: firebird.Transaction;

   constructor (client: FirebirdSQLClient, options: importer.ImportOptions) {
      super(options);
      this._client = client;
   }

   protected async open () {
      this._db = await this._client.getConnection();
   }

   private _settle (method: 'commit' | 'rollback') {
      const transaction = this._transaction;
      this._transaction = undefined;
      if (!transaction) return Promise.resolve();

      return new Promise<void>((resolve, reject) => {
         transaction[method](err => err ? reject(err) : resolve());
      });
   }

   private async _query (target: firebird.Database | firebird.Transaction, sql: string) {
      await new Promise<void>((resolve, reject) => {
         target.query(sql, [], err => err ? reject(err) : resolve());
      });
   }

   protected async execute (sql: string) {
      const code = removeComments(sql, 'firebird').trim();

      if (COMMIT.test(code)) return this._settle('commit');
      if (ROLLBACK.test(code)) return this._settle('rollback');
      if (ISQL_COMMAND.test(code)) return;

      if (DML.test(code)) {
         if (!this._transaction) {
            this._transaction = await new Promise<firebird.Transaction>((resolve, reject) => {
               this._db.transaction(firebird.ISOLATION_READ_COMMITTED, (err, transaction) => err ? reject(err) : resolve(transaction));
            });
         }
         return this._query(this._transaction, sql);
      }

      // Metadata: the pending data is committed first (like isql with AUTODDL ON)
      await this._settle('commit');
      await this._query(this._db, sql);
   }

   protected async close (completed: boolean) {
      try {
         await this._settle(completed ? 'commit' : 'rollback');
      }
      finally {
         this._db?.detach();
         this._db = undefined;
      }
   }
}
