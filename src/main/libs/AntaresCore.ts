import * as antares from 'common/interfaces/antares';
import mysql from 'mysql2/promise';
import * as pg from 'pg';
import SSH2Promise from 'ssh2-promise';

const queryLogger = (sql: string) => {
   // Remove comments, newlines and multiple spaces
   const escapedSql = sql.replace(/(\/\*(.|[\r\n])*?\*\/)|(--(.*|[\r\n]))/gm, '').replace(/\s\s+/g, ' ');
   console.log(escapedSql);
};

/**
 * As Simple As Possible Query Builder Core
 */
export class AntaresCore {
   protected _client: string;
   protected _params: mysql.ConnectionOptions | pg.ClientConfig | { databasePath: string; readonly: boolean};
   protected _poolSize: number;
   protected _ssh?: SSH2Promise;
   protected _logger: (sql: string) => void;
   protected _queryDefaults: antares.QueryBuilderObject;
   protected _query: antares.QueryBuilderObject;

   constructor (args: antares.ClientParams) {
      this._client = args.client;
      this._params = args.params;
      this._poolSize = args.poolSize || undefined;
      this._logger = args.logger || queryLogger;

      this._queryDefaults = {
         schema: '',
         select: [],
         from: '',
         where: [],
         groupBy: [],
         orderBy: [],
         limit: [],
         offset: [],
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

   limit (...args: string[]) {
      this._query.limit = args;
      return this;
   }

   offset (...args: string[]) {
      this._query.offset = args;
      return this;
   }

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   update (...args: any) {
      this._query.update = [...this._query.update, ...args];
      return this;
   }

   insert (arr: string[]) {
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
}
