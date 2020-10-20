'use strict';
import mysql from 'mysql';
import { AntaresCore } from '../AntaresCore';

export class MySQLClient extends AntaresCore {
   /**
    * @memberof MySQLClient
    */
   async connect () {
      if (!this._poolSize)
         this._connection = mysql.createConnection(this._params);
      else
         this._connection = mysql.createPool({ ...this._params, connectionLimit: this._poolSize });
   }

   /**
    * @memberof MySQLClient
    */
   destroy () {
      this._connection.end();
   }

   /**
    * Executes an USE query
    *
    * @param {String} schema
    * @memberof MySQLClient
    */
   use (schema) {
      return this.raw(`USE \`${schema}\``);
   }

   /**
    * @returns {Array.<Object>} databases scructure
    * @memberof MySQLClient
    */
   async getStructure () {
      const { rows: databases } = await this.raw('SHOW DATABASES');
      // TODO: SHOW TABLE STATUS FROM `{DATABASE_NAME}`;

      const { rows: tables } = await this
         .select('*')
         .schema('information_schema')
         .from('TABLES')
         .orderBy({ TABLE_SCHEMA: 'ASC', TABLE_NAME: 'ASC' })
         .run();

      const { rows: functions } = await this.raw('SHOW FUNCTION STATUS');
      const { rows: procedures } = await this.raw('SHOW PROCEDURE STATUS');
      const { rows: schedulers } = await this.raw('SELECT *, EVENT_SCHEMA AS `Db`, EVENT_NAME AS `Name` FROM information_schema.`EVENTS`');

      const triggersArr = [];
      for (const db of databases) {
         let { rows: triggers } = await this.raw(`SHOW TRIGGERS FROM \`${db.Database}\``);
         if (triggers.length) {
            triggers = triggers.map(trigger => {
               trigger.Db = db.Database;
               return trigger;
            });
            triggersArr.push(...triggers);
         }
      }

      return databases.map(db => {
         // TABLES
         const remappedTables = tables.filter(table => table.TABLE_SCHEMA === db.Database).map(table => {
            let tableType;
            switch (table.TABLE_TYPE) {
               case 'VIEW':
                  tableType = 'view';
                  break;
               default:
                  tableType = 'table';
                  break;
            }

            return {
               name: table.TABLE_NAME,
               type: tableType,
               rows: table.TABLE_ROWS,
               created: table.CREATE_TIME,
               updated: table.UPDATE_TIME,
               engine: table.ENGINE,
               comment: table.TABLE_COMMENT,
               size: table.DATA_LENGTH + table.INDEX_LENGTH,
               autoIncrement: table.AUTO_INCREMENT,
               collation: table.TABLE_COLLATION
            };
         });

         // PROCEDURES
         const remappedProcedures = procedures.filter(procedure => procedure.Db === db.Database).map(procedure => {
            return {
               name: procedure.Name,
               type: procedure.Type,
               definer: procedure.Definer,
               created: procedure.Created,
               updated: procedure.Modified,
               comment: procedure.Comment,
               charset: procedure.character_set_client,
               security: procedure.Security_type
            };
         });

         // SCHEDULERS
         const remappedSchedulers = schedulers.filter(scheduler => scheduler.Db === db.Database).map(scheduler => {
            return {
               name: scheduler.EVENT_NAME,
               definition: scheduler.EVENT_DEFINITION,
               type: scheduler.EVENT_TYPE,
               definer: scheduler.DEFINER,
               body: scheduler.EVENT_BODY,
               starts: scheduler.STARTS,
               ends: scheduler.ENDS,
               status: scheduler.STATUS,
               executeAt: scheduler.EXECUTE_AT,
               intervalField: scheduler.INTERVAL_FIELD,
               intervalValue: scheduler.INTERVAL_VALUE,
               onCompletion: scheduler.ON_COMPLETION,
               originator: scheduler.ORIGINATOR,
               sqlMode: scheduler.SQL_MODE,
               created: scheduler.CREATED,
               updated: scheduler.LAST_ALTERED,
               lastExecuted: scheduler.LAST_EXECUTED,
               comment: scheduler.EVENT_COMMENT,
               charset: scheduler.CHARACTER_SET_CLIENT,
               timezone: scheduler.TIME_ZONE
            };
         });

         // TRIGGERS
         const remappedTriggers = triggersArr.filter(trigger => trigger.Db === db.Database).map(trigger => {
            return {
               name: trigger.Trigger,
               statement: trigger.Statement,
               timing: trigger.Timing,
               definer: trigger.Definer,
               event: trigger.Event,
               table: trigger.Table,
               sqlMode: trigger.sql_mode,
               created: trigger.Created,
               charset: trigger.character_set_client
            };
         });

         return {
            name: db.Database,
            tables: remappedTables,
            functions: functions.filter(func => func.Db === db.Database), // TODO: remap functions
            procedures: remappedProcedures,
            triggers: remappedTriggers,
            schedulers: remappedSchedulers
         };
      });
   }

