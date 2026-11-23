import * as antares from 'common/interfaces/antares';
import * as exporter from 'common/interfaces/exporter';
import * as pg from 'pg';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import QueryStream = require('pg-query-stream');

import { PostgreSQLClient } from '../../clients/PostgreSQLClient';
import { PostgreSQLTypes } from '../../db/engines/postgresql/PostgreSQLTypes';
import { DataColumn, NUMERIC_LITERAL, SqlExporter, ValueFormatter } from './SqlExporter';

interface ColumnInfo {
   name: string;
   type: string;
   notnull: boolean;
   default: string | null;
   /** '' | 'a' (ALWAYS) | 'd' (BY DEFAULT) */
   identity: string;
   /** '' | 's' (STORED) | 'v' (VIRTUAL) */
   generated: string;
   collation: string | null;
   /** pg_type.typcategory */
   category: string;
   comment: string | null;
}

interface SequenceInfo {
   name: string;
   type: string;
   start: string;
   increment: string;
   min: string;
   max: string;
   cache: string;
   cycle: boolean;
   /** Column owning the sequence (serial or identity) */
   owner: string | null;
   /** 'a': serial (OWNED BY), 'i': identity, null: sequence used by a default but not owned by the table */
   deptype: string | null;
   lastValue: string;
   isCalled: boolean;
}

interface TableInfo {
   oid: number;
   columns: ColumnInfo[];
   sequences: SequenceInfo[];
}

export default class PostgreSQLExporter extends SqlExporter {
   protected _client: PostgreSQLClient;
   private readonly _types = new PostgreSQLTypes();
   /**
    * Connection of the dump, like pg_dump: one REPEATABLE READ read only transaction (all the rows come from
    * the same snapshot) and an empty search_path, so that the definitions read from the catalog are schema qualified
    */
   private _connection?: pg.Client;
   private _serverVersion = 0;
   private readonly _tableInfos = new Map<string, Promise<TableInfo>>();
   /** Tables with GENERATED ALWAYS identity columns: their INSERT statements need OVERRIDING SYSTEM VALUE */
   private readonly _overridingTables = new Set<string>();

   constructor (client: PostgreSQLClient, tables: exporter.TableParams[], options: exporter.ExportOptions) {
      super(tables, options);

      this._client = client;
   }

   get host () {
      return this._client.host;
   }

   async getServerVersion () {
      const version = await this._client.getVersion();
      return `${version.name} ${version.number}`;
   }

   quoteName (name: string) {
      return `"${name.replaceAll('"', '""')}"`;
   }

   quoteString (value: string) {
      return this._client.dialect.quoteString(value);
   }

   /** Schema qualified name */
   qualified (name: string) {
      return `${this.quoteName(this.schemaName)}.${this.quoteName(name)}`;
   }

   async prepare () {
      this._connection = await this._client.getConnection() as pg.Client;
      // Without a listener, an error of the connection (e.g. server restart) would crash the worker
      this._connection.on('error', () => null);

      for (const sql of [
         'SET statement_timeout = 0',
         'SET lock_timeout = 0',
         'SET idle_in_transaction_session_timeout = 0',
         // Output formats that can be read back by any server (as pg_dump does)
         'SET DateStyle = ISO',
         'SET IntervalStyle = postgres',
         'SET extra_float_digits = 3',
         'SELECT pg_catalog.set_config(\'search_path\', \'\', false)',
         'BEGIN ISOLATION LEVEL REPEATABLE READ, READ ONLY'
      ])
         await this._connection.query(sql);

      const [{ version }] = await this._query<{ version: string }>('SELECT pg_catalog.current_setting(\'server_version_num\') AS version');
      this._serverVersion = Number(version);
   }

   async cleanup () {
      const connection = this._connection;
      this._connection = undefined;
      await connection?.end().catch((): null => null);
   }

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   private async _query<T = any> (sql: string, params: unknown[] = []): Promise<T[]> {
      const { rows } = await this._connection.query(sql, params);
      return rows;
   }

