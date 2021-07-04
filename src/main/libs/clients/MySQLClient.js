'use strict';
import mysql from 'mysql2/promise';
import { AntaresCore } from '../AntaresCore';
import dataTypes from 'common/data-types/mysql';
import * as SSH2Promise from 'ssh2-promise';

export class MySQLClient extends AntaresCore {
   constructor (args) {
      super(args);

      this._schema = null;

      this.types = {
         0: 'DECIMAL',
         1: 'TINYINT',
         2: 'SMALLINT',
         3: 'INT',
         4: 'FLOAT',
         5: 'DOUBLE',
         6: 'NULL',
         7: 'TIMESTAMP',
         8: 'BIGINT',
         9: 'MEDIUMINT',
         10: 'DATE',
         11: 'TIME',
         12: 'DATETIME',
         13: 'YEAR',
         14: 'NEWDATE',
         15: 'VARCHAR',
         16: 'BIT',
         17: 'TIMESTAMP2',
         18: 'DATETIME2',
         19: 'TIME2',
         245: 'JSON',
         246: 'NEWDECIMAL',
         247: 'ENUM',
         248: 'SET',
         249: 'TINY_BLOB',
         250: 'MEDIUM_BLOB',
         251: 'LONG_BLOB',
         252: 'BLOB',
         253: 'VARCHAR',
         254: 'CHAR',
         255: 'GEOMETRY'
      };
   }

   _getType (field) {
      let name = this.types[field.columnType];
      let length = field.columnLength;

      if (['DATE', 'TIME', 'YEAR', 'DATETIME'].includes(name))
         length = field.decimals;

      if (name === 'TIMESTAMP')
         length = 0;

      if (field.charsetNr === 63) { // if binary
         if (name === 'CHAR')
            name = 'BINARY';
         else if (name === 'VARCHAR')
            name = 'VARBINARY';
      }

      if (name === 'BLOB') {
         switch (length) {
            case 765:
               name = 'TYNITEXT';
               break;
            case 196605:
               name = 'TEXT';
               break;
            case 50331645:
               name = 'MEDIUMTEXT';
               break;
            case 4294967295:
               name = field.charsetNr === 63 ? 'LONGBLOB' : 'LONGTEXT';
               break;
            case 255:
               name = 'TINYBLOB';
               break;
            case 65535:
               name = 'BLOB';
               break;
            case 16777215:
               name = 'MEDIUMBLOB';
               break;
            default:
               name = field.charsetNr === 63 ? 'BLOB' : 'TEXT';
         }
      }

      return { name, length };
   }

   _getTypeInfo (type) {
      return dataTypes
         .reduce((acc, group) => [...acc, ...group.types], [])
         .filter(_type => _type.name === type.toUpperCase())[0];
   }

   /**
    * @memberof MySQLClient
    */
   async connect () {
      delete this._params.application_name;

      const dbConfig = {
         host: this._params.host,
         port: this._params.port,
         user: this._params.user,
         password: this._params.password
      };

      if (this._params.database?.length) dbConfig.database = this._params.database;

      if (this._params.ssl) dbConfig.ssl = { ...this._params.ssl };

      if (this._params.ssh) {
         this._ssh = new SSH2Promise({ ...this._params.ssh });

         this._tunnel = await this._ssh.addTunnel({
            remoteAddr: this._params.host,
            remotePort: this._params.port
         });
         dbConfig.port = this._tunnel.localPort;
      }

      if (!this._poolSize) this._connection = await mysql.createConnection(dbConfig);
      else {
         this._connection = mysql.createPool({
            ...dbConfig,
            connectionLimit: this._poolSize,
            typeCast: (field, next) => {
               if (field.type === 'DATETIME')
                  return field.string();
               else
                  return next();
            }
         });
      }
   }

   /**
    * @memberof MySQLClient
    */
   destroy () {
      this._connection.end();
      if (this._ssh) this._ssh.close();
   }

   /**
    * Executes an USE query
    *
    * @param {String} schema
    * @memberof MySQLClient
    */
   use (schema) {
      this._schema = schema;
      return this.raw(`USE \`${schema}\``);
   }

