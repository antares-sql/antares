import * as exporter from 'common/interfaces/exporter';
import * as mysql from 'mysql2/promise';
import { SqlExporter } from './SqlExporter';
import { MySQLClient } from '../../clients/MySQLClient';
import { valueToSqlString } from 'common/libs/sqlUtils';

export default class MysqlExporter extends SqlExporter {
   protected _client: MySQLClient;

   constructor (client: MySQLClient, tables: exporter.TableParams[], options: exporter.ExportOptions) {
      super(tables, options);

      this._client = client;
      this._commentChar = '#';
   }

   async getSqlHeader () {
      let dump = await super.getSqlHeader();
      dump += `


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
SET NAMES utf8mb4;
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
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

${footer}
`;
   }

   async getCreateTable (tableName: string) {
      const { rows } = await this._client.raw(
         `SHOW CREATE TABLE \`${this.schemaName}\`.\`${tableName}\``
      );

      if (rows.length !== 1) return '';

      const col = 'Create View' in rows[0] ? 'Create View' : 'Create Table';

      return rows[0][col] + ';';
   }

   getDropTable (tableName: string) {
      return `DROP TABLE IF EXISTS \`${tableName}\`;`;
   }

   async * getTableInsert (tableName: string) {
      let rowCount = 0;
      let sqlStr = '';

      const countResults = await this._client.raw(`SELECT COUNT(1) as count FROM \`${this.schemaName}\`.\`${tableName}\``);
      if (countResults.rows.length === 1) rowCount = countResults.rows[0].count;

      if (rowCount > 0) {
         let queryLength = 0;
         let rowsWritten = 0;
         let rowIndex = 0;
         const { sqlInsertDivider, sqlInsertAfter } = this._options;
         const columns = await this._client.getTableColumns({
            table: tableName,
            schema: this.schemaName
         });

         const notGeneratedColumns = columns.filter(col => !col.generated);
         const columnNames = notGeneratedColumns.map(col => '`' + col.name + '`');
         const insertStmt = `INSERT INTO \`${tableName}\` (${columnNames.join(
            ', '
         )}) VALUES`;

         sqlStr += `LOCK TABLES \`${tableName}\` WRITE;\n`;
         sqlStr += `/*!40000 ALTER TABLE \`${tableName}\` DISABLE KEYS */;`;
         sqlStr += '\n\n';
         yield sqlStr;

         yield insertStmt;

         const stream = await this._queryStream(
            `SELECT ${columnNames.join(', ')} FROM \`${this.schemaName}\`.\`${tableName}\``
         );

         for await (const row of stream) {
            if (this.isCancelled) {
               stream.destroy();
               yield null;
               return;
            }

            let sqlInsertString = '';

            if (
               (sqlInsertDivider === 'bytes' && queryLength >= sqlInsertAfter * 1024) ||
               (sqlInsertDivider === 'rows' && rowsWritten === sqlInsertAfter)
            ) {
               sqlInsertString += `;\n${insertStmt}\n\t(`;
               queryLength = 0;
               rowsWritten = 0;
            }
            else if (rowIndex === 0) sqlInsertString += '\n\t(';
            else sqlInsertString += ',\n\t(';

            for (const i in notGeneratedColumns) {
               const column = notGeneratedColumns[i];
               const val = row[column.name];

               sqlInsertString += valueToSqlString({ val, client: 'mysql', field: column });

               if (parseInt(i) !== notGeneratedColumns.length - 1)
                  sqlInsertString += ', ';
            }

            sqlInsertString += ')';

            queryLength += sqlInsertString.length;
            rowsWritten++;
            rowIndex++;
            yield sqlInsertString;
         }

         sqlStr = ';\n\n';
         sqlStr += `/*!40000 ALTER TABLE \`${tableName}\` ENABLE KEYS */;\n`;
         sqlStr += 'UNLOCK TABLES;';

         yield sqlStr;
      }
   }

