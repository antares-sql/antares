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
            onUpdate: field.EXTRA.toLowerCase().includes('on update') ? field.EXTRA.replace('on update', '') : '',
            comment: field.COLUMN_COMMENT
         };
      });
   }

   /**
    * @param {Object} params
    * @param {String} params.schema
    * @param {String} params.table
    * @returns {Object} table indexes
    * @memberof MySQLClient
    */
   async getTableIndexes ({ schema, table }) {
      const { rows } = await this.raw(`SHOW INDEXES FROM \`${table}\` FROM \`${schema}\``);

      return rows.map(row => {
         return {
            unique: !row.Non_unique,
            name: row.Key_name,
            column: row.Column_name,
            indexType: row.Index_type,
            type: row.Key_name === 'PRIMARY' ? 'PRIMARY' : !row.Non_unique ? 'UNIQUE' : row.Index_type === 'FULLTEXT' ? 'FULLTEXT' : 'INDEX',
            cardinality: row.Cardinality,
            comment: row.Comment,
            indexComment: row.Index_comment
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
    * SHOW ENGINES
    *
    * @returns {Array.<Object>} engines list
    * @memberof MySQLClient
    */
   async getEngines () {
      const sql = 'SHOW ENGINES';
      const results = await this.raw(sql);

      return results.rows.map(row => {
         return {
            name: row.Engine,
            support: row.Support,
            comment: row.Comment,
            transactions: row.Trasactions,
            xa: row.XA,
            savepoints: row.Savepoints
         };
      });
   }

   /**
    * ALTER TABLE
    *
    * @returns {Array.<Object>} parameters
    * @memberof MySQLClient
    */
   async alterTable (params) {
      const {
         table,
         additions,
         deletions,
         changes,
         indexChanges,
         options
      } = params;

      console.log(params);

      let sql = `ALTER TABLE \`${table}\` `;
      const alterColumns = [];

      // OPTIONS
      if ('comment' in options) alterColumns.push(`COMMENT='${options.comment}'`);
      if ('engine' in options) alterColumns.push(`ENGINE=${options.engine}`);
      if ('autoIncrement' in options) alterColumns.push(`AUTO_INCREMENT=${+options.autoIncrement}`);
      if ('collation' in options) alterColumns.push(`COLLATE='${options.collation}'`);

      // ADD FIELDS
      additions.forEach(addition => {
         const length = addition.numLength || addition.charLength || addition.datePrecision;

         alterColumns.push(`ADD COLUMN \`${addition.name}\` 
            ${addition.type.toUpperCase()}${length ? `(${length})` : ''} 
            ${addition.unsigned ? 'UNSIGNED' : ''} 
            ${addition.zerofill ? 'ZEROFILL' : ''}
            ${addition.nullable ? 'NULL' : 'NOT NULL'}
            ${addition.autoIncrement ? 'AUTO_INCREMENT' : ''}
            ${addition.default ? `DEFAULT ${addition.default}` : ''}
            ${addition.comment ? `COMMENT '${addition.comment}'` : ''}
            ${addition.collation ? `COLLATE ${addition.collation}` : ''}
            ${addition.onUpdate ? `ON UPDATE ${addition.onUpdate}` : ''}
            ${addition.after ? `AFTER \`${addition.after}\`` : 'FIRST'}`);
      });

      // ADD INDEX
      indexChanges.additions.forEach(addition => {
         const fields = addition.fields.map(field => `\`${field}\``).join(',');
         let type = addition.type;

         if (type === 'PRIMARY')
            alterColumns.push(`ADD PRIMARY KEY (${fields})`);
         else {
            if (type === 'UNIQUE')
               type = 'UNIQUE INDEX';

            alterColumns.push(`ADD ${type} \`${addition.name}\` (${fields})`);
         }
      });

      // CHANGE FIELDS
      changes.forEach(change => {
         const length = change.numLength || change.charLength || change.datePrecision;

         alterColumns.push(`CHANGE COLUMN \`${change.orgName}\` \`${change.name}\` 
            ${change.type.toUpperCase()}${length ? `(${length})` : ''} 
            ${change.unsigned ? 'UNSIGNED' : ''} 
            ${change.zerofill ? 'ZEROFILL' : ''}
            ${change.nullable ? 'NULL' : 'NOT NULL'}
            ${change.autoIncrement ? 'AUTO_INCREMENT' : ''}
            ${change.default ? `DEFAULT ${change.default}` : ''}
            ${change.comment ? `COMMENT '${change.comment}'` : ''}
            ${change.collation ? `COLLATE ${change.collation}` : ''}
            ${change.onUpdate ? `ON UPDATE ${change.onUpdate}` : ''}
            ${change.after ? `AFTER \`${change.after}\`` : 'FIRST'}`);
      });

      // CHANGE INDEX
      indexChanges.changes.forEach(change => {
         if (change.oldType === 'PRIMARY')
            alterColumns.push('DROP PRIMARY KEY');
         else
            alterColumns.push(`DROP INDEX \`${change.oldName}\``);

         const fields = change.fields.map(field => `\`${field}\``).join(',');
         let type = change.type;

         if (type === 'PRIMARY')
            alterColumns.push(`ADD PRIMARY KEY (${fields})`);
         else {
            if (type === 'UNIQUE')
               type = 'UNIQUE INDEX';

            alterColumns.push(`ADD ${type} \`${change.name}\` (${fields})`);
         }
      });

      // DROP FIELDS
      deletions.forEach(deletion => {
         alterColumns.push(`DROP COLUMN \`${deletion.name}\``);
      });

      // DROP INDEX
      indexChanges.deletions.forEach(deletion => {
         if (deletion.type === 'PRIMARY')
            alterColumns.push('DROP PRIMARY KEY');
         else
            alterColumns.push(`DROP INDEX \`${deletion.name}\``);
      });

      sql += alterColumns.join(', ');

      // RENAME
      if (options.name) sql += `; RENAME TABLE \`${table}\` TO \`${options.name}\``;

      return await this.raw(sql);
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
    * @param {object} args
    * @param {boolean} args.nest
    * @param {boolean} args.details
    * @returns {Promise}
    * @memberof MySQLClient
    */
   async raw (sql, args) {
      args = {
         nest: false,
         details: false,
         ...args
      };
      const nestTables = args.nest ? '.' : false;
      const resultsArr = [];
      let paramsArr = [];
      let selectedFields = [];
      const queries = sql.split(';');

      if (process.env.NODE_ENV === 'development') this._logger(sql);// TODO: replace BLOB content with a placeholder

      for (const query of queries) {
         if (!query) continue;
         let fieldsArr = [];
         let keysArr = [];

         const { rows, report, fields, keys } = await new Promise((resolve, reject) => {
            this._connection.query({ sql: query, nestTables }, async (err, response, fields) => {
               const queryResult = response;

               if (err)
                  reject(err);
               else {
                  const remappedFields = fields
                     ? fields.map(field => {
                        return {
                           name: field.name,
                           orgName: field.orgName,
                           schema: field.db,
                           table: field.table,
                           orgTable: field.orgTable,
                           type: 'varchar'
                        };
                     })
                     : [];

                  if (args.details) {
                     let cachedTable;

                     if (remappedFields.length) {
                        selectedFields = remappedFields.map(field => {
                           return {
                              name: field.orgName || field.name,
                              table: field.orgTable || field.table
                           };
                        });

                        paramsArr = remappedFields.map(field => {
                           if (field.table) cachedTable = field.table;// Needed for some queries on information_schema
                           return {
                              table: field.orgTable || cachedTable,
                              schema: field.schema || 'INFORMATION_SCHEMA'
                           };
                        }).filter((val, i, arr) => arr.findIndex(el => el.schema === val.schema && el.table === val.table) === i);

                        for (const paramObj of paramsArr) {
                           try { // Table data
                              const response = await this.getTableColumns(paramObj);

                              let detailedFields = response.length
                                 ? selectedFields.map(selField => {
                                    return response.find(field => field.name === selField.name && field.table === selField.table);
                                 }).filter(el => !!el)
                                 : [];

                              if (selectedFields.length) {
                                 detailedFields = detailedFields.map(field => {
                                    const aliasObj = remappedFields.find(resField => resField.orgName === field.name);
                                    return {
                                       ...field,
                                       alias: aliasObj.name || field.name,
                                       tableAlias: aliasObj.table || field.table
                                    };
                                 });
                              }

                              if (!detailedFields.length) {
                                 detailedFields = remappedFields.map(field => {
                                    return {
                                       ...field,
                                       alias: field.name,
                                       tableAlias: field.table
                                    };
                                 });
                              }

                              fieldsArr = fieldsArr ? [...fieldsArr, ...detailedFields] : detailedFields;
                           }
                           catch (err) {
                              reject(err);
                           }

                           try { // Key usage (foreign keys)
                              const response = await this.getKeyUsage(paramObj);
                              keysArr = keysArr ? [...keysArr, ...response] : response;
                           }
                           catch (err) {
                              reject(err);
                           }
                        }
                     }
                  }

                  resolve({
                     rows: Array.isArray(queryResult) ? queryResult : false,
                     report: !Array.isArray(queryResult) ? queryResult : false,
                     fields: fieldsArr.length ? fieldsArr : remappedFields,
                     keys: keysArr
                  });
               }
            });
         });

         resultsArr.push({ rows, report, fields, keys });
      }

      return resultsArr.length === 1 ? resultsArr[0] : resultsArr;
   }
}
