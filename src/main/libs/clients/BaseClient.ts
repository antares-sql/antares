import * as antares from 'common/interfaces/antares';
import mysql from 'mysql2/promise';
import * as pg from 'pg';
import SSH2Promise = require('@fabio286/ssh2-promise');
import { querySplitter } from 'common/libs/querySplitter';

import { ipcLogger, LoggerLevel } from '../misc/ipcLogger';

/**
 * As Simple As Possible Query Builder Core
 */
export abstract class BaseClient {
   _client: antares.ClientCode;
   protected _cUid: string
   protected _params: mysql.ConnectionOptions | pg.ClientConfig | { databasePath: string; readonly: boolean};
   protected _poolSize: number;
   protected _ssh?: SSH2Promise;
   protected _logger: (args: {content: string; cUid: string; level: LoggerLevel}) => void;
   protected _querySplitter: (sql: string, client: antares.ClientCode) => string[];
   protected _queryDefaults: antares.QueryBuilderObject;
   protected _query: antares.QueryBuilderObject;

   constructor (args: antares.ClientParams) {
      this._client = args.client;
      this._cUid = args.uid;
      this._params = args.params;
      this._poolSize = args.poolSize || undefined;
      this._logger = args.logger || ipcLogger;
      this._querySplitter = args.querySplitter || querySplitter;

      this._queryDefaults = {
         schema: '',
         select: [],
         from: '',
         where: [],
         groupBy: [],
         orderBy: [],
         limit: null,
         offset: null,
         join: [],
         update: [],
         insert: [],
         delete: false
      };
      this._query = Object.assign({}, this._queryDefaults);
   }

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   protected _reducer (acc: string[], curr: any) {
      const type = typeof curr;

      switch (type) {
         case 'number':
         case 'string':
            return [...acc, curr];
         case 'object':
            if (Array.isArray(curr))
               return [...acc, ...curr];
            else {
               const clausoles = [];
               for (const key in curr)
                  clausoles.push(`${key} ${curr[key]}`);

               return clausoles;
            }
      }
   }

   private _resetQuery () {
      this._query = Object.assign({}, this._queryDefaults);
   }

   schema (schema: string) {
      this._query.schema = schema;
      return this;
   }

   select (...args: string[]) {
      this._query.select = [...this._query.select, ...args];
      return this;
   }

   from (table: string) {
      this._query.from = table;
      return this;
   }

   into (table: string) {
      this._query.from = table;
      return this;
   }

   delete (table: string) {
      this._query.delete = true;
      this.from(table);
      return this;
   }

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   where (...args: any) {
      this._query.where = [...this._query.where, ...args];
      return this;
   }

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   groupBy (...args: any) {
      this._query.groupBy = [...this._query.groupBy, ...args];
      return this;
   }

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   orderBy (...args: any) {
      this._query.orderBy = [...this._query.orderBy, ...args];
      return this;
   }

   limit (limit: number) {
      this._query.limit = limit;
      return this;
   }

   offset (offset: number) {
      this._query.offset = offset;
      return this;
   }

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   update (...args: any) {
      this._query.update = [...this._query.update, ...args];
      return this;
   }

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   insert (arr: Record<string, any>[]) {
      this._query.insert = [...this._query.insert, ...arr];
      return this;
   }

   getSQL (): string {
      throw new Error('Client must implement the "getSQL" method');
   }

   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   raw<T = antares.QueryResult> (_sql: string, _args?: antares.QueryParams): Promise<T> {
      throw new Error('Client must implement the "raw" method');
   }

   run<RowType> (args?: antares.QueryParams) {
      const rawQuery = this.getSQL();
      this._resetQuery();
      return this.raw<antares.QueryResult<RowType>>(rawQuery, args);
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