   async getViews () {
      const { rows: views } = await this._client.raw(
         `SHOW TABLE STATUS FROM \`${this.schemaName}\` WHERE Comment = 'VIEW'`
      );
      let sqlString = '';

      sqlString += this.buildComment('Creating temporary tables to overcome VIEW dependency errors');

      // Temporary tables
      for (const view of views) {
         const viewFields = await this._client.getTableColumns({ schema: this.schemaName, table: view.Name });
         const tableFields: string[] = [];

         for (const field of viewFields) {
            const typeInfo = this._client.getTypeInfo(field.type);
            const length = typeInfo.length ? field.enumValues || field.numLength || field.charLength || field.datePrecision : false;

            tableFields.push(`\`${field.name}\` ${field.type.toUpperCase()}${length ? `(${length}${field.numScale ? `,${field.numScale}` : ''})` : ''} ${field.unsigned ? 'UNSIGNED' : ''} ${field.zerofill ? 'ZEROFILL' : ''} ${field.nullable ? 'NULL' : 'NOT NULL'} ${field.autoIncrement ? 'AUTO_INCREMENT' : ''} ${field.collation ? `COLLATE ${field.collation}` : ''}`);
         }
         sqlString +=
`
CREATE TABLE \`${view.Name}\`(
   ${tableFields.join(',\n\t')}
);`;

         sqlString += '\n';
      }

      sqlString += '\n';

      for (const view of views) {
         sqlString += `DROP TABLE IF EXISTS \`${view.Name}\`;\n`;
         const viewSyntax = await this.getCreateTable(view.Name);
         sqlString += viewSyntax.replaceAll('`' + this.schemaName + '`.', '');
         sqlString += '\n\n';
      }

      return sqlString;
   }

   async getTriggers () {
      const { rows: triggers } = await this._client.raw(
         `SHOW TRIGGERS FROM \`${this.schemaName}\``
      );
      // const generatedTables = this._tables
      //    .filter(t => t.includeStructure)
      //    .map(t => t.table);

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

         // if (!generatedTables.includes(table)) continue;// Commented to avoid issues if export contains triggers without tables

         const definer = this.getEscapedDefiner(trigger.Definer);
         sqlString += '/*!50003 SET @OLD_SQL_MODE=@@SQL_MODE*/;;\n';
         sqlString += `/*!50003 SET SQL_MODE="${sqlMode}" */;\n`;
         sqlString += 'DELIMITER ;;\n';
         sqlString += '/*!50003 CREATE*/ ';
         sqlString += `/*!50017 DEFINER=${definer}*/ `;
         sqlString += `/*!50003 TRIGGER \`${name}\` ${timing} ${event} ON \`${table}\` FOR EACH ROW ${statement}*/;;\n`;
         sqlString += 'DELIMITER ;\n';
         sqlString += '/*!50003 SET SQL_MODE=@OLD_SQL_MODE */;\n\n';
      }

