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
      const { rows: functions } = await this.raw('SHOW FUNCTION STATUS');
      const { rows: procedures } = await this.raw('SHOW PROCEDURE STATUS');
      const { rows: schedulers } = await this.raw('SELECT *, EVENT_SCHEMA AS `Db`, EVENT_NAME AS `Name` FROM information_schema.`EVENTS`');

      const tablesArr = [];
      const triggersArr = [];

      for (const db of databases) {
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
            type: field.DATA_TYPE.toUpperCase(),
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
    * SELECT `user`, `host`, IF(LENGTH(password)>0, password, authentication_string) AS `password` FROM `mysql`.`user`
    *
    * @returns {Array.<Object>} users list
    * @memberof MySQLClient
    */
   async getUsers () {
      const { rows } = await this.raw('SELECT `user`, `host`, IF(LENGTH(password)>0, password, authentication_string) AS `password` FROM `mysql`.`user`');

      return rows.map(row => {
         return {
            name: row.user,
            host: row.host,
            password: row.password
         };
      });
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
      const sql = `DROP VIEW \`${params.view}\``;
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
      let sql = `ALTER ALGORITHM = ${view.algorithm}${view.definer ? ` DEFINER=${view.definer}` : ''} SQL SECURITY ${view.security} VIEW \`${view.oldName}\` AS ${view.sql} ${view.updateOption ? `WITH ${view.updateOption} CHECK OPTION` : ''}`;

      if (view.name !== view.oldName)
         sql += `; RENAME TABLE \`${view.oldName}\` TO \`${view.name}\``;

      return await this.raw(sql);
   }

   /**
    * CREATE VIEW
    *
    * @returns {Array.<Object>} parameters
    * @memberof MySQLClient
    */
   async createView (view) {
      const sql = `CREATE ALGORITHM = ${view.algorithm} ${view.definer ? `DEFINER=${view.definer} ` : ''}SQL SECURITY ${view.security} VIEW \`${view.name}\` AS ${view.sql} ${view.updateOption ? `WITH ${view.updateOption} CHECK OPTION` : ''}`;
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
            event1: row['SQL Original Statement'].match(/(BEFORE|AFTER)/gs)[0],
            event2: row['SQL Original Statement'].match(/(INSERT|UPDATE|DELETE)/gs)[0]
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
      const sql = `DROP TRIGGER \`${params.trigger}\``;
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
      const sql = `CREATE ${trigger.definer ? `DEFINER=${trigger.definer} ` : ''}TRIGGER \`${trigger.name}\` ${trigger.event1} ${trigger.event2} ON \`${trigger.table}\` FOR EACH ROW ${trigger.sql}`;
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

      return results.rows.map(row => {
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

         const parameters = row['Create Procedure']
            .match(/(?<=\().*?(?=\))/s)[0]
            .replaceAll('\r', '')
            .replaceAll('\t', '')
            .split(',')
            .map(el => {
               const param = el.split(' ');
               const type = param[2] ? param[2].replace(')', '').split('(') : ['', null];

               return {
                  name: param[1] ? param[1].replaceAll('`', '') : '',
                  type: type[0],
                  length: +type[1],
                  context: param[0] ? param[0].replace('\n', '') : ''
               };
            }).filter(el => el.name);

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
            parameters,
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
      const sql = `DROP PROCEDURE \`${params.routine}\``;
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
      const parameters = routine.parameters.reduce((acc, curr) => {
         acc.push(`${curr.context} \`${curr.name}\` ${curr.type}${curr.length ? `(${curr.length})` : ''}`);
         return acc;
      }, []).join(',');

      const sql = `CREATE ${routine.definer ? `DEFINER=${routine.definer} ` : ''}PROCEDURE \`${routine.name}\`(${parameters})
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

      return results.rows.map(row => {
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

         const parameters = row['Create Function']
            .match(/(?<=\().*?(?=\))/s)[0]
            .replaceAll('\r', '')
            .replaceAll('\t', '')
            .split(',')
            .map(el => {
               const param = el.split(' ');
               const type = param[1] ? param[1].replace(')', '').split('(') : ['', null];

               return {
                  name: param[0] ? param[0].replaceAll('`', '') : '',
                  type: type[0],
                  length: +type[1]
               };
            }).filter(el => el.name);

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
            parameters,
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
      const sql = `DROP FUNCTION \`${params.func}\``;
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

      const sql = `CREATE ${func.definer ? `DEFINER=${func.definer} ` : ''}FUNCTION \`${func.name}\`(${parameters}) RETURNS ${func.returns}${func.returnsLength ? `(${func.returnsLength})` : ''}
         LANGUAGE SQL
         ${func.deterministic ? 'DETERMINISTIC' : 'NOT DETERMINISTIC'}
         ${func.dataAccess}
         SQL SECURITY ${func.security}
         COMMENT '${func.comment}'
         ${func.sql}`;

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
         const schedule = row['Create Event'].match(/(?<=ON SCHEDULE\n*?\s*?).*?(?=\n)/gs)[0];
         const execution = schedule.includes('EVERY') ? 'EVERY' : 'ONCE';
         const every = execution === 'EVERY' ? row['Create Event'].match(/(?<=EVERY )(\s*([^\s]+)){0,2}/gs)[0].replaceAll('\'', '').split(' ') : [];
         const starts = execution === 'EVERY' && schedule.includes('STARTS') ? schedule.match(/(?<=STARTS ').*?(?='\s)/gs)[0] : '';
         const ends = execution === 'EVERY' && schedule.includes('ENDS') ? schedule.match(/(?<=ENDS ').*?(?='\s)/gs)[0] : '';
         const at = execution === 'ONCE' && schedule.includes('AT') ? schedule.match(/(?<=AT ').*?(?='\s)/gs)[0] : '';

         return {
            definer: row['Create Event'].match(/(?<=DEFINER=).*?(?=\s)/gs)[0],
            sql: row['Create Event'].match(/(BEGIN|begin)(.*)(END|end)/gs)[0],
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
      const sql = `DROP EVENT \`${params.scheduler}\``;
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

      const sql = `ALTER ${scheduler.definer ? ` DEFINER=${scheduler.definer}` : ''} EVENT \`${scheduler.oldName}\` 
      ON SCHEDULE
         ${scheduler.execution === 'EVERY'
      ? `EVERY ${scheduler.every.join(' ')}${scheduler.starts ? ` STARTS '${scheduler.starts}'` : ''}${scheduler.ends ? ` ENDS '${scheduler.ends}'` : ''}`
      : `AT '${scheduler.at}'`}
      ON COMPLETION${!scheduler.preserve ? ' NOT' : ''} PRESERVE
      ${scheduler.name !== scheduler.oldName ? `RENAME TO \`${scheduler.name}\`` : ''}
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
      const sql = `CREATE ${scheduler.definer ? ` DEFINER=${scheduler.definer}` : ''} EVENT \`${scheduler.name}\` 
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

      const sql = `CREATE TABLE \`${name}\` (\`${name}_ID\` INT NULL) COMMENT='${comment}', COLLATE='${collation}', ENGINE=${engine}`;

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

      // ADD FOREIGN KEYS
      foreignChanges.additions.forEach(addition => {
         alterColumns.push(`ADD CONSTRAINT \`${addition.constraintName}\` FOREIGN KEY (\`${addition.field}\`) REFERENCES \`${addition.refTable}\` (\`${addition.refField}\`) ON UPDATE ${addition.onUpdate} ON DELETE ${addition.onDelete}`);
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
      if (options.name) sql += `; RENAME TABLE \`${table}\` TO \`${options.name}\``;

      return await this.raw(sql);
   }

   /**
    * TRUNCATE TABLE
    *
    * @returns {Array.<Object>} parameters
    * @memberof MySQLClient
    */
   async truncateTable (params) {
      const sql = `TRUNCATE TABLE \`${params.table}\``;
      return await this.raw(sql);
   }

   /**
    * DROP TABLE
    *
    * @returns {Array.<Object>} parameters
    * @memberof MySQLClient
    */
   async dropTable (params) {
      const sql = `DROP TABLE \`${params.table}\``;
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
    * @param {boolean} args.split
    * @returns {Promise}
    * @memberof MySQLClient
    */
   async raw (sql, args) {
      args = {
         nest: false,
         details: false,
         split: true,
         ...args
      };
      const nestTables = args.nest ? '.' : false;
      const resultsArr = [];
      let paramsArr = [];
      let selectedFields = [];
      const queries = args.split ? sql.split(';') : [sql];

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
                        if (!field || Array.isArray(field))
                           return false;

                        return {
                           name: field.name,
                           orgName: field.orgName,
                           schema: field.db,
                           table: field.table,
                           orgTable: field.orgTable,
                           type: 'VARCHAR'
                        };
                     }).filter(Boolean)
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
                                    return response.find(field => field.name.toLowerCase() === selField.name.toLowerCase() && field.table === selField.table);
                                 }).filter(el => !!el)
                                 : [];

                              if (selectedFields.length) {
                                 detailedFields = detailedFields.map(field => {
                                    const aliasObj = remappedFields.find(resField => resField.orgName === field.name && resField.orgTable === field.table);
                                    return {
                                       ...field,
                                       alias: aliasObj.name || field.name,
                                       tableAlias: aliasObj.table || field.table
                                    };
                                 });
                              }

                              if (!detailedFields.length) {
                                 detailedFields = remappedFields.map(field => {
                                    const isInFields = fieldsArr.some(f => field.name.toLowerCase() === f.name.toLowerCase() && field.table === f.table);

                                    if (!isInFields) {
                                       return {
                                          ...field,
                                          alias: field.name,
                                          tableAlias: field.table
                                       };
                                    }
                                    else
                                       return false;
                                 }).filter(Boolean);
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
                     rows: Array.isArray(queryResult) ? queryResult.some(el => Array.isArray(el)) ? [] : queryResult : false,
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
