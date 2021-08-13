'use strict';
import { Pool, Client, types } from 'pg';
import { parse } from 'pgsql-ast-parser';
import { AntaresCore } from '../AntaresCore';
import dataTypes from 'common/data-types/postgresql';
import * as SSH2Promise from 'ssh2-promise';

function pgToString (value) {
   return value.toString();
}

types.setTypeParser(1082, pgToString); // date
types.setTypeParser(1083, pgToString); // time
types.setTypeParser(1114, pgToString); // timestamp
types.setTypeParser(1184, pgToString); // timestamptz
types.setTypeParser(1266, pgToString); // timetz

export class PostgreSQLClient extends AntaresCore {
   constructor (args) {
      super(args);

      this._schema = null;

      this.types = {};
      for (const key in types.builtins)
         this.types[types.builtins[key]] = key;

      this._arrayTypes = {
         _int2: 'SMALLINT',
         _int4: 'INTEGER',
         _int8: 'BIGINT',
         _float4: 'REAL',
         _float8: 'DOUBLE PRECISION',
         _char: '"CHAR"',
         _varchar: 'CHARACTER VARYING'
      };
   }

   _getTypeInfo (type) {
      return dataTypes
         .reduce((acc, group) => [...acc, ...group.types], [])
         .filter(_type => _type.name === type.toUpperCase())[0];
   }

   _getArrayType (type) {
      if (Object.keys(this._arrayTypes).includes(type))
         return this._arrayTypes[type];
      return type.replace('_', '');
   }

