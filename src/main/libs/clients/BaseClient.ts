import * as antares from 'common/interfaces/antares';
import { querySplitter } from 'common/libs/sqlUtils';
import mysql from 'mysql2/promise';
import * as pg from 'pg';

import { QueryBuilder } from '../db/core/QueryBuilder';
import { Clause, QueryDialect } from '../db/core/QueryDialect';
import { ipcLogger, LoggerLevel } from '../misc/ipcLogger';

export abstract class BaseClient {
   _client: antares.ClientCode;
   protected _cUid: string
   protected _params: mysql.ConnectionOptions | pg.ClientConfig | { databasePath: string; readonly: boolean};
   protected _poolSize: number;
   protected _logger: (args: {content: string; cUid: string; level: LoggerLevel}) => void;
   protected _querySplitter: (sql: string, client: antares.ClientCode) => string[];
   /** Renders query builder objects to this engine's SQL */
   protected abstract readonly _dialect: QueryDialect;

   constructor (args: antares.ClientParams) {
      this._client = args.client;
      this._cUid = args.uid;
      this._params = args.params;
      this._poolSize = args.poolSize || undefined;
      this._logger = args.logger || ipcLogger;
      this._querySplitter = args.querySplitter || querySplitter;
   }

   get dialect () {
      return this._dialect;
   }

   /** A new, independent query builder bound to this connection */
   query () {
      return new QueryBuilder(this._dialect, this);
   }

   // Fluent shortcuts: every chain starts a new QueryBuilder, so no state is shared between queries

   schema (schema: string) {
      return this.query().schema(schema);
   }

   select (...args: Clause[]) {
      return this.query().select(...args);
   }

   from (table: string) {
      return this.query().from(table);
   }

   into (table: string) {
      return this.query().into(table);
   }

   delete (table: string) {
      return this.query().delete(table);
   }

   where (...args: Clause[]) {
      return this.query().where(...args);
   }

   update (...args: Clause[]) {
      return this.query().update(...args);
   }

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   insert (rows: Record<string, any>[]) {
      return this.query().insert(rows);
   }

   abstract raw<T = antares.QueryResult> (sql: string, args?: antares.QueryParams): Promise<T>;
}
