'use strict';
export default class {
   static testConnection (connection) {
      return connection.raw('SELECT 1+1');
   }

   static getStructure (connection) {
      return connection.raw('SELECT * FROM information_schema.TABLES ORDER BY TABLE_SCHEMA, TABLE_NAME ASC');
   }
}
