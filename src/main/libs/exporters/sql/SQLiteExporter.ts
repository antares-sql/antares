import * as exporter from 'common/interfaces/exporter';
import * as path from 'path';

import sqlite = require('better-sqlite3');

import { SQLiteClient } from '../../clients/SQLiteClient';
import { DataColumn, SqlExporter } from './SqlExporter';

/**
 * SQLite dump, like the .dump command of the sqlite3 shell: statements as stored in sqlite_master,
 * all the data inside one transaction, AUTOINCREMENT counters, indexes after the data.
 */
export default class SQLiteExporter extends SqlExporter {
   protected _client: SQLiteClient;
   /** Handle of the dump: a read transaction keeps all the reads on the same snapshot */
   private _db?: sqlite.Database;
   private _shadowTables = new Set<string>();

   constructor (client: SQLiteClient, tables: exporter.TableParams[], options: exporter.ExportOptions) {
      super(tables, options);

      this._client = client;
   }

   get host () {
      return path.basename(this._client._params.databasePath);
   }

   async getServerVersion () {
      const version = await this._client.getVersion();
      return `${version.name} ${version.number}`;
   }

   quoteName (name: string) {
      return `"${name.replaceAll('"', '""')}"`;
   }

   quoteString (value: string) {
      return `'${value.replaceAll('\'', '\'\'')}'`;
   }

   /** sqlite_master of the exported database (main or an attached one) */
   private get _master () {
      return `${this.quoteName(this.schemaName)}.sqlite_master`;
   }

   async prepare () {
      this._db = this._client.getConnection();
      this._db.exec('BEGIN');

      try {
         // Internal tables of virtual tables (e.g. FTS): created by the virtual table itself
         const rows = this._db.prepare('SELECT name FROM pragma_table_list WHERE schema = ? AND type = \'shadow\'').all(this.schemaName) as { name: string }[];
         this._shadowTables = new Set(rows.map(row => row.name));
      }
      catch (_) {} // pragma_table_list: SQLite 3.37+

      this._tables = this._tables.filter(table => !this._shadowTables.has(table.table));
   }

   async cleanup () {
      const db = this._db;
      this._db = undefined;
      db?.close();
   }

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   private _all<T = any> (sql: string, ...params: unknown[]): T[] {
      return this._db.prepare(sql).all(...params) as T[];
   }

   async getSqlHeader () {
      return `${await super.getSqlHeader()}


PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;`;
   }

   async getFooter () {
      return `COMMIT;\n\n${await super.getFooter()}\n`;
   }

   async getCreateTable (tableName: string) {
      const [table] = this._all<{ sql: string }>(`SELECT sql FROM ${this._master} WHERE type = 'table' AND name = ?`, tableName);
      if (!table?.sql) return '';

      // Indexes are created after the data of all tables (faster import)
      const indexes = this._all<{ sql: string }>(`SELECT sql FROM ${this._master} WHERE type = 'index' AND tbl_name = ? AND sql IS NOT NULL ORDER BY rowid`, tableName);
      for (const index of indexes)
         this._postTablesSql += `${index.sql};\n`;

      return `${table.sql};`;
   }

   getDropTable (tableName: string) {
      return `DROP TABLE IF EXISTS ${this.quoteName(tableName)};`;
   }

   async getDataColumns (tableName: string): Promise<DataColumn[]> {
      // table_xinfo also lists generated columns (hidden 2 and 3) and hidden columns of virtual tables (1): not inserted
      const columns = this._all<{ name: string; hidden: number }>(`SELECT name, hidden FROM ${this.quoteName(this.schemaName)}.pragma_table_xinfo(?)`, tableName);

      return columns
         .filter(column => !column.hidden)
         .map(column => ({ name: column.name, format: value => this._literal(value) }));
   }

   /** SQLite is dynamically typed: the literal follows the type of the stored value */
   private _literal (value: unknown): string {
      if (typeof value === 'number') { // Integers are read as BigInt: numbers are REAL values
         if (!Number.isFinite(value)) return value > 0 ? '1e999' : value < 0 ? '-1e999' : 'NULL';
         const literal = String(value);
         return /[.eE]/.test(literal) ? literal : `${literal}.0`;
      }

      return this.formatValue(value, v => this.quoteString(v), data => `X'${data.toString('hex').toUpperCase()}'`);
   }

   async * streamRows (tableName: string, columns: DataColumn[]): AsyncIterable<unknown[]> {
      const statement = this._db.prepare(
         `SELECT ${columns.map(c => this.quoteName(c.name)).join(', ')} FROM ${this.quoteName(this.schemaName)}.${this.quoteName(tableName)}`
      );

      // Read lazily, with integers as BigInt (no rounding beyond 2^53)
      for (const row of statement.raw(true).safeIntegers(true).iterate())
         yield row as unknown[];
   }

   async writeTableData (tableName: string) {
      await super.writeTableData(tableName);

      // AUTOINCREMENT counter, also when the table is empty
      const hasSequence = this._all(`SELECT 1 FROM ${this._master} WHERE type = 'table' AND name = 'sqlite_sequence'`).length;
      if (!hasSequence) return;

      const [sequence] = this._all<{ seq: number }>(`SELECT seq FROM ${this.quoteName(this.schemaName)}.sqlite_sequence WHERE name = ?`, tableName);
      if (sequence) {
         await this.writeString(`\nDELETE FROM sqlite_sequence WHERE name = ${this.quoteString(tableName)};\n`);
         await this.writeString(`INSERT INTO sqlite_sequence (name, seq) VALUES (${this.quoteString(tableName)}, ${sequence.seq});\n`);
      }
   }

   private _objects (type: 'view' | 'trigger') {
      return this._all<{ name: string; sql: string }>(`SELECT name, sql FROM ${this._master} WHERE type = ? AND sql IS NOT NULL ORDER BY rowid`, type);
   }

   async getViews () {
      return this._objects('view')
         .map(view => `DROP VIEW IF EXISTS ${this.quoteName(view.name)};\n${view.sql};\n`)
         .join('\n');
   }

   async getTriggers () {
      return this._objects('trigger')
         .map(trigger => `DROP TRIGGER IF EXISTS ${this.quoteName(trigger.name)};\n${trigger.sql};\n`)
         .join('\n');
   }
}
