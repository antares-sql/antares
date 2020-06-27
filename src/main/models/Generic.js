'use strict';
export default class {
   static async raw (connection, query, schema) {
      if (schema) {
         try {
            await connection.use(schema);
         }
         catch (err) {
            return err;
         }
      }
      return connection.raw(query);
   }

   static async getTableData (connection, schema, table) {
      return connection
         .select('*')
         .schema(schema)
         .from(table)
         .limit(1000)
         .run();
   }

   static async updateTableCell (connection, params) { // TODO: Handle different field types
      return connection
         .update({ [params.field]: `= "${params.content}"` })
         .schema(params.schema)
         .from(params.table)
         .where({ [params.primary]: `= ${params.id}` })
         .run();
   }
}