   async getSqlHeader () {
      let dump = await super.getSqlHeader();
      dump += `


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', ${this.quoteString(this.quoteName(this.schemaName))}, false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;\n\n\n`;

      if (this.schemaName !== 'public') dump += `CREATE SCHEMA IF NOT EXISTS ${this.quoteName(this.schemaName)};\n\n`;

      dump += await this.getCreateTypes();

      return dump;
   }

   /** Columns and sequences of a table, read once */
   private _tableInfo (tableName: string) {
      if (!this._tableInfos.has(tableName))
         this._tableInfos.set(tableName, this._readTableInfo(tableName));
      return this._tableInfos.get(tableName);
   }

   private async _readTableInfo (tableName: string): Promise<TableInfo> {
      const [table] = await this._query<{ oid: number }>(`
         SELECT c.oid
         FROM pg_catalog.pg_class c
         JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = $1 AND c.relname = $2
      `, [this.schemaName, tableName]);

      if (!table) throw new Error(`Table "${this.schemaName}"."${tableName}" not found`);

      const columns = await this._query<ColumnInfo>(`
         SELECT a.attname AS name,
            pg_catalog.format_type(a.atttypid, a.atttypmod) AS type,
            a.attnotnull AS notnull,
            pg_catalog.pg_get_expr(d.adbin, d.adrelid) AS default,
            ${this._serverVersion >= 100000 ? 'a.attidentity' : '\'\''} AS identity,
            ${this._serverVersion >= 120000 ? 'a.attgenerated' : '\'\''} AS generated,
            CASE WHEN a.attcollation <> t.typcollation AND a.attcollation <> 0
               THEN pg_catalog.quote_ident(cn.nspname) || '.' || pg_catalog.quote_ident(co.collname)
            END AS collation,
            t.typcategory AS category,
            pg_catalog.col_description(a.attrelid, a.attnum) AS comment
         FROM pg_catalog.pg_attribute a
         JOIN pg_catalog.pg_type t ON t.oid = a.atttypid
         LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
         LEFT JOIN pg_catalog.pg_collation co ON co.oid = a.attcollation
         LEFT JOIN pg_catalog.pg_namespace cn ON cn.oid = co.collnamespace
         WHERE a.attrelid = $1 AND a.attnum > 0 AND NOT a.attisdropped
         ORDER BY a.attnum
      `, [table.oid]);

      // Sequences owned by the columns (serial, identity) and sequences used by the defaults
      const sequences = this._serverVersion < 100000
         ? []
         : await this._query<SequenceInfo>(`
         SELECT pg_catalog.quote_ident(sn.nspname) || '.' || pg_catalog.quote_ident(s.relname) AS name,
            pg_catalog.format_type(ps.seqtypid, NULL) AS type,
            ps.seqstart::text AS start,
            ps.seqincrement::text AS increment,
            ps.seqmin::text AS min,
            ps.seqmax::text AS max,
            ps.seqcache::text AS cache,
            ps.seqcycle AS cycle,
            owner.attname AS owner,
            owner.deptype
         FROM pg_catalog.pg_class s
         JOIN pg_catalog.pg_namespace sn ON sn.oid = s.relnamespace
         JOIN pg_catalog.pg_sequence ps ON ps.seqrelid = s.oid
         LEFT JOIN LATERAL (
            SELECT a.attname, d.deptype
            FROM pg_catalog.pg_depend d
            JOIN pg_catalog.pg_attribute a ON a.attrelid = d.refobjid AND a.attnum = d.refobjsubid
            WHERE d.classid = 'pg_catalog.pg_class'::pg_catalog.regclass AND d.objid = s.oid
            AND d.refobjid = $1 AND d.deptype IN ('a', 'i')
            LIMIT 1
         ) owner ON true
         WHERE s.relkind = 'S' AND (owner.attname IS NOT NULL OR s.oid IN (
            SELECT d.refobjid
            FROM pg_catalog.pg_depend d
            JOIN pg_catalog.pg_attrdef ad ON ad.oid = d.objid
            WHERE d.classid = 'pg_catalog.pg_attrdef'::pg_catalog.regclass AND ad.adrelid = $1
            AND d.refclassid = 'pg_catalog.pg_class'::pg_catalog.regclass
         ))
         ORDER BY s.oid
      `, [table.oid]);

      for (const sequence of sequences) {
         const [state] = await this._query<{ lastValue: string; isCalled: boolean }>(
            `SELECT last_value::text AS "lastValue", is_called AS "isCalled" FROM ${sequence.name}`
         );
         sequence.lastValue = state.lastValue;
         sequence.isCalled = state.isCalled;
      }

      return { oid: table.oid, columns, sequences };
   }

