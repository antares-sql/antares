'use strict';
import { sqlEscaper } from 'common/libs/sqlEscaper';
export default class {
   static async getTableData (connection, schema, table) {
      return connection
         .select('*')
         .schema(schema)
         .from(table)
         .limit(1000)
         .run();
   }

   static async updateTableCell (connection, params) {
      let escapedParam;
      switch (params.type) {
         case 'int':
         case 'tinyint':
         case 'smallint':
         case 'mediumint':
         case 'bigint':
            escapedParam = params.content;
            break;
         case 'char':
         case 'varchar':
         case 'text':
         case 'mediumtext':
         case 'longtext':
            escapedParam = `"${sqlEscaper(params.content)}"`;
            break;
         default:
            escapedParam = `"${sqlEscaper(params.content)}"`;
            break;
      }
      return connection
         .update({ [params.field]: `= ${escapedParam}` })
         .schema(params.schema)
         .from(params.table)
         .where({ [params.primary]: `= ${params.id}` })
         .run();
   }

   static async deleteTableRows (connection, params) {
      return connection
         .schema(params.schema)
         .delete(params.table)
         .where({ [params.primary]: `IN (${params.rows.join(',')})` })
         .run();
   }
}
