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
}
