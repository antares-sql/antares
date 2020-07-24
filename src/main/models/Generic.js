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
}
