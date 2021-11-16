'use strict';
import sqlite from 'better-sqlite3';
import { AntaresCore } from '../AntaresCore';
import dataTypes from 'common/data-types/mysql';

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
      const { rows } = await this
         .select('*')
         .schema('information_schema')
         .from('COLUMNS')
         .where({ TABLE_SCHEMA: `= '${schema}'`, TABLE_NAME: `= '${table}'` })
         .orderBy({ ORDINAL_POSITION: 'ASC' })
         .run();

      const { rows: fields } = await this.raw(`SHOW CREATE TABLE \`${schema}\`.\`${table}\``);

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
                  if (details.includes('DEFAULT'))
                     defaultValue = details.match(/(?<=DEFAULT ).*?$/gs)[0].split(' COMMENT')[0];
                     // const defaultValueArr = defaultValue.split('');
                     // if (defaultValueArr[0] === '\'') {
                     //    defaultValueArr.shift();
                     //    defaultValueArr.pop();
                     //    defaultValue = defaultValueArr.join('');
                     // }

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
      const { rows } = await this.raw(`SHOW TABLE STATUS FROM \`${schema}\` WHERE Name = '${table}'`);

      if (rows.length) {
         let tableType;
         switch (rows[0].Comment) {
            case 'VIEW':
               tableType = 'view';
               break;
            default:
               tableType = 'table';
               break;
         }

         return {
            name: rows[0].Name,
            type: tableType,
            rows: rows[0].Rows,
            created: rows[0].Create_time,
            updated: rows[0].Update_time,
            engine: rows[0].Engine,
            comment: rows[0].Comment,
            size: rows[0].Data_length + rows[0].Index_length,
            autoIncrement: rows[0].Auto_increment,
            collation: rows[0].Collation
         };
      };
      return {};
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

   async getUsers () {}

   /**
    * CREATE DATABASE
    *
    * @returns {Array.<Object>} parameters
    * @memberof SQLiteClient
    */
   async createSchema (params) {
      return await this.raw(`CREATE DATABASE \`${params.name}\` COLLATE ${params.collation}`);
   }

   /**
    * ALTER DATABASE
    *
    * @returns {Array.<Object>} parameters
    * @memberof SQLiteClient
    */
   async alterSchema (params) {
      return await this.raw(`ALTER DATABASE \`${params.name}\` COLLATE ${params.collation}`);
   }

   /**
    * DROP DATABASE
    *
    * @returns {Array.<Object>} parameters
    * @memberof SQLiteClient
    */
   async dropSchema (params) {
      return await this.raw(`DROP DATABASE \`${params.database}\``);
   }

   /**
    * @returns {Array.<Object>} parameters
    * @memberof SQLiteClient
    */
   async getDatabaseCollation (params) {
      return await this.raw(`SELECT \`DEFAULT_COLLATION_NAME\` FROM \`information_schema\`.\`SCHEMATA\` WHERE \`SCHEMA_NAME\`='${params.database}'`);
   }

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
    * SHOW CREATE PROCEDURE
    *
    * @returns {Array.<Object>} view informations
    * @memberof SQLiteClient
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
    * @memberof SQLiteClient
    */
   async dropRoutine (params) {
      const sql = `DROP PROCEDURE \`${params.schema}\`.\`${params.routine}\``;
      return await this.raw(sql);
   }

   /**
    * ALTER PROCEDURE
    *
    * @returns {Array.<Object>} parameters
    * @memberof SQLiteClient
    */
   async alterRoutine (params) {
      const { routine } = params;
      const tempProcedure = Object.assign({}, routine);
      tempProcedure.name = `Antares_${tempProcedure.name}_tmp`;

      try {
         await this.createRoutine(tempProcedure);
         await this.dropRoutine({ schema: routine.schema, routine: tempProcedure.name });
         await this.dropRoutine({ schema: routine.schema, routine: routine.oldName });
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
    * @memberof SQLiteClient
    */
   async createRoutine (params) {
      const parameters = 'parameters' in params
         ? params.parameters.reduce((acc, curr) => {
            acc.push(`${curr.context} \`${curr.name}\` ${curr.type}${curr.length ? `(${curr.length})` : ''}`);
            return acc;
         }, []).join(',')
         : '';

      const sql = `CREATE ${params.definer ? `DEFINER=${params.definer} ` : ''}PROCEDURE \`${params.schema}\`.\`${params.name}\`(${parameters})
         LANGUAGE SQL
         ${params.deterministic ? 'DETERMINISTIC' : 'NOT DETERMINISTIC'}
         ${params.dataAccess}
         SQL SECURITY ${params.security}
         COMMENT '${params.comment}'
         ${params.sql}`;

      return await this.raw(sql, { split: false });
   }

   /**
    * SHOW CREATE FUNCTION
    *
    * @returns {Array.<Object>} view informations
    * @memberof SQLiteClient
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
    * @memberof SQLiteClient
    */
   async dropFunction (params) {
      const sql = `DROP FUNCTION \`${params.schema}\`.\`${params.func}\``;
      return await this.raw(sql);
   }

   /**
    * ALTER FUNCTION
    *
    * @returns {Array.<Object>} parameters
    * @memberof SQLiteClient
    */
   async alterFunction (params) {
      const { func } = params;
      const tempProcedure = Object.assign({}, func);
      tempProcedure.name = `Antares_${tempProcedure.name}_tmp`;

      try {
         await this.createFunction(tempProcedure);
         await this.dropFunction({ schema: func.schema, func: tempProcedure.name });
         await this.dropFunction({ schema: func.schema, func: func.oldName });
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
    * @memberof SQLiteClient
    */
   async createFunction (params) {
      const parameters = 'parameters' in params
         ? params.parameters.reduce((acc, curr) => {
            acc.push(`\`${curr.name}\` ${curr.type}${curr.length ? `(${curr.length})` : ''}`);
            return acc;
         }, []).join(',')
         : '';

      const body = params.returns ? params.sql : 'BEGIN\n  RETURN 0;\nEND';

      const sql = `CREATE ${params.definer ? `DEFINER=${params.definer} ` : ''}FUNCTION \`${params.schema}\`.\`${params.name}\`(${parameters}) RETURNS ${params.returns || 'SMALLINT'}${params.returnsLength ? `(${params.returnsLength})` : ''}
         LANGUAGE SQL
         ${params.deterministic ? 'DETERMINISTIC' : 'NOT DETERMINISTIC'}
         ${params.dataAccess}
         SQL SECURITY ${params.security}
         COMMENT '${params.comment}'
         ${body}`;

      return await this.raw(sql, { split: false });
   }

   /**
    * SHOW CREATE EVENT
    *
    * @returns {Array.<Object>} view informations
    * @memberof SQLiteClient
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
    * @memberof SQLiteClient
    */
   async dropEvent (params) {
      const sql = `DROP EVENT \`${params.schema}\`.\`${params.scheduler}\``;
      return await this.raw(sql);
   }

   /**
    * ALTER EVENT
    *
    * @returns {Array.<Object>} parameters
    * @memberof SQLiteClient
    */
   async alterEvent (params) {
      const { scheduler } = params;

      if (scheduler.execution === 'EVERY' && scheduler.every[0].includes('-'))
         scheduler.every[0] = `'${scheduler.every[0]}'`;

      const sql = `ALTER ${scheduler.definer ? ` DEFINER=${scheduler.definer}` : ''} EVENT \`${scheduler.schema}\`.\`${scheduler.oldName}\` 
      ON SCHEDULE
         ${scheduler.execution === 'EVERY'
      ? `EVERY ${scheduler.every.join(' ')}${scheduler.starts ? ` STARTS '${scheduler.starts}'` : ''}${scheduler.ends ? ` ENDS '${scheduler.ends}'` : ''}`
      : `AT '${scheduler.at}'`}
      ON COMPLETION${!scheduler.preserve ? ' NOT' : ''} PRESERVE
      ${scheduler.name !== scheduler.oldName ? `RENAME TO \`${scheduler.schema}\`.\`${scheduler.name}\`` : ''}
      ${scheduler.state}
      COMMENT '${scheduler.comment}'
      DO ${scheduler.sql}`;

      return await this.raw(sql, { split: false });
   }

   /**
    * CREATE EVENT
    *
    * @returns {Array.<Object>} parameters
    * @memberof SQLiteClient
    */
   async createEvent (params) {
      const sql = `CREATE ${params.definer ? ` DEFINER=${params.definer}` : ''} EVENT \`${params.schema}\`.\`${params.name}\` 
      ON SCHEDULE
         ${params.execution === 'EVERY'
      ? `EVERY ${params.every.join(' ')}${params.starts ? ` STARTS '${params.starts}'` : ''}${params.ends ? ` ENDS '${params.ends}'` : ''}`
      : `AT '${params.at}'`}
      ON COMPLETION${!params.preserve ? ' NOT' : ''} PRESERVE
      ${params.state}
      COMMENT '${params.comment}'
      DO ${params.sql}`;

      return await this.raw(sql, { split: false });
   }

   async enableEvent ({ schema, scheduler }) {
      const sql = `ALTER EVENT \`${schema}\`.\`${scheduler}\` ENABLE`;
      return await this.raw(sql, { split: false });
   }

   async disableEvent ({ schema, scheduler }) {
      const sql = `ALTER EVENT \`${schema}\`.\`${scheduler}\` DISABLE`;
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
    * @returns {Array.<Object>} parameters
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
      const newForeigns = [];

      let sql = `CREATE TABLE \`${schema}\`.\`${options.name}\``;

      // ADD FIELDS
      fields.forEach(field => {
         const typeInfo = this._getTypeInfo(field.type);
         const length = typeInfo.length ? field.enumValues || field.numLength || field.charLength || field.datePrecision : false;

         newColumns.push(`\`${field.name}\` 
            ${field.type.toUpperCase()}${length ? `(${length})` : ''} 
            ${field.unsigned ? 'UNSIGNED' : ''} 
            ${field.zerofill ? 'ZEROFILL' : ''}
            ${field.nullable ? 'NULL' : 'NOT NULL'}
            ${field.autoIncrement ? 'AUTO_INCREMENT' : ''}
            ${field.default ? `DEFAULT ${field.default}` : ''}
            ${field.comment ? `COMMENT '${field.comment}'` : ''}
            ${field.collation ? `COLLATE ${field.collation}` : ''}
            ${field.onUpdate ? `ON UPDATE ${field.onUpdate}` : ''}`);
      });

      // ADD INDEX
      indexes.forEach(index => {
         const fields = index.fields.map(field => `\`${field}\``).join(',');
         let type = index.type;

         if (type === 'PRIMARY')
            newIndexes.push(`PRIMARY KEY (${fields})`);
         else {
            if (type === 'UNIQUE')
               type = 'UNIQUE INDEX';

            newIndexes.push(`${type} \`${index.name}\` (${fields})`);
         }
      });

      // ADD FOREIGN KEYS
      foreigns.forEach(foreign => {
         newForeigns.push(`CONSTRAINT \`${foreign.constraintName}\` FOREIGN KEY (\`${foreign.field}\`) REFERENCES \`${foreign.refTable}\` (\`${foreign.refField}\`) ON UPDATE ${foreign.onUpdate} ON DELETE ${foreign.onDelete}`);
      });

      sql = `${sql} (${[...newColumns, ...newIndexes, ...newForeigns].join(', ')}) COMMENT='${options.comment}', COLLATE='${options.collation}', ENGINE=${options.engine}`;

      return await this.raw(sql);
   }

   /**
    * ALTER TABLE
    *
    * @returns {Array.<Object>} parameters
    * @memberof SQLiteClient
    */
   async alterTable (params) {
      const {
         table,
         schema,
         additions,
         deletions,
         changes,
         indexChanges,
         foreignChanges,
         options
      } = params;

      let sql = `ALTER TABLE \`${schema}\`.\`${table}\` `;
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
      if (options.name) sql += `; RENAME TABLE \`${schema}\`.\`${table}\` TO \`${schema}\`.\`${options.name}\``;

      return await this.raw(sql);
   }

   /**
    * DUPLICATE TABLE
    *
    * @returns {Array.<Object>} parameters
    * @memberof SQLiteClient
    */
   async duplicateTable (params) {
      const sql = `CREATE TABLE \`${params.schema}\`.\`${params.table}_copy\` LIKE \`${params.schema}\`.\`${params.table}\``;
      return await this.raw(sql);
   }

   /**
    * TRUNCATE TABLE
    *
    * @returns {Array.<Object>} parameters
    * @memberof SQLiteClient
    */
   async truncateTable (params) {
      const sql = `TRUNCATE TABLE \`${params.schema}\`.\`${params.table}\``;
      return await this.raw(sql);
   }

   /**
    * DROP TABLE
    *
    * @returns {Array.<Object>} parameters
    * @memberof SQLiteClient
    */
   async dropTable (params) {
      const sql = `DROP TABLE \`${params.schema}\`.\`${params.table}\``;
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
                     return {
                        name: field.name,
                        alias: field.name,
                        orgName: field.column,
                        schema: field.database,
                        table: field.table,
                        tableAlias: field.table,
                        orgTable: field.table,
                        type: field.type !== null ? field.type : detectedTypes[field.name]
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