      return sqlString;
   }

   async getSchedulers () {
      const { rows: schedulers } = await this._client.raw(
         `SELECT *, EVENT_SCHEMA AS \`Db\`, EVENT_NAME AS \`Name\` FROM information_schema.\`EVENTS\` WHERE EVENT_SCHEMA = '${this.schemaName}'`
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
         const comment = this.escapeAndQuote(scheduler.EVENT_COMMENT);

         sqlString += `/*!50106 DROP EVENT IF EXISTS \`${name}\` */;\n`;
         sqlString += '/*!50003 SET @OLD_SQL_MODE=@@SQL_MODE*/;;\n';
         sqlString += `/*!50003 SET SQL_MODE='${sqlMode}' */;\n`;
         sqlString += 'DELIMITER ;;\n';
         sqlString += '/*!50106 CREATE*/ ';
         sqlString += `/*!50117 DEFINER=${definer}*/ `;
         sqlString += `/*!50106 EVENT \`${name}\` ON SCHEDULE `;
         if (type === 'RECURRING') {
            sqlString += `EVERY ${intervalValue} ${intervalField} STARTS '${starts}' `;

            if (ends) sqlString += `ENDS '${ends}' `;
         }
         else sqlString += `AT '${at}' `;
         sqlString += `ON COMPLETION ${onCompletion} ${
            status === 'disabled' ? 'DISABLE' : 'ENABLE'
         } COMMENT ${comment || '\'\''} DO ${definition}*/;;\n`;
         sqlString += 'DELIMITER ;\n';
         sqlString += '/*!50003 SET SQL_MODE=@OLD_SQL_MODE*/;;\n';
      }

      return sqlString;
   }

   async getFunctions () {
      const { rows: functions } = await this._client.raw(
         `SHOW FUNCTION STATUS WHERE \`Db\` = '${this.schemaName}';`
      );

      let sqlString = '';

      for (const func of functions) {
         const definer = this.getEscapedDefiner(func.Definer);
         sqlString += await this.getRoutineSyntax(
            func.Name,
            func.Type,
            definer
         );
      }

      return sqlString;
   }

   async getRoutines () {
      const { rows: routines } = await this._client.raw(
         `SHOW PROCEDURE STATUS WHERE \`Db\` = '${this.schemaName}';`
      );

      let sqlString = '';

      for (const routine of routines) {
         const definer = this.getEscapedDefiner(routine.Definer);

         sqlString += await this.getRoutineSyntax(
            routine.Name,
            routine.Type,
            definer
         );
      }

      return sqlString;
   }

   async getRoutineSyntax (name: string, type: string, definer: string) {
      const { rows: routines } = await this._client.raw(
         `SHOW CREATE ${type} \`${this.schemaName}\`.\`${name}\``
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

         sqlString += `/*!50003 DROP ${type} IF EXISTS ${name}*/;;\n`;
         sqlString += '/*!50003 SET @OLD_SQL_MODE=@@SQL_MODE*/;;\n';
         sqlString += `/*!50003 SET SQL_MODE="${sqlMode}"*/;;\n`;
         sqlString += 'DELIMITER ;;\n';
         sqlString += `/*!50003 CREATE*/ /*!50020 DEFINER=${definer}*/ /*!50003 ${procedureBody}*/;;\n`;
         sqlString += 'DELIMITER ;\n';
         sqlString += '/*!50003 SET SQL_MODE=@OLD_SQL_MODE*/;\n';
      }

      return sqlString;
   }

   async _queryStream (sql: string) {
      if (process.env.NODE_ENV === 'development') console.log('EXPORTER:', sql);
      const isPool = 'getConnection' in this._client._connection;
      const connection = isPool ? await (this._client._connection as mysql.Pool).getConnection() : this._client._connection;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stream = (connection as any).connection.query(sql).stream();
      const dispose = () => (connection as mysql.PoolConnection).release();

      stream.on('end', dispose);
      stream.on('error', dispose);
      stream.on('close', dispose);
      return stream;
   }

   getEscapedDefiner (definer: string) {
      return definer
         .split('@')
         .map(part => '`' + part + '`')
         .join('@');
   }

   escapeAndQuote (val: string) {
      // eslint-disable-next-line no-control-regex
      const CHARS_TO_ESCAPE = /[\0\b\t\n\r\x1a"'\\]/g;
      const CHARS_ESCAPE_MAP: {[key: string]: string} = {
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
      let chunkIndex = CHARS_TO_ESCAPE.lastIndex = 0;
      let escapedVal = '';
      let match;

      while ((match = CHARS_TO_ESCAPE.exec(val))) {
         escapedVal += val.slice(chunkIndex, match.index) + CHARS_ESCAPE_MAP[match[0]];
         chunkIndex = CHARS_TO_ESCAPE.lastIndex;
      }

      if (chunkIndex === 0)
         return `'${val}'`;

      if (chunkIndex < val.length)
         return `'${escapedVal + val.slice(chunkIndex)}'`;

      return `'${escapedVal}'`;
   }
}
