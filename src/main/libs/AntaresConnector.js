'use strict';
import mysql from 'mysql2';

/**
 * As Simple As Possible Query Builder
 *
 * @export
 * @class AntaresConnector
 */
export class AntaresConnector {
   /**
    *Creates an instance of AntaresConnector.
    * @param {Object} args connection params
    * @memberof AntaresConnector
    */
   constructor (args) {
      this._client = args.client;
      this._params = args.params;
      this._poolSize = args.poolSize || false;
      this._connection = null;

      this._queryDefaults = {
         schema: '',
         select: [],
         from: '',
         where: [],
         groupBy: [],
         orderBy: [],
         limit: '',
         join: [],
         update: [],
         insert: [],
         delete: []
      };
      this._query = Object.assign({}, this._queryDefaults);
   }

   _reducer (acc, curr) {
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

   _resetQuery () {
      this._query = Object.assign({}, this._queryDefaults);
   }

   /**
    * @memberof AntaresConnector
    */
   connect () {
      switch (this._client) {
         case 'maria':
         case 'mysql':
            if (!this._poolSize) {
               const connection = mysql.createConnection(this._params);
               this._connection = connection.promise();
            }
            else {
               const pool = mysql.createPool({ ...this._params, connectionLimit: this._poolSize });
               this._connection = pool.promise();
            }
            break;

         default:
            break;
      }
   }

   schema (schema) {
      this._query.schema = schema;
      return this;
   }

   select (...args) {
      this._query.select = [...this._query.select, ...args];
      return this;
   }

   from (table) {
      this._query.from = table;
      return this;
   }

   where (...args) {
      this._query.where = [...this._query.where, ...args];
      return this;
   }

   groupBy (...args) {
      this._query.groupBy = [...this._query.groupBy, ...args];
      return this;
   }

   orderBy (...args) {
      this._query.orderBy = [...this._query.orderBy, ...args];
      return this;
   }

   getQueryString () {
      const selectArray = this._query.select.reduce(this._reducer, []);
      const selectRaw = selectArray.length ? `SELECT ${selectArray.join(', ')}` : 'SELECT *';
      const fromRaw = this._query.from ? `FROM ${this._query.schema ? `\`${this._query.schema}\`.` : ''} \`${this._query.from}\`` : '';
      const whereArray = this._query.where.reduce(this._reducer, []);
      const whereRaw = whereArray.length ? `WHERE ${whereArray.join(', AND ')}` : '';
      const groupByArray = this._query.groupBy.reduce(this._reducer, []);
      const groupByRaw = groupByArray.length ? `GROUP BY ${groupByArray.join(', ')}` : '';
      const orderByArray = this._query.orderBy.reduce(this._reducer, []);
      const orderByRaw = orderByArray.length ? `ORDER BY ${orderByArray.join(', ')}` : '';

      return `${selectRaw} ${fromRaw} ${whereRaw} ${groupByRaw} ${orderByRaw}`;
   }

   run () {
      const rawQuery = this.getQueryString();
      this._resetQuery();
      return this.raw(rawQuery);
   }

   /**
    * @param {*} sql raw SQL query
    * @returns {Promise}
    * @memberof AntaresConnector
    */
   async raw (sql) {
      switch (this._client) {
         case 'maria':
         case 'mysql': {
            const [rows, fields] = await this._connection.query(sql);
            return { rows, fields };
         }
         default:
            break;
      }
   }

   /**
    * @memberof AntaresConnector
    */
   destroy () {
      switch (this._client) {
         case 'maria':
         case 'mysql': {
            this._connection.end();
            break;
         }
         default:
            break;
      }
   }
}
