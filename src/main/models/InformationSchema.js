'use strict';
export default class {
   static testConnection (connection) {
      return connection.select('1+1').run();
   }

   static getStructure (connection) {
      return connection
         .select('*')
         .schema('information_schema')
         .from('TABLES')
         .orderBy({ TABLE_SCHEMA: 'ASC', TABLE_NAME: 'ASC' })
         .run();
   }

   static getTableColumns (connection, schema, table) {
      return connection
         .select('*')
         .schema('information_schema')
         .from('COLUMNS')
         .where({ TABLE_SCHEMA: `= '${schema}'`, TABLE_NAME: `= '${table}'` })
         .orderBy({ ORDINAL_POSITION: 'ASC' })
         .run();
   }
}
