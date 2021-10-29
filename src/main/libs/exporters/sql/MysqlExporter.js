import { SqlExporter } from './SqlExporter';
import { BLOB, BIT } from 'common/fieldTypes';
import hexToBinary from 'common/libs/hexToBinary';

export default class MysqlExporter extends SqlExporter {
   async getSqlHeader () {
      let dump = await super.getSqlHeader();
      dump += `


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
SET NAMES utf8mb4;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE='NO_AUTO_VALUE_ON_ZERO', SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;`;

      return dump;
   }

   async getFooter () {
      return `/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;`;
   }

   async getCreateTable (tableName) {
      const { rows } = await this._client.raw(`SHOW CREATE TABLE \`${this.schemaName}\`.\`${tableName}\``);

      if (rows.length !== 1)
         return '';

      return rows[0]['Create Table'] + ';';
   }

   getDropTable (tableName) {
      return `DROP TABLE IF EXISTS \`${tableName}\`;`;
   }

   async getTableInsert (tableName) {
      let rowCount = 0;
      let sqlStr = '';

      const countResults = await this._client.raw(`SELECT COUNT(1) as count FROM \`${this.schemaName}\`.\`${tableName}\``);
      if (countResults.rows.length === 1)
         rowCount = countResults.rows[0].count;

      if (rowCount > 0) {
         const columns = await this._client.getTableColumns({ table: tableName, schema: this.schemaName });
         const columnNames = columns.map(col => '`' + col.name + '`');
         const insertStmt = `INSERT INTO \`${tableName}\` (${columnNames.join(', ')}) VALUES`;

         const tableResult = await this._client.raw(`SELECT ${columnNames.join(', ')} FROM \`${this.schemaName}\`.\`${tableName}\``);

         sqlStr += `LOCK TABLES \`${tableName}\` WRITE;\n`;
         sqlStr += `/*!40000 ALTER TABLE \`${tableName}\` DISABLE KEYS */;`;
         sqlStr += '\n\n';

         sqlStr += insertStmt;
         sqlStr += '\n';

         for (const row of tableResult.rows) {
            sqlStr += '\t(';

            for (const i in columns) {
               const column = columns[i];
               const val = row[column.name];

               if (val === null)
                  sqlStr += 'NULL';

               else if (BIT.includes(column.type))
                  sqlStr += `b'${hexToBinary(Buffer.from(val).toString('hex'))}'`;

               else if (BLOB.includes(column.type))
                  sqlStr += `X'${val.toString('hex').toUpperCase()}'`;

               else if (val === '')
                  sqlStr += '\'\'';

               else
                  sqlStr += typeof val === 'string' ? this.escapeAndQuote(val) : val;

               if (parseInt(i) !== columns.length - 1)
                  sqlStr += ', ';
            }

            sqlStr += '),\n';
         }

         sqlStr += '\n';

         sqlStr += `/*!40000 ALTER TABLE \`${tableName}\` ENABLE KEYS */;\n`;
         sqlStr += 'UNLOCK TABLES;';
      }

      return sqlStr;
   }

   escapeAndQuote (value) {
      if (!value) return null;
      return `'${value.replaceAll(/'/g, '\'\'')}'`;
   }
}
