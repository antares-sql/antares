'use strict';

export default class {
   static testConnection (connection) {
      return connection('TABLES')
         .select({ result: 1 })
         .withSchema('information_schema');
   }

   static getStructure (connection) {
      return connection('TABLES')
         .select('*')
         .withSchema('information_schema')
         .orderBy(['TABLE_SCHEMA', 'TABLE_NAME'], 'asc');
   }
}
