'use strict';
export default class {
   static async raw (connection, query, database) {
      if (database) await connection.raw(`USE \`${database}\``);
      return connection.raw(query);
   }
}
