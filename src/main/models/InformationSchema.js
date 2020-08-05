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

   static async getTableColumns (connection, schema, table) {
      const { rows } = await connection
         .select('*')
         .schema('information_schema')
         .from('COLUMNS')
         .where({ TABLE_SCHEMA: `= '${schema}'`, TABLE_NAME: `= '${table}'` })
         .orderBy({ ORDINAL_POSITION: 'ASC' })
         .run();

      return rows.map(field => {
         return {
            name: field.COLUMN_NAME,
            key: field.COLUMN_KEY.toLowerCase(),
            type: field.DATA_TYPE,
            precision: field.DATETIME_PRECISION
         };
      });
   }
}
