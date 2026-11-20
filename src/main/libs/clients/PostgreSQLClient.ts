import * as antares from 'common/interfaces/antares';
import { pgTypeIdentifier } from 'common/libs/pgIdentifiers';
import { removeComments } from 'common/libs/sqlUtils';
import * as pg from 'pg';
import * as pgAst from 'pgsql-ast-parser';

import { CancelQueriesCapability, DatabaseClient, DatabasesCapability, DbConfigCapability, FunctionsCapability, MaterializedViewsCapability, RoutinesCapability, SchemasCapability, TableDdlCapability, TriggerFunctionsCapability, TriggerToggleCapability, UsersCapability, UserTypesCapability } from '../db/core/contracts';
import { arrayRowsToObjects, uniqueColumnNames } from '../db/core/resultRows';
import { maskSecrets } from '../db/core/users';
import { PostgreSQLConnections, PostgreSQLParams } from '../db/engines/postgresql/PostgreSQLConnections';
import { PostgreSQLDdl } from '../db/engines/postgresql/PostgreSQLDdl';
import { PostgreSQLDialect } from '../db/engines/postgresql/PostgreSQLDialect';
import { parseFunctionDefinition } from '../db/engines/postgresql/PostgreSQLParsers';
import { PostgreSQLTypes, typeKinds } from '../db/engines/postgresql/PostgreSQLTypes';
import { databasePrivileges, PostgreSQLUsers, schemaPrivileges } from '../db/engines/postgresql/PostgreSQLUsers';
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
export class PostgreSQLClient extends BaseClient implements DatabaseClient, SchemasCapability, DatabasesCapability, DbConfigCapability, CancelQueriesCapability, TableDdlCapability, MaterializedViewsCapability, TriggerToggleCapability, RoutinesCapability, FunctionsCapability, TriggerFunctionsCapability, UsersCapability, UserTypesCapability {
   protected readonly _ddl = new PostgreSQLDdl();
   protected readonly _dialect = new PostgreSQLDialect();
   private readonly _users = new PostgreSQLUsers();
   private readonly _types = new PostgreSQLTypes();
   private _schema?: string;
   private readonly _connections: PostgreSQLConnections;
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

   _params: PostgreSQLParams;

   constructor (args: antares.ClientParams) {
      super(args);

      this._schema = null;
      this._connections = new PostgreSQLConnections(this._params, this._poolSize);

      for (const key in pg.types.builtins) {
         const builtinKey = key as builtinsTypes;
         this.types[pg.types.builtins[builtinKey]] = key;
      }
   }

   getTypeInfo (type: string): antares.TypeInformations {
      return this._ddl.getTypeInfo(type);
   }

   _getArrayType (type: string) {
      if (Object.keys(this._arrayTypes).includes(type))
         return this._arrayTypes[type];
      return type.replace('_', '');
   }

   getDbConfig () {
      return this._connections.getDbConfig();
   }

   connect () {
      return this._connections.connect();
   }

   /** A new standalone client (used by the exporter to stream rows: end it when done) */
   getConnection () {
      return this._connections.createConnection();
   }

   getConnectionPool () {
      return this._connections.createPool();
   }

   ping () {
      return this.select('1+1').run();
   }