   /**
    * @param {Object} params
    * @param {String} params.schema
    * @param {String} params.table
    * @returns {Object} table scructure
    * @memberof MySQLClient
    */
   async getTableColumns ({ schema, table }) {
      const { rows } = await this
         .select('*')
         .schema('information_schema')
         .from('COLUMNS')
         .where({ TABLE_SCHEMA: `= '${schema}'`, TABLE_NAME: `= '${table}'` })
         .orderBy({ ORDINAL_POSITION: 'ASC' })
         .run();

      return rows.map(field => {
         let numLength = field.COLUMN_TYPE.match(/int\(([^)]+)\)/);
         numLength = numLength ? +numLength.pop() : null;

         return {
            name: field.COLUMN_NAME,
            key: field.COLUMN_KEY.toLowerCase(),
            type: field.DATA_TYPE,
            schema: field.TABLE_SCHEMA,
            table: field.TABLE_NAME,
            numPrecision: field.NUMERIC_PRECISION,
            numLength,
            datePrecision: field.DATETIME_PRECISION,
            charLength: field.CHARACTER_MAXIMUM_LENGTH,
            nullable: field.IS_NULLABLE.includes('YES'),
            unsigned: field.COLUMN_TYPE.includes('unsigned'),
            zerofill: field.COLUMN_TYPE.includes('zerofill'),
            order: field.ORDINAL_POSITION,
            default: field.COLUMN_DEFAULT,
            charset: field.CHARACTER_SET_NAME,
            collation: field.COLLATION_NAME,
            autoIncrement: field.EXTRA.includes('auto_increment'),
            comment: field.COLUMN_COMMENT
         };
      });
   }

   /**
    * @param {Object} params
    * @param {String} params.schema
    * @param {String} params.table
    * @returns {Object} table key usage
    * @memberof MySQLClient
    */
   async getKeyUsage ({ schema, table }) {
      const { rows } = await this
         .select('*')
         .schema('information_schema')
         .from('KEY_COLUMN_USAGE')
         .where({ TABLE_SCHEMA: `= '${schema}'`, TABLE_NAME: `= '${table}'`, REFERENCED_TABLE_NAME: 'IS NOT NULL' })
         .run();

      return rows.map(field => {
         return {
            schema: field.TABLE_SCHEMA,
            table: field.TABLE_NAME,
            column: field.COLUMN_NAME,
            position: field.ORDINAL_POSITION,
            constraintPosition: field.POSITION_IN_UNIQUE_CONSTRAINT,
            constraintName: field.CONSTRAINT_NAME,
            refSchema: field.REFERENCED_TABLE_SCHEMA,
            refTable: field.REFERENCED_TABLE_NAME,
            refColumn: field.REFERENCED_COLUMN_NAME
         };
      });
   }

   /**
    * SHOW COLLATION
    *
    * @returns {Array.<Object>} collations list
    * @memberof MySQLClient
    */
   async getCollations () {
      const results = await this.raw('SHOW COLLATION');

      return results.rows.map(row => {
         return {
            charset: row.Charset,
            collation: row.Collation,
            compiled: row.Compiled.includes('Yes'),
            default: row.Default.includes('Yes'),
            id: row.Id,
            sortLen: row.Sortlen
         };
      });
   }

   /**
    * SHOW VARIABLES
    *
    * @returns {Array.<Object>} variables list
    * @memberof MySQLClient
    */
   async getVariables () {
      const sql = 'SHOW VARIABLES';
      const results = await this.raw(sql);

      return results.rows.map(row => {
         return {
            name: row.Variable_name,
            value: row.Value
         };
      });
   }

   /**
    * @returns {String} SQL string
    * @memberof MySQLClient
    */
   getSQL () {
      // SELECT
      const selectArray = this._query.select.reduce(this._reducer, []);
      let selectRaw = '';

      if (selectArray.length)
         selectRaw = selectArray.length ? `SELECT ${selectArray.join(', ')} ` : 'SELECT * ';

      // FROM
      let fromRaw = '';

      if (!this._query.update.length && !Object.keys(this._query.insert).length && !!this._query.from)
         fromRaw = 'FROM';
      else if (Object.keys(this._query.insert).length)
         fromRaw = 'INTO';

      fromRaw += this._query.from ? ` ${this._query.schema ? `\`${this._query.schema}\`.` : ''}\`${this._query.from}\` ` : '';

      // WHERE
      const whereArray = this._query.where.reduce(this._reducer, []);
      const whereRaw = whereArray.length ? `WHERE ${whereArray.join(' AND ')} ` : '';

      // UPDATE
      const updateArray = this._query.update.reduce(this._reducer, []);
      const updateRaw = updateArray.length ? `SET ${updateArray.join(', ')} ` : '';

      // INSERT
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

      // GROUP BY
      const groupByArray = this._query.groupBy.reduce(this._reducer, []);
      const groupByRaw = groupByArray.length ? `GROUP BY ${groupByArray.join(', ')} ` : '';

      // ORDER BY
      const orderByArray = this._query.orderBy.reduce(this._reducer, []);
      const orderByRaw = orderByArray.length ? `ORDER BY ${orderByArray.join(', ')} ` : '';

      // LIMIT
      const limitRaw = this._query.limit.length ? `LIMIT ${this._query.limit.join(', ')} ` : '';

      return `${selectRaw}${updateRaw ? 'UPDATE' : ''}${insertRaw ? 'INSERT ' : ''}${this._query.delete ? 'DELETE ' : ''}${fromRaw}${updateRaw}${whereRaw}${groupByRaw}${orderByRaw}${limitRaw}${insertRaw}`;
   }

   /**
    * @param {string} sql raw SQL query
    * @param {boolean} [nest]
    * @returns {Promise}
    * @memberof MySQLClient
    */
   async raw (sql, nest) {
      const nestTables = nest ? '.' : false;
      const resultsArr = [];
      const queries = sql.split(';');

      if (process.env.NODE_ENV === 'development') this._logger(sql);// TODO: replace BLOB content with a placeholder

      for (const query of queries) {
         if (!query) continue;

         const { rows, report, fields } = await new Promise((resolve, reject) => {
            this._connection.query({ sql: query, nestTables }, (err, response, fields) => {
               if (err)
                  reject(err);
               else {
                  const remappedFields = fields ? fields.map(field => {
                     return {
                        name: field.name,
                        orgName: field.orgName,
                        schema: field.db,
                        table: field.orgTable,
                        type: 'varchar'
                     };
                  }) : [];

                  resolve({
                     rows: Array.isArray(response) ? response : false,
                     report: !Array.isArray(response) ? response : false,
                     fields: remappedFields
                  });
               }
            });
         });
         resultsArr.push({ rows, report, fields });
      }

      return resultsArr.length === 1 ? resultsArr[0] : resultsArr;
   }
}
