import SSH2Promise = require('@fabio286/ssh2-promise');
import SSHConfig from '@fabio286/ssh2-promise/lib/sshConfig';
import dataTypes from 'common/data-types/postgresql';
import * as antares from 'common/interfaces/antares';
import * as pg from 'pg';
import * as pgAst from 'pgsql-ast-parser';
import { ConnectionOptions } from 'tls';

import { BaseClient } from './BaseClient';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pgToString (value: any) {
   return value.toString();
}

pg.types.setTypeParser(1082, pgToString); // date
pg.types.setTypeParser(1083, pgToString); // time
pg.types.setTypeParser(1114, pgToString); // timestamp
pg.types.setTypeParser(1184, pgToString); // timestamptz
pg.types.setTypeParser(1266, pgToString); // timetz

// from pg-types
type builtinsTypes =
   'BOOL' |
   'BYTEA' |
   'CHAR' |
   'INT8' |
   'INT2' |
   'INT4' |
   'REGPROC' |
   'TEXT' |
   'OID' |
   'TID' |
   'XID' |
   'CID' |
   'JSON' |
   'XML' |
   'PG_NODE_TREE' |
   'SMGR' |
   'PATH' |
   'POLYGON' |
   'CIDR' |
   'FLOAT4' |
   'FLOAT8' |
   'ABSTIME' |
   'RELTIME' |
   'TINTERVAL' |
   'CIRCLE' |
   'MACADDR8' |
   'MONEY' |
   'MACADDR' |
   'INET' |
   'ACLITEM' |
   'BPCHAR' |
   'VARCHAR' |
   'DATE' |
   'TIME' |
   'TIMESTAMP' |
   'TIMESTAMPTZ' |
   'INTERVAL' |
   'TIMETZ' |
   'BIT' |
   'VARBIT' |
   'NUMERIC' |
   'REFCURSOR' |
   'REGPROCEDURE' |
   'REGOPER' |
   'REGOPERATOR' |
   'REGCLASS' |
   'REGTYPE' |
   'UUID' |
   'TXID_SNAPSHOT' |
   'PG_LSN' |
   'PG_NDISTINCT' |
   'PG_DEPENDENCIES' |
   'TSVECTOR' |
   'TSQUERY' |
   'GTSVECTOR' |
   'REGCONFIG' |
   'REGDICTIONARY' |
   'JSONB' |
   'REGNAMESPACE' |
   'REGROLE';
export class PostgreSQLClient extends BaseClient {
   private _schema?: string;
   private _runningConnections: Map<string, number>;
   private _connectionsToCommit: Map<string, pg.Client | pg.PoolClient>;
   private _keepaliveTimer: NodeJS.Timer;
   private _keepaliveMs: number;
   protected _connection?: pg.Client | pg.Pool;
   private types: Record<string, string> = {};
   private _arrayTypes: Record<string, string> = {
      _int2: 'SMALLINT',
      _int4: 'INTEGER',
      _int8: 'BIGINT',
      _float4: 'REAL',
      _float8: 'DOUBLE PRECISION',
      _char: '"CHAR"',
      _varchar: 'CHARACTER VARYING'
   }

   _params: pg.ClientConfig & {schema: string; ssl?: ConnectionOptions; ssh?: SSHConfig; readonly: boolean};

