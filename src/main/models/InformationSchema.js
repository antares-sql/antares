'use strict';

export default class {
   static getStructure (connection) {
      return connection()
         .select('*')
         .withSchema('information_schema')
         .from('TABLES')
         .orderBy(['TABLE_SCHEMA', 'TABLE_NAME'], 'asc');
   }
}