   private _sequenceOptions (sequence: SequenceInfo) {
      return `START WITH ${sequence.start} INCREMENT BY ${sequence.increment} MINVALUE ${sequence.min} MAXVALUE ${sequence.max} CACHE ${sequence.cache}${sequence.cycle ? ' CYCLE' : ''}`;
   }

   async getCreateTable (tableName: string) {
      const { oid, columns, sequences } = await this._tableInfo(tableName);
      const table = this.qualified(tableName);
      const identities = new Map(sequences.filter(s => s.deptype === 'i').map(s => [s.owner, s]));
      let sql = '';

      for (const sequence of sequences.filter(s => s.deptype !== 'i'))
         sql += `CREATE SEQUENCE IF NOT EXISTS ${sequence.name} AS ${sequence.type} ${this._sequenceOptions(sequence)};\n`;
      if (sql) sql += '\n';

      const definitions = columns.map(column => {
         let definition = `${this.quoteName(column.name)} ${column.type}`;
         if (column.collation) definition += ` COLLATE ${column.collation}`;

         if (column.generated)
            definition += ` GENERATED ALWAYS AS (${column.default}) ${column.generated === 'v' ? 'VIRTUAL' : 'STORED'}`;
         else if (column.default !== null)
            definition += ` DEFAULT ${column.default}`;

         if (column.identity) {
            const sequence = identities.get(column.name);
            definition += ` GENERATED ${column.identity === 'a' ? 'ALWAYS' : 'BY DEFAULT'} AS IDENTITY`;
            if (sequence) definition += ` (${this._sequenceOptions(sequence)})`;
         }

         if (column.notnull) definition += ' NOT NULL';
         return definition;
      });

      const constraints = await this._query<{ name: string; type: string; definition: string }>(`
         SELECT conname AS name, contype AS type, pg_catalog.pg_get_constraintdef(oid) AS definition
         FROM pg_catalog.pg_constraint
         WHERE conrelid = $1 AND contype IN ('p', 'u', 'c', 'x', 'f') AND conislocal
         ORDER BY CASE contype WHEN 'p' THEN 0 ELSE 1 END, conname
      `, [oid]);

      for (const constraint of constraints.filter(c => c.type !== 'f'))
         definitions.push(`CONSTRAINT ${this.quoteName(constraint.name)} ${constraint.definition}`);

      sql += `CREATE TABLE ${table} (\n   ${definitions.join(',\n   ')}\n);\n`;

      for (const sequence of sequences.filter(s => s.deptype === 'a'))
         sql += `ALTER SEQUENCE ${sequence.name} OWNED BY ${table}.${this.quoteName(sequence.owner)};\n`;

      const [{ comment } = { comment: null }] = await this._query<{ comment: string }>('SELECT pg_catalog.obj_description($1, \'pg_class\') AS comment', [oid]);
      if (comment !== null)
         sql += `COMMENT ON TABLE ${table} IS ${this.quoteString(comment)};\n`;
      for (const column of columns.filter(c => c.comment !== null))
         sql += `COMMENT ON COLUMN ${table}.${this.quoteName(column.name)} IS ${this.quoteString(column.comment)};\n`;

      // Indexes and foreign keys are created after the data of all tables: faster import, any table order
      for (const index of await this._indexes(oid))
         this._postTablesSql += `${index};\n`;

      for (const constraint of constraints.filter(c => c.type === 'f'))
         this._postTablesSql += `ALTER TABLE ONLY ${table}\n   ADD CONSTRAINT ${this.quoteName(constraint.name)} ${constraint.definition};\n`;

      return sql;
   }

