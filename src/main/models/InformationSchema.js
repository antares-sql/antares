'use strict';
export default class {
   static testConnection (connection) {
      return connection.select('1+1').run();
   }

   static getStructure (connection) {
      // return connection.raw('SELECT * FROM information_schema.TABLES ORDER BY TABLE_SCHEMA ASC, TABLE_NAME ASC');
      return connection
         .select('*')
         .schema('information_schema')
         .from('TABLES')
         .orderBy({ TABLE_SCHEMA: 'ASC', TABLE_NAME: 'ASC' })
         .run();
   }

   // TODO: SELECT * FROM `information_schema`.`COLUMNS` WHERE TABLE_SCHEMA='fepcomdb' AND TABLE_NAME='macchine' ORDER BY ORDINAL_POSITION;
}
