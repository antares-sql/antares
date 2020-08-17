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
            numPrecision: field.NUMERIC_PRECISION,
            datePrecision: field.DATETIME_PRECISION,
            charLength: field.CHARACTER_MAXIMUM_LENGTH,
            isNullable: field.IS_NULLABLE,
            default: field.COLUMN_DEFAULT,
            charset: field.CHARACTER_SET_NAME,
            collation: field.COLLATION_NAME,
            autoIncrement: field.EXTRA.includes('auto_increment')
         };
      });
   }

   static async getKeyUsage (connection, schema, table) {
      const { rows } = await connection
         .select('*')
         .schema('information_schema')
         .from('KEY_COLUMN_USAGE')
         .where({ TABLE_SCHEMA: `= '${schema}'`, TABLE_NAME: `= '${table}'`, REFERENCED_TABLE_NAME: 'IS NOT NULL' })
         .run();

      return rows.map(field => {
         return {
            schema: field.TABLE_SCHEMA,
            table: field.TABLE_NAME,
            column: field.COLUMN_NAME,
            position: field.ORDINAL_POSITION,
            constraintPosition: field.POSITION_IN_UNIQUE_CONSTRAINT,
            constraintName: field.CONSTRAINT_NAME,
            refSchema: field.REFERENCED_TABLE_SCHEMA,
            refTable: field.REFERENCED_TABLE_NAME,
            refColumn: field.REFERENCED_COLUMN_NAME
         };
      });
   }
}