   /**
    * @param {Array} schemas list
    * @returns {Array.<Object>} databases scructure
    * @memberof MySQLClient
    */
   async getStructure (schemas) {
      const { rows: databases } = await this.raw('SHOW DATABASES');
      const { rows: functions } = await this.raw('SHOW FUNCTION STATUS');
      const { rows: procedures } = await this.raw('SHOW PROCEDURE STATUS');
      const { rows: schedulers } = await this.raw('SELECT *, EVENT_SCHEMA AS `Db`, EVENT_NAME AS `Name` FROM information_schema.`EVENTS`');

      const tablesArr = [];
      const triggersArr = [];

      for (const db of databases) {
         if (!schemas.has(db.Database)) continue;

         let { rows: tables } = await this.raw(`SHOW TABLE STATUS FROM \`${db.Database}\``);
         if (tables.length) {
            tables = tables.map(table => {
               table.Db = db.Database;
               return table;
            });
            tablesArr.push(...tables);
         }

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
         if (schemas.has(db.Database)) {
            // TABLES
            const remappedTables = tablesArr.filter(table => table.Db === db.Database).map(table => {
               let tableType;
               switch (table.Comment) {
                  case 'VIEW':
                     tableType = 'view';
                     break;
                  default:
                     tableType = 'table';
                     break;
               }

               return {
                  name: table.Name,
                  type: tableType,
                  rows: table.Rows,
                  created: table.Create_time,
                  updated: table.Update_time,
                  engine: table.Engine,
                  comment: table.Comment,
                  size: table.Data_length + table.Index_length,
                  autoIncrement: table.Auto_increment,
                  collation: table.Collation
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

            // FUNCTIONS
            const remappedFunctions = functions.filter(func => func.Db === db.Database).map(func => {
               return {
                  name: func.Name,
                  type: func.Type,
                  definer: func.Definer,
                  created: func.Created,
                  updated: func.Modified,
                  comment: func.Comment,
                  charset: func.character_set_client,
                  security: func.Security_type
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
               functions: remappedFunctions,
               procedures: remappedProcedures,
               triggers: remappedTriggers,
               schedulers: remappedSchedulers
            };
         }
         else {
            return {
               name: db.Database,
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
    * @memberof MySQLClient
    */
   async getTableColumns ({ schema, table }) {
      const { rows } = await this
         .select('*')
         .schema('information_schema')
         .from('COLUMNS')
         .where({ TABLE_SCHEMA: `= '${this._schema || schema}'`, TABLE_NAME: `= '${table}'` })
         .orderBy({ ORDINAL_POSITION: 'ASC' })
         .run();

      const { rows: fields } = await this.raw(`SHOW CREATE TABLE \`${this._schema || schema}\`.\`${table}\``);

      const remappedFields = fields.map(row => {
         if (!row['Create Table']) return false;

         let n = 0;
         return row['Create Table']
            .split('')
            .reduce((acc, curr) => {
               if (curr === ')') n--;
               if (n !== 0) acc += curr;
               if (curr === '(') n++;
               return acc;
            }, '')
            .replaceAll('\n', '')
            .split(',')
            .map(f => {
               try {
                  const fieldArr = f.trim().split(' ');
                  const nameAndType = fieldArr.slice(0, 2);
                  if (nameAndType[0].charAt(0) !== '`') return false;

                  const details = fieldArr.slice(2).join(' ');
                  let defaultValue = null;
                  if (details.includes('DEFAULT')) {
                     defaultValue = details.match(/(?<=DEFAULT ).*?$/gs)[0].split(' COMMENT')[0];
                     const defaultValueArr = defaultValue.split('');
                     if (defaultValueArr[0] === '\'') {
                        defaultValueArr.shift();
                        defaultValueArr.pop();
                        defaultValue = defaultValueArr.join('');
                     }
                  }

                  const typeAndLength = nameAndType[1].replace(')', '').split('(');

                  return {
                     name: nameAndType[0].replaceAll('`', ''),
                     type: typeAndLength[0].toUpperCase(),
                     length: typeAndLength[1] ? typeAndLength[1] : null,
                     default: defaultValue
                  };
               }
               catch (err) {
                  return false;
               }
            })
            .filter(Boolean)
            .reduce((acc, curr) => {
               acc[curr.name] = curr;
               return acc;
            }, {});
      })[0];

      return rows.map(field => {
         let numLength = field.COLUMN_TYPE.match(/int\(([^)]+)\)/);
         numLength = numLength ? +numLength.pop() : null;
         const enumValues = /(enum|set)/.test(field.COLUMN_TYPE)
            ? field.COLUMN_TYPE.match(/\(([^)]+)\)/)[0].slice(1, -1)
            : null;

         return {
            name: field.COLUMN_NAME,
            key: field.COLUMN_KEY.toLowerCase(),
            type: remappedFields ? remappedFields[field.COLUMN_NAME].type : field.DATA_TYPE,
            schema: field.TABLE_SCHEMA,
            table: field.TABLE_NAME,
            numPrecision: field.NUMERIC_PRECISION,
            numLength,
            enumValues,
            datePrecision: field.DATETIME_PRECISION,
            charLength: field.CHARACTER_MAXIMUM_LENGTH,
            nullable: field.IS_NULLABLE.includes('YES'),
            unsigned: field.COLUMN_TYPE.includes('unsigned'),
            zerofill: field.COLUMN_TYPE.includes('zerofill'),
            order: field.ORDINAL_POSITION,
            default: remappedFields ? remappedFields[field.COLUMN_NAME].default : field.COLUMN_DEFAULT,
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

      const { rows: extras } = await this
         .select('*')
         .schema('information_schema')
         .from('REFERENTIAL_CONSTRAINTS')
         .where({ CONSTRAINT_SCHEMA: `= '${schema}'`, TABLE_NAME: `= '${table}'`, REFERENCED_TABLE_NAME: 'IS NOT NULL' })
         .run();

      return rows.map(field => {
         const extra = extras.find(x => x.CONSTRAINT_NAME === field.CONSTRAINT_NAME);
         return {
            schema: field.TABLE_SCHEMA,
            table: field.TABLE_NAME,
            field: field.COLUMN_NAME,
            position: field.ORDINAL_POSITION,
            constraintPosition: field.POSITION_IN_UNIQUE_CONSTRAINT,
            constraintName: field.CONSTRAINT_NAME,
            refSchema: field.REFERENCED_TABLE_SCHEMA,
            refTable: field.REFERENCED_TABLE_NAME,
            refField: field.REFERENCED_COLUMN_NAME,
            onUpdate: extra.UPDATE_RULE,
            onDelete: extra.DELETE_RULE
         };
      });
   }

   /**
    * SELECT `user`, `host`, authentication_string) AS `password` FROM `mysql`.`user`
    *
    * @returns {Array.<Object>} users list
    * @memberof MySQLClient
    */
   async getUsers () {
      const { rows } = await this.raw('SELECT `user`, `host`, authentication_string AS `password` FROM `mysql`.`user`');

      return rows.map(row => {
         return {
            name: row.user,
            host: row.host,
            password: row.password
         };
      });
   }

   /**
    * CREATE DATABASE
    *
    * @returns {Array.<Object>} parameters
    * @memberof MySQLClient
    */
   async createSchema (params) {
      return await this.raw(`CREATE DATABASE \`${params.name}\` COLLATE ${params.collation}`);
   }

   /**
    * ALTER DATABASE
    *
    * @returns {Array.<Object>} parameters
    * @memberof MySQLClient
    */
   async alterSchema (params) {
      return await this.raw(`ALTER DATABASE \`${params.name}\` COLLATE ${params.collation}`);
   }

   /**
    * DROP DATABASE
    *
    * @returns {Array.<Object>} parameters
    * @memberof MySQLClient
    */
   async dropSchema (params) {
      return await this.raw(`DROP DATABASE \`${params.database}\``);
   }

   /**
    * @returns {Array.<Object>} parameters
    * @memberof MySQLClient
    */
   async getDatabaseCollation (params) {
      return await this.raw(`SELECT \`DEFAULT_COLLATION_NAME\` FROM \`information_schema\`.\`SCHEMATA\` WHERE \`SCHEMA_NAME\`='${params.database}'`);
   }

   /**
    * SHOW CREATE VIEW
    *
    * @returns {Array.<Object>} view informations
    * @memberof MySQLClient
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
    * @memberof MySQLClient
    */
   async dropView (params) {
      const sql = `DROP VIEW \`${this._schema}\`.\`${params.view}\``;
      return await this.raw(sql);
   }

   /**
    * ALTER VIEW
    *
    * @returns {Array.<Object>} parameters
    * @memberof MySQLClient
    */
   async alterView (params) {
      const { view } = params;
      let sql = `ALTER ALGORITHM = ${view.algorithm}${view.definer ? ` DEFINER=${view.definer}` : ''} SQL SECURITY ${view.security} VIEW \`${this._schema}\`.\`${view.oldName}\` AS ${view.sql} ${view.updateOption ? `WITH ${view.updateOption} CHECK OPTION` : ''}`;

      if (view.name !== view.oldName)
         sql += `; RENAME TABLE \`${this._schema}\`.\`${view.oldName}\` TO \`${this._schema}\`.\`${view.name}\``;

      return await this.raw(sql);
   }

   /**
    * CREATE VIEW
    *
    * @returns {Array.<Object>} parameters
    * @memberof MySQLClient
    */
   async createView (view) {
      const sql = `CREATE ALGORITHM = ${view.algorithm} ${view.definer ? `DEFINER=${view.definer} ` : ''}SQL SECURITY ${view.security} VIEW \`${this._schema}\`.\`${view.name}\` AS ${view.sql} ${view.updateOption ? `WITH ${view.updateOption} CHECK OPTION` : ''}`;
      return await this.raw(sql);
   }

   /**
    * SHOW CREATE TRIGGER
    *
    * @returns {Array.<Object>} view informations
    * @memberof MySQLClient
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
    * @memberof MySQLClient
    */
   async dropTrigger (params) {
      const sql = `DROP TRIGGER \`${this._schema}\`.\`${params.trigger}\``;
      return await this.raw(sql);
   }

   /**
    * ALTER TRIGGER
    *
    * @returns {Array.<Object>} parameters
    * @memberof MySQLClient
    */
   async alterTrigger (params) {
      const { trigger } = params;
      const tempTrigger = Object.assign({}, trigger);
      tempTrigger.name = `Antares_${tempTrigger.name}_tmp`;

      try {
         await this.createTrigger(tempTrigger);
         await this.dropTrigger({ trigger: tempTrigger.name });
         await this.dropTrigger({ trigger: trigger.oldName });
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
    * @memberof MySQLClient
    */
   async createTrigger (trigger) {
      const sql = `CREATE ${trigger.definer ? `DEFINER=${trigger.definer} ` : ''}TRIGGER \`${this._schema}\`.\`${trigger.name}\` ${trigger.activation} ${trigger.event} ON \`${trigger.table}\` FOR EACH ROW ${trigger.sql}`;
      return await this.raw(sql, { split: false });
   }

   /**
    * SHOW CREATE PROCEDURE
    *
    * @returns {Array.<Object>} view informations
    * @memberof MySQLClient
    */
   async getRoutineInformations ({ schema, routine }) {
      const sql = `SHOW CREATE PROCEDURE \`${schema}\`.\`${routine}\``;
      const results = await this.raw(sql);

      return results.rows.map(async row => {
         if (!row['Create Procedure']) {
            return {
               definer: null,
               sql: '',
               parameters: [],
               name: row.Procedure,
               comment: '',
               security: 'DEFINER',
               deterministic: false,
               dataAccess: 'CONTAINS SQL'
            };
         }

         const sql = `SELECT * 
               FROM information_schema.parameters 
               WHERE SPECIFIC_NAME = '${routine}'
               AND SPECIFIC_SCHEMA = '${schema}'
               ORDER BY ORDINAL_POSITION
            `;

         const results = await this.raw(sql);

         const parameters = results.rows.map(row => {
            return {
               name: row.PARAMETER_NAME,
               type: row.DATA_TYPE.toUpperCase(),
               length: row.NUMERIC_PRECISION || row.DATETIME_PRECISION || row.CHARACTER_MAXIMUM_LENGTH || '',
               context: row.PARAMETER_MODE
            };
         });

         let dataAccess = 'CONTAINS SQL';
         if (row['Create Procedure'].includes('NO SQL'))
            dataAccess = 'NO SQL';
         if (row['Create Procedure'].includes('READS SQL DATA'))
            dataAccess = 'READS SQL DATA';
         if (row['Create Procedure'].includes('MODIFIES SQL DATA'))
            dataAccess = 'MODIFIES SQL DATA';

         return {
            definer: row['Create Procedure'].match(/(?<=DEFINER=).*?(?=\s)/gs)[0],
            sql: row['Create Procedure'].match(/(BEGIN|begin)(.*)(END|end)/gs)[0],
            parameters: parameters || [],
            name: row.Procedure,
            comment: row['Create Procedure'].match(/(?<=COMMENT ').*?(?=')/gs) ? row['Create Procedure'].match(/(?<=COMMENT ').*?(?=')/gs)[0] : '',
            security: row['Create Procedure'].includes('SQL SECURITY INVOKER') ? 'INVOKER' : 'DEFINER',
            deterministic: row['Create Procedure'].includes('DETERMINISTIC'),
            dataAccess
         };
      })[0];
   }

   /**
    * DROP PROCEDURE
    *
    * @returns {Array.<Object>} parameters
    * @memberof MySQLClient
    */
   async dropRoutine (params) {
      const sql = `DROP PROCEDURE \`${this._schema}\`.\`${params.routine}\``;
      return await this.raw(sql);
   }

   /**
    * ALTER PROCEDURE
    *
    * @returns {Array.<Object>} parameters
    * @memberof MySQLClient
    */
   async alterRoutine (params) {
      const { routine } = params;
      const tempProcedure = Object.assign({}, routine);
      tempProcedure.name = `Antares_${tempProcedure.name}_tmp`;

      try {
         await this.createRoutine(tempProcedure);
         await this.dropRoutine({ routine: tempProcedure.name });
         await this.dropRoutine({ routine: routine.oldName });
         await this.createRoutine(routine);
      }
      catch (err) {
         return Promise.reject(err);
      }
   }

   /**
    * CREATE PROCEDURE
    *
    * @returns {Array.<Object>} parameters
    * @memberof MySQLClient
    */
   async createRoutine (routine) {
      const parameters = 'parameters' in routine
         ? routine.parameters.reduce((acc, curr) => {
            acc.push(`${curr.context} \`${curr.name}\` ${curr.type}${curr.length ? `(${curr.length})` : ''}`);
            return acc;
         }, []).join(',')
         : '';

      const sql = `CREATE ${routine.definer ? `DEFINER=${routine.definer} ` : ''}PROCEDURE \`${this._schema}\`.\`${routine.name}\`(${parameters})
         LANGUAGE SQL
         ${routine.deterministic ? 'DETERMINISTIC' : 'NOT DETERMINISTIC'}
         ${routine.dataAccess}
         SQL SECURITY ${routine.security}
         COMMENT '${routine.comment}'
         ${routine.sql}`;

      return await this.raw(sql, { split: false });
   }

   /**
    * SHOW CREATE FUNCTION
    *
    * @returns {Array.<Object>} view informations
    * @memberof MySQLClient
    */
   async getFunctionInformations ({ schema, func }) {
      const sql = `SHOW CREATE FUNCTION \`${schema}\`.\`${func}\``;
      const results = await this.raw(sql);

      return results.rows.map(async row => {
         if (!row['Create Function']) {
            return {
               definer: null,
               sql: '',
               parameters: [],
               name: row.Procedure,
               comment: '',
               security: 'DEFINER',
               deterministic: false,
               dataAccess: 'CONTAINS SQL',
               returns: 'INT',
               returnsLength: null
            };
         }

         const sql = `SELECT * 
            FROM information_schema.parameters 
            WHERE SPECIFIC_NAME = '${func}'
            AND SPECIFIC_SCHEMA = '${schema}'
            ORDER BY ORDINAL_POSITION
         `;

         const results = await this.raw(sql);

         const parameters = results.rows.filter(row => row.PARAMETER_MODE).map(row => {
            return {
               name: row.PARAMETER_NAME,
               type: row.DATA_TYPE.toUpperCase(),
               length: row.NUMERIC_PRECISION || row.DATETIME_PRECISION || row.CHARACTER_MAXIMUM_LENGTH || '',
               context: row.PARAMETER_MODE
            };
         });

         let dataAccess = 'CONTAINS SQL';
         if (row['Create Function'].includes('NO SQL'))
            dataAccess = 'NO SQL';
         if (row['Create Function'].includes('READS SQL DATA'))
            dataAccess = 'READS SQL DATA';
         if (row['Create Function'].includes('MODIFIES SQL DATA'))
            dataAccess = 'MODIFIES SQL DATA';

         const output = row['Create Function'].match(/(?<=RETURNS ).*?(?=\s)/gs).length ? row['Create Function'].match(/(?<=RETURNS ).*?(?=\s)/gs)[0].replace(')', '').split('(') : ['', null];

         return {
            definer: row['Create Function'].match(/(?<=DEFINER=).*?(?=\s)/gs)[0],
            sql: row['Create Function'].match(/(BEGIN|begin)(.*)(END|end)/gs)[0],
            parameters: parameters || [],
            name: row.Function,
            comment: row['Create Function'].match(/(?<=COMMENT ').*?(?=')/gs) ? row['Create Function'].match(/(?<=COMMENT ').*?(?=')/gs)[0] : '',
            security: row['Create Function'].includes('SQL SECURITY INVOKER') ? 'INVOKER' : 'DEFINER',
            deterministic: row['Create Function'].includes('DETERMINISTIC'),
            dataAccess,
            returns: output[0].toUpperCase(),
            returnsLength: +output[1]
         };
      })[0];
   }

   /**
    * DROP FUNCTION
    *
    * @returns {Array.<Object>} parameters
    * @memberof MySQLClient
    */
   async dropFunction (params) {
      const sql = `DROP FUNCTION \`${this._schema}\`.\`${params.func}\``;
      return await this.raw(sql);
   }

   /**
    * ALTER FUNCTION
    *
    * @returns {Array.<Object>} parameters
    * @memberof MySQLClient
    */
   async alterFunction (params) {
      const { func } = params;
      const tempProcedure = Object.assign({}, func);
      tempProcedure.name = `Antares_${tempProcedure.name}_tmp`;

      try {
         await this.createFunction(tempProcedure);
         await this.dropFunction({ func: tempProcedure.name });
         await this.dropFunction({ func: func.oldName });
         await this.createFunction(func);
      }
      catch (err) {
         return Promise.reject(err);
      }
   }

   /**
    * CREATE FUNCTION
    *
    * @returns {Array.<Object>} parameters
    * @memberof MySQLClient
    */
   async createFunction (func) {
      const parameters = func.parameters.reduce((acc, curr) => {
         acc.push(`\`${curr.name}\` ${curr.type}${curr.length ? `(${curr.length})` : ''}`);
         return acc;
      }, []).join(',');

      const body = func.returns ? func.sql : 'BEGIN\n  RETURN 0;\nEND';

      const sql = `CREATE ${func.definer ? `DEFINER=${func.definer} ` : ''}FUNCTION \`${this._schema}\`.\`${func.name}\`(${parameters}) RETURNS ${func.returns || 'SMALLINT'}${func.returnsLength ? `(${func.returnsLength})` : ''}
         LANGUAGE SQL
         ${func.deterministic ? 'DETERMINISTIC' : 'NOT DETERMINISTIC'}
         ${func.dataAccess}
         SQL SECURITY ${func.security}
         COMMENT '${func.comment}'
         ${body}`;

      return await this.raw(sql, { split: false });
   }

   /**
    * SHOW CREATE EVENT
    *
    * @returns {Array.<Object>} view informations
    * @memberof MySQLClient
    */
   async getEventInformations ({ schema, scheduler }) {
      const sql = `SHOW CREATE EVENT \`${schema}\`.\`${scheduler}\``;
      const results = await this.raw(sql);

      return results.rows.map(row => {
         const schedule = row['Create Event'];
         const execution = schedule.includes('EVERY') ? 'EVERY' : 'ONCE';
         const every = execution === 'EVERY' ? row['Create Event'].match(/(?<=EVERY )(\s*([^\s]+)){0,2}/gs)[0].replaceAll('\'', '').split(' ') : [];
         const starts = execution === 'EVERY' && schedule.includes('STARTS') ? schedule.match(/(?<=STARTS ').*?(?='\s)/gs)[0] : '';
         const ends = execution === 'EVERY' && schedule.includes('ENDS') ? schedule.match(/(?<=ENDS ').*?(?='\s)/gs)[0] : '';
         const at = execution === 'ONCE' && schedule.includes('AT') ? schedule.match(/(?<=AT ').*?(?='\s)/gs)[0] : '';

         return {
            definer: row['Create Event'].match(/(?<=DEFINER=).*?(?=\s)/gs)[0],
            sql: row['Create Event'].match(/(?<=DO )(.*)/gs)[0],
            name: row.Event,
            comment: row['Create Event'].match(/(?<=COMMENT ').*?(?=')/gs) ? row['Create Event'].match(/(?<=COMMENT ').*?(?=')/gs)[0] : '',
            state: row['Create Event'].includes('ENABLE') ? 'ENABLE' : row['Create Event'].includes('DISABLE ON SLAVE') ? 'DISABLE ON SLAVE' : 'DISABLE',
            preserve: row['Create Event'].includes('ON COMPLETION PRESERVE'),
            execution,
            every,
            starts,
            ends,
            at
         };
      })[0];
   }

   /**
    * DROP EVENT
    *
    * @returns {Array.<Object>} parameters
    * @memberof MySQLClient
    */
   async dropEvent (params) {
      const sql = `DROP EVENT \`${this._schema}\`.\`${params.scheduler}\``;
      return await this.raw(sql);
   }

   /**
    * ALTER EVENT
    *
    * @returns {Array.<Object>} parameters
    * @memberof MySQLClient
    */
   async alterEvent (params) {
      const { scheduler } = params;

      if (scheduler.execution === 'EVERY' && scheduler.every[0].includes('-'))
         scheduler.every[0] = `'${scheduler.every[0]}'`;

      const sql = `ALTER ${scheduler.definer ? ` DEFINER=${scheduler.definer}` : ''} EVENT \`${this._schema}\`.\`${scheduler.oldName}\` 
      ON SCHEDULE
         ${scheduler.execution === 'EVERY'
      ? `EVERY ${scheduler.every.join(' ')}${scheduler.starts ? ` STARTS '${scheduler.starts}'` : ''}${scheduler.ends ? ` ENDS '${scheduler.ends}'` : ''}`
      : `AT '${scheduler.at}'`}
      ON COMPLETION${!scheduler.preserve ? ' NOT' : ''} PRESERVE
      ${scheduler.name !== scheduler.oldName ? `RENAME TO \`${this._schema}\`.\`${scheduler.name}\`` : ''}
      ${scheduler.state}
      COMMENT '${scheduler.comment}'
      DO ${scheduler.sql}`;

      return await this.raw(sql, { split: false });
   }

   /**
    * CREATE EVENT
    *
    * @returns {Array.<Object>} parameters
    * @memberof MySQLClient
    */
   async createEvent (scheduler) {
      const sql = `CREATE ${scheduler.definer ? ` DEFINER=${scheduler.definer}` : ''} EVENT \`${this._schema}\`.\`${scheduler.name}\` 
      ON SCHEDULE
         ${scheduler.execution === 'EVERY'
      ? `EVERY ${scheduler.every.join(' ')}${scheduler.starts ? ` STARTS '${scheduler.starts}'` : ''}${scheduler.ends ? ` ENDS '${scheduler.ends}'` : ''}`
      : `AT '${scheduler.at}'`}
      ON COMPLETION${!scheduler.preserve ? ' NOT' : ''} PRESERVE
      ${scheduler.state}
      COMMENT '${scheduler.comment}'
      DO ${scheduler.sql}`;

      return await this.raw(sql, { split: false });
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
            transactions: row.Transactions,
            xa: row.XA,
            savepoints: row.Savepoints,
            isDefault: row.Support.includes('DEFAULT')
         };
      });
   }

   /**
    * SHOW VARIABLES LIKE '%vers%'
    *
    * @returns {Array.<Object>} version parameters
    * @memberof MySQLClient
    */
   async getVersion () {
      const sql = 'SHOW VARIABLES LIKE "%vers%"';
      const { rows } = await this.raw(sql);

      return rows.reduce((acc, curr) => {
         switch (curr.Variable_name) {
            case 'version':
               acc.number = curr.Value.split('-')[0];
               break;
            case 'version_comment':
               acc.name = curr.Value.replace('(GPL)', '');
               break;
            case 'version_compile_machine':
               acc.arch = curr.Value;
               break;
            case 'version_compile_os':
               acc.os = curr.Value;
               break;
         }
         return acc;
      }, {});
   }

   async getProcesses () {
      const sql = 'SELECT `ID`, `USER`, `HOST`, `DB`, `COMMAND`, `TIME`, `STATE`, LEFT(`INFO`, 51200) AS `INFO` FROM `information_schema`.`PROCESSLIST`';

      const { rows } = await this.raw(sql);

      return rows.map(row => {
         return {
            id: row.ID,
            user: row.USER,
            host: row.HOST,
            db: row.DB,
            command: row.COMMAND,
            time: row.TIME,
            state: row.STATE,
            info: row.INFO
         };
      });
   }

   /**
    * CREATE TABLE
    *
    * @returns {Array.<Object>} parameters
    * @memberof MySQLClient
    */
   async createTable (params) {
      const {
         name,
         collation,
         comment,
         engine
      } = params;

      const sql = `CREATE TABLE \`${this._schema}\`.\`${name}\` (\`${name}_ID\` INT NULL) COMMENT='${comment}', COLLATE='${collation}', ENGINE=${engine}`;

      return await this.raw(sql);
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
         foreignChanges,
         options
      } = params;

      let sql = `ALTER TABLE \`${this._schema || params.options.schema}\`.\`${table}\` `;
      const alterColumns = [];

      // OPTIONS
      if ('comment' in options) alterColumns.push(`COMMENT='${options.comment}'`);
      if ('engine' in options) alterColumns.push(`ENGINE=${options.engine}`);
      if ('autoIncrement' in options) alterColumns.push(`AUTO_INCREMENT=${+options.autoIncrement}`);
      if ('collation' in options) alterColumns.push(`COLLATE='${options.collation}'`);

      // ADD FIELDS
      additions.forEach(addition => {
         const typeInfo = this._getTypeInfo(addition.type);
         const length = typeInfo.length ? addition.enumValues || addition.numLength || addition.charLength || addition.datePrecision : false;

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

      // ADD FOREIGN KEYS
      foreignChanges.additions.forEach(addition => {
         alterColumns.push(`ADD CONSTRAINT \`${addition.constraintName}\` FOREIGN KEY (\`${addition.field}\`) REFERENCES \`${addition.refTable}\` (\`${addition.refField}\`) ON UPDATE ${addition.onUpdate} ON DELETE ${addition.onDelete}`);
      });

      // CHANGE FIELDS
      changes.forEach(change => {
         const typeInfo = this._getTypeInfo(change.type);
         const length = typeInfo.length ? change.enumValues || change.numLength || change.charLength || change.datePrecision : false;

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

      // CHANGE FOREIGN KEYS
      foreignChanges.changes.forEach(change => {
         alterColumns.push(`DROP FOREIGN KEY \`${change.oldName}\``);
         alterColumns.push(`ADD CONSTRAINT \`${change.constraintName}\` FOREIGN KEY (\`${change.field}\`) REFERENCES \`${change.refTable}\` (\`${change.refField}\`) ON UPDATE ${change.onUpdate} ON DELETE ${change.onDelete}`);
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

      // DROP FOREIGN KEYS
      foreignChanges.deletions.forEach(deletion => {
         alterColumns.push(`DROP FOREIGN KEY \`${deletion.constraintName}\``);
      });

      sql += alterColumns.join(', ');

      // RENAME
      if (options.name) sql += `; RENAME TABLE \`${this._schema}\`.\`${table}\` TO \`${this._schema}\`.\`${options.name}\``;

      return await this.raw(sql);
   }

   /**
    * DUPLICATE TABLE
    *
    * @returns {Array.<Object>} parameters
    * @memberof MySQLClient
    */
   async duplicateTable (params) {
      const sql = `CREATE TABLE \`${this._schema}\`.\`${params.table}_copy\` LIKE \`${this._schema}\`.\`${params.table}\``;
      return await this.raw(sql);
   }

   /**
    * TRUNCATE TABLE
    *
    * @returns {Array.<Object>} parameters
    * @memberof MySQLClient
    */
   async truncateTable (params) {
      const sql = `TRUNCATE TABLE \`${this._schema}\`.\`${params.table}\``;
      return await this.raw(sql);
   }

   /**
    * DROP TABLE
    *
    * @returns {Array.<Object>} parameters
    * @memberof MySQLClient
    */
   async dropTable (params) {
      const sql = `DROP TABLE \`${this._schema}\`.\`${params.table}\``;
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
    * @memberof MySQLClient
    */
   async raw (sql, args) {
      sql = sql.replace(/(\/\*(.|[\r\n])*?\*\/)|(--(.*|[\r\n]))/gm, '');
      if (process.env.NODE_ENV === 'development') this._logger(sql);// TODO: replace BLOB content with a placeholder

      args = {
         nest: false,
         details: false,
         split: true,
         ...args
      };

      const nestTables = args.nest ? '.' : false;
      const resultsArr = [];
      let paramsArr = [];
      const queries = args.split
         ? sql.split(/((?:[^;'"]*(?:"(?:\\.|[^"])*"|'(?:\\.|[^'])*')[^;'"]*)+)|;/gm)
            .filter(Boolean)
            .map(q => q.trim())
         : [sql];
      const isPool = typeof this._connection.getConnection === 'function';
      const connection = isPool ? await this._connection.getConnection() : this._connection;

      if (args.schema)
         await connection.query(`USE \`${args.schema}\``);

      for (const query of queries) {
         if (!query) continue;
         const timeStart = new Date();
         let timeStop;
         let keysArr = [];

         const { rows, report, fields, keys, duration } = await new Promise((resolve, reject) => {
            connection.query({ sql: query, nestTables }).then(async ([response, fields]) => {
               timeStop = new Date();
               const queryResult = response;

               let remappedFields = fields
                  ? fields.map(field => {
                     if (!field || Array.isArray(field))
                        return false;

                     const type = this._getType(field);

                     return {
                        name: field.orgName,
                        alias: field.name,
                        orgName: field.orgName,
                        schema: field.schema,
                        table: field.table,
                        tableAlias: field.table,
                        orgTable: field.orgTable,
                        type: type.name,
                        length: type.length
                     };
                  }).filter(Boolean)
                  : [];

               if (args.details) {
                  let cachedTable;

                  if (remappedFields.length) {
                     paramsArr = remappedFields.map(field => {
                        if (field.orgTable) cachedTable = field.orgTable;// Needed for some queries on information_schema
                        return {
                           table: field.orgTable || cachedTable,
                           schema: field.schema || 'INFORMATION_SCHEMA'
                        };
                     }).filter((val, i, arr) => arr.findIndex(el => el.schema === val.schema && el.table === val.table) === i);

                     for (const paramObj of paramsArr) {
                        if (!paramObj.table || !paramObj.schema) continue;

                        try { // Column details
                           const response = await this.getTableColumns(paramObj);
                           remappedFields = remappedFields.map(field => {
                              const detailedField = response.find(f => f.name === field.name);
                              if (detailedField && field.orgTable === paramObj.table && field.schema === paramObj.schema)
                                 field = { ...field, ...detailedField };
                              return field;
                           });
                        }
                        catch (err) {
                           if (isPool) connection.release();
                           reject(err);
                        }

                        try { // Key usage (foreign keys)
                           const response = await this.getKeyUsage(paramObj);
                           keysArr = keysArr ? [...keysArr, ...response] : response;
                        }
                        catch (err) {
                           if (isPool) connection.release();
                           reject(err);
                        }
                     }
                  }
               }

               resolve({
                  duration: timeStop - timeStart,
                  rows: Array.isArray(queryResult) ? queryResult.some(el => Array.isArray(el)) ? [] : queryResult : false,
                  report: !Array.isArray(queryResult) ? queryResult : false,
                  fields: remappedFields,
                  keys: keysArr
               });
            }).catch((err) => {
               if (isPool) connection.release();
               reject(err);
            });
         });

         resultsArr.push({ rows, report, fields, keys, duration });
      }

      if (isPool) connection.release();

      return resultsArr.length === 1 ? resultsArr[0] : resultsArr;
   }
}