   /** CREATE INDEX statements of the indexes not created by constraints */
   private async _indexes (oid: number) {
      const rows = await this._query<{ definition: string }>(`
         SELECT pg_catalog.pg_get_indexdef(i.indexrelid) AS definition
         FROM pg_catalog.pg_index i
         WHERE i.indrelid = $1 AND NOT EXISTS (
            SELECT 1 FROM pg_catalog.pg_constraint c
            WHERE c.conindid = i.indexrelid AND c.conrelid = i.indrelid AND c.contype IN ('p', 'u', 'x')
         )
         ORDER BY i.indexrelid
      `, [oid]);

      return rows.map(row => row.definition);
   }

   /** Tables are dropped with what depends on them (views, foreign keys): the dump recreates them */
   getDropTable (tableName: string) {
      return `DROP TABLE IF EXISTS ${this.qualified(tableName)} CASCADE;`;
   }

   async getDataColumns (tableName: string): Promise<DataColumn[]> {
      const { columns } = await this._tableInfo(tableName);

      return columns
         .filter(column => !column.generated)
         .map(column => ({
            name: column.name,
            // Values read as text: exact numbers, dates with time zone and precision, any type (arrays, ranges...)
            select: `${this.quoteName(column.name)}::text`,
            format: this._formatter(column.category)
         }));
   }

   private _formatter (category: string): ValueFormatter {
      const isPlain = category === 'N' || category === 'B'; // Numbers and booleans

      return value => {
         if (value === null) return 'NULL';
         if (isPlain && (NUMERIC_LITERAL.test(value as string) || value === 'true' || value === 'false')) return value as string;
         return this.quoteString(value as string);
      };
   }

   getInsertHead (tableName: string, columns: DataColumn[]) {
      const head = `INSERT INTO ${this.qualified(tableName)} (${columns.map(c => this.quoteName(c.name)).join(', ')})`;
      // Values of GENERATED ALWAYS identity columns
      return `${head}${this._overridingTables.has(tableName) ? ' OVERRIDING SYSTEM VALUE' : ''} VALUES`;
   }

   async writeTableData (tableName: string) {
      const { columns, sequences } = await this._tableInfo(tableName);
      if (columns.some(c => c.identity === 'a'))
         this._overridingTables.add(tableName);

      await super.writeTableData(tableName);

      // Current values of the sequences, also when the table is empty
      let sql = '';
      for (const sequence of sequences) {
         const target = sequence.owner && sequence.deptype
            ? `pg_catalog.pg_get_serial_sequence(${this.quoteString(this.qualified(tableName))}, ${this.quoteString(sequence.owner)})`
            : this.quoteString(sequence.name);
         sql += `SELECT pg_catalog.setval(${target}, ${sequence.lastValue}, ${sequence.isCalled});\n`;
      }
      if (sql) await this.writeString(`\n${sql}`);
   }

   async * streamRows (tableName: string, columns: DataColumn[]): AsyncIterable<unknown[]> {
      const sql = `SELECT ${columns.map(c => c.select).join(', ')} FROM ONLY ${this.qualified(tableName)}`;
      const stream = this._connection.query(new QueryStream(sql, [], { batchSize: 1000, highWaterMark: 1000, rowMode: 'array' }));

      yield * stream;
   }

