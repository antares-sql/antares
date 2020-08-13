'use strict';
import mysql from 'mysql';
import mssql from 'mssql';
// import pg from 'pg'; TODO: PostgreSQL

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
      this._logger = args.logger || console.log;

      this._queryDefaults = {
         schema: '',
         select: [],
         from: '',
         where: [],
         groupBy: [],
         orderBy: [],
         limit: [],
         join: [],
         update: [],
         insert: {},
         delete: false
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

   /**
    * Resets the query object after a query
    *
    * @memberof AntaresConnector
    */
   _resetQuery () {
      this._query = Object.assign({}, this._queryDefaults);
   }

   /**
    * @memberof AntaresConnector
    */
   async connect () {
      switch (this._client) {
         case 'maria':
         case 'mysql':
            if (!this._poolSize)
               this._connection = mysql.createConnection(this._params);
            else
               this._connection = mysql.createPool({ ...this._params, connectionLimit: this._poolSize });
            break;
         case 'mssql': {
            const mssqlParams = {
               user: this._params.user,
               password: this._params.password,
               server: this._params.host
            };
            this._connection = await mssql.connect(mssqlParams);
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

   into (table) {
      this._query.from = table;
      return this;
   }

   delete (table) {
      this._query.delete = true;
      this.from(table);
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

   limit (...args) {
      this._query.limit = args;
      return this;
   }

   use (schema) {
      let sql;

      switch (this._client) {
         case 'maria':
         case 'mysql':
            sql = `USE \`${schema}\``;
            break;
         case 'mssql':
            sql = `USE "${schema}"`;
            break;
         default:
            break;
      }

      return this.raw(sql);
   }

   /**
    * @param {String | Array} args field = value
    * @returns
    * @memberof AntaresConnector
    */
   update (...args) {
      this._query.update = [...this._query.update, ...args];
      return this;
   }

   /**
    * @param {Object} obj field: value
    * @returns
    * @memberof AntaresConnector
    */
   insert (obj) {
      this._query.insert = { ...this._query.insert, ...obj };
      return this;
   }

   /**
    * @returns {string} SQL string
    * @memberof AntaresConnector
    */
   getSQL () {
      // SELECT
      const selectArray = this._query.select.reduce(this._reducer, []);
      let selectRaw = '';
      if (selectArray.length) {
         switch (this._client) {
            case 'maria':
            case 'mysql':
               selectRaw = selectArray.length ? `SELECT ${selectArray.join(', ')} ` : 'SELECT * ';
               break;
            case 'mssql': {
               const topRaw = this._query.limit.length ? ` TOP (${this._query.limit[0]}) ` : '';
               selectRaw = selectArray.length ? `SELECT${topRaw} ${selectArray.join(', ')} ` : 'SELECT * ';
            }
               break;
            default:
               break;
         }
      }

      // FROM
      let fromRaw = '';
      if (!this._query.update.length && !Object.keys(this._query.insert).length && !!this._query.from)
         fromRaw = 'FROM';
      else if (Object.keys(this._query.insert).length)
         fromRaw = 'INTO';

      switch (this._client) {
         case 'maria':
         case 'mysql':
            fromRaw += this._query.from ? ` ${this._query.schema ? `\`${this._query.schema}\`.` : ''}\`${this._query.from}\` ` : '';
            break;
         case 'mssql':
            fromRaw += this._query.from ? ` ${this._query.schema ? `${this._query.schema}.` : ''}${this._query.from} ` : '';
            break;
         default:
            break;
      }

      const whereArray = this._query.where.reduce(this._reducer, []);
      const whereRaw = whereArray.length ? `WHERE ${whereArray.join(' AND ')} ` : '';

      const updateArray = this._query.update.reduce(this._reducer, []);
      const updateRaw = updateArray.length ? `SET ${updateArray.join(', ')} ` : '';

      let insertRaw = '';
      if (Object.keys(this._query.insert).length) {
         const fieldsList = [];
         const valueList = [];
         const fields = this._query.insert;

         for (const key in fields) {
            if (fields[key] === null) continue;
            fieldsList.push(key);
            valueList.push(fields[key]);
         }

         insertRaw = `(${fieldsList.join(', ')}) VALUES (${valueList.join(', ')}) `;
      }

      const groupByArray = this._query.groupBy.reduce(this._reducer, []);
      const groupByRaw = groupByArray.length ? `GROUP BY ${groupByArray.join(', ')} ` : '';

      const orderByArray = this._query.orderBy.reduce(this._reducer, []);
      const orderByRaw = orderByArray.length ? `ORDER BY ${orderByArray.join(', ')} ` : '';

      // LIMIT
      let limitRaw;
      switch (this._client) {
         case 'maria':
         case 'mysql':
            limitRaw = this._query.limit.length ? `LIMIT ${this._query.limit.join(', ')} ` : '';
            break;
         case 'mssql':
            limitRaw = '';
            break;
         default:
            break;
      }

      return `${selectRaw}${updateRaw ? 'UPDATE' : ''}${insertRaw ? 'INSERT ' : ''}${this._query.delete ? 'DELETE ' : ''}${fromRaw}${updateRaw}${whereRaw}${groupByRaw}${orderByRaw}${limitRaw}${insertRaw}`;
   }

   /**
    * @returns {Promise}
    * @memberof AntaresConnector
    */
   async run () {
      const rawQuery = this.getSQL();
      this._resetQuery();
      return this.raw(rawQuery);
   }

   /**
    * @param {string} sql raw SQL query
    * @returns {Promise}
    * @memberof AntaresConnector
    */
   async raw (sql) {
      if (process.env.NODE_ENV === 'development') this._logger(sql);// TODO: replace BLOB content with a placeholder

      switch (this._client) { // TODO: uniform fields with every client type, needed table name and fields array
         case 'maria':
         case 'mysql': {
            const { rows, fields } = await new Promise((resolve, reject) => {
               this._connection.query(sql, (err, rows, fields) => {
                  if (err)
                     reject(err);
                  else
                     resolve({ rows, fields });
               });
            });
            return { rows, fields };
         }
         case 'mssql': {
            const results = await this._connection.request().query(sql);
            return { rows: results.recordsets[0] };// TODO: fields
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
         case 'mysql':
            this._connection.end();
            break;
         case 'mssql':
            this._connection.close();
            break;
         default:
            break;
      }
   }
}
