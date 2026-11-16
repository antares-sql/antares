import dataTypes from 'common/data-types/sqlite';
import * as antares from 'common/interfaces/antares';

import { DdlGenerator } from '../../core/DdlGenerator';

/**
 * Builds DDL statements. Pure: returns SQL, never executes it.
 */
export class SQLiteDdl extends DdlGenerator {
   constructor () {
      super(dataTypes);
   }

   createTable (params: antares.CreateTableParams): string {
      const {
         schema,
         fields,
         foreigns,
         indexes,
         options
      } = params;
      const newColumns: string[] = [];
      const newIndexes: string[] = [];
      const manageIndexes: string[] = [];
      const newForeigns: string[] = [];

      let sql = `CREATE TABLE "${schema}"."${options.name}"`;

      // ADD FIELDS
      fields.forEach(field => {
         const typeInfo = this.getTypeInfo(field.type);
         const length = typeInfo?.length
            ? field.enumValues ||
              field.numLength ||
              field.numPrecision ||
              field.charLength ||
              field.datePrecision
            : false;

         newColumns.push(`"${field.name}" 
            ${field.type.toUpperCase()}${length ? `(${length})` : ''} 
            ${field.unsigned ? 'UNSIGNED' : ''} 
            ${field.nullable ? 'NULL' : 'NOT NULL'}
            ${field.autoIncrement ? 'AUTO_INCREMENT' : ''}
            ${field.default !== null ? `DEFAULT ${field.default || '\'\''}` : ''}
            ${field.onUpdate ? `ON UPDATE ${field.onUpdate}` : ''}`);
      });

      // ADD INDEX
      indexes.forEach(index => {
         const fields = index.fields.map(field => `"${field}"`).join(',');
         const type = index.type;

         if (type === 'PRIMARY')
            newIndexes.push(`PRIMARY KEY (${fields})`);
         else
            manageIndexes.push(`CREATE ${type === 'UNIQUE' ? type : ''} INDEX "${index.name}" ON "${options.name}" (${fields})`);
      });

      // ADD FOREIGN KEYS
      foreigns.forEach(foreign => {
         newForeigns.push(`CONSTRAINT "${foreign.constraintName}" FOREIGN KEY ("${foreign.field}") REFERENCES "${foreign.refTable}" ("${foreign.refField}") ON UPDATE ${foreign.onUpdate} ON DELETE ${foreign.onDelete}`);
      });

      sql = `${sql} (${[...newColumns, ...newIndexes, ...newForeigns].join(', ')})`;
      if (manageIndexes.length) sql = `${sql}; ${manageIndexes.join(';')}`;

      return sql;
   }

   duplicateTable (params: { schema: string; table: string }): string {
      const sql = `CREATE TABLE "${params.schema}"."${params.table}_copy" AS SELECT * FROM "${params.schema}"."${params.table}"`;
      return sql;
   }

   truncateTable (params: { schema: string; table: string }): string {
      const sql = `DELETE FROM "${params.schema}"."${params.table}"`;
      return sql;
   }

   dropTable (params: { schema: string; table: string }): string {
      const sql = `DROP TABLE "${params.schema}"."${params.table}"`;
      return sql;
   }

   dropView (params: { schema: string; view: string }): string {
      const sql = `DROP VIEW "${params.schema}"."${params.view}"`;
      return sql;
   }

   createView (params: antares.CreateViewParams): string {
      const sql = `CREATE VIEW "${params.schema}"."${params.name}" AS ${params.sql}`;
      return sql;
   }

   dropTrigger (params: { schema: string; trigger: string }): string {
      const sql = `DROP TRIGGER \`${params.schema}\`.\`${params.trigger}\``;
      return sql;
   }

   createTrigger (params: antares.CreateTriggerParams): string {
      const sql = `CREATE ${params.definer ? `DEFINER=${params.definer} ` : ''}TRIGGER \`${params.schema}\`.\`${params.name}\` ${params.activation} ${params.event} ON \`${params.table}\` FOR EACH ROW ${params.sql}`;
      return sql;
   }
}