   async getCreateTypes () {
      let sqlString = '';
      // Enums, domains, ranges and composite types of the schema (not of extensions), in creation order to respect dependencies
      const { rows: types } = await this._client.raw<antares.QueryResult<{ typname: string }>>(`
         SELECT t.typname
         FROM pg_type t
         JOIN pg_namespace n ON n.oid = t.typnamespace
         WHERE n.nspname = ${this._client.dialect.quoteString(this.schemaName)}
         AND (t.typtype IN ('e', 'd', 'r') OR (t.typtype = 'c' AND EXISTS (SELECT 1 FROM pg_class c WHERE c.oid = t.typrelid AND c.relkind = 'c')))
         AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.classid = 'pg_type'::regclass AND d.objid = t.oid AND d.deptype = 'e')
         ORDER BY t.oid
      `);

      if (types.length) {
         sqlString += this.buildComment('Dump of types\n------------------------------------------------------------') + '\n\n';

         for (const { typname } of types) {
            const details = await this._client.getUserTypeInformations({ schema: this.schemaName, userType: typname, qualifyTypes: true });
            for (const statement of this._types.createType(details))
               sqlString += `${statement};\n`;
         }

         sqlString += '\n';
      }

      return sqlString;
   }

   /** Functions, procedures and aggregates of the schema (not of extensions) */
   private async _routines (condition: string) {
      return this._query<{ oid: number; definition: string }>(`
         SELECT p.oid, CASE WHEN p.prokind = 'a' THEN NULL ELSE pg_catalog.pg_get_functiondef(p.oid) END AS definition
         FROM pg_catalog.pg_proc p
         JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = $1 AND ${condition}
         AND NOT EXISTS (
            SELECT 1 FROM pg_catalog.pg_depend d
            WHERE d.classid = 'pg_catalog.pg_proc'::pg_catalog.regclass AND d.objid = p.oid AND d.deptype = 'e'
         )
         ORDER BY p.oid
      `, [this.schemaName]);
   }

   async getCreateAggregates () {
      let sqlString = '';

      for (const { oid } of await this._routines('p.prokind = \'a\'')) {
         const [aggregate] = await this._query<{ definition: string }>(`
            SELECT pg_catalog.format(
               E'CREATE AGGREGATE %s (\n%s\n);',
               (pg_catalog.pg_identify_object('pg_catalog.pg_proc'::pg_catalog.regclass, aggfnoid, 0)).identity,
               pg_catalog.array_to_string(
                  ARRAY[
                     pg_catalog.format(E'\tSFUNC = %s', aggtransfn::pg_catalog.regproc),
                     pg_catalog.format(E'\tSTYPE = %s', pg_catalog.format_type(aggtranstype, NULL)),
                     CASE aggfinalfn WHEN 0 THEN NULL ELSE pg_catalog.format(E'\tFINALFUNC = %s', aggfinalfn::pg_catalog.regproc) END,
                     CASE aggsortop WHEN 0 THEN NULL ELSE pg_catalog.format(E'\tSORTOP = OPERATOR(%s.%s)', pg_catalog.quote_ident(opn.nspname), oprname) END,
                     CASE WHEN agginitval IS NULL THEN NULL ELSE pg_catalog.format(E'\tINITCOND = %L', agginitval) END
                  ],
                  E',\n'
               )
            ) AS definition
            FROM pg_catalog.pg_aggregate
            LEFT JOIN pg_catalog.pg_operator op ON op.oid = aggsortop
            LEFT JOIN pg_catalog.pg_namespace opn ON opn.oid = op.oprnamespace
            WHERE aggfnoid = $1
         `, [oid]);

         if (aggregate)
            sqlString += `\n${aggregate.definition}\n`;
      }

      return sqlString;
   }

