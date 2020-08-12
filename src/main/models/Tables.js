'use strict';
import { sqlEscaper } from 'common/libs/sqlEscaper';
import { TEXT, LONG_TEXT, NUMBER, BLOB } from 'common/fieldTypes';
import fs from 'fs';

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
      let reload = false;

      if (NUMBER.includes(params.type))
         escapedParam = params.content;
      else if ([...TEXT, ...LONG_TEXT].includes(params.type))
         escapedParam = `"${sqlEscaper(params.content)}"`;
      else if (BLOB.includes(params.type)) {
         if (params.content) {
            const fileBlob = fs.readFileSync(params.content);
            escapedParam = `0x${fileBlob.toString('hex')}`;
            reload = true;
         }
         else
            escapedParam = '""';
      }
      else
         escapedParam = `"${sqlEscaper(params.content)}"`;

      await connection
         .update({ [params.field]: `= ${escapedParam}` })
         .schema(params.schema)
         .from(params.table)
         .where({ [params.primary]: `= ${params.id}` })
         .run();

      return { reload };
   }

   static async deleteTableRows (connection, params) {
      return connection
         .schema(params.schema)
         .delete(params.table)
         .where({ [params.primary]: `IN (${params.rows.join(',')})` })
         .run();
   }

   static async insertTableRows (connection, params) { // Prepare every field like updateTableCell method
      for (let i = 0; i < params.repeat; i++) {
         await connection
            .schema(params.schema)
            .into(params.table)
            .insert(params.row)
            .run();
      }
   }
}