   constructor (args: antares.ClientParams) {
      super(args);

      this._schema = null;
      this._runningConnections = new Map();
      this._connectionsToCommit = new Map();
      this._keepaliveMs = 10*60*1000;

      for (const key in pg.types.builtins) {
         const builtinKey = key as builtinsTypes;
         this.types[pg.types.builtins[builtinKey]] = key;
      }
   }

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   _reducer (acc: string[], curr: any) {
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
                  clausoles.push(`"${key}" ${curr[key]}`);

               return clausoles;
            }
      }
   }

   getTypeInfo (type: string): antares.TypeInformations {
      return dataTypes
         .reduce((acc, group) => [...acc, ...group.types], [])
         .filter(_type => _type.name === type.toUpperCase())[0];
   }

   _getArrayType (type: string) {
      if (Object.keys(this._arrayTypes).includes(type))
         return this._arrayTypes[type];
      return type.replace('_', '');
   }

   async getDbConfig () {
      this._params.application_name = 'Antares SQL';

      const dbConfig = {
         host: this._params.host,
         port: this._params.port,
         user: this._params.user,
         connectionString: this._params.connectionString,
         database: 'postgres' as string,
         password: this._params.password,
         ssl: null as ConnectionOptions
      };

      if (this._params.database?.length) dbConfig.database = this._params.database;

      if (this._params.ssl) dbConfig.ssl = this._params.ssl;

      if (this._params.ssh) {
         try {
            this._ssh = new SSH2Promise({
               ...this._params.ssh,
               reconnect: true,
               reconnectTries: 3,
               debug: process.env.NODE_ENV !== 'production' ? (s) => console.log(s) : null
            });

            const tunnel = await this._ssh.addTunnel({
               remoteAddr: this._params.host,
               remotePort: this._params.port
            });

            dbConfig.host = undefined;
            dbConfig.port = tunnel.localPort;
         }
         catch (err) {
            if (this._ssh) {
               this._ssh.close();
               this._ssh.closeTunnel();
            }
            throw err;
         }
      }

      return dbConfig;
   }

   /**
    * @memberof PostgreSQLClient
    */
   async connect () {
      if (!this._poolSize)
         this._connection = await this.getConnection();
      else
         this._connection = await this.getConnectionPool();
   }

   async getConnection () {
      const dbConfig = await this.getDbConfig();
      const client = new pg.Client(dbConfig);
      await client.connect();
      const connection = client;

      if (this._params.readonly)
         await connection.query('SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY');

      connection.on('error', err => { // Intercepts errors and converts to rejections
         Promise.reject(err);
      });

      return connection;
   }

   async getConnectionPool () {
      const dbConfig = await this.getDbConfig();
      const pool = new pg.Pool({
         ...dbConfig,
         max: this._poolSize,
         idleTimeoutMillis: 0
      });
      const connection = pool;

      if (this._params.readonly) {
         connection.on('connect', conn => {
            conn.query('SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY');
         });
      }

      this._keepaliveTimer = setInterval(async () => {
         await this.keepAlive();
      }, this._keepaliveMs);

      connection.on('error', err => { // Intercepts errors and converts to rejections
         Promise.reject(err);
      });

      return connection;
   }

   ping () {
      return this.select('1+1').run();
   }

   destroy () {
      this._connection.end();
      clearInterval(this._keepaliveTimer);
      this._keepaliveTimer = undefined;
      if (this._ssh) {
         this._ssh.close();
         this._ssh.closeTunnel();
      }
   }

   private async keepAlive () {
      try {
         const connection = await this._connection.connect() as pg.PoolClient;
         await connection.query('SELECT 1+1');
         connection.release();
      }
      catch (_) {}
   }

   use (schema: string, connection?: pg.Client | pg.PoolClient) {
      this._schema = schema;

      if (schema) {
         const sql = `SET search_path TO "${schema}"`;

         if (connection === undefined)
            return this.raw(sql);
         else
            return connection.query(sql);
      }
   }

   getCollations (): null[] {
      return [];
   }

   async getDatabases () {
      const { rows } = await this.raw('SELECT datname FROM pg_database WHERE datistemplate = false');
      if (rows) {
         return rows.reduce((acc, cur) => {
            acc.push(cur.datname);
            return acc;
         }, [] as string[]);
      }
      else
         return [];
   }

   async getStructure (schemas: Set<string>) {
      /* eslint-disable camelcase */
      interface ShowTableResult {
         Db?: string;
         data_length: number;
         index_length: number;
         table_name: string;
         table_type: string;
         reltuples: number;
         Collation: string;
         comment: string;
      }

      interface ShowTriggersResult {
         Db?: string;
         table_name: string;
         trigger_name: string;
         enabled: boolean;
      }
      /* eslint-enable camelcase */

      const { rows: databases } = await this.raw<antares.QueryResult<{ database: string}>>('SELECT schema_name AS database FROM information_schema.schemata ORDER BY schema_name');
      const { rows: functions } = await this.raw('SELECT * FROM information_schema.routines WHERE routine_type = \'FUNCTION\'');
      const { rows: procedures } = await this.raw('SELECT * FROM information_schema.routines WHERE routine_type = \'PROCEDURE\'');

      const tablesArr: ShowTableResult[] = [];
      const triggersArr: ShowTriggersResult[] = [];
      let schemaSize = 0;

      for (const db of databases) {
         if (!schemas.has(db.database)) continue;

         let { rows: tables } = await this.raw<antares.QueryResult<ShowTableResult>>(`
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

         let { rows: matViews } = await this.raw<antares.QueryResult<ShowTableResult>>(`
            SELECT schemaname AS schema_name,
               matviewname AS table_name,
               matviewowner AS owner,
               ispopulated AS is_populated,
               definition,
               'materializedView' AS table_type
            FROM pg_matviews
            WHERE schemaname = '${db.database}'
            ORDER BY schema_name,
               table_name;
         `);

         if (tables.length) {
            tables = tables.map(table => {
               table.Db = db.database;
               return table;
            });
            tablesArr.push(...tables);
         }

         if (matViews.length) {
            matViews = matViews.map(view => {
               view.Db = db.database;
               return view;
            });
            tablesArr.push(...matViews);
         }

         let { rows: triggers } = await this.raw<antares.QueryResult<ShowTriggersResult>>(`
            SELECT
               pg_class.relname AS table_name,
               pg_trigger.tgname AS trigger_name,
               pg_namespace.nspname AS trigger_schema,
               (pg_trigger.tgenabled != 'D')::bool AS enabled
            FROM pg_trigger
            JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
            JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
            JOIN information_schema.triggers ON information_schema.triggers.trigger_schema = pg_namespace.nspname 
               AND information_schema.triggers.event_object_table = pg_class.relname
               AND information_schema.triggers.trigger_name = pg_trigger.tgname
            WHERE trigger_schema = '${db.database}'
            GROUP BY 1, 2, 3, 4
            ORDER BY table_name
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
               const tableSize = Number(table.data_length) + Number(table.index_length);
               schemaSize += tableSize;

               return {
                  name: table.table_name,
                  type: table.table_type === 'VIEW'
                     ? 'view'
                     : table.table_type === 'materializedView'
                        ? 'materializedView'
                        : 'table',
                  rows: table.reltuples,
                  size: tableSize,
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
                  definer: '',
                  table: trigger.table_name,
                  sqlMode: '',
                  enabled: trigger.enabled
               };
            });

            return {
               name: db.database,
               size: schemaSize,
               tables: remappedTables,
               functions: remappedFunctions,
               procedures: remappedProcedures,
               triggers: remappedTriggers,
               triggerFunctions: remappedTriggerFunctions,
               schedulers: [] as null[]
            };
         }
         else {
            return {
               name: db.database,
               size: 0,
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

   async getTableColumns ({ schema, table }: { schema: string; table: string }, arrayRemap = true) {
      /* eslint-disable camelcase */
      interface TableColumnsResult {
         data_type: string;
         udt_name: string;
         column_name: string;
         table_schema: string;
         table_name: string;
         numeric_scale: number;
         numeric_precision: number;
         datetime_precision: number;
         character_maximum_length: number;
         is_nullable: string;
         ordinal_position: number;
         column_default: string;
         character_set_name: string;
         collation_name: string;
         column_comment: string;
      }
      /* eslint-enable camelcase */

      // Table columns
      const { rows } = await this.raw<antares.QueryResult<TableColumnsResult>>(`
         WITH comments AS (
            SELECT attr.attname AS column, des.description AS comment, pgc.relname
            FROM pg_attribute AS attr, pg_description AS des, pg_class AS pgc
            WHERE pgc.oid = attr.attrelid
            AND des.objoid = pgc.oid
            AND pg_table_is_visible(pgc.oid)
            AND attr.attnum = des.objsubid
         )
         SELECT cols.*, comments.comment AS column_comment
         FROM "information_schema"."columns" AS cols
         LEFT JOIN comments ON comments.column = cols.column_name AND comments.relname = cols.table_name
         WHERE cols.table_schema = '${schema}'
         AND cols.table_name = '${table}'
         ORDER BY "ordinal_position" ASC
      `);

      return rows.map(field => {
         let type = field.data_type;
         const isArray = type === 'ARRAY';

         if (isArray && arrayRemap)
            type = this._getArrayType(field.udt_name);

         return {
            name: field.column_name,
            key: null as null,
            type: type.toUpperCase(),
            isArray,
            schema: field.table_schema,
            table: field.table_name,
            numScale: field.numeric_scale,
            numPrecision: field.numeric_precision,
            datePrecision: field.datetime_precision,
            charLength: field.character_maximum_length,
            nullable: field.is_nullable.includes('YES'),
            unsigned: null as null,
            zerofill: null as null,
            order: field.ordinal_position,
            default: field.column_default,
            charset: field.character_set_name,
            collation: field.collation_name,
            autoIncrement: false,
            onUpdate: null as null,
            comment: field.column_comment
         };
      });
   }

   async getTableApproximateCount ({ table }: { table: string }): Promise<number> {
      const { rows } = await this.raw(`SELECT reltuples AS count FROM pg_class WHERE relname = '${table}'`);

      return rows.length ? rows[0].count : 0;
   }

   async getTableOptions ({ schema, table }: { schema: string; table: string }) {
      /* eslint-disable camelcase */
      interface TableOptionsResult {
         table_name: string;
         table_type: string;
         reltuples: string;
         data_length: number;
         index_length: number;
         Collation: string;
         comment: string;
      }
      /* eslint-enable camelcase */

      const { rows } = await this.raw<antares.QueryResult<TableOptionsResult>>(`
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
      }
      return {};
   }

   async getTableIndexes ({ schema, table }: { schema: string; table: string }) {
      /* eslint-disable camelcase */
      interface ShowIntexesResult {
         constraint_name: string;
         column_name: string;
         constraint_type: string;
      }
      /* eslint-enable camelcase */

      // if (schema !== 'public')
      await this.use(schema);

      const { rows } = await this.raw<antares.QueryResult<ShowIntexesResult>>(`WITH ndx_list AS (
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
            type: row.constraint_type
         };
      });
   }

   async getTableByIDs (ids: string) {
      if (!ids) return;

      const { rows } = await this.raw<antares.QueryResult<{tableid: number; relname: string; schemaname: string}>>(`
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
      }, {} as {table: string; schema: string}[]);
   }

   async getTableDll ({ schema, table }: { schema: string; table: string }) {
      /* eslint-disable camelcase */
      interface SequenceRecord {
         sequence_catalog: string;
         sequence_schema: string;
         sequence_name: string;
         data_type: string;
         numeric_precision: number;
         numeric_precision_radix: number;
         numeric_scale: number;
         start_value: string;
         minimum_value: string;
         maximum_value: string;
         increment: string;
         cycle_option: string;
      }
      /* eslint-enable camelcase */

      let createSql = '';
      const sequences = [];
      const columnsSql = [];
      const arrayTypes: Record<string, string> = {
         _int2: 'smallint',
         _int4: 'integer',
         _int8: 'bigint',
         _float4: 'real',
         _float8: 'double precision',
         _char: '"char"',
         _varchar: 'character varying'
      };

      // Table columns
      const { rows } = await this.raw(`
         SELECT * 
         FROM "information_schema"."columns" 
         WHERE "table_schema" = '${schema}' 
         AND "table_name" = '${table}' 
         ORDER BY "ordinal_position" ASC
      `, { schema: 'information_schema' });

      if (!rows.length) return '';

      const indexes = await this.getTableIndexes({ schema, table });
      const primaryKey = indexes
         .filter(i => i.type === 'PRIMARY')
         .reduce((acc, cur) => {
            if (!Object.keys(acc).length) {
               cur.column = `"${cur.column}"`;
               acc = cur;
            }
            else
               acc.column += `, "${cur.column}"`;
            return acc;
         }, {} as { name: string; column: string; type: string});

      const remappedIndexes = indexes
         .filter(i => i.type !== 'PRIMARY')
         .reduce((acc, cur) => {
            const existingIndex = acc.findIndex(i => i.name === cur.name);

            if (existingIndex >= 0)
               acc[existingIndex].column += `, "${cur.column}"`;
            else {
               cur.column = `"${cur.column}"`;
               acc.push(cur);
            }

            return acc;
         }, [] as { name: string; column: string; type: string}[]);

      for (const column of rows) {
         let fieldType = column.data_type;
         if (fieldType === 'USER-DEFINED') fieldType = `"${schema}".${column.udt_name}`;
         else if (fieldType === 'ARRAY') {
            if (Object.keys(arrayTypes).includes(fieldType))
               fieldType = arrayTypes[column.udt_name] + '[]';
            else
               fieldType = column.udt_name.replaceAll('_', '') + '[]';
         }

         const columnArr = [
            `"${column.column_name}"`,
            `${fieldType}${column.character_maximum_length ? `(${column.character_maximum_length})` : ''}`
         ];

         if (column.column_default) {
            columnArr.push(`DEFAULT ${column.column_default}`);
            if (column.column_default.includes('nextval')) {
               const sequenceName = column.column_default.split('\'')[1];
               sequences.push(sequenceName);
            }
         }
         if (column.is_nullable === 'NO') columnArr.push('NOT NULL');

         columnsSql.push(columnArr.join(' '));
      }

      if (primaryKey)
         columnsSql.push(`CONSTRAINT "${primaryKey.name}" PRIMARY KEY (${primaryKey.column})`);

      // Table sequences
      for (let sequence of sequences) {
         if (sequence.includes('.')) sequence = sequence.split('.')[1];

         const { rows } = await this.select('*')
            .schema('information_schema')
            .from('sequences')
            .where({ sequence_schema: `= '${schema}'`, sequence_name: `= '${sequence}'` })
            .run<SequenceRecord>();

         if (rows.length) {
            createSql += `CREATE SEQUENCE "${schema}"."${sequence}"
   START WITH ${rows[0].start_value}
   INCREMENT BY ${rows[0].increment}
   MINVALUE ${rows[0].minimum_value}
   MAXVALUE ${rows[0].maximum_value}
   CACHE 1;\n\n`;
         }
      }

      // Table create
      createSql += `CREATE TABLE "${schema}"."${table}"(
   ${columnsSql.join(',\n   ')}
);\n`;

      // Table indexes
      createSql += '\n';

      for (const index of remappedIndexes) {
         if (index.type !== 'PRIMARY')
            createSql += `CREATE ${index.type}${index.type === 'UNIQUE' ? ' INDEX' : ''} "${index.name}" ON "${schema}"."${table}" (${index.column});\n`;
      }

      return createSql;
   }

   async getKeyUsage ({ schema, table }: { schema: string; table: string }) {
      /* eslint-disable camelcase */
      interface KeyResult {
         table_schema: string;
         table_name: string;
         column_name: string;
         ordinal_position: number;
         position_in_unique_constraint: number;
         constraint_name: string;
         foreign_table_schema: string;
         foreign_table_name: string;
         foreign_column_name: string;
         update_rule: string;
         delete_rule: string;
      }
      /* eslint-enable camelcase */

      const { rows } = await this.raw<antares.QueryResult<KeyResult>>(`
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

   async getUsers () {
      const { rows } = await this.raw('SELECT *  FROM pg_catalog.pg_user');

      return rows.map(row => {
         return {
            name: row.username,
            host: row.host,
            password: row.passwd
         } as {name: string; host: string; password: string};
      });
   }

   async createSchema (params: {name: string}) {
      return await this.raw(`CREATE SCHEMA "${params.name}"`);
   }

   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   async alterSchema (params: {name: string}): Promise<void> {
      return null;
   }

   async dropSchema (params: { database: string }) {
      return await this.raw(`DROP SCHEMA "${params.database}" CASCADE`);
   }

   async createTable (params: antares.CreateTableParams) {
      const {
         schema,
         fields,
         foreigns,
         indexes,
         options
      } = params;
      const newColumns: string[] = [];
      const newIndexes: string[] = [];
      const manageIndexes: string[] = [];
      const newForeigns: string[] = [];
      const modifyComment: string[] = [];

      let sql = `CREATE TABLE "${schema}"."${options.name}"`;

      // ADD FIELDS
      fields.forEach(field => {
         const typeInfo = this.getTypeInfo(field.type);
         const length = typeInfo.length ? field.enumValues || field.numLength || field.charLength || field.datePrecision : false;

         newColumns.push(`"${field.name}" 
            ${field.type.toUpperCase()}${length ? `(${length}${field.numScale !== null ? `,${field.numScale}` : ''})` : ''} 
            ${field.unsigned ? 'UNSIGNED' : ''} 
            ${field.zerofill ? 'ZEROFILL' : ''}
            ${field.nullable ? 'NULL' : 'NOT NULL'}
            ${field.default !== null ? `DEFAULT ${field.default || '\'\''}` : ''}
            ${field.onUpdate ? `ON UPDATE ${field.onUpdate}` : ''}`);
         if (field.comment != null)
            modifyComment.push(`COMMENT ON COLUMN "${schema}"."${options.name}"."${field.name}" IS '${field.comment}'`);
      });

      // ADD INDEX
      indexes.forEach(index => {
         const fields = index.fields.map(field => `${field}`).join(',');
         const type = index.type;

         if (type === 'PRIMARY')
            newIndexes.push(`PRIMARY KEY (${fields})`);
         else if (type === 'UNIQUE')
            newIndexes.push(`CONSTRAINT "${index.name}" UNIQUE (${fields})`);
         else
            manageIndexes.push(`CREATE INDEX "${index.name}" ON "${schema}"."${options.name}" (${fields})`);
      });

      // ADD FOREIGN KEYS
      foreigns.forEach(foreign => {
         newForeigns.push(`CONSTRAINT "${foreign.constraintName}" FOREIGN KEY ("${foreign.field}") REFERENCES "${schema}"."${foreign.refTable}" ("${foreign.refField}") ON UPDATE ${foreign.onUpdate} ON DELETE ${foreign.onDelete}`);
      });

      sql = `${sql} (${[...newColumns, ...newIndexes, ...newForeigns].join(', ')}); `;
      if (manageIndexes.length) sql = `${sql} ${manageIndexes.join(';')}; `;
      // TABLE COMMENT
      if (options.comment != null) sql = `${sql} COMMENT ON TABLE "${schema}"."${options.name}" IS '${options.comment}'; `;
      // FIELDS COMMENT
      if (modifyComment.length) sql = `${sql} ${modifyComment.join(';')}; `;

      return await this.raw(sql);
   }

   async alterTable (params: antares.AlterTableParams) {
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
      const alterColumns: string[] = [];
      const renameColumns: string[] = [];
      const createSequences: string[] = [];
      const manageIndexes: string[] = [];
      const modifyComment: string[] = [];

      // ADD FIELDS
      additions.forEach(addition => {
         const typeInfo = this.getTypeInfo(addition.type);
         const length = typeInfo.length ? addition.numLength || addition.charLength || addition.datePrecision : false;

         alterColumns.push(`ADD COLUMN "${addition.name}" 
            ${addition.type.toUpperCase()}${length ? `(${length}${addition.numScale !== null ? `,${addition.numScale}` : ''})` : ''}${addition.isArray ? '[]' : ''} 
            ${addition.unsigned ? 'UNSIGNED' : ''} 
            ${addition.zerofill ? 'ZEROFILL' : ''}
            ${addition.nullable ? 'NULL' : 'NOT NULL'}
            ${addition.default !== null ? `DEFAULT ${addition.default || '\'\''}` : ''}
            ${addition.onUpdate ? `ON UPDATE ${addition.onUpdate}` : ''}`);
         if (addition.comment != null)
            modifyComment.push(`COMMENT ON COLUMN "${schema}"."${table}"."${addition.name}" IS '${addition.comment}'`);
      });

      // ADD INDEX
      indexChanges.additions.forEach(addition => {
         const fields = addition.fields.map(field => `"${field}"`).join(',');
         const type = addition.type;

         if (type === 'PRIMARY')
            alterColumns.push(`ADD PRIMARY KEY (${fields})`);
         else if (type === 'UNIQUE')
            alterColumns.push(`ADD CONSTRAINT "${addition.name}" UNIQUE (${fields})`);
         else
            manageIndexes.push(`CREATE INDEX "${addition.name}" ON "${schema}"."${table}" (${fields})`);
      });

      // ADD FOREIGN KEYS
      foreignChanges.additions.forEach(addition => {
         alterColumns.push(`ADD CONSTRAINT "${addition.constraintName}" FOREIGN KEY ("${addition.field}") REFERENCES "${schema}"."${addition.refTable}" (${addition.refField}) ON UPDATE ${addition.onUpdate} ON DELETE ${addition.onDelete}`);
      });

      // CHANGE FIELDS
      changes.forEach(change => {
         const typeInfo = this.getTypeInfo(change.type);
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

         alterColumns.push(`ALTER COLUMN "${change.name}" TYPE ${localType}${length ? `(${length}${change.numScale ? `,${change.numScale}` : ''})` : ''}${change.isArray ? '[]' : ''} USING "${change.name}"::${localType}`);
         alterColumns.push(`ALTER COLUMN "${change.name}" ${change.nullable ? 'DROP NOT NULL' : 'SET NOT NULL'}`);
         alterColumns.push(`ALTER COLUMN "${change.name}" ${change.default !== null ? `SET DEFAULT ${change.default || '\'\''}` : 'DROP DEFAULT'}`);

         if (['SERIAL', 'SMALLSERIAL', 'BIGSERIAL'].includes(change.type)) {
            const sequenceName = `${table}_${change.name}_seq`.replace(' ', '_');
            createSequences.push(`CREATE SEQUENCE IF NOT EXISTS ${sequenceName} OWNED BY "${table}"."${change.name}"`);
            alterColumns.push(`ALTER COLUMN "${change.name}" SET DEFAULT nextval('${sequenceName}')`);
         }

         if (change.orgName !== change.name)
            renameColumns.push(`ALTER TABLE "${schema}"."${table}" RENAME COLUMN "${change.orgName}" TO "${change.name}"`);
         if (change.comment != null)
            modifyComment.push(`COMMENT ON COLUMN "${schema}"."${table}"."${change.name}" IS '${change.comment}'`);
      });

      // CHANGE INDEX
      indexChanges.changes.forEach(change => {
         if (['PRIMARY', 'UNIQUE'].includes(change.oldType))
            alterColumns.push(`DROP CONSTRAINT ${change.oldName}`);
         else
            manageIndexes.push(`DROP INDEX ${change.oldName}`);

         const fields = change.fields.map(field => `"${field}"`).join(',');
         const type = change.type;

         if (type === 'PRIMARY')
            alterColumns.push(`ADD PRIMARY KEY (${fields})`);
         else if (type === 'UNIQUE')
            alterColumns.push(`ADD CONSTRAINT "${change.name}" UNIQUE (${fields})`);
         else
            manageIndexes.push(`CREATE INDEX "${change.name}" ON "${schema}"."${table}" (${fields})`);
      });

      // CHANGE FOREIGN KEYS
      foreignChanges.changes.forEach(change => {
         alterColumns.push(`DROP CONSTRAINT "${change.oldName}"`);
         alterColumns.push(`ADD CONSTRAINT "${change.constraintName}" FOREIGN KEY (${change.field}) REFERENCES "${schema}"."${change.refTable}" ("${change.refField}") ON UPDATE ${change.onUpdate} ON DELETE ${change.onDelete}`);
      });

      // DROP FIELDS
      deletions.forEach(deletion => {
         alterColumns.push(`DROP COLUMN "${deletion.name}"`);
      });

      // DROP INDEX
      indexChanges.deletions.forEach(deletion => {
         if (['PRIMARY', 'UNIQUE'].includes(deletion.type))
            alterColumns.push(`DROP CONSTRAINT "${deletion.name}"`);
         else
            manageIndexes.push(`DROP INDEX "${deletion.name}"`);
      });

      // DROP FOREIGN KEYS
      foreignChanges.deletions.forEach(deletion => {
         alterColumns.push(`DROP CONSTRAINT "${deletion.constraintName}"`);
      });

      if (alterColumns.length) sql += `ALTER TABLE "${schema}"."${table}" ${alterColumns.join(', ')}; `;
      if (createSequences.length) sql = `${createSequences.join(';')}; ${sql}`;
      if (manageIndexes.length) sql = `${manageIndexes.join(';')}; ${sql}`;
      // TABLE COMMENT
      if (options.comment != null) sql = `${sql} COMMENT ON TABLE "${schema}"."${table}" IS '${options.comment}'; `;
      // FIELDS COMMENT
      if (modifyComment.length) sql = `${sql} ${modifyComment.join(';')}; `;
      if (options.name) sql += `ALTER TABLE "${schema}"."${table}" RENAME TO "${options.name}"; `;
      // RENAME
      if (renameColumns.length) sql = `${renameColumns.join(';')}; ${sql}`;

      return await this.raw(sql);
   }

   async duplicateTable (params: { schema: string; table: string }) {
      const sql = `CREATE TABLE "${params.schema}"."${params.table}_copy" (LIKE "${params.schema}"."${params.table}" INCLUDING ALL)`;
      return await this.raw(sql);
   }

   async truncateTable (params: { schema: string; table: string }) {
      const sql = `TRUNCATE TABLE "${params.schema}"."${params.table}"`;
      return await this.raw(sql);
   }

   async dropTable (params: { schema: string; table: string }) {
      const sql = `DROP TABLE "${params.schema}"."${params.table}"`;
      return await this.raw(sql);
   }

   async getViewInformations ({ schema, view }: { schema: string; view: string }) {
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

   async getMaterializedViewInformations ({ schema, view }: { schema: string; view: string }) {
      const sql = `SELECT "definition" FROM "pg_matviews" WHERE "matviewname"='${view}' AND "schemaname"='${schema}'`;
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

   async dropView (params: { schema: string; view: string }) {
      const sql = `DROP VIEW "${params.schema}"."${params.view}"`;
      return await this.raw(sql);
   }

   async dropMaterializedView (params: { schema: string; view: string }) {
      const sql = `DROP MATERIALIZED VIEW "${params.schema}"."${params.view}"`;
      return await this.raw(sql);
   }

   async alterView ({ view }: { view: antares.AlterViewParams }) {
      let sql = `CREATE OR REPLACE VIEW "${view.schema}"."${view.oldName}" AS ${view.sql}`;

      if (view.name !== view.oldName)
         sql += `; ALTER VIEW "${view.schema}"."${view.oldName}" RENAME TO "${view.name}"`;

      return await this.raw(sql);
   }

   async alterMaterializedView ({ view }: { view: antares.AlterViewParams }) {
      let sql = `CREATE OR REPLACE MATERIALIZED VIEW "${view.schema}"."${view.oldName}" AS ${view.sql}`;

      if (view.name !== view.oldName)
         sql += `; ALTER VIEW "${view.schema}"."${view.oldName}" RENAME TO "${view.name}"`;

      return await this.raw(sql);
   }

   async createView (params: antares.CreateViewParams) {
      const sql = `CREATE VIEW "${params.schema}"."${params.name}" AS ${params.sql}`;
      return await this.raw(sql);
   }

   async createMaterializedView (params: antares.CreateViewParams) {
      const sql = `CREATE MATERIALIZED VIEW "${params.schema}"."${params.name}" AS ${params.sql}`;
      return await this.raw(sql);
   }

   async getTriggerInformations ({ schema, trigger }: { schema: string; trigger: string }) {
      const [table, triggerName] = trigger.split('.');

      const results = await this.raw(`
         SELECT
            information_schema.triggers.event_object_schema AS table_schema,
            information_schema.triggers.event_object_table AS table_name,
            information_schema.triggers.trigger_schema,
            information_schema.triggers.trigger_name,
            string_agg(event_manipulation, ',') AS EVENT,
            action_timing AS activation,
            action_condition AS condition,
            action_statement AS definition,
            (pg_trigger.tgenabled != 'D')::bool AS enabled
         FROM pg_trigger
         JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
         JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
         JOIN information_schema.triggers ON pg_namespace.nspname = information_schema.triggers.trigger_schema
            AND pg_class.relname = information_schema.triggers.event_object_table
         WHERE trigger_schema = '${schema}'
         AND trigger_name = '${triggerName}'
         AND event_object_table = '${table}'
         GROUP BY 1,2,3,4,6,7,8,9
         ORDER BY table_schema,
                  table_name
      `);

      return results.rows.map(row => {
         return {
            sql: row.definition,
            name: row.trigger_name,
            table: row.table_name,
            event: [...new Set(row.event.split(','))],
            activation: row.activation
         };
      })[0];
   }

   async dropTrigger (params: { schema: string; trigger: string }) {
      const triggerParts = params.trigger.split('.');
      const sql = `DROP TRIGGER "${triggerParts[1]}" ON "${params.schema}"."${triggerParts[0]}"`;
      return await this.raw(sql);
   }

   async alterTrigger ({ trigger } : {trigger: antares.AlterTriggerParams}) {
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

   async createTrigger (params: antares.CreateTriggerParams) {
      const eventsString = Array.isArray(params.event) ? params.event.join(' OR ') : params.event;
      const sql = `CREATE TRIGGER "${params.name}" ${params.activation} ${eventsString} ON "${params.schema}"."${params.table}" FOR EACH ROW ${params.sql}`;
      return await this.raw(sql, { split: false });
   }

   async enableTrigger ({ schema, trigger }: { schema: string; trigger: string }) {
      const [table, triggerName] = trigger.split('.');
      const sql = `ALTER TABLE "${schema}"."${table}" ENABLE TRIGGER "${triggerName}"`;
      return await this.raw(sql, { split: false });
   }

   async disableTrigger ({ schema, trigger }: { schema: string; trigger: string }) {
      const [table, triggerName] = trigger.split('.');
      const sql = `ALTER TABLE "${schema}"."${table}" DISABLE TRIGGER "${triggerName}"`;
      return await this.raw(sql, { split: false });
   }

   async getRoutineInformations ({ schema, routine }: { schema: string; routine: string }) {
      const sql = `SELECT pg_get_functiondef((SELECT oid FROM pg_proc WHERE proname = '${routine}'));`;
      const results = await this.raw(sql);

      return results.rows.map(async row => {
         if (!row.pg_get_functiondef) {
            return {
               definer: null as null,
               sql: '',
               parameters: [] as null[],
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
            deterministic: null as null,
            dataAccess: null as null,
            language: row.pg_get_functiondef.match(/(?<=LANGUAGE )(.*)(?<=[\S+\n\r\s])/gm)[0]
         };
      })[0];
   }

   async dropRoutine (params: { schema: string; routine: string }) {
      const sql = `DROP PROCEDURE "${params.schema}"."${params.routine}"`;
      return await this.raw(sql);
   }

   async alterRoutine ({ routine }: {routine: antares.AlterRoutineParams}) {
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

   async createRoutine (routine: antares.CreateRoutineParams) {
      const parameters = 'parameters' in routine
         ? routine.parameters.reduce((acc, curr) => {
            acc.push(`${curr.context} ${curr.name} ${curr.type}`);
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

   async getFunctionInformations ({ schema, func }: { schema: string; func: string }) {
      /* eslint-disable camelcase */
      interface CreateFunctionResult {
         pg_get_functiondef: string;
      }

      interface FunctionParamsResult {
         parameter_mode: string;
         parameter_name: string;
         data_type: string;
      }
      /* eslint-enable camelcase */

      const sql = `SELECT pg_get_functiondef((SELECT oid FROM pg_proc WHERE proname = '${func}'));`;
      const results = await this.raw<antares.QueryResult<CreateFunctionResult>>(sql);

      return results.rows.map(async row => {
         if (!row.pg_get_functiondef) {
            return {
               definer: null as null,
               sql: '',
               parameters: [] as null[],
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

         const results = await this.raw<antares.QueryResult<FunctionParamsResult>>(sql);

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
            deterministic: null as null,
            dataAccess: null as null,
            language: row.pg_get_functiondef.match(/(?<=LANGUAGE )(.*)(?<=[\S+\n\r\s])/gm)[0],
            returns: row.pg_get_functiondef.match(/(?<=RETURNS )(.*)(?<=[\S+\n\r\s])/gm)[0].replace('SETOF ', '').toUpperCase()
         };
      })[0];
   }

   async dropFunction (params: { schema: string; func: string }) {
      const sql = `DROP FUNCTION "${params.schema}"."${params.func}"`;
      return await this.raw(sql);
   }

   /**
    * ALTER FUNCTION
    *
    * @returns {Array.<Object>} parameters
    * @memberof PostgreSQLClient
    */
   async alterFunction ({ func }: { func: antares.AlterFunctionParams }) {
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

   async createFunction (func: antares.CreateFunctionParams) {
      const parameters = 'parameters' in func
         ? func.parameters.reduce((acc, curr) => {
            acc.push(`${curr.context} ${curr.name || ''} ${curr.type}`);
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

   async alterTriggerFunction ({ func }: { func: antares.CreateFunctionParams}) {
      if (func.schema !== 'public')
         await this.use(func.schema);

      const body = func.returns ? func.sql : '$function$\n$function$';

      const sql = `CREATE OR REPLACE FUNCTION "${func.schema}"."${func.name}" ()
         RETURNS TRIGGER
         LANGUAGE ${func.language}
         AS ${body}`;

      return await this.raw(sql, { split: false });
   }

   async createTriggerFunction (func: antares.CreateFunctionParams) {
      if (func.schema !== 'public')
         await this.use(func.schema);

      const body = func.returns ? func.sql : '$function$\r\nBEGIN\r\n\r\nEND\r\n$function$';

      const sql = `CREATE FUNCTION "${func.schema}"."${func.name}" ()
         RETURNS TRIGGER
         LANGUAGE ${func.language}
         AS ${body}`;

      return await this.raw(sql, { split: false });
   }

   async getVariables () {
      interface ShowVariablesResult {
         name: string;
         setting: string;
      }

      const sql = 'SHOW ALL';
      const results = await this.raw<antares.QueryResult<ShowVariablesResult>>(sql);

      return results.rows.map(row => {
         return {
            name: row.name,
            value: row.setting
         };
      });
   }

   async getEngines () {
      return {
         name: 'PostgreSQL',
         support: 'YES',
         comment: '',
         isDefault: true
      };
   }

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

   async killProcess (id: number) {
      return await this.raw(`SELECT pg_terminate_backend(${id})`);
   }

   async killTabQuery (tabUid: string) {
      const id = this._runningConnections.get(tabUid);
      if (id)
         return await this.raw(`SELECT pg_cancel_backend(${id})`);
   }

   async commitTab (tabUid: string) {
      const connection = this._connectionsToCommit.get(tabUid);
      if (connection) {
         await connection.query('COMMIT');
         return this.destroyConnectionToCommit(tabUid);
      }
   }

   async rollbackTab (tabUid: string) {
      const connection = this._connectionsToCommit.get(tabUid);
      if (connection) {
         await connection.query('ROLLBACK');
         return this.destroyConnectionToCommit(tabUid);
      }
   }

   destroyConnectionToCommit (tabUid: string) {
      const connection = this._connectionsToCommit.get(tabUid);
      if (connection) {
         (connection as pg.Client).end();
         this._connectionsToCommit.delete(tabUid);
      }
   }

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
      const limitRaw = selectArray.length && this._query.limit ? `LIMIT ${this._query.limit} ` : '';

      // OFFSET
      const offsetRaw = selectArray.length && this._query.offset ? `OFFSET ${this._query.offset} ` : '';

      return `${selectRaw}${updateRaw ? 'UPDATE' : ''}${insertRaw ? 'INSERT ' : ''}${this._query.delete ? 'DELETE ' : ''}${fromRaw}${updateRaw}${whereRaw}${groupByRaw}${orderByRaw}${limitRaw}${offsetRaw}${insertRaw}`;
   }

   async raw<T = antares.QueryResult> (sql: string, args?: antares.QueryParams) {
      this._logger({ cUid: this._cUid, content: sql, level: 'query' });

      args = {
         nest: false,
         details: false,
         split: true,
         comments: true,
         autocommit: true,
         ...args
      };

      if (!args.comments)
         sql = sql.replace(/(\/\*(.|[\r\n])*?\*\/)|(--(.*|[\r\n]))/gm, '');// Remove comments

      const resultsArr: antares.QueryResult[] = [];
      let paramsArr = [];
      const queries = args.split
         ? this._querySplitter(sql, 'pg')
         : [sql];

      let connection: pg.Client | pg.PoolClient;
      const isPool = this._connection instanceof pg.Pool;

      if (!args.autocommit && args.tabUid) { // autocommit OFF
         if (this._connectionsToCommit.has(args.tabUid))
            connection = this._connectionsToCommit.get(args.tabUid);
         else {
            connection = await this.getConnection();
            await connection.query('START TRANSACTION');
            this._connectionsToCommit.set(args.tabUid, connection);
         }
      }
      else { // autocommit ON
         connection = isPool ? await this._connection.connect() as pg.PoolClient : this._connection as pg.Client;
      }

      if (args.tabUid && isPool)
         this._runningConnections.set(args.tabUid, (connection as pg.PoolClient & { processID: number }).processID);

      if (args.schema)
         await this.use(args.schema, connection);

      for (const query of queries) {
         if (!query) continue;

         const timeStart = new Date();
         let timeStop: Date;
         let keysArr: antares.QueryForeign[] = [];

         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         const { rows, report, fields, keys, duration }: any = await new Promise((resolve, reject) => {
            (async () => {
               try {
                  const res = await connection.query({ rowMode: args.nest ? 'array' : null, text: query });

                  timeStop = new Date();

                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  let ast: any;

                  try {
                     [ast] = pgAst.parse(query);// TODO: maybe refactor
                  }
                  catch (err) {}

                  const { rows, fields } = res;
                  let queryResult;
                  let tablesInfo: { table: string; schema: string }[];

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
                           return undefined;

                        let schema: string = ast && ast.from && 'schema' in ast.from[0] ? ast.from[0].schema : this._schema;
                        let table: string = ast && ast.from ? ast.from[0].name : null;

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
                           type: this.types[field.dataTypeID] || field.format,
                           length: undefined as number,
                           key: undefined as string
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
                                    }
                                 }

                                 return field;
                              });
                           }
                           catch (err) {
                              if (isPool && args.autocommit) {
                                 (connection as pg.PoolClient).release();
                                 this._runningConnections.delete(args.tabUid);
                              }
                              reject(err);
                           }

                           try { // Key usage (foreign keys)
                              const response = await this.getKeyUsage(paramObj);
                              keysArr = keysArr ? [...keysArr, ...response] : response;
                           }
                           catch (err) {
                              if (isPool && args.autocommit) {
                                 (connection as pg.PoolClient).release();
                                 this._runningConnections.delete(args.tabUid);
                              }
                              reject(err);
                           }
                        }
                     }
                  }

                  resolve({
                     duration: timeStop.getTime() - timeStart.getTime(),
                     rows: Array.isArray(queryResult) ? queryResult.some(el => Array.isArray(el)) ? [] : queryResult : false,
                     report: !Array.isArray(queryResult) ? queryResult : false,
                     fields: remappedFields,
                     keys: keysArr
                  });
               }
               catch (err) {
                  if (isPool && args.autocommit) {
                     (connection as pg.PoolClient).release();
                     this._runningConnections.delete(args.tabUid);
                  }
                  reject(err);
               }
            })();
         });

         resultsArr.push({ rows, report, fields, keys, duration });
      }

      if (isPool && args.autocommit) {
         (connection as pg.PoolClient).release();
         this._runningConnections.delete(args.tabUid);
      }

      const result = resultsArr.length === 1 ? resultsArr[0] : resultsArr;

      return result as unknown as T;
   }
}
