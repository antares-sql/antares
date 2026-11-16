import * as antares from 'common/interfaces/antares';
import { querySplitter } from 'common/libs/sqlUtils';
import mysql from 'mysql2/promise';
import * as pg from 'pg';
import SSH2Promise = require('@fabio286/ssh2-promise');

import { QueryBuilder } from '../db/core/QueryBuilder';
import { Clause, QueryDialect } from '../db/core/QueryDialect';
import { ipcLogger, LoggerLevel } from '../misc/ipcLogger';

export abstract class BaseClient {
   _client: antares.ClientCode;
   protected _cUid: string
   protected _params: mysql.ConnectionOptions | pg.ClientConfig | { databasePath: string; readonly: boolean};
   protected _poolSize: number;
   protected _ssh?: SSH2Promise;
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

   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   raw<T = antares.QueryResult> (_sql: string, _args?: antares.QueryParams): Promise<T> {
      throw new Error('Client must implement the "raw" method');
   }

   /* eslint-disable @typescript-eslint/no-unused-vars */
   /* eslint-disable @typescript-eslint/no-explicit-any */
   getDbConfig () {
      throw new Error('Method "getDbConfig" not implemented');
   }

   getDatabases () {
      throw new Error('Method "getDatabases" not implemented');
   }

   createSchema (...args: any) {
      throw new Error('Method "createSchema" not implemented');
   }

   alterSchema (...args: any) {
      throw new Error('Method "alterSchema" not implemented');
   }

   dropSchema (...args: any) {
      throw new Error('Method "dropSchema" not implemented');
   }

   getTableChecks (...args: any) {
      throw new Error('Method "getTableDll" not implemented');
   }

   getTableDll (...args: any) {
      throw new Error('Method "getTableDll" not implemented');
   }

   getDatabaseCollation (...args: any) {
      throw new Error('Method "getDatabaseCollation" not implemented');
   }

   getFunctionInformations (...args: any) {
      throw new Error('Method "getFunctionInformations" not implemented');
   }

   alterFunction (...args: any) {
      throw new Error('Method "alterFunction" not implemented');
   }

   createTriggerFunction (...args: any) {
      throw new Error('Method "createTriggerFunction" not implemented');
   }

   alterTriggerFunction (...args: any) {
      throw new Error('Method "alterTriggerFunction" not implemented');
   }

   createFunction (...args: any) {
      throw new Error('Method "createFunction" not implemented');
   }

   dropFunction (...args: any) {
      throw new Error('Method "dropFunction" not implemented');
   }

   getCollations () {
      throw new Error('Method "getCollations" not implemented');
   }

   getRoutineInformations (...args: any) {
      throw new Error('Method "getRoutineInformations" not implemented');
   }

   dropRoutine (...args: any) {
      throw new Error('Method "dropRoutine" not implemented');
   }

   alterRoutine (...args: any) {
      throw new Error('Method "alterRoutine" not implemented');
   }

   createRoutine (...args: any) {
      throw new Error('Method "createRoutine" not implemented');
   }

   getVariables () {
      throw new Error('Method "getVariables" not implemented');
   }

   getMaterializedViewInformations (...args: any) {
      throw new Error('Method "getMaterializedViewInformations" not implemented');
   }

   dropMaterializedView (...args: any) {
      throw new Error('Method "dropMaterializedView" not implemented');
   }

   createMaterializedView (...args: any) {
      throw new Error('Method "createMaterializedView" not implemented');
   }

   getEventInformations (...args: any) {
      throw new Error('Method "getEventInformations" not implemented');
   }

   dropEvent (...args: any) {
      throw new Error('Method "dropEvent" not implemented');
   }

   alterEvent (...args: any) {
      throw new Error('Method "alterEvent" not implemented');
   }

   createEvent (...args: any) {
      throw new Error('Method "createEvent" not implemented');
   }

   enableEvent (...args: any) {
      throw new Error('Method "enableEvent" not implemented');
   }

   disableEvent (...args: any) {
      throw new Error('Method "disableEvent" not implemented');
   }

   enableTrigger (...args: any) {
      throw new Error('Method "enableTrigger" not implemented');
   }

   disableTrigger (...args: any) {
      throw new Error('Method "disableTrigger" not implemented');
   }

   killTabQuery (...args: any) {
      throw new Error('Method "killTabQuery" not implemented');
   }
   /* eslint-enable @typescript-eslint/no-unused-vars */
   /* eslint-enable @typescript-eslint/no-explicit-any */
}
