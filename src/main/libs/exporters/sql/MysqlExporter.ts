import { FLOAT, NUMBER } from 'common/fieldTypes';
import * as exporter from 'common/interfaces/exporter';
import * as mysql from 'mysql2/promise';

import { MySQLClient } from '../../clients/MySQLClient';
import { DataColumn, NUMERIC_LITERAL, SqlExporter, ValueFormatter } from './SqlExporter';

const NUMERIC_TYPES = new Set([...NUMBER, ...FLOAT]);

/**
 * Values read as the server sends them: BIGINT and DECIMAL as strings (no rounding beyond 2^53),
 * JSON as text (not parsed and serialized again), spatial values in the internal binary format
 * (written as hex, like mysqldump --hex-blob). Dates are strings (dateStrings connection option).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const typeCast = (field: any, next: () => unknown) => {
   switch (field.type) {
      case 'LONGLONG':
      case 'NEWDECIMAL':
      case 'DECIMAL':
         return field.string();
      case 'JSON':
         return field.string('utf8');
      case 'GEOMETRY':
         return field.buffer();
      default:
         return next();
   }
};

// eslint-disable-next-line no-control-regex
const CHARS_TO_ESCAPE = /[\0\b\t\n\r\x1a"'\\]/g;
const CHARS_ESCAPE_MAP: Record<string, string> = {
   '\0': '\\0',
   '\b': '\\b',
   '\t': '\\t',
   '\n': '\\n',
   '\r': '\\r',
   '\x1a': '\\Z',
   '"': '\\"',
   '\'': '\\\'',
   '\\': '\\\\'
};

export default class MysqlExporter extends SqlExporter {
   protected _client: MySQLClient;
   /** Connection of the dump: a transaction with a consistent snapshot, session time zone UTC */
   private _connection?: mysql.Connection;

   constructor (client: MySQLClient, tables: exporter.TableParams[], options: exporter.ExportOptions) {
      super(tables, options);

      this._client = client;
      this._commentChar = '#';
   }

   get host () {
      return this._client.host;
   }

   async getServerVersion () {
      const version = await this._client.getVersion();
      return `${version.name} ${version.number}`;
   }

   quoteName (name: string) {
      return `\`${name.replaceAll('`', '``')}\``;
   }

   /**
    * Like mysqldump --single-transaction: all the rows come from the same snapshot (consistent foreign keys),
    * TIMESTAMP values are read in UTC and the dump sets TIME_ZONE='+00:00' (portable across servers).
    */
   async prepare () {
      this._connection = await this._client.getSingleConnection();
      await this._connection.query('SET SESSION time_zone = \'+00:00\'');
      // The output may stop reading rows for a while (backpressure): the server must not drop the connection
      await this._connection.query('SET SESSION net_write_timeout = 3600');
      await this._connection.query('SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ');
      await this._connection.query('START TRANSACTION /*!40100 WITH CONSISTENT SNAPSHOT */');
   }

   async cleanup () {
      const connection = this._connection;
      this._connection = undefined;
      connection?.destroy();
   }

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   private async _query<T = any> (sql: string): Promise<T[]> {
      const [rows] = await this._connection.query(sql);
      return rows as T[];
   }

   async getSqlHeader () {
      let dump = await super.getSqlHeader();
      dump += `


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
SET NAMES utf8mb4;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;`;

      return dump;
   }

   async getFooter () {
      const footer = await super.getFooter();

      return `/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

${footer}
`;
   }

   async getCreateTable (tableName: string) {
      const rows = await this._query(`SHOW CREATE TABLE ${this.quoteName(this.schemaName)}.${this.quoteName(tableName)}`);

      if (rows.length !== 1) return '';

      const col = 'Create View' in rows[0] ? 'Create View' : 'Create Table';

      return rows[0][col] + ';';
   }

   getDropTable (tableName: string) {
      return `DROP TABLE IF EXISTS ${this.quoteName(tableName)};`;
   }

   async getDataColumns (tableName: string): Promise<DataColumn[]> {
      const columns = await this._client.getTableColumns({ table: tableName, schema: this.schemaName });

      return columns
         .filter(column => !column.generated)
         .map(column => ({ name: column.name, format: this._formatter(column.type) }));
   }

   private _formatter (type: string): ValueFormatter {
      const quote = (value: string) => this.escapeAndQuote(value);
      const blob = (data: Buffer) => this._client.dialect.blobLiteral(data);

      if (type === 'BIT') {
         return value => value instanceof Uint8Array
            ? `b'${Array.from(value, byte => byte.toString(2).padStart(8, '0')).join('')}'`
            : this.formatValue(value, quote, blob);
      }

      if (NUMERIC_TYPES.has(type)) {
         return value => typeof value === 'string' && NUMERIC_LITERAL.test(value)
            ? value
            : this.formatValue(value, quote, blob);
      }

      return value => this.formatValue(value, quote, blob);
   }

   async * streamRows (tableName: string, columns: DataColumn[]): AsyncIterable<unknown[]> {
      const sql = `SELECT ${columns.map(c => this.quoteName(c.name)).join(', ')} FROM ${this.quoteName(this.schemaName)}.${this.quoteName(tableName)}`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stream = (this._connection as any).connection
         .query({ sql, rowsAsArray: true, typeCast })
         .stream({ highWaterMark: 1000 });

      yield * stream;
   }

   getBeforeTableData (tableName: string) {
      return `LOCK TABLES ${this.quoteName(tableName)} WRITE;\n/*!40000 ALTER TABLE ${this.quoteName(tableName)} DISABLE KEYS */;\n\n`;
   }

   getAfterTableData (tableName: string) {
      return `\n/*!40000 ALTER TABLE ${this.quoteName(tableName)} ENABLE KEYS */;\nUNLOCK TABLES;`;
   }

   /**
    * Views are created after the tables, first as placeholders (views with the same columns) so that
    * views using other views can be created in any order (like mysqldump)
    */
   async getViews () {
      const views = await this._query<{ name: string }>(
         `SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = ${this.escapeAndQuote(this.schemaName)} AND TABLE_TYPE = 'VIEW' ORDER BY TABLE_NAME`
      );
      if (!views.length) return '';

      let sqlString = this.buildComment('Temporary views to overcome VIEW dependency errors') + '\n\n';

      for (const { name } of views) {
         let columns: string[] = [];
         try {
            columns = (await this._client.getTableColumns({ schema: this.schemaName, table: name })).map(field => field.name);
         }
         catch (_) {} // Invalid view (e.g. a referenced table was dropped): created anyway

         const select = columns.length
            ? columns.map(column => `1 AS ${this.quoteName(column)}`).join(', ')
            : '1 AS `1`';

         sqlString += `DROP TABLE IF EXISTS ${this.quoteName(name)};\n`;
         sqlString += `/*!50001 DROP VIEW IF EXISTS ${this.quoteName(name)}*/;\n`;
         sqlString += `/*!50001 CREATE VIEW ${this.quoteName(name)} AS SELECT ${select}*/;\n\n`;
      }

      sqlString += '\n';

      for (const { name } of views) {
         const [view] = await this._query(`SHOW CREATE VIEW ${this.quoteName(this.schemaName)}.${this.quoteName(name)}`);
         if (!view) continue;

         sqlString += `/*!50001 DROP VIEW IF EXISTS ${this.quoteName(name)}*/;\n`;
         sqlString += view['Create View'].replaceAll(this.quoteName(this.schemaName) + '.', '') + ';';
         sqlString += '\n\n';
      }

      return sqlString;
   }

   async getTriggers () {
      const triggers = await this._query(`SHOW TRIGGERS FROM ${this.quoteName(this.schemaName)}`);

      let sqlString = '';

      for (const trigger of triggers) {
         const {
            Trigger: name,
            Timing: timing,
            Event: event,
            Table: table,
            Statement: statement,
            sql_mode: sqlMode
         } = trigger;

         const definer = this.getEscapedDefiner(trigger.Definer);
         sqlString += '/*!50003 SET @OLD_SQL_MODE=@@SQL_MODE*/;\n';
         sqlString += `/*!50003 SET SQL_MODE=${this.escapeAndQuote(sqlMode)} */;\n`;
         sqlString += `/*!50032 DROP TRIGGER IF EXISTS ${this.quoteName(name)} */;\n`;
         sqlString += 'DELIMITER ;;\n';
         sqlString += '/*!50003 CREATE*/ ';
         sqlString += `/*!50017 DEFINER=${definer}*/ `;
         sqlString += `/*!50003 TRIGGER ${this.quoteName(name)} ${timing} ${event} ON ${this.quoteName(table)} FOR EACH ROW ${statement}*/;;\n`;
         sqlString += 'DELIMITER ;\n';
         sqlString += '/*!50003 SET SQL_MODE=@OLD_SQL_MODE */;\n\n';
      }

      return sqlString;
   }

   async getSchedulers () {
      const schedulers = await this._query(
         `SELECT * FROM information_schema.EVENTS WHERE EVENT_SCHEMA = ${this.escapeAndQuote(this.schemaName)}`
      );
      let sqlString = '';

      for (const scheduler of schedulers) {
         const {
            EVENT_NAME: name,
            SQL_MODE: sqlMode,
            EVENT_TYPE: type,
            INTERVAL_VALUE: intervalValue,
            INTERVAL_FIELD: intervalField,
            STARTS: starts,
            ENDS: ends,
            EXECUTE_AT: at,
            ON_COMPLETION: onCompletion,
            STATUS: status,
            EVENT_DEFINITION: definition
         } = scheduler;

         const definer = this.getEscapedDefiner(scheduler.DEFINER);
         const comment = this.escapeAndQuote(scheduler.EVENT_COMMENT || '');

         sqlString += `/*!50106 DROP EVENT IF EXISTS ${this.quoteName(name)} */;\n`;
         sqlString += '/*!50003 SET @OLD_SQL_MODE=@@SQL_MODE*/;\n';
         sqlString += `/*!50003 SET SQL_MODE=${this.escapeAndQuote(sqlMode)} */;\n`;
         sqlString += 'DELIMITER ;;\n';
         sqlString += '/*!50106 CREATE*/ ';
         sqlString += `/*!50117 DEFINER=${definer}*/ `;
         sqlString += `/*!50106 EVENT ${this.quoteName(name)} ON SCHEDULE `;
         if (type === 'RECURRING') {
            sqlString += `EVERY ${intervalValue} ${intervalField} STARTS '${starts}' `;

            if (ends) sqlString += `ENDS '${ends}' `;
         }
         else sqlString += `AT '${at}' `;
         sqlString += `ON COMPLETION ${onCompletion} ${
            status === 'DISABLED' ? 'DISABLE' : 'ENABLE'
         } COMMENT ${comment} DO ${definition}*/;;\n`;
         sqlString += 'DELIMITER ;\n';
         sqlString += '/*!50003 SET SQL_MODE=@OLD_SQL_MODE*/;\n\n';
      }

      return sqlString;
   }

   async getFunctions () {
      const functions = await this._query(
         `SHOW FUNCTION STATUS WHERE \`Db\` = ${this.escapeAndQuote(this.schemaName)}`
      );

      let sqlString = '';

      for (const func of functions)
         sqlString += await this.getRoutineSyntax(func.Name, func.Type, this.getEscapedDefiner(func.Definer));

      return sqlString;
   }

   async getRoutines () {
      const routines = await this._query(
         `SHOW PROCEDURE STATUS WHERE \`Db\` = ${this.escapeAndQuote(this.schemaName)}`
      );

      let sqlString = '';

      for (const routine of routines)
         sqlString += await this.getRoutineSyntax(routine.Name, routine.Type, this.getEscapedDefiner(routine.Definer));

      return sqlString;
   }

   async getRoutineSyntax (name: string, type: string, definer: string) {
      const routines = await this._query(
         `SHOW CREATE ${type} ${this.quoteName(this.schemaName)}.${this.quoteName(name)}`
      );

      if (routines.length === 0) return '';

      const routine = routines[0];

      const fieldName = `Create ${type === 'PROCEDURE' ? 'Procedure' : 'Function'}`;
      const sqlMode = routine.sql_mode;
      const createProcedure = routine[fieldName];
      let sqlString = '';

      if (createProcedure) { // If procedure body not empty
         const startOffset = createProcedure.indexOf(type);
         const procedureBody = createProcedure.substring(startOffset);

         sqlString += `/*!50003 DROP ${type} IF EXISTS ${this.quoteName(name)}*/;\n`;
         sqlString += '/*!50003 SET @OLD_SQL_MODE=@@SQL_MODE*/;\n';
         sqlString += `/*!50003 SET SQL_MODE=${this.escapeAndQuote(sqlMode)}*/;\n`;
         sqlString += 'DELIMITER ;;\n';
         sqlString += `/*!50003 CREATE*/ /*!50020 DEFINER=${definer}*/ /*!50003 ${procedureBody}*/;;\n`;
         sqlString += 'DELIMITER ;\n';
         sqlString += '/*!50003 SET SQL_MODE=@OLD_SQL_MODE*/;\n\n';
      }

      return sqlString;
   }

   getEscapedDefiner (definer: string) {
      const at = definer.lastIndexOf('@');
      return at === -1
         ? this.quoteName(definer)
         : `${this.quoteName(definer.slice(0, at))}@${this.quoteName(definer.slice(at + 1))}`;
   }

   /** MySQL string literal (backslash escapes) */
   escapeAndQuote (val: string) {
      return `'${val.replace(CHARS_TO_ESCAPE, char => CHARS_ESCAPE_MAP[char])}'`;
   }
}
