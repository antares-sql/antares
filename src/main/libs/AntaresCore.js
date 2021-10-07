'use strict';
/**
 * As Simple As Possible Query Builder Core
 *
 * @class AntaresCore
 */
export class AntaresCore {
   /**
    * Creates an instance of AntaresCore.
    *
    * @param {Object} args connection params
    * @memberof AntaresCore
    */
   constructor (args) {
      this._client = args.client;
      this._params = args.params;
      this._poolSize = args.poolSize || false;
      this._connection = null;
      this._ssh = null;
      this._logger = args.logger || console.log;

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
    * @memberof AntaresCore
    */
   _resetQuery () {
      this._query = Object.assign({}, this._queryDefaults);
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

   offset (...args) {
      this._query.offset = args;
      return this;
   }

   /**
    * @param {String | Array} args field = value
    * @returns
    * @memberof AntaresCore
    */
   update (...args) {
      this._query.update = [...this._query.update, ...args];
      return this;
   }

   /**
    * @param {Array} arr Array of row objects
    * @returns
    * @memberof AntaresCore
    */
   insert (arr) {
      this._query.insert = [...this._query.insert, ...arr];
      return this;
   }

   /**
    * @param {Object} args
    * @returns {Promise}
    * @memberof AntaresCore
    */
   run (args) {
      const rawQuery = this.getSQL();
      this._resetQuery();
      return this.raw(rawQuery, args);
   }
}