   destroy () {
      this._connections.destroy();
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
      // Only the routines of the requested schemas (pg_catalog alone has thousands)
      const schemaList = [...schemas].map(schema => this._dialect.quoteString(schema)).join(', ');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type RoutineRow = Record<string, any>;
      const { rows: routines } = schemaList
         ? await this.raw<antares.QueryResult<RoutineRow>>(`SELECT * FROM information_schema.routines WHERE routine_type IN ('FUNCTION', 'PROCEDURE') AND routine_schema IN (${schemaList})`)
         : { rows: [] as RoutineRow[] };
      const functions = routines.filter(routine => routine.routine_type === 'FUNCTION');
      const procedures = routines.filter(routine => routine.routine_type === 'PROCEDURE');
      // User-defined types: enums, domains, ranges and composite types (not the row types of tables), without the ones of extensions
      const { rows: userTypes } = schemaList
         ? await this.raw<antares.QueryResult<{ nspname: string; typname: string; typtype: string }>>(`
            SELECT n.nspname, t.typname, t.typtype
            FROM pg_type t
            JOIN pg_namespace n ON n.oid = t.typnamespace
            WHERE n.nspname IN (${schemaList})
            AND (t.typtype IN ('e', 'd', 'r') OR (t.typtype = 'c' AND EXISTS (SELECT 1 FROM pg_class c WHERE c.oid = t.typrelid AND c.relkind = 'c')))
            AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.classid = 'pg_type'::regclass AND d.objid = t.oid AND d.deptype = 'e')
            ORDER BY t.typname
         `)
         : { rows: [] as { nspname: string; typname: string; typtype: string }[] };

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
               schedulers: [] as null[],
               userTypes: userTypes
                  .filter(type => type.nspname === db.database)
                  .map(type => ({ name: type.typname, kind: typeKinds[type.typtype] }))
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
               schedulers: [],
               userTypes: []
            };
         }
      });
   }

   async getTableColumns ({ schema, table }: { schema: string; table: string }, arrayRemap = true) {
      /* eslint-disable camelcase */
      interface TableColumnsResult {
         data_type: string;
         udt_name: string;
         udt_schema: string;
         domain_name: string;
         domain_schema: string;
         enum_values: string;
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
         SELECT cols.*, comments.comment AS column_comment,
            (SELECT string_agg(quote_literal(e.enumlabel), ',' ORDER BY e.enumsortorder)
               FROM pg_enum e
               JOIN pg_type et ON et.oid = e.enumtypid
               JOIN pg_namespace en ON en.oid = et.typnamespace
               WHERE cols.data_type = 'USER-DEFINED' AND et.typname = cols.udt_name AND en.nspname = cols.udt_schema
            ) AS enum_values
         FROM "information_schema"."columns" AS cols
         LEFT JOIN comments ON comments.column = cols.column_name AND comments.relname = cols.table_name
         WHERE cols.table_schema = '${schema}'
         AND cols.table_name = '${table}'
         ORDER BY "ordinal_position" ASC
      `);

      return rows.map(field => {
         let type = field.data_type.toUpperCase();
         const isArray = type === 'ARRAY';

         if (field.domain_name) // information_schema reports the base type of domains
            type = pgTypeIdentifier(field.domain_schema, field.domain_name, field.table_schema);
         else if (isArray && arrayRemap)
            type = this._getArrayType(field.udt_name).toUpperCase();
         else if (type === 'USER-DEFINED') // Enums, domains, extension types: the real name, usable in ALTER COLUMN ... TYPE
            type = pgTypeIdentifier(field.udt_schema, field.udt_name, field.table_schema);

         return {
            name: field.column_name,
            key: null as null,
            type,
            /** Labels of enum columns, quoted and comma separated like the MySQL ENUM ones */
            enumValues: field.enum_values || undefined,
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
         if (column.domain_name) fieldType = this._types.qualified(column.domain_schema, column.domain_name);
         else if (fieldType === 'USER-DEFINED') fieldType = this._types.qualified(column.udt_schema, column.udt_name);
         else if (fieldType === 'ARRAY') {
            if (Object.keys(arrayTypes).includes(fieldType))
               fieldType = arrayTypes[column.udt_name] + '[]';
            else
               fieldType = column.udt_name.replaceAll('_', '') + '[]';
         }

         const columnArr = [
            `"${column.column_name}"`,
            `${fieldType}${column.character_maximum_length && !column.domain_name ? `(${column.character_maximum_length})` : ''}`
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

   /** Connected role and server version: they decide which roles and attributes it can manage */
   private async _usersContext () {
      const { rows: [current] } = await this.raw('SELECT r.*, current_setting(\'server_version_num\')::int AS version FROM pg_roles r WHERE r.rolname = current_user');
      const version = Number(current.version);
      const isSuper = !!current.rolsuper;

      return {
         current,
         version,
         isSuper,
         canManage: isSuper || !!current.rolcreaterole,
         // PostgreSQL 16+: CREATEROLE roles grant only the attributes they have, and alter only roles they administer
         canGrant: (column: string) => isSuper || (version >= 160000 && !!current[column])
      };
   }

   async getUsersManagementInfo (): Promise<antares.UsersManagementInfo> {
      const { current, version, canManage, canGrant } = await this._usersContext();
      const canGrantCreateDb = canGrant('rolcreatedb') || (canManage && version < 160000);

      const attributes: antares.UserAttributeDefinition[] = [
         { name: 'canLogin', type: 'boolean', group: 'account', default: true },
         { name: 'superuser', type: 'boolean', group: 'account', default: false, disabled: !canGrant('rolsuper') },
         { name: 'createDb', type: 'boolean', group: 'account', default: false, disabled: !canGrantCreateDb },
         { name: 'createRole', type: 'boolean', group: 'account', default: false, disabled: !canManage },
         { name: 'inherit', type: 'boolean', group: 'account', default: true },
         { name: 'replication', type: 'boolean', group: 'account', default: false, disabled: !canGrant('rolreplication') }
      ];
      if ('rolbypassrls' in current) // 9.5+
         attributes.push({ name: 'bypassRls', type: 'boolean', group: 'account', default: false, disabled: !canGrant('rolbypassrls') });
      attributes.push(
         { name: 'connectionLimit', type: 'number', group: 'limits', default: -1, min: -1 },
         { name: 'validUntil', type: 'datetime', group: 'limits', default: null }
      );

      const { rows: databases } = await this.raw('SELECT datname FROM pg_database WHERE NOT datistemplate ORDER BY datname');
      const { rows: schemas } = await this.raw('SELECT nspname FROM pg_namespace WHERE nspname NOT LIKE \'pg\\_%\' AND nspname <> \'information_schema\' ORDER BY nspname');
      const { rows: roles } = await this.raw('SELECT rolname FROM pg_roles ORDER BY rolname');

      return {
         currentUser: { name: current.rolname },
         canManage,
         hasHost: false,
         canRename: true,
         passwordRequired: false,
         attributes,
         globalPrivileges: [],
         scopes: [
            { name: 'database', objects: databases.map(row => row.datname), privileges: databasePrivileges },
            { name: 'schema', objects: schemas.map(row => row.nspname), privileges: schemaPrivileges }
         ],
         roles: roles.map(row => row.rolname)
      };
   }

   async getUsersList (): Promise<antares.UserAccount[]> {
      const { current, version, isSuper, canManage } = await this._usersContext();
      const isAdmin = version >= 160000 ? 'pg_has_role(current_user, r.oid, \'MEMBER WITH ADMIN OPTION\')' : 'false';
      const { rows } = await this.raw(`SELECT r.rolname, r.rolcanlogin, r.rolsuper, ${isAdmin} AS is_admin FROM pg_roles r WHERE r.rolname NOT LIKE 'pg\\_%' ORDER BY r.rolname`);

      return rows.map(row => {
         let editable = row.rolname === current.rolname;
         if (isSuper) editable = true;
         else if (canManage) editable = editable || (version >= 160000 ? !!row.is_admin : !row.rolsuper);

         return { name: row.rolname, editable, disabled: !row.rolcanlogin };
      });
   }

   async getUserDetails (user: antares.UserIdentity): Promise<antares.UserDetails> {
      const name = this._dialect.quoteString(user.name);
      const role = `(SELECT oid FROM pg_roles WHERE rolname = ${name})`;

      const { rows: [row] } = await this.raw(`
         SELECT r.*, CASE WHEN r.rolvaliduntil IS NULL OR r.rolvaliduntil = 'infinity' THEN NULL
            ELSE to_char(r.rolvaliduntil, 'YYYY-MM-DD HH24:MI:SS') END AS valid_until
         FROM pg_roles r WHERE r.rolname = ${name}`);
      if (!row) throw new Error(`Role ${user.name} not found`);

      const { rows: databases } = await this.raw(`SELECT d.datname AS object, a.privilege_type AS privilege FROM pg_database d, aclexplode(d.datacl) a WHERE a.grantee = ${role} ORDER BY 1, 2`);
      const { rows: schemas } = await this.raw(`SELECT n.nspname AS object, a.privilege_type AS privilege FROM pg_namespace n, aclexplode(n.nspacl) a WHERE a.grantee = ${role} ORDER BY 1, 2`);
      const { rows: roles } = await this.raw(`SELECT b.rolname FROM pg_auth_members m JOIN pg_roles b ON b.oid = m.roleid WHERE m.member = ${role} ORDER BY 1`);

      const byObject = (rows: { object: string; privilege: string }[]) => rows.reduce<Record<string, string[]>>((acc, { object, privilege }) => ({
         ...acc,
         [object]: [...(acc[object] ?? []), privilege]
      }), {});

      return {
         name: row.rolname,
         attributes: this._users.attributesOfRow(row),
         globalPrivileges: [],
         privileges: { database: byObject(databases), schema: byObject(schemas) },
         roles: roles.map(r => r.rolname)
      };
   }

   /** Runs statements as one multi-statement query: PostgreSQL applies all of them or none */
   private async _runStatements (statements: string[], { password, schema }: { password?: string; schema?: string } = {}) {
      if (!statements.length) return;

      const sql = statements.join(';\n');
      const secrets = password ? [this._dialect.quoteString(password)] : [];
      this._logger({ cUid: this._cUid, content: maskSecrets(sql, secrets), level: 'query' });

      const lease = await this._connections.acquire();
      try {
         if (schema) await this.use(schema, lease.connection);
         await lease.connection.query(sql);
      }
      finally {
         lease.release();
      }
   }

   async createUser (params: antares.SaveUserParams) {
      await this._runStatements(this._users.createUser(params), { password: params.password });
   }

   async alterUser (params: antares.SaveUserParams) {
      await this._runStatements(this._users.alterUser(params), { password: params.password });
   }

   async dropUser (user: antares.UserIdentity) {
      await this._runStatements(this._users.dropUser(await this.getUserDetails(user)));
   }

   private async _getUserTypeRow (schema: string, userType: string, searchPath = schema) {
      const { rows: [row] } = await this.raw(`
         SELECT t.oid, t.typname, t.typtype, t.typnotnull, t.typdefault,
            format_type(t.typbasetype, t.typtypmod) AS base_type,
            (SELECT format_type(r.rngsubtype, NULL) FROM pg_range r WHERE r.rngtypid = t.oid) AS subtype,
            obj_description(t.oid, 'pg_type') AS comment
         FROM pg_type t
         JOIN pg_namespace n ON n.oid = t.typnamespace
         WHERE n.nspname = ${this._dialect.quoteString(schema)} AND t.typname = ${this._dialect.quoteString(userType)}
      `, { schema: searchPath });

      if (!row || !typeKinds[row.typtype]) throw new Error(`Type ${schema}.${userType} not found`);
      return row;
   }

   /**
    * Types are read with the search path of their schema: format_type() does not qualify the types of that schema.
    * `qualifyTypes` qualifies them all (SQL dumps run with an empty search path).
    */
   async getUserTypeInformations ({ schema, userType, qualifyTypes = false }: { schema: string; userType: string; qualifyTypes?: boolean }): Promise<antares.UserTypeDetails> {
      const searchPath = qualifyTypes ? 'pg_catalog' : schema;
      const row = await this._getUserTypeRow(schema, userType, searchPath);
      const kind = typeKinds[row.typtype];
      const details: antares.UserTypeDetails = {
         schema,
         name: row.typname,
         kind,
         comment: row.comment || '',
         values: [],
         attributes: [],
         baseType: kind === 'domain' ? row.base_type : kind === 'range' ? row.subtype : '',
         notNull: kind === 'domain' ? !!row.typnotnull : false,
         default: kind === 'domain' ? row.typdefault || '' : '',
         checks: []
      };

      if (kind === 'enum') {
         const { rows } = await this.raw(`SELECT enumlabel FROM pg_enum WHERE enumtypid = ${row.oid} ORDER BY enumsortorder`);
         details.values = rows.map(r => ({ name: r.enumlabel, oldName: r.enumlabel }));
      }
      else if (kind === 'composite') {
         const { rows } = await this.raw(`
            SELECT a.attname, format_type(a.atttypid, a.atttypmod) AS type
            FROM pg_attribute a
            JOIN pg_type t ON t.typrelid = a.attrelid
            WHERE t.oid = ${row.oid} AND a.attnum > 0 AND NOT a.attisdropped
            ORDER BY a.attnum
         `, { schema: searchPath });
         details.attributes = rows.map(r => ({ name: r.attname, type: r.type, oldName: r.attname }));
      }
      else if (kind === 'domain') {
         const { rows } = await this.raw(`SELECT conname, pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE contypid = ${row.oid} AND contype = 'c' ORDER BY conname`);
         details.checks = rows.map(r => ({ name: r.conname, clause: this._types.checkClause(r.definition), oldName: r.conname }));
      }

      return details;
   }

   async createUserType (params: antares.UserTypeDetails) {
      await this._runStatements(this._types.createType(params), { schema: params.schema });
   }

   async alterUserType (params: antares.AlterUserTypeParams) {
      await this._runStatements(this._types.alterType(params), { schema: params.original.schema });
   }

   async dropUserType ({ schema, userType }: { schema: string; userType: string }) {
      const row = await this._getUserTypeRow(schema, userType);
      await this._runStatements([this._types.dropType({ schema, name: row.typname, kind: typeKinds[row.typtype] })]);
   }

   async createSchema (params: {name: string}) {
      return await this.raw(this._ddl.createSchema(params));
   }

   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   async alterSchema (params: {name: string}): Promise<void> {
      return null;
   }

   async dropSchema (params: { database: string }) {
      return await this.raw(this._ddl.dropSchema(params));
   }

   // The search path of the connection running the DDL is the table schema: user-defined types of that schema are not qualified
   async createTable (params: antares.CreateTableParams) {
      return await this.raw(this._ddl.createTable(params), { schema: params.schema });
   }

   async alterTable (params: antares.AlterTableParams) {
      return await this.raw(this._ddl.alterTable(params), { schema: params.schema });
   }

   async duplicateTable (params: { schema: string; table: string }) {
      return await this.raw(this._ddl.duplicateTable(params));
   }

   async truncateTable (params: { schema: string; table: string }) {
      return await this.raw(this._ddl.truncateTable(params));
   }

   async dropTable (params: { schema: string; table: string }) {
      return await this.raw(this._ddl.dropTable(params));
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
      return await this.raw(this._ddl.dropView(params));
   }

   async dropMaterializedView (params: { schema: string; view: string }) {
      return await this.raw(this._ddl.dropMaterializedView(params));
   }

   async alterView (params: { view: antares.AlterViewParams }) {
      return await this.raw(this._ddl.alterView(params));
   }

   async alterMaterializedView ({ view }: { view: antares.AlterViewParams }) {
      // PostgreSQL can't replace the query of a materialized view: validate the new definition
      // on a temporary copy, then drop and recreate it (same approach as alterTrigger/alterRoutine)
      const tempName = `Antares_${view.name}_tmp`;

      await this.createMaterializedView({ ...view, name: tempName });
      await this.dropMaterializedView({ schema: view.schema, view: tempName });
      await this.dropMaterializedView({ schema: view.schema, view: view.oldName });
      return await this.createMaterializedView(view);
   }

   async createView (params: antares.CreateViewParams) {
      return await this.raw(this._ddl.createView(params));
   }

   async createMaterializedView (params: antares.CreateViewParams) {
      return await this.raw(this._ddl.createMaterializedView(params));
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
      return await this.raw(this._ddl.dropTrigger(params));
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
      return await this.raw(this._ddl.createTrigger(params), { split: false });
   }

   async enableTrigger (params: { schema: string; trigger: string }) {
      return await this.raw(this._ddl.enableTrigger(params), { split: false });
   }

   async disableTrigger (params: { schema: string; trigger: string }) {
      return await this.raw(this._ddl.disableTrigger(params), { split: false });
   }

   async getRoutineInformations ({ schema, routine }: { schema: string; routine: string }) {
      const sql = `SELECT pg_get_functiondef((SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE p.proname = ${this.dialect.quoteString(routine)} AND n.nspname = ${this.dialect.quoteString(schema)} LIMIT 1));`;
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
            AND args.data_type IS NOT NULL
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
            parameters: parameters || [],
            name: routine,
            comment: '',
            deterministic: null as null,
            dataAccess: null as null,
            ...parseFunctionDefinition(row.pg_get_functiondef)
         };
      })[0];
   }

   async dropRoutine (params: { schema: string; routine: string }) {
      return await this.raw(this._ddl.dropRoutine(params));
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
      if (routine.schema !== 'public')
         await this.use(routine.schema);
      return await this.raw(this._ddl.createRoutine(routine), { split: false });
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

      const sql = `SELECT pg_get_functiondef((SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE p.proname = ${this.dialect.quoteString(func)} AND n.nspname = ${this.dialect.quoteString(schema)} LIMIT 1));`;
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
            parameters: parameters || [],
            name: func,
            comment: '',
            deterministic: null as null,
            dataAccess: null as null,
            ...parseFunctionDefinition(row.pg_get_functiondef)
         };
      })[0];
   }

   async dropFunction (params: { schema: string; func: string }) {
      return await this.raw(this._ddl.dropFunction(params));
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
      if (func.schema !== 'public')
         await this.use(func.schema);
      return await this.raw(this._ddl.createFunction(func), { split: false });
   }

   async alterTriggerFunction (params: { func: antares.CreateFunctionParams}) {
      if (params.func.schema !== 'public')
         await this.use(params.func.schema);
      return await this.raw(this._ddl.alterTriggerFunction(params), { split: false });
   }

   async createTriggerFunction (func: antares.CreateFunctionParams) {
      if (func.schema !== 'public')
         await this.use(func.schema);
      return await this.raw(this._ddl.createTriggerFunction(func), { split: false });
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
      return await this.raw(this._ddl.killProcess(id));
   }

   async killTabQuery (tabUid: string) {
      const id = this._connections.runningId(tabUid);
      if (id)
         return await this.raw(`SELECT pg_cancel_backend(${id})`);
   }

   async commitTab (tabUid: string) {
      await this._connections.commitTab(tabUid);
   }

   async rollbackTab (tabUid: string) {
      await this._connections.rollbackTab(tabUid);
   }

   destroyConnectionToCommit (tabUid: string) {
      this._connections.closeTab(tabUid);
   }

   async raw<T = antares.QueryResult> (sql: string, args?: antares.QueryParams) {
      this._logger({ cUid: this._cUid, content: args?.logContent ?? sql, level: 'query' });

      args = {
         nest: false,
         details: false,
         split: true,
         comments: true,
         autocommit: true,
         ...args
      };

      if (!args.comments)
         sql = removeComments(sql, 'pg');

      const resultsArr: antares.QueryResult[] = [];
      let paramsArr = [];
      const queries = args.split
         ? this._querySplitter(sql, 'pg')
         : [sql];

      const lease = await this._connections.acquire(args);
      const connection = lease.connection;

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
                  let aliases: string[] = [];

                  if (args.nest) {
                     const tablesID = [...new Set(fields.map(field => field.tableID))].toString();
                     tablesInfo = await this.getTableByIDs(tablesID);

                     const prefixes = fields.map(field => tablesInfo[field.tableID] ? `${tablesInfo[field.tableID].table}.` : '');
                     aliases = uniqueColumnNames(fields.map(field => field.name), prefixes);
                     queryResult = arrayRowsToObjects(rows, aliases.map((alias, i) => `${prefixes[i]}${alias}`));
                  }
                  else
                     queryResult = rows;

                  let remappedFields = fields
                     ? fields.map((field, i) => {
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
                           alias: aliases[i] ?? field.name,
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
                              lease.release();
                              reject(err);
                           }

                           try { // Key usage (foreign keys)
                              const response = await this.getKeyUsage(paramObj);
                              keysArr = keysArr ? [...keysArr, ...response] : response;
                           }
                           catch (err) {
                              lease.release();
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
                  lease.release();
                  reject(err);
               }
            })();
         });

         resultsArr.push({ rows, report, fields, keys, duration });
      }

      lease.release();

      const result = resultsArr.length === 1 ? resultsArr[0] : resultsArr;

      return result as unknown as T;
   }
}