   async getViews () {
      const views = await this._query<{ oid: number; name: string; kind: string; definition: string; options: string[] | null; populated: boolean }>(`
         SELECT c.oid, c.relname AS name, c.relkind AS kind, pg_catalog.pg_get_viewdef(c.oid) AS definition,
            c.reloptions AS options, c.relispopulated AS populated
         FROM pg_catalog.pg_class c
         JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = $1 AND c.relkind IN ('v', 'm')
         AND NOT EXISTS (
            SELECT 1 FROM pg_catalog.pg_depend d
            WHERE d.classid = 'pg_catalog.pg_class'::pg_catalog.regclass AND d.objid = c.oid AND d.deptype = 'e'
         )
         ORDER BY c.oid
      `, [this.schemaName]);

      if (!views.length) return '';

      // Views using other views are created after them
      const dependencies = await this._query<{ view: number; ref: number }>(`
         SELECT DISTINCT r.ev_class AS view, d.refobjid AS ref
         FROM pg_catalog.pg_depend d
         JOIN pg_catalog.pg_rewrite r ON r.oid = d.objid
         WHERE d.classid = 'pg_catalog.pg_rewrite'::pg_catalog.regclass
         AND d.refclassid = 'pg_catalog.pg_class'::pg_catalog.regclass
         AND d.refobjid <> r.ev_class AND r.ev_class = ANY($1::pg_catalog.oid[])
      `, [views.map(v => v.oid)]);

      const byOid = new Map(views.map(view => [view.oid, view]));
      const sorted: typeof views = [];
      const visited = new Set<number>();
      const visit = (oid: number) => {
         if (visited.has(oid) || !byOid.has(oid)) return;
         visited.add(oid);
         for (const dependency of dependencies.filter(d => d.view === oid))
            visit(dependency.ref);
         sorted.push(byOid.get(oid));
      };
      views.forEach(view => visit(view.oid));

      let sqlString = '';

      for (const view of sorted) {
         const name = this.qualified(view.name);
         const definition = view.definition.trim().replace(/;$/, '');
         const options = view.options?.length ? ` WITH (${view.options.join(', ')})` : '';

         if (view.kind === 'm') {
            sqlString += `\nDROP MATERIALIZED VIEW IF EXISTS ${name} CASCADE;\n`;
            sqlString += `CREATE MATERIALIZED VIEW ${name}${options} AS\n${definition}\nWITH ${view.populated ? 'DATA' : 'NO DATA'};\n`;
            for (const index of await this._indexes(view.oid))
               sqlString += `${index};\n`;
         }
         else {
            sqlString += `\nDROP VIEW IF EXISTS ${name} CASCADE;\n`;
            sqlString += `CREATE VIEW ${name}${options} AS\n${definition};\n`;
         }
      }

      return sqlString;
   }

   async getTriggers () {
      let sqlString = '';

      // Trigger functions
      for (const func of await this._routines('p.prokind = \'f\' AND p.prorettype = \'pg_catalog.trigger\'::pg_catalog.regtype'))
         sqlString += `\n${func.definition.trim()};\n`;

      const triggers = await this._query<{ name: string; table: string; definition: string; enabled: string }>(`
         SELECT t.tgname AS name, c.relname AS table, pg_catalog.pg_get_triggerdef(t.oid) AS definition, t.tgenabled AS enabled
         FROM pg_catalog.pg_trigger t
         JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
         JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = $1 AND NOT t.tgisinternal
         ORDER BY c.relname, t.tgname
      `, [this.schemaName]);

      for (const trigger of triggers) {
         const table = this.qualified(trigger.table);
         sqlString += `\nDROP TRIGGER IF EXISTS ${this.quoteName(trigger.name)} ON ${table};\n`;
         sqlString += `${trigger.definition};\n`;
         if (trigger.enabled === 'D')
            sqlString += `ALTER TABLE ${table} DISABLE TRIGGER ${this.quoteName(trigger.name)};\n`;
      }

      return sqlString;
   }

   async getFunctions () {
      let sqlString = '';

      for (const func of await this._routines('p.prokind = \'f\' AND p.prorettype <> \'pg_catalog.trigger\'::pg_catalog.regtype'))
         sqlString += `\n${func.definition.trim()};\n`;

      sqlString += await this.getCreateAggregates();

      return sqlString;
   }

   async getRoutines () {
      let sqlString = '';

      for (const procedure of await this._routines('p.prokind = \'p\''))
         sqlString += `\n${procedure.definition.trim()};\n`;

      return sqlString;
   }

   /** Standard SQL string literal (the dump sets standard_conforming_strings = on) */
   escapeAndQuote (val: string) {
      return this.quoteString(val);
   }
}
