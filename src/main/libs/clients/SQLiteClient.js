'use strict';
import sqlite from 'better-sqlite3';
import { AntaresCore } from '../AntaresCore';
import dataTypes from 'common/data-types/mysql';
import { NUMBER, FLOAT, TIME, DATETIME } from 'common/fieldTypes';

export class SQLiteClient extends AntaresCore {
   constructor (args) {
      super(args);

      this._schema = null;
   }

   _getTypeInfo (type) {
      return dataTypes
         .reduce((acc, group) => [...acc, ...group.types], [])
         .filter(_type => _type.name === type.toUpperCase())[0];
   }

   /**
    * @memberof SQLiteClient
    */
   async connect () {
      this._connection = sqlite(this._params.databasePath, {
         fileMustExist: true,
         readonly: this._params.readonly
      });
   }

   /**
    * @memberof SQLiteClient
    */
   destroy () {}

   /**
    * Executes an USE query
    *
    * @memberof SQLiteClient
    */
   use () {}

   /**
    * @param {Array} schemas list
    * @returns {Array.<Object>} databases scructure
    * @memberof SQLiteClient
    */
   async getStructure (schemas) {
      const { rows: databases } = await this.raw('SELECT * FROM pragma_database_list');

      const filteredDatabases = databases;

      const tablesArr = [];
      const triggersArr = [];
      let schemaSize = 0;

      for (const db of filteredDatabases) {
         if (!schemas.has(db.name)) continue;

         let { rows: tables } = await this.raw(`SELECT * FROM "${db.name}".sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`);
         if (tables.length) {
            tables = tables.map(table => {
               table.Db = db.name;
               return table;
            });
            tablesArr.push(...tables);
         }

         let { rows: triggers } = await this.raw(`SELECT * FROM "${db.name}".sqlite_master WHERE type='trigger' AND name NOT LIKE 'sqlite_%'`);
         if (triggers.length) {
            triggers = triggers.map(trigger => {
               trigger.Db = db.name;
               return trigger;
            });
            triggersArr.push(...triggers);
         }
      }

      return filteredDatabases.map(db => {
         if (schemas.has(db.name)) {
            // TABLES
            const remappedTables = tablesArr.filter(table => table.Db === db.name).map(table => {
               const tableSize = 0;
               schemaSize += tableSize;

               return {
                  name: table.name,
                  type: table.type,
                  rows: false,
                  size: false
               };
            });

            // TRIGGERS
            const remappedTriggers = triggersArr.filter(trigger => trigger.Db === db.name).map(trigger => {
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
               name: db.name,
               size: schemaSize,
               tables: remappedTables,
               functions: [],
               procedures: [],
               triggers: remappedTriggers,
               schedulers: []
            };
         }
         else {
            return {
               name: db.name,
               size: 0,
               tables: [],
               functions: [],
               procedures: [],
               triggers: [],
               schedulers: []
            };
         }
      });
   }

   /**
    * @param {Object} params
    * @param {String} params.schema
    * @param {String} params.table
    * @returns {Object} table scructure
    * @memberof SQLiteClient
    */
   async getTableColumns ({ schema, table }) {
      const { rows: fields } = await this.raw(`SELECT * FROM "${schema}".pragma_table_info('${table}')`);

      return fields.map(field => {
         const [type, length] = field.type.includes('(')
            ? field.type.replace(')', '').split('(').map(el => {
               if (!isNaN(el)) el = +el;
               return el;
            })
            : [field.type, null];

         return {
            name: field.name,
            key: null,
            type: type.trim(),
            schema: schema,
            table: table,
            numPrecision: [...NUMBER, ...FLOAT].includes(type) ? length : null,
            datePrecision: null,
            charLength: ![...NUMBER, ...FLOAT].includes(type) ? length : null,
            nullable: !field.notnull,
            unsigned: null,
            zerofill: null,
            order: field.cid + 1,
            default: field.dflt_value,
            charset: null,
            collation: null,
            autoIncrement: false,
            onUpdate: null,
            comment: ''
         };
      });
   }

   /**
    * @param {Object} params
    * @param {String} params.schema
    * @param {String} params.table
    * @returns {Object} table row count
    * @memberof SQLiteClient
    */
   async getTableApproximateCount ({ schema, table }) {
      const { rows } = await this.raw(`SELECT COUNT(*) AS count FROM "${schema}"."${table}"`);

      return rows.length ? rows[0].count : 0;
   }

   /**
    * @param {Object} params
    * @param {String} params.schema
    * @param {String} params.table
    * @returns {Object} table options
    * @memberof SQLiteClient
    */
   async getTableOptions ({ schema, table }) {
      return { name: table };
   }

   /**
    * @param {Object} params
    * @param {String} params.schema
    * @param {String} params.table
    * @returns {Object} table indexes
    * @memberof SQLiteClient
    */
   async getTableIndexes ({ schema, table }) {
      const remappedIndexes = [];
      const { rows: primaryKeys } = await this.raw(`SELECT * FROM "${schema}".pragma_table_info('${table}') WHERE pk != 0`);

      for (const key of primaryKeys) {
         remappedIndexes.push({
            name: 'PRIMARY',
            column: key.name,
            indexType: null,
            type: 'PRIMARY',
            cardinality: null,
            comment: '',
            indexComment: ''
         });
      }

      const { rows: indexes } = await this.raw(`SELECT * FROM "${schema}".pragma_index_list('${table}');`);

      for (const index of indexes) {
         const { rows: details } = await this.raw(`SELECT * FROM "${schema}".pragma_index_info('${index.name}');`);

         for (const detail of details) {
            remappedIndexes.push({
               name: index.name,
               column: detail.name,
               indexType: null,
               type: index.unique === 1 ? 'UNIQUE' : 'INDEX',
               cardinality: null,
               comment: '',
               indexComment: ''
            });
         }
      }

      return remappedIndexes;
   }

   /**
    * @param {Object} params
    * @param {String} params.schema
    * @param {String} params.table
    * @returns {Object} table key usage
    * @memberof SQLiteClient
    */
   async getKeyUsage ({ schema, table }) {
      const { rows } = await this.raw(`SELECT * FROM "${schema}".pragma_foreign_key_list('${table}');`);

      return rows.map(field => {
         return {
            schema: schema,
            table: table,
            field: field.from,
            position: field.id + 1,
            constraintPosition: null,
            constraintName: field.id,
            refSchema: schema,
            refTable: field.table,
            refField: field.to,
            onUpdate: field.on_update,
            onDelete: field.on_delete
         };
      });
   }

   async getUsers () {}

   /**
    * SHOW CREATE VIEW
    *
    * @returns {Array.<Object>} view informations
    * @memberof SQLiteClient
    */
   async getViewInformations ({ schema, view }) {
      const sql = `SHOW CREATE VIEW \`${schema}\`.\`${view}\``;
      const results = await this.raw(sql);

      return results.rows.map(row => {
         return {
            algorithm: row['Create View'].match(/(?<=CREATE ALGORITHM=).*?(?=\s)/gs)[0],
            definer: row['Create View'].match(/(?<=DEFINER=).*?(?=\s)/gs)[0],
            security: row['Create View'].match(/(?<=SQL SECURITY ).*?(?=\s)/gs)[0],
            updateOption: row['Create View'].match(/(?<=WITH ).*?(?=\s)/gs) ? row['Create View'].match(/(?<=WITH ).*?(?=\s)/gs)[0] : '',
            sql: row['Create View'].match(/(?<=AS ).*?$/gs)[0],
            name: row.View
         };
      })[0];
   }

   /**
    * DROP VIEW
    *
    * @returns {Array.<Object>} parameters
    * @memberof SQLiteClient
    */
   async dropView (params) {
      const sql = `DROP VIEW \`${params.schema}\`.\`${params.view}\``;
      return await this.raw(sql);
   }

   /**
    * ALTER VIEW
    *
    * @returns {Array.<Object>} parameters
    * @memberof SQLiteClient
    */
   async alterView (params) {
      const { view } = params;
      let sql = `
         USE \`${view.schema}\`; 
         ALTER ALGORITHM = ${view.algorithm}${view.definer ? ` DEFINER=${view.definer}` : ''} 
         SQL SECURITY ${view.security} 
         VIEW \`${view.schema}\`.\`${view.oldName}\` AS ${view.sql} ${view.updateOption ? `WITH ${view.updateOption} CHECK OPTION` : ''}
      `;

      if (view.name !== view.oldName)
         sql += `; RENAME TABLE \`${view.schema}\`.\`${view.oldName}\` TO \`${view.schema}\`.\`${view.name}\``;

      return await this.raw(sql);
   }

   /**
    * CREATE VIEW
    *
    * @returns {Array.<Object>} parameters
    * @memberof SQLiteClient
    */
   async createView (params) {
      const sql = `CREATE ALGORITHM = ${params.algorithm} ${params.definer ? `DEFINER=${params.definer} ` : ''}SQL SECURITY ${params.security} VIEW \`${params.schema}\`.\`${params.name}\` AS ${params.sql} ${params.updateOption ? `WITH ${params.updateOption} CHECK OPTION` : ''}`;
      return await this.raw(sql);
   }

   /**
    * SHOW CREATE TRIGGER
    *
    * @returns {Array.<Object>} view informations
    * @memberof SQLiteClient
    */
   async getTriggerInformations ({ schema, trigger }) {
      const sql = `SHOW CREATE TRIGGER \`${schema}\`.\`${trigger}\``;
      const results = await this.raw(sql);

      return results.rows.map(row => {
         return {
            definer: row['SQL Original Statement'].match(/(?<=DEFINER=).*?(?=\s)/gs)[0],
            sql: row['SQL Original Statement'].match(/(BEGIN|begin)(.*)(END|end)/gs)[0],
            name: row.Trigger,
            table: row['SQL Original Statement'].match(/(?<=ON `).*?(?=`)/gs)[0],
            activation: row['SQL Original Statement'].match(/(BEFORE|AFTER)/gs)[0],
            event: row['SQL Original Statement'].match(/(INSERT|UPDATE|DELETE)/gs)[0]
         };
      })[0];
   }

   /**
    * DROP TRIGGER
    *
    * @returns {Array.<Object>} parameters
    * @memberof SQLiteClient
    */
   async dropTrigger (params) {
      const sql = `DROP TRIGGER \`${params.schema}\`.\`${params.trigger}\``;
      return await this.raw(sql);
   }

   /**
    * ALTER TRIGGER
    *
    * @returns {Array.<Object>} parameters
    * @memberof SQLiteClient
    */
   async alterTrigger (params) {
      const { trigger } = params;
      const tempTrigger = Object.assign({}, trigger);
      tempTrigger.name = `Antares_${tempTrigger.name}_tmp`;

      try {
         await this.createTrigger(tempTrigger);
         await this.dropTrigger({ schema: trigger.schema, trigger: tempTrigger.name });
         await this.dropTrigger({ schema: trigger.schema, trigger: trigger.oldName });
         await this.createTrigger(trigger);
      }
      catch (err) {
         return Promise.reject(err);
      }
   }

   /**
    * CREATE TRIGGER
    *
    * @returns {Array.<Object>} parameters
    * @memberof SQLiteClient
    */
   async createTrigger (params) {
      const sql = `CREATE ${params.definer ? `DEFINER=${params.definer} ` : ''}TRIGGER \`${params.schema}\`.\`${params.name}\` ${params.activation} ${params.event} ON \`${params.table}\` FOR EACH ROW ${params.sql}`;
      return await this.raw(sql, { split: false });
   }

   /**
    * SHOW COLLATION
    *
    * @returns {Array.<Object>} collations list
    * @memberof SQLiteClient
    */
   async getCollations () {
      return [];
   }

   /**
    * SHOW VARIABLES
    *
    * @returns {Array.<Object>} variables list
    * @memberof SQLiteClient
    */
   async getVariables () {
      return [];
   }

   /**
    * SHOW ENGINES
    *
    * @returns {Array.<Object>} engines list
    * @memberof SQLiteClient
    */
   async getEngines () {
      return {
         name: 'SQLite',
         support: 'YES',
         comment: '',
         isDefault: true
      };
   }

   /**
    * SHOW VARIABLES LIKE '%vers%'
    *
    * @returns {Array.<Object>} version parameters
    * @memberof SQLiteClient
    */
   async getVersion () {
      const os = require('os');
      const sql = 'SELECT sqlite_version() AS version';
      const { rows } = await this.raw(sql);

      return {
         number: rows[0].version,
         name: 'SQLite',
         arch: process.arch,
         os: `${os.type()} ${os.release()}`
      };
   }

   async getProcesses () {}

   async killProcess () {}

   /**
    * CREATE TABLE
    *
    * @returns {Promise<null>}
    * @memberof SQLiteClient
    */
   async createTable (params) {
      const {
         schema,
         fields,
         foreigns,
         indexes,
         options
      } = params;
      const newColumns = [];
      const newIndexes = [];
      const manageIndexes = [];
      const newForeigns = [];

      let sql = `CREATE TABLE "${schema}"."${options.name}"`;

      // ADD FIELDS
      fields.forEach(field => {
         const typeInfo = this._getTypeInfo(field.type);
         const length = typeInfo?.length ? field.enumValues || field.numLength || field.charLength || field.datePrecision : false;

         newColumns.push(`"${field.name}" 
            ${field.type.toUpperCase()}${length && length !== true ? `(${length})` : ''} 
            ${field.unsigned ? 'UNSIGNED' : ''} 
            ${field.nullable ? 'NULL' : 'NOT NULL'}
            ${field.autoIncrement ? 'AUTO_INCREMENT' : ''}
            ${field.default ? `DEFAULT ${field.default}` : ''}
            ${field.onUpdate ? `ON UPDATE ${field.onUpdate}` : ''}`);
      });

      // ADD INDEX
      indexes.forEach(index => {
         const fields = index.fields.map(field => `"${field}"`).join(',');
         const type = index.type;

         if (type === 'PRIMARY')
            newIndexes.push(`PRIMARY KEY (${fields})`);
         else
            manageIndexes.push(`CREATE ${type === 'UNIQUE' ? type : ''} INDEX "${index.name}" ON "${options.name}" (${fields})`);
      });

      // ADD FOREIGN KEYS
      foreigns.forEach(foreign => {
         newForeigns.push(`CONSTRAINT "${foreign.constraintName}" FOREIGN KEY ("${foreign.field}") REFERENCES "${foreign.refTable}" ("${foreign.refField}") ON UPDATE ${foreign.onUpdate} ON DELETE ${foreign.onDelete}`);
      });

      sql = `${sql} (${[...newColumns, ...newIndexes, ...newForeigns].join(', ')})`;
      if (manageIndexes.length) sql = `${sql}; ${manageIndexes.join(';')}`;

      return await this.raw(sql);
   }

   /**
    * ALTER TABLE
    *
    * @returns {Promise<null>}
    * @memberof SQLiteClient
    */
   async alterTable (params) {
      try {
         await this.raw('BEGIN TRANSACTION');
         await this.raw('PRAGMA foreign_keys = 0');

         const tmpName = `Antares_${params.table}_tmp`;
         await this.raw(`CREATE TABLE "${tmpName}" AS SELECT * FROM "${params.table}"`);
         await this.dropTable(params);

         const createTableParams = {
            schema: params.schema,
            fields: params.tableStructure.fields,
            foreigns: params.tableStructure.foreigns,
            indexes: params.tableStructure.indexes.filter(index => !index.name.includes('sqlite_autoindex')),
            options: { name: params.tableStructure.name }
         };
         await this.createTable(createTableParams);
         const insertFields = createTableParams.fields
            .filter(field => {
               return (
                  params.additions.every(add => add.name !== field.name) &&
                  params.deletions.every(del => del.name !== field.name)
               );
            })
            .reduce((acc, curr) => {
               acc.push(`"${curr.name}"`);
               return acc;
            }, []);

         const selectFields = insertFields.map(field => {
            const renamedField = params.changes.find(change => `"${change.name}"` === field);
            if (renamedField)
               return `"${renamedField.orgName}"`;
            return field;
         });

         await this.raw(`INSERT INTO "${createTableParams.options.name}" (${insertFields.join(',')}) SELECT ${selectFields.join(',')} FROM "${tmpName}"`);

         await this.dropTable({ schema: params.schema, table: tmpName });
         await this.raw('PRAGMA foreign_keys = 1');
         await this.raw('COMMIT');
      }
      catch (err) {
         await this.raw('ROLLBACK');
         return Promise.reject(err);
      }
   }

   /**
    * DUPLICATE TABLE
    *
    * @returns {Promise<null>}
    * @memberof SQLiteClient
    */
   async duplicateTable (params) { // TODO: retrive table informations and create a copy
      const sql = `CREATE TABLE "${params.schema}"."${params.table}_copy" AS SELECT * FROM "${params.schema}"."${params.table}"`;
      return await this.raw(sql);
   }

   /**
    * TRUNCATE TABLE
    *
    * @returns {Promise<null>}
    * @memberof SQLiteClient
    */
   async truncateTable (params) {
      const sql = `DELETE FROM "${params.schema}"."${params.table}"`;
      return await this.raw(sql);
   }

   /**
    * DROP TABLE
    *
    * @returns {Promise<null>}
    * @memberof SQLiteClient
    */
   async dropTable (params) {
      const sql = `DROP TABLE "${params.schema}"."${params.table}"`;
      return await this.raw(sql);
   }

   /**
    * @returns {String} SQL string
    * @memberof SQLiteClient
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

      fromRaw += this._query.from ? ` ${this._query.schema ? `"${this._query.schema}".` : ''}"${this._query.from}" ` : '';

      // WHERE
      const whereArray = this._query.where
         .reduce(this._reducer, [])
         ?.map(clausole => clausole.replace('= null', 'IS NULL'));
      const whereRaw = whereArray.length ? `WHERE ${whereArray.join(' AND ')} ` : '';

      // UPDATE
      const updateArray = this._query.update.reduce(this._reducer, []);
      const updateRaw = updateArray.length ? `SET ${updateArray.join(', ')} ` : '';

      // INSERT
      let insertRaw = '';

      if (this._query.insert.length) {
         const fieldsList = Object.keys(this._query.insert[0]);
         const rowsList = this._query.insert.map(el => `(${Object.values(el).join(', ')})`);

         insertRaw = `(${fieldsList.join(', ')}) VALUES ${rowsList.join(', ')} `;
      }

      // GROUP BY
      const groupByArray = this._query.groupBy.reduce(this._reducer, []);
      const groupByRaw = groupByArray.length ? `GROUP BY ${groupByArray.join(', ')} ` : '';

      // ORDER BY
      const orderByArray = this._query.orderBy.reduce(this._reducer, []);
      const orderByRaw = orderByArray.length ? `ORDER BY ${orderByArray.join(', ')} ` : '';

      // LIMIT
      const limitRaw = this._query.limit.length ? `LIMIT ${this._query.limit.join(', ')} ` : '';

      // OFFSET
      const offsetRaw = this._query.offset.length ? `OFFSET ${this._query.offset.join(', ')} ` : '';

      return `${selectRaw}${updateRaw ? 'UPDATE' : ''}${insertRaw ? 'INSERT ' : ''}${this._query.delete ? 'DELETE ' : ''}${fromRaw}${updateRaw}${whereRaw}${groupByRaw}${orderByRaw}${limitRaw}${offsetRaw}${insertRaw}`;
   }

   /**
    * @param {string} sql raw SQL query
    * @param {object} args
    * @param {boolean} args.nest
    * @param {boolean} args.details
    * @param {boolean} args.split
    * @returns {Promise}
    * @memberof SQLiteClient
    */
   async raw (sql, args) {
      if (process.env.NODE_ENV === 'development') this._logger(sql);// TODO: replace BLOB content with a placeholder

      args = {
         nest: false,
         details: false,
         split: true,
         comments: true,
         ...args
      };

      if (!args.comments)
         sql = sql.replace(/(\/\*(.|[\r\n])*?\*\/)|(--(.*|[\r\n]))/gm, '');// Remove comments

      const resultsArr = [];
      let paramsArr = [];
      const queries = args.split
         ? sql.split(/((?:[^;'"]*(?:"(?:\\.|[^"])*"|'(?:\\.|[^'])*')[^;'"]*)+)|;/gm)
            .filter(Boolean)
            .map(q => q.trim())
         : [sql];
      const connection = this._connection;

      for (const query of queries) {
         if (!query) continue;
         const timeStart = new Date();
         let timeStop;
         const keysArr = [];

         const { rows, report, fields, keys, duration } = await new Promise((resolve, reject) => {
            (async () => {
               let queryResult;
               let affectedRows;
               let fields;
               const detectedTypes = {};

               try {
                  const stmt = connection.prepare(query);

                  if (stmt.reader) {
                     queryResult = stmt.all();
                     fields = stmt.columns();

                     if (queryResult.length) {
                        fields.forEach(field => {
                           detectedTypes[field.name] = typeof queryResult[0][field.name];
                        });
                     }
                  }
                  else {
                     const info = queryResult = stmt.run();
                     affectedRows = info.changes;
                  }
               }
               catch (err) {
                  reject(err);
               }

               timeStop = new Date();

               let remappedFields = fields
                  ? fields.map(field => {
                     let [parsedType, length] = field.type?.includes('(')
                        ? field.type.replace(')', '').split('(').map(el => {
                           if (!isNaN(el))
                              el = +el;
                           else
                              el = el.trim();
                           return el;
                        })
                        : [field.type, null];

                     if ([...TIME, ...DATETIME].includes(parsedType)) {
                        const firstNotNull = queryResult.find(res => res[field.name] !== null);
                        if (firstNotNull[field.name].includes('.'))
                           length = firstNotNull[field.name].split('.').pop().length;
                     }

                     return {
                        name: field.name,
                        alias: field.name,
                        orgName: field.column,
                        schema: field.database,
                        table: field.table,
                        tableAlias: field.table,
                        orgTable: field.table,
                        type: field.type !== null ? parsedType : detectedTypes[field.name],
                        length
                     };
                  }).filter(Boolean)
                  : [];

               if (args.details) {
                  paramsArr = remappedFields.map(field => {
                     return {
                        table: field.table,
                        schema: field.schema
                     };
                  }).filter((val, i, arr) => arr.findIndex(el => el.schema === val.schema && el.table === val.table) === i);

                  for (const paramObj of paramsArr) {
                     if (!paramObj.table || !paramObj.schema) continue;

                     try {
                        const indexes = await this.getTableIndexes(paramObj);

                        remappedFields = remappedFields.map(field => {
                        // const detailedField = columns.find(f => f.name === field.name);
                           const fieldIndex = indexes.find(i => i.column === field.name);
                           if (field.table === paramObj.table && field.schema === paramObj.schema) {
                           // if (detailedField) {
                           //    const length = detailedField.numPrecision || detailedField.charLength || detailedField.datePrecision || null;
                           //    field = { ...field, ...detailedField, length };
                           // }

                              if (fieldIndex) {
                                 const key = fieldIndex.type === 'PRIMARY' ? 'pri' : fieldIndex.type === 'UNIQUE' ? 'uni' : 'mul';
                                 field = { ...field, key };
                              };
                           }

                           return field;
                        });
                     }
                     catch (err) {
                        reject(err);
                     }
                  }
               }

               resolve({
                  duration: timeStop - timeStart,
                  rows: Array.isArray(queryResult) ? queryResult.some(el => Array.isArray(el)) ? [] : queryResult : false,
                  report: affectedRows !== undefined ? { affectedRows } : null,
                  fields: remappedFields,
                  keys: keysArr
               });
            })();
         });

         resultsArr.push({ rows, report, fields, keys, duration });
      }

      return resultsArr.length === 1 ? resultsArr[0] : resultsArr;
   }
}