   /**
    * @memberof PostgreSQLClient
    */
   async connect () {
      const dbConfig = {
         host: this._params.host,
         port: this._params.port,
         user: this._params.user,
         password: this._params.password,
         ssl: null
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

      if (!this._poolSize) {
         const client = new Client(dbConfig);
         await client.connect();
         this._connection = client;
      }
      else {
         const pool = new Pool({ ...dbConfig, max: this._poolSize });
         this._connection = pool;
      }
   }

   /**
    * @memberof PostgreSQLClient
    */
   destroy () {
      this._connection.end();
      if (this._ssh) this._ssh.close();
   }

   /**
    * Executes an "USE" query
    *
    * @param {String} schema
    * @memberof PostgreSQLClient
    */
   use (schema) {
      this._schema = schema;
      if (schema)
         return this.raw(`SET search_path TO ${schema}`);
   }

   /**
    * @param {Array} schemas list
    * @returns {Array.<Object>} databases scructure
    * @memberof PostgreSQLClient
    */
   async getStructure (schemas) {
      const { rows: databases } = await this.raw('SELECT schema_name AS database FROM information_schema.schemata ORDER BY schema_name');
      const { rows: functions } = await this.raw('SELECT * FROM information_schema.routines WHERE routine_type = \'FUNCTION\'');
      const { rows: procedures } = await this.raw('SELECT * FROM information_schema.routines WHERE routine_type = \'PROCEDURE\'');

      const tablesArr = [];
      const triggersArr = [];

      for (const db of databases) {
         if (!schemas.has(db.database)) continue;

         let { rows: tables } = await this.raw(`
            SELECT *, 
               pg_table_size(QUOTE_IDENT(t.TABLE_SCHEMA) || '.' || QUOTE_IDENT(t.TABLE_NAME))::bigint AS data_length, 
               pg_relation_size(QUOTE_IDENT(t.TABLE_SCHEMA) || '.' || QUOTE_IDENT(t.TABLE_NAME))::bigint AS index_length, 
               c.reltuples, obj_description(c.oid) AS comment 
            FROM "information_schema"."tables" AS t 
            LEFT JOIN "pg_namespace" n ON t.table_schema = n.nspname 
            LEFT JOIN "pg_class" c ON n.oid = c.relnamespace AND c.relname=t.table_name 
            WHERE t."table_schema" = '${db.database}'
            ORDER BY table_name
         `);

         if (tables.length) {
            tables = tables.map(table => {
               table.Db = db.database;
               return table;
            });
            tablesArr.push(...tables);
         }

         let { rows: triggers } = await this.raw(`
            SELECT event_object_schema AS table_schema,
               event_object_table AS table_name,
               trigger_schema,
               trigger_name,
               string_agg(event_manipulation, ',') AS event,
               action_timing AS activation,
               action_condition AS condition,
               action_statement AS definition
            FROM information_schema.triggers
            WHERE trigger_schema = '${db.database}'
            GROUP BY 1,2,3,4,6,7,8
            ORDER BY table_schema,
                     table_name
         `);

         if (triggers.length) {
            triggers = triggers.map(trigger => {
               trigger.Db = db.database;
               return trigger;
            });
            triggersArr.push(...triggers);
         }
      }

      return databases.map(db => {
         if (schemas.has(db.database)) {
            // TABLES
            const remappedTables = tablesArr.filter(table => table.Db === db.database).map(table => {
               return {
                  name: table.table_name,
                  type: table.table_type === 'VIEW' ? 'view' : 'table',
                  rows: table.reltuples,
                  size: +table.data_length + +table.index_length,
                  collation: table.Collation,
                  comment: table.comment,
                  engine: ''
               };
            });

            // PROCEDURES
            const remappedProcedures = procedures.filter(procedure => procedure.routine_schema === db.database).map(procedure => {
               return {
                  name: procedure.routine_name,
                  type: procedure.routine_type,
                  security: procedure.security_type
               };
            });

            // FUNCTIONS
            const remappedFunctions = functions.filter(func => func.routine_schema === db.database && func.data_type !== 'trigger').map(func => {
               return {
                  name: func.routine_name,
                  type: func.routine_type,
                  security: func.security_type
               };
            });

            // TRIGGER FUNCTIONS
            const remappedTriggerFunctions = functions.filter(func => func.routine_schema === db.database && func.data_type === 'trigger').map(func => {
               return {
                  name: func.routine_name,
                  type: func.routine_type,
                  security: func.security_type
               };
            });

            // TRIGGERS
            const remappedTriggers = triggersArr.filter(trigger => trigger.Db === db.database).map(trigger => {
               return {
                  name: `${trigger.table_name}.${trigger.trigger_name}`,
                  orgName: trigger.trigger_name,
                  timing: trigger.activation,
                  definer: '',
                  definition: trigger.definition,
                  event: trigger.event,
                  table: trigger.table_name,
                  sqlMode: ''
               };
            });

            return {
               name: db.database,
               tables: remappedTables,
               functions: remappedFunctions,
               procedures: remappedProcedures,
               triggers: remappedTriggers,
               triggerFunctions: remappedTriggerFunctions,
               schedulers: []
            };
         }
         else {
            return {
               name: db.database,
               tables: [],
               functions: [],
               procedures: [],
               triggers: [],
               triggerFunctions: [],
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
    * @memberof PostgreSQLClient
    */
   async getTableColumns ({ schema, table }, arrayRemap = true) {
      const { rows } = await this
         .select('*')
         .schema('information_schema')
         .from('columns')
         .where({ table_schema: `= '${schema}'`, table_name: `= '${table}'` })
         .orderBy({ ordinal_position: 'ASC' })
         .run();

      return rows.map(field => {
         let type = field.data_type;
         const isArray = type === 'ARRAY';

         if (isArray && arrayRemap)
            type = this._getArrayType(field.udt_name);

         return {
            name: field.column_name,
            key: null,
            type: type.toUpperCase(),
            isArray,
            schema: field.table_schema,
            table: field.table_name,
            numPrecision: field.numeric_precision,
            datePrecision: field.datetime_precision,
            charLength: field.character_maximum_length,
            nullable: field.is_nullable.includes('YES'),
            unsigned: null,
            zerofill: null,
            order: field.ordinal_position,
            default: field.column_default,
            charset: field.character_set_name,
            collation: field.collation_name,
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
    * @memberof PostgreSQLClient
    */
   async getTableApproximateCount ({ schema, table }) {
      const { rows } = await this.raw(`SELECT reltuples AS count FROM pg_class WHERE relname = '${table}'`);

      return rows.length ? rows[0].count : 0;
   }

   /**
    * @param {Object} params
    * @param {String} params.schema
    * @param {String} params.table
    * @returns {Object} table options
    * @memberof MySQLClient
    */
   async getTableOptions ({ schema, table }) {
      const { rows } = await this.raw(`
         SELECT *, 
            pg_table_size(QUOTE_IDENT(t.TABLE_SCHEMA) || '.' || QUOTE_IDENT(t.TABLE_NAME))::bigint AS data_length, 
            pg_relation_size(QUOTE_IDENT(t.TABLE_SCHEMA) || '.' || QUOTE_IDENT(t.TABLE_NAME))::bigint AS index_length, 
            c.reltuples, obj_description(c.oid) AS comment 
         FROM "information_schema"."tables" AS t 
         LEFT JOIN "pg_namespace" n ON t.table_schema = n.nspname 
         LEFT JOIN "pg_class" c ON n.oid = c.relnamespace AND c.relname=t.table_name 
         WHERE t."table_schema" = '${schema}'
         AND table_name = '${table}'
      `);

      if (rows.length) {
         return {
            name: rows[0].table_name,
            type: rows[0].table_type === 'VIEW' ? 'view' : 'table',
            rows: rows[0].reltuples,
            size: +rows[0].data_length + +rows[0].index_length,
            collation: rows[0].Collation,
            comment: rows[0].comment,
            engine: ''
         };
      };
      return {};
   }

   /**
    * @param {Object} params
    * @param {String} params.schema
    * @param {String} params.table
    * @returns {Object} table indexes
    * @memberof PostgreSQLClient
    */
   async getTableIndexes ({ schema, table }) {
      if (schema !== 'public')
         await this.use(schema);

      const { rows } = await this.raw(`WITH ndx_list AS (
         SELECT pg_index.indexrelid, pg_class.oid
         FROM pg_index, pg_class
         WHERE pg_class.relname = '${table}' AND pg_class.oid = pg_index.indrelid), ndx_cols AS (
         SELECT pg_class.relname, UNNEST(i.indkey) AS col_ndx, CASE i.indisprimary WHEN TRUE THEN 'PRIMARY' ELSE CASE i.indisunique WHEN TRUE THEN 'UNIQUE' ELSE 'INDEX' END END AS CONSTRAINT_TYPE, pg_class.oid
         FROM pg_class
         JOIN pg_index i ON (pg_class.oid = i.indexrelid)
         JOIN ndx_list ON (pg_class.oid = ndx_list.indexrelid)
         WHERE pg_table_is_visible(pg_class.oid))
         SELECT ndx_cols.relname AS CONSTRAINT_NAME, ndx_cols.CONSTRAINT_TYPE, a.attname AS COLUMN_NAME
         FROM pg_attribute a
         JOIN ndx_cols ON (a.attnum = ndx_cols.col_ndx)
         JOIN ndx_list ON (ndx_list.oid = a.attrelid AND ndx_list.indexrelid = ndx_cols.oid)
      `);

      return rows.map(row => {
         return {
            name: row.constraint_name,
            column: row.column_name,
            indexType: null,
            type: row.constraint_type,
            cardinality: null,
            comment: '',
            indexComment: ''
         };
      });
   }

   /**
    *
    * @param {Number} id
    * @returns {Array}
    */
   async getTableByIDs (ids) {
      if (!ids) return;

      const { rows } = await this.raw(`
         SELECT relid AS tableid, relname, schemaname FROM pg_statio_all_tables WHERE relid IN (${ids}) 
         UNION
         SELECT pg_class.oid AS tableid,relname, nspname AS schemaname FROM pg_class JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace WHERE pg_class.oid IN (${ids})
      `);

      return rows.reduce((acc, curr) => {
         acc[curr.tableid] = {
            table: curr.relname,
            schema: curr.schemaname
         };
         return acc;
      }, {});
   }

   /**
    * @param {Object} params
    * @param {String} params.schema
    * @param {String} params.table
    * @returns {Object} table key usage
    * @memberof PostgreSQLClient
    */
   async getKeyUsage ({ schema, table }) {
      const { rows } = await this.raw(`
         SELECT 
            tc.table_schema, 
            tc.constraint_name, 
            tc.table_name, 
            kcu.column_name, 
            kcu.position_in_unique_constraint, 
            kcu.ordinal_position, 
            ccu.table_schema AS foreign_table_schema,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            rc.update_rule,
            rc.delete_rule
         FROM information_schema.table_constraints AS tc 
         JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
         JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
         JOIN information_schema.referential_constraints AS rc 
            ON rc.constraint_name = kcu.constraint_name
         WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = '${schema}'
         AND tc.table_name = '${table}'
      `);

      return rows.map(field => {
         return {
            schema: field.table_schema,
            table: field.table_name,
            field: field.column_name,
            position: field.ordinal_position,
            constraintPosition: field.position_in_unique_constraint,
            constraintName: field.constraint_name,
            refSchema: field.foreign_table_schema,
            refTable: field.foreign_table_name,
            refField: field.foreign_column_name,
            onUpdate: field.update_rule,
            onDelete: field.delete_rule
         };
      });
   }

   /**
    * SELECT *  FROM pg_catalog.pg_user
    *
    * @returns {Array.<Object>} users list
    * @memberof PostgreSQLClient
    */
   async getUsers () {
      const { rows } = await this.raw('SELECT *  FROM pg_catalog.pg_user');

      return rows.map(row => {
         return {
            name: row.username,
            host: row.host,
            password: row.passwd
         };
      });
   }

   /**
    * CREATE SCHEMA
    *
    * @returns {Array.<Object>} parameters
    * @memberof MySQLClient
    */
   async createSchema (params) {
      return await this.raw(`CREATE SCHEMA "${params.name}"`);
   }

   /**
    * ALTER DATABASE
    *
    * @returns {Array.<Object>} parameters
    * @memberof MySQLClient
    */
   async alterSchema (params) {
      return await this.raw(`ALTER SCHEMA "${params.name}"`);
   }

   /**
    * DROP DATABASE
    *
    * @returns {Array.<Object>} parameters
    * @memberof MySQLClient
    */
   async dropSchema (params) {
      return await this.raw(`DROP SCHEMA "${params.database}"`);
   }

   /**
    * SHOW CREATE VIEW
    *
    * @returns {Array.<Object>} view informations
    * @memberof PostgreSQLClient
    */
   async getViewInformations ({ schema, view }) {
      const sql = `SELECT "definition" FROM "pg_views" WHERE "viewname"='${view}' AND "schemaname"='${schema}'`;
      const results = await this.raw(sql);

      return results.rows.map(row => {
         return {
            algorithm: '',
            definer: '',
            security: '',
            updateOption: '',
            sql: row.definition,
            name: view
         };
      })[0];
   }

   /**
    * DROP VIEW
    *
    * @returns {Array.<Object>} parameters
    * @memberof PostgreSQLClient
    */
   async dropView (params) {
      const sql = `DROP VIEW ${params.schema}.${params.view}`;
      return await this.raw(sql);
   }

   /**
    * ALTER VIEW
    *
    * @returns {Array.<Object>} parameters
    * @memberof PostgreSQLClient
    */
   async alterView (params) {
      const { view } = params;
      let sql = `CREATE OR REPLACE VIEW ${view.schema}.${view.oldName} AS ${view.sql}`;

      if (view.name !== view.oldName)
         sql += `; ALTER VIEW ${view.schema}.${view.oldName} RENAME TO ${view.name}`;

      return await this.raw(sql);
   }

   /**
    * CREATE VIEW
    *
    * @returns {Array.<Object>} parameters
    * @memberof PostgreSQLClient
    */
   async createView (params) {
      const sql = `CREATE VIEW ${params.schema}.${params.name} AS ${params.sql}`;
      return await this.raw(sql);
   }

   /**
    * SHOW CREATE TRIGGER
    *
    * @returns {Array.<Object>} view informations
    * @memberof PostgreSQLClient
    */
   async getTriggerInformations ({ schema, trigger }) {
      const [table, triggerName] = trigger.split('.');

      const results = await this.raw(`
         SELECT event_object_schema AS table_schema,
            event_object_table AS table_name,
            trigger_schema,
            trigger_name,
            string_agg(event_manipulation, ',') AS event,
            action_timing AS activation,
            action_condition AS condition,
            action_statement AS definition
         FROM information_schema.triggers
         WHERE trigger_schema = '${schema}'
         AND trigger_name = '${triggerName}'
         AND event_object_table = '${table}'
         GROUP BY 1,2,3,4,6,7,8
         ORDER BY table_schema,
                  table_name
      `);

      return results.rows.map(row => {
         return {
            sql: row.definition,
            name: row.trigger_name,
            table: row.table_name,
            event: row.event.split(','),
            activation: row.activation
         };
      })[0];
   }

   /**
    * DROP TRIGGER
    *
    * @returns {Array.<Object>} parameters
    * @memberof PostgreSQLClient
    */
   async dropTrigger (params) {
      const triggerParts = params.trigger.split('.');
      const sql = `DROP TRIGGER "${triggerParts[1]}" ON "${params.schema}"."${triggerParts[0]}"`;
      return await this.raw(sql);
   }

   /**
    * ALTER TRIGGER
    *
    * @returns {Array.<Object>} parameters
    * @memberof PostgreSQLClient
    */
   async alterTrigger (params) {
      const { trigger } = params;
      const tempTrigger = Object.assign({}, trigger);
      tempTrigger.name = `Antares_${tempTrigger.name}_tmp`;

      try {
         await this.createTrigger(tempTrigger);
         await this.dropTrigger({ schema: trigger.schema, trigger: `${tempTrigger.table}.${tempTrigger.name}` });
         await this.dropTrigger({ schema: trigger.schema, trigger: `${trigger.table}.${trigger.oldName}` });
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
    * @memberof PostgreSQLClient
    */
   async createTrigger (params) {
      const eventsString = Array.isArray(params.event) ? params.event.join(' OR ') : params.event;
      const sql = `CREATE TRIGGER "${params.name}" ${params.activation} ${eventsString} ON "${params.schema}"."${params.table}" FOR EACH ROW ${params.sql}`;
      return await this.raw(sql, { split: false });
   }

   /**
    * SHOW CREATE PROCEDURE
    *
    * @returns {Array.<Object>} view informations
    * @memberof PostgreSQLClient
    */
   async getRoutineInformations ({ schema, routine }) {
      const sql = `SELECT pg_get_functiondef((SELECT oid FROM pg_proc WHERE proname = '${routine}'));`;
      const results = await this.raw(sql);

      return results.rows.map(async row => {
         if (!row.pg_get_functiondef) {
            return {
               definer: null,
               sql: '',
               parameters: [],
               name: routine,
               comment: '',
               security: 'DEFINER',
               deterministic: false,
               dataAccess: 'CONTAINS SQL'
            };
         }

         const sql = `SELECT proc.specific_schema AS procedure_schema,
            proc.specific_name,
            proc.routine_name AS procedure_name,
            proc.external_language,
            args.parameter_name,
            args.parameter_mode,
            args.data_type
         FROM information_schema.routines proc
         LEFT JOIN information_schema.parameters args
            ON proc.specific_schema = args.specific_schema
            AND proc.specific_name = args.specific_name
         WHERE proc.routine_schema not in ('pg_catalog', 'information_schema')
            AND proc.routine_type = 'PROCEDURE'
            AND proc.routine_name = '${routine}'
            AND proc.specific_schema = '${schema}'
            AND args.data_type != NULL
         ORDER BY procedure_schema,
            specific_name,
            procedure_name,
            args.ordinal_position
         `;

         const results = await this.raw(sql);

         const parameters = results.rows.map(row => {
            return {
               name: row.parameter_name,
               type: row.data_type ? row.data_type.toUpperCase() : '',
               length: '',
               context: row.parameter_mode
            };
         });

         return {
            definer: '',
            sql: row.pg_get_functiondef.match(/(\$(.*)\$)(.*)(\$(.*)\$)/gs)[0],
            parameters: parameters || [],
            name: routine,
            comment: '',
            security: row.pg_get_functiondef.includes('SECURITY DEFINER') ? 'DEFINER' : 'INVOKER',
            deterministic: null,
            dataAccess: null,
            language: row.pg_get_functiondef.match(/(?<=LANGUAGE )(.*)(?<=[\S+\n\r\s])/gm)[0]
         };
      })[0];
   }

   /**
    * DROP PROCEDURE
    *
    * @returns {Array.<Object>} parameters
    * @memberof PostgreSQLClient
    */
   async dropRoutine (params) {
      const sql = `DROP PROCEDURE "${params.schema}"."${params.routine}"`;
      return await this.raw(sql);
   }

   /**
    * ALTER PROCEDURE
    *
    * @returns {Array.<Object>} parameters
    * @memberof PostgreSQLClient
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
    * @memberof PostgreSQLClient
    */
   async createRoutine (routine) {
      const parameters = 'parameters' in routine
         ? routine.parameters.reduce((acc, curr) => {
            acc.push(`${curr.context} ${curr.name} ${curr.type}${curr.length ? `(${curr.length})` : ''}`);
            return acc;
         }, []).join(',')
         : '';

      if (routine.schema !== 'public')
         await this.use(routine.schema);

      const sql = `CREATE PROCEDURE "${routine.schema}"."${routine.name}"(${parameters})
         LANGUAGE ${routine.language}
         SECURITY ${routine.security}
         AS ${routine.sql}`;

      return await this.raw(sql, { split: false });
   }

   /**
    * SHOW CREATE FUNCTION
    *
    * @returns {Array.<Object>} view informations
    * @memberof PostgreSQLClient
    */
   async getFunctionInformations ({ schema, func }) {
      const sql = `SELECT pg_get_functiondef((SELECT oid FROM pg_proc WHERE proname = '${func}'));`;
      const results = await this.raw(sql);

      return results.rows.map(async row => {
         if (!row.pg_get_functiondef) {
            return {
               definer: null,
               sql: '',
               parameters: [],
               name: func,
               comment: '',
               security: 'DEFINER',
               deterministic: false,
               dataAccess: 'CONTAINS SQL'
            };
         }

         const sql = `SELECT proc.specific_schema AS procedure_schema,
            proc.specific_name,
            proc.routine_name AS procedure_name,
            proc.external_language,
            args.parameter_name,
            args.parameter_mode,
            args.data_type
         FROM information_schema.routines proc
         LEFT JOIN information_schema.parameters args
            ON proc.specific_schema = args.specific_schema
            AND proc.specific_name = args.specific_name
         WHERE proc.routine_schema not in ('pg_catalog', 'information_schema')
            AND proc.routine_type = 'FUNCTION'
            AND proc.routine_name = '${func}'
            AND proc.specific_schema = '${schema}'
         ORDER BY procedure_schema,
            specific_name,
            procedure_name,
            args.ordinal_position
         `;

         const results = await this.raw(sql);

         const parameters = results.rows.filter(row => row.parameter_mode).map(row => {
            return {
               name: row.parameter_name,
               type: row.data_type.toUpperCase(),
               length: '',
               context: row.parameter_mode
            };
         });

         return {
            definer: '',
            sql: row.pg_get_functiondef.match(/(\$(.*)\$)(.*)(\$(.*)\$)/gs)[0],
            parameters: parameters || [],
            name: func,
            comment: '',
            security: row.pg_get_functiondef.includes('SECURITY DEFINER') ? 'DEFINER' : 'INVOKER',
            deterministic: null,
            dataAccess: null,
            language: row.pg_get_functiondef.match(/(?<=LANGUAGE )(.*)(?<=[\S+\n\r\s])/gm)[0],
            returns: row.pg_get_functiondef.match(/(?<=RETURNS )(.*)(?<=[\S+\n\r\s])/gm)[0].replace('SETOF ', '').toUpperCase()
         };
      })[0];
   }

   /**
    * DROP FUNCTION
    *
    * @returns {Array.<Object>} parameters
    * @memberof PostgreSQLClient
    */
   async dropFunction (params) {
      const sql = `DROP FUNCTION "${params.schema}"."${params.func}"`;
      return await this.raw(sql);
   }

   /**
    * ALTER FUNCTION
    *
    * @returns {Array.<Object>} parameters
    * @memberof PostgreSQLClient
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
    * @memberof PostgreSQLClient
    */
   async createFunction (func) {
      const parameters = 'parameters' in func
         ? func.parameters.reduce((acc, curr) => {
            acc.push(`${curr.context} ${curr.name || ''} ${curr.type}${curr.length ? `(${curr.length})` : ''}`);
            return acc;
         }, []).join(',')
         : '';

      if (func.schema !== 'public')
         await this.use(func.schema);

      const body = func.returns ? func.sql : '$function$\n$function$';

      const sql = `CREATE FUNCTION "${func.schema}"."${func.name}" (${parameters})
         RETURNS ${func.returns || 'void'}
         LANGUAGE ${func.language}
         SECURITY ${func.security}
         AS ${body}`;

      return await this.raw(sql, { split: false });
   }

   /**
    * ALTER TRIGGER FUNCTION
    *
    * @returns {Array.<Object>} parameters
    * @memberof PostgreSQLClient
    */
   async alterTriggerFunction (params) {
      const { func } = params;

      if (func.schema !== 'public')
         await this.use(func.schema);

      const body = func.returns ? func.sql : '$function$\n$function$';

      const sql = `CREATE OR REPLACE FUNCTION "${func.schema}"."${func.name}" ()
         RETURNS TRIGGER
         LANGUAGE ${func.language}
         AS ${body}`;

      return await this.raw(sql, { split: false });
   }

   /**
    * CREATE TRIGGER FUNCTION
    *
    * @returns {Array.<Object>} parameters
    * @memberof PostgreSQLClient
    */
   async createTriggerFunction (func) {
      if (func.schema !== 'public')
         await this.use(func.schema);

      const body = func.returns ? func.sql : '$function$\r\nBEGIN\r\n\r\nEND\r\n$function$';

      const sql = `CREATE FUNCTION "${func.schema}"."${func.name}" ()
         RETURNS TRIGGER
         LANGUAGE ${func.language}
         AS ${body}`;

      return await this.raw(sql, { split: false });
   }

   /**
    * SELECT * FROM pg_collation
    *
    * @returns {Array.<Object>} collations list
    * @memberof PostgreSQLClient
    */
   async getCollations () {
      return [];
   }

   /**
    * SHOW ALL
    *
    * @returns {Array.<Object>} variables list
    * @memberof PostgreSQLClient
    */
   async getVariables () {
      const sql = 'SHOW ALL';
      const results = await this.raw(sql);

      return results.rows.map(row => {
         return {
            name: row.name,
            value: row.setting
         };
      });
   }

   /**
    * SHOW ENGINES
    *
    * @returns {Array.<Object>} engines list
    * @memberof PostgreSQLClient
    */
   async getEngines () {
      return {
         name: 'PostgreSQL',
         support: 'YES',
         comment: '',
         isDefault: true
      };
   }

   /**
    * SHOW VARIABLES LIKE '%vers%'
    *
    * @returns {Array.<Object>} version parameters
    * @memberof PostgreSQLClient
    */
   async getVersion () {
      const sql = 'SELECT version()';
      const { rows } = await this.raw(sql);
      const infos = rows[0].version.split(',');

      return {
         number: infos[0].split(' ')[1],
         name: infos[0].split(' ')[0],
         arch: infos[1],
         os: infos[2]
      };
   }

   async getProcesses () {
      const sql = 'SELECT "pid", "usename", "client_addr", "datname", application_name , EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - "query_start")::INTEGER, "state", "query" FROM "pg_stat_activity"';

      const { rows } = await this.raw(sql);

      return rows.map(row => {
         return {
            id: row.pid,
            user: row.usename,
            host: row.client_addr,
            database: row.datname,
            application: row.application_name,
            time: row.date_part,
            state: row.state,
            info: row.query
         };
      });
   }

   /**
    * CREATE TABLE
    *
    * @returns {Array.<Object>} parameters
    * @memberof PostgreSQLClient
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
         const length = typeInfo.length ? field.enumValues || field.numLength || field.charLength || field.datePrecision : false;

         newColumns.push(`${field.name} 
            ${field.type.toUpperCase()}${length ? `(${length})` : ''} 
            ${field.unsigned ? 'UNSIGNED' : ''} 
            ${field.zerofill ? 'ZEROFILL' : ''}
            ${field.nullable ? 'NULL' : 'NOT NULL'}
            ${field.default ? `DEFAULT ${field.default}` : ''}
            ${field.onUpdate ? `ON UPDATE ${field.onUpdate}` : ''}`);
      });

      // ADD INDEX
      indexes.forEach(index => {
         const fields = index.fields.map(field => `${field}`).join(',');
         const type = index.type;

         if (type === 'PRIMARY')
            newIndexes.push(`PRIMARY KEY (${fields})`);
         else if (type === 'UNIQUE')
            newIndexes.push(`CONSTRAINT ${index.name} UNIQUE (${fields})`);
         else
            manageIndexes.push(`CREATE INDEX ${index.name} ON "${schema}"."${options.name}" (${fields})`);
      });

      // ADD FOREIGN KEYS
      foreigns.forEach(foreign => {
         newForeigns.push(`CONSTRAINT ${foreign.constraintName} FOREIGN KEY (${foreign.field}) REFERENCES "${schema}"."${foreign.refTable}" (${foreign.refField}) ON UPDATE ${foreign.onUpdate} ON DELETE ${foreign.onDelete}`);
      });

      sql = `${sql} (${[...newColumns, ...newIndexes, ...newForeigns].join(', ')})`;
      if (manageIndexes.length) sql = `${sql}; ${manageIndexes.join(';')}`;
      return await this.raw(sql);
   }

   /**
    * ALTER TABLE
    *
    * @returns {Array.<Object>} parameters
    * @memberof PostgreSQLClient
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

      if (schema !== 'public')
         await this.use(schema);

      let sql = '';
      const alterColumns = [];
      const renameColumns = [];
      const createSequences = [];
      const manageIndexes = [];

      // ADD FIELDS
      additions.forEach(addition => {
         const typeInfo = this._getTypeInfo(addition.type);
         const length = typeInfo.length ? addition.numLength || addition.charLength || addition.datePrecision : false;

         alterColumns.push(`ADD COLUMN ${addition.name} 
            ${addition.type.toUpperCase()}${length ? `(${length})` : ''}${addition.isArray ? '[]' : ''}
            ${addition.unsigned ? 'UNSIGNED' : ''} 
            ${addition.zerofill ? 'ZEROFILL' : ''}
            ${addition.nullable ? 'NULL' : 'NOT NULL'}
            ${addition.default ? `DEFAULT ${addition.default}` : ''}
            ${addition.onUpdate ? `ON UPDATE ${addition.onUpdate}` : ''}`);
      });

      // ADD INDEX
      indexChanges.additions.forEach(addition => {
         const fields = addition.fields.map(field => `${field}`).join(',');
         const type = addition.type;

         if (type === 'PRIMARY')
            alterColumns.push(`ADD PRIMARY KEY (${fields})`);
         else if (type === 'UNIQUE')
            alterColumns.push(`ADD CONSTRAINT ${addition.name} UNIQUE (${fields})`);
         else
            manageIndexes.push(`CREATE INDEX ${addition.name} ON "${schema}"."${table}" (${fields})`);
      });

      // ADD FOREIGN KEYS
      foreignChanges.additions.forEach(addition => {
         alterColumns.push(`ADD CONSTRAINT ${addition.constraintName} FOREIGN KEY (${addition.field}) REFERENCES "${schema}"."${addition.refTable}" (${addition.refField}) ON UPDATE ${addition.onUpdate} ON DELETE ${addition.onDelete}`);
      });

      // CHANGE FIELDS
      changes.forEach(change => {
         const typeInfo = this._getTypeInfo(change.type);
         const length = typeInfo.length ? change.numLength || change.charLength || change.datePrecision : false;
         let localType;

         switch (change.type) {
            case 'SERIAL':
               localType = 'integer';
               break;
            case 'SMALLSERIAL':
               localType = 'smallint';
               break;
            case 'BIGSERIAL':
               localType = 'bigint';
               break;
            default:
               localType = change.type.toLowerCase();
         }

         alterColumns.push(`ALTER COLUMN "${change.name}" TYPE ${localType}${length ? `(${length})` : ''}${change.isArray ? '[]' : ''} USING "${change.name}"::${localType}`);
         alterColumns.push(`ALTER COLUMN "${change.name}" ${change.nullable ? 'DROP NOT NULL' : 'SET NOT NULL'}`);
         alterColumns.push(`ALTER COLUMN "${change.name}" ${change.default ? `SET DEFAULT ${change.default}` : 'DROP DEFAULT'}`);
         if (['SERIAL', 'SMALLSERIAL', 'BIGSERIAL'].includes(change.type)) {
            const sequenceName = `${table}_${change.name}_seq`.replace(' ', '_');
            createSequences.push(`CREATE SEQUENCE IF NOT EXISTS ${sequenceName} OWNED BY "${table}"."${change.name}"`);
            alterColumns.push(`ALTER COLUMN "${change.name}" SET DEFAULT nextval('${sequenceName}')`);
         }

         if (change.orgName !== change.name)
            renameColumns.push(`ALTER TABLE "${schema}"."${table}" RENAME COLUMN "${change.orgName}" TO "${change.name}"`);
      });

      // CHANGE INDEX
      indexChanges.changes.forEach(change => {
         if (['PRIMARY', 'UNIQUE'].includes(change.oldType))
            alterColumns.push(`DROP CONSTRAINT ${change.oldName}`);
         else
            manageIndexes.push(`DROP INDEX ${change.oldName}`);

         const fields = change.fields.map(field => `${field}`).join(',');
         const type = change.type;

         if (type === 'PRIMARY')
            alterColumns.push(`ADD PRIMARY KEY (${fields})`);
         else if (type === 'UNIQUE')
            alterColumns.push(`ADD CONSTRAINT ${change.name} UNIQUE (${fields})`);
         else
            manageIndexes.push(`CREATE INDEX ${change.name} ON "${schema}"."${table}" (${fields})`);
      });

      // CHANGE FOREIGN KEYS
      foreignChanges.changes.forEach(change => {
         alterColumns.push(`DROP CONSTRAINT ${change.oldName}`);
         alterColumns.push(`ADD CONSTRAINT ${change.constraintName} FOREIGN KEY (${change.field}) REFERENCES "${schema}"."${change.refTable}" (${change.refField}) ON UPDATE ${change.onUpdate} ON DELETE ${change.onDelete}`);
      });

      // DROP FIELDS
      deletions.forEach(deletion => {
         alterColumns.push(`DROP COLUMN ${deletion.name}`);
      });

      // DROP INDEX
      indexChanges.deletions.forEach(deletion => {
         if (['PRIMARY', 'UNIQUE'].includes(deletion.type))
            alterColumns.push(`DROP CONSTRAINT ${deletion.name}`);
         else
            manageIndexes.push(`DROP INDEX ${deletion.name}`);
      });

      // DROP FOREIGN KEYS
      foreignChanges.deletions.forEach(deletion => {
         alterColumns.push(`DROP CONSTRAINT ${deletion.constraintName}`);
      });

      if (alterColumns.length) sql += `ALTER TABLE "${schema}"."${table}" ${alterColumns.join(', ')}; `;
      if (createSequences.length) sql = `${createSequences.join(';')}; ${sql}`;
      if (manageIndexes.length) sql = `${manageIndexes.join(';')}; ${sql}`;
      if (options.name) sql += `ALTER TABLE "${schema}"."${table}" RENAME TO "${options.name}"; `;

      // RENAME
      if (renameColumns.length) sql = `${renameColumns.join(';')}; ${sql}`;

      return await this.raw(sql);
   }

   /**
    * DUPLICATE TABLE
    *
    * @returns {Array.<Object>} parameters
    * @memberof PostgreSQLClient
    */
   async duplicateTable (params) {
      const sql = `CREATE TABLE ${params.schema}.${params.table}_copy (LIKE ${params.schema}.${params.table} INCLUDING ALL)`;
      return await this.raw(sql);
   }

   /**
    * TRUNCATE TABLE
    *
    * @returns {Array.<Object>} parameters
    * @memberof PostgreSQLClient
    */
   async truncateTable (params) {
      const sql = `TRUNCATE TABLE ${params.schema}.${params.table}`;
      return await this.raw(sql);
   }

   /**
    * DROP TABLE
    *
    * @returns {Array.<Object>} parameters
    * @memberof PostgreSQLClient
    */
   async dropTable (params) {
      const sql = `DROP TABLE ${params.schema}.${params.table}`;
      return await this.raw(sql);
   }

   /**
    * @returns {String} SQL string
    * @memberof PostgreSQLClient
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

      fromRaw += this._query.from ? ` ${this._query.schema ? `${this._query.schema}.` : ''}${this._query.from} ` : '';

      // WHERE
      const whereArray = this._query.where.reduce(this._reducer, []);
      const whereRaw = whereArray.length ? `WHERE ${whereArray.join(' AND ')} ` : '';

      // UPDATE
      const updateArray = this._query.update.reduce(this._reducer, []);
      const updateRaw = updateArray.length ? `SET ${updateArray.join(', ')} ` : '';

      // INSERT
      let insertRaw = '';

      if (this._query.insert.length) {
         const fieldsList = Object.keys(this._query.insert[0]).map(f => `"${f}"`);
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
      const limitRaw = selectArray.length && this._query.limit.length ? `LIMIT ${this._query.limit.join(', ')} ` : '';

      // OFFSET
      const offsetRaw = selectArray.length && this._query.offset.length ? `OFFSET ${this._query.offset.join(', ')} ` : '';

      return `${selectRaw}${updateRaw ? 'UPDATE' : ''}${insertRaw ? 'INSERT ' : ''}${this._query.delete ? 'DELETE ' : ''}${fromRaw}${updateRaw}${whereRaw}${groupByRaw}${orderByRaw}${limitRaw}${offsetRaw}${insertRaw}`;
   }

   /**
    * @param {string} sql raw SQL query
    * @param {object} args
    * @param {boolean} args.nest
    * @param {boolean} args.details
    * @param {boolean} args.split
    * @returns {Promise}
    * @memberof PostgreSQLClient
    */
   async raw (sql, args) {
      args = {
         nest: false,
         details: false,
         split: true,
         comments: true,
         ...args
      };

      if (args.schema && args.schema !== 'public')
         await this.use(args.schema);

      if (!args.comments)
         sql = sql.replace(/(\/\*(.|[\r\n])*?\*\/)|(--(.*|[\r\n]))/gm, '');// Remove comments

      const resultsArr = [];
      let paramsArr = [];
      const queries = args.split
         ? sql.split(/(?!\B'[^']*);(?![^']*'\B)/gm)
            .filter(Boolean)
            .map(q => q.trim())
         : [sql];

      if (process.env.NODE_ENV === 'development') this._logger(sql);// TODO: replace BLOB content with a placeholder

      for (const query of queries) {
         if (!query) continue;

         const timeStart = new Date();
         let timeStop;
         let keysArr = [];

         const { rows, report, fields, keys, duration } = await new Promise((resolve, reject) => {
            this._connection.query({
               rowMode: args.nest ? 'array' : null,
               text: query
            }, async (err, res) => {
               timeStop = new Date();

               if (err)
                  reject(err);
               else {
                  let ast;

                  try {
                     [ast] = parse(query);
                  }
                  catch (err) {}

                  const { rows, fields } = res;
                  let queryResult;
                  let tablesInfo;

                  if (args.nest) {
                     const tablesID = [...new Set(fields.map(field => field.tableID))].toString();
                     tablesInfo = await this.getTableByIDs(tablesID);

                     queryResult = rows.map(row => {
                        return row.reduce((acc, curr, i) => {
                           const table = tablesInfo[fields[i].tableID] ? tablesInfo[fields[i].tableID].table : '';
                           acc[`${table ? `${table}.` : ''}${fields[i].name}`] = curr;
                           return acc;
                        }, {});
                     });
                  }
                  else
                     queryResult = rows;

                  let remappedFields = fields
                     ? fields.map(field => {
                        if (!field || Array.isArray(field))
                           return false;

                        let schema = ast && ast.from && 'schema' in ast.from[0] ? ast.from[0].schema : this._schema;
                        let table = ast && ast.from ? ast.from[0].name : null;

                        if (args.nest) {
                           schema = tablesInfo[field.tableID] ? tablesInfo[field.tableID].schema : this._schema;
                           table = tablesInfo[field.tableID] ? tablesInfo[field.tableID].table : null;
                        }

                        return {
                           ...field,
                           name: field.name,
                           alias: field.name,
                           schema,
                           table,
                           // TODO: pick ast.from index if multiple
                           tableAlias: ast && ast.from ? ast.from[0].as : null,
                           orgTable: ast && ast.from ? ast.from[0].name : null,
                           type: this.types[field.dataTypeID] || field.format
                        };
                     }).filter(Boolean)
                     : [];

                  if (args.details) {
                     if (remappedFields.length) {
                        paramsArr = remappedFields.map(field => {
                           return {
                              table: field.table,
                              schema: field.schema
                           };
                        }).filter((val, i, arr) => arr.findIndex(el => el.schema === val.schema && el.table === val.table) === i);

                        for (const paramObj of paramsArr) {
                           if (!paramObj.table || !paramObj.schema) continue;

                           try { // Column details
                              const columns = await this.getTableColumns(paramObj, false);
                              const indexes = await this.getTableIndexes(paramObj);

                              remappedFields = remappedFields.map(field => {
                                 const detailedField = columns.find(f => f.name === field.name);
                                 const fieldIndex = indexes.find(i => i.column === field.name);
                                 if (field.table === paramObj.table && field.schema === paramObj.schema) {
                                    if (detailedField) {
                                       const length = detailedField.numPrecision || detailedField.charLength || detailedField.datePrecision || null;
                                       field = { ...field, ...detailedField, length };
                                    }

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
                     duration: timeStop - timeStart,
                     rows: Array.isArray(queryResult) ? queryResult.some(el => Array.isArray(el)) ? [] : queryResult : false,
                     report: !Array.isArray(queryResult) ? queryResult : false,
                     fields: remappedFields,
                     keys: keysArr
                  });
               }
            });
         });

         resultsArr.push({ rows, report, fields, keys, duration });
      }

      return resultsArr.length === 1 ? resultsArr[0] : resultsArr;
   }
}
