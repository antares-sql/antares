'use strict';
export default class {
   static async raw (connection, query, schema) {
      if (schema) await connection.raw(`USE \`${schema}\``);
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
}
