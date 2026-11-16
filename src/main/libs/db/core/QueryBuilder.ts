import * as antares from 'common/interfaces/antares';

import { Clause, QueryDialect } from './QueryDialect';

export interface QueryExecutor {
   raw<T = antares.QueryResult>(sql: string, args?: antares.QueryParams): Promise<T>;
}

export const emptyQuery = (): antares.QueryBuilderObject => ({
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
});

/**
 * Fluent query builder. One instance per query: state is never shared between queries
 * (clients create a new builder for every chain, see BaseClient).
 */
export class QueryBuilder {
   private readonly _query = emptyQuery();
   private readonly _dialect: QueryDialect;
   private readonly _executor?: QueryExecutor;

   constructor (dialect: QueryDialect, executor?: QueryExecutor) {
      this._dialect = dialect;
      this._executor = executor;
   }

   schema (schema: string) {
      this._query.schema = schema;
      return this;
   }

   select (...args: Clause[]) {
      this._query.select = [...this._query.select, ...args as string[]];
      return this;
   }

   from (table: string) {
      this._query.from = table;
      return this;
   }

   into (table: string) {
      return this.from(table);
   }

   delete (table: string) {
      this._query.delete = true;
      return this.from(table);
   }

   where (...args: Clause[]) {
      this._query.where = [...this._query.where, ...args as string[]];
      return this;
   }

   groupBy (...args: Clause[]) {
      this._query.groupBy = [...this._query.groupBy, ...args as string[]];
      return this;
   }

   orderBy (...args: Clause[]) {
      this._query.orderBy = [...this._query.orderBy, ...args as string[]];
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

   update (...args: Clause[]) {
      this._query.update = [...this._query.update, ...args as string[]];
      return this;
   }

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   insert (rows: Record<string, any>[]) {
      this._query.insert = [...this._query.insert, ...rows];
      return this;
   }

   /** A copy of the current builder state */
   toObject (): antares.QueryBuilderObject {
      return structuredClone(this._query);
   }

   toSQL (): string {
      return this._dialect.render(this._query);
   }

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   run<RowType = any> (args?: antares.QueryParams) {
      if (!this._executor)
         throw new Error('QueryBuilder has no executor: use toSQL() or create it from a client');

      return this._executor.raw<antares.QueryResult<RowType>>(this.toSQL(), args);
   }
}
