import * as importer from 'common/interfaces/importer';
import { removeComments, scanSql } from 'common/libs/sqlScanner';
import * as pg from 'pg';
import { from as copyFrom } from 'pg-copy-streams';

import { PostgreSQLClient } from '../../clients/PostgreSQLClient';
import { InlineDataSink, ScriptImporter } from './ScriptImporter';

/** COPY reading its rows from the script (pg_dump and pgAdmin plain dumps) */
const COPY_FROM_STDIN = /^COPY\b[\s\S]*\bFROM\s+STDIN\b/i;
/**
 * psql meta-commands without effect on the import: pg_dump 17.6/16.10/15.14/14.19/13.22 and later
 * wrap the dump in \restrict ... \unrestrict (CVE-2025-8714)
 */
const IGNORED_META_COMMAND = /^\\(restrict|unrestrict)\b/;

/**
 * Removes the psql meta-commands of a statement: a backslash outside strings, quoted identifiers
 * and comments starts a meta-command that goes on up to the end of the line.
 */
export function stripMetaCommands (sql: string) {
   const commands: string[] = [];
   const text = scanSql(sql, 'pg').map(segment => {
      const part = sql.slice(segment.start, segment.end);
      if (segment.type !== 'code') return part;
      return part.replace(/\\[^\n]*/g, command => {
         commands.push(command.trim());
         return '';
      });
   }).join('');

   return { sql: text, commands };
}

/**
 * Runs an SQL script on a PostgreSQL database, like psql: each statement runs on its own (the
 * transactions are the ones of the script), the rows of COPY ... FROM stdin are streamed to the server.
 */
export default class PostgreSQLImporter extends ScriptImporter {
   protected readonly _dialect = 'pg';
   private readonly _client: PostgreSQLClient;
   private _connection?: pg.Client;

   constructor (client: PostgreSQLClient, options: importer.ImportOptions) {
      super(options);
      this._client = client;
   }

   protected async open () {
      const connection = await this._client.getConnection() as pg.Client;
      // Errors of the server or the network are reported by the running query
      connection.on('error', (): null => null);
      this._connection = connection;
      if (this._options.schema)
         await this._client.use(this._options.schema, connection);
   }

   protected async execute (sql: string) {
      await this._connection.query(sql);
   }

   /** psql meta-commands are not SQL: they are left out, the ones with effects are reported */
   protected prepareStatement (statement: string) {
      if (!statement.includes('\\')) return statement;

      const { sql, commands } = stripMetaCommands(statement);
      for (const command of commands) {
         if (!IGNORED_META_COMMAND.test(command))
            this.reportError(command, new Error('psql meta-commands are not supported: skipped'));
      }

      return removeComments(sql, 'pg').trim() ? sql.trim() : '';
   }

   protected hasInlineData (sql: string) {
      return COPY_FROM_STDIN.test(removeComments(sql, 'pg').trim());
   }

   protected async openInlineData (sql: string): Promise<InlineDataSink> {
      const stream = this._connection.query(copyFrom(sql));
      let error: Error | undefined;
      // The statement fails before or while the data is written (pending writes are never completed)
      const failed = new Promise<never>((_resolve, reject) => stream.on('error', err => {
         error = err;
         reject(err);
      }));
      failed.catch((): null => null);

      // After an error the stream has no connection anymore: it must not be used
      const whileRunning = (action: (done: (err?: Error) => void) => void) => error
         ? Promise.reject(error)
         : Promise.race([new Promise<void>((resolve, reject) => action(err => err ? reject(err) : resolve())), failed]);

      return {
         write: data => whileRunning(done => stream.write(data, done)),
         end: () => whileRunning(done => stream.end(() => done())),
         // A CopyFail rolls back the COPY
         abort: () => {
            if (!error && !stream.destroyed && !stream.writableFinished) stream.destroy();
         }
      };
   }

   protected async close () {
      const connection = this._connection;
      this._connection = undefined;
      // A transaction left open by the script is rolled back, like psql does
      await connection?.end().catch((): null => null);
   }
}
