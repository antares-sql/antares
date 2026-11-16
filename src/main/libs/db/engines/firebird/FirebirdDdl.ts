import dataTypes from 'common/data-types/firebird';
import * as antares from 'common/interfaces/antares';

import { DdlGenerator } from '../../core/DdlGenerator';

/**
 * Builds DDL statements. Pure: returns SQL, never executes it.
 */
export class FirebirdDdl extends DdlGenerator {
   constructor () {
      super(dataTypes);
   }

   createTable (params: antares.CreateTableParams): string {
      const {
         fields,
         foreigns,
         indexes,
         options
      } = params;
      const newColumns: string[] = [];
      const newIndexes: string[] = [];
      const newForeigns: string[] = [];

      let sql = `CREATE TABLE "${options.name}"`;

      // ADD FIELDS
      fields.forEach(field => {
         const typeInfo = this.getTypeInfo(field.type);
         const length = typeInfo?.length ? field.enumValues || field.numLength || field.charLength || field.datePrecision : false;

         newColumns.push(`"${field.name}" 
            ${field.type.toUpperCase()}${length ? `(${length})` : ''} 
            ${field.default !== null ? `DEFAULT ${field.default || '\'\''}` : ''}
            ${field.nullable ? '' : 'NOT NULL'}`);
      });

      // ADD INDEX
      indexes.forEach(index => {
         const fields = index.fields.map(field => `"${field}"`).join(',');
         const type = index.type;

         newIndexes.push(`CONSTRAINT "${index.name}" ${type === 'PRIMARY' ? 'PRIMARY KEY' : type} (${fields})`);
      });

      // ADD FOREIGN KEYS
      foreigns.forEach(foreign => {
         newForeigns.push(`
            ADD CONSTRAINT "${foreign.constraintName}" 
            FOREIGN KEY ("${foreign.field}") REFERENCES "${foreign.refTable}" ("${foreign.refField}") 
            ${foreign.onUpdate !== 'RESTRICT' ? `ON UPDATE ${foreign.onUpdate}` : ''}
            ${foreign.onDelete !== 'RESTRICT' ? `ON DELETE ${foreign.onDelete}` : ''}
         `);
      });

      sql = `${sql} (${[...newColumns, ...newIndexes].join(', ')})`;

      if (newForeigns.length)
         sql = `${sql}; ALTER TABLE "${options.name}" ${newForeigns.join(';')}`;

      return sql;
   }

   alterTable (params: antares.AlterTableParams): string {
      const {
         table,
         additions,
         deletions,
         changes,
         indexChanges,
         foreignChanges
      } = params;

      let sql = `ALTER TABLE "${table}" `;
      const alterColumns: string[] = [];
      const newForeigns: string[] = [];

      // OPTIONS
      // if ('comment' in options) alterColumns.push(`COMMENT='${options.comment}'`);
      // if ('engine' in options) alterColumns.push(`ENGINE=${options.engine}`);
      // if ('autoIncrement' in options) alterColumns.push(`AUTO_INCREMENT=${+options.autoIncrement}`);
      // if ('collation' in options) alterColumns.push(`COLLATE='${options.collation}'`);

      // ADD FIELDS
      additions.forEach(addition => {
         const typeInfo = this.getTypeInfo(addition.type);
         const length = typeInfo.length ? addition.enumValues || addition.numLength || addition.charLength || addition.datePrecision : false;

         alterColumns.push(`ADD "${addition.name}" 
            ${addition.type.toUpperCase()}${length ? `(${length})` : ''} 
            ${addition.default !== null ? `DEFAULT ${addition.default || '\'\''}` : ''}
            ${addition.nullable ? '' : 'NOT NULL'}`);
      });

      // ADD INDEX
      indexChanges.additions.forEach(addition => {
         const fields = addition.fields.map(field => `"${field}"`).join(',');
         const type = addition.type;

         alterColumns.push(`ADD CONSTRAINT "${addition.name}" ${type === 'PRIMARY' ? 'PRIMARY KEY' : type} (${fields})`);
      });

      // ADD FOREIGN KEYS
      foreignChanges.additions.forEach(foreign => {
         newForeigns.push(`
            ADD CONSTRAINT "${foreign.constraintName}" 
            FOREIGN KEY ("${foreign.field}") REFERENCES "${foreign.refTable}" ("${foreign.refField}") 
            ${foreign.onUpdate !== 'RESTRICT' ? `ON UPDATE ${foreign.onUpdate}` : ''}
            ${foreign.onDelete !== 'RESTRICT' ? `ON DELETE ${foreign.onDelete}` : ''}
         `);
      });

      // CHANGE FIELDS
      changes.forEach(change => {
         const typeInfo = this.getTypeInfo(change.type);
         const length = typeInfo.length ? change.enumValues || change.numLength || change.charLength || change.datePrecision : false;

         if (change.orgName !== change.name)
            alterColumns.push(`ALTER COLUMN "${change.orgName}" TO "${change.name}"`);

         alterColumns.push(`ALTER COLUMN "${change.name}" TYPE ${change.type.toUpperCase()}${length ? `(${length}${change.numScale ? `,${change.numScale}` : ''})` : ''}`);

         if (change.default !== null)
            alterColumns.push(`ALTER COLUMN "${change.name}" SET DEFAULT ${change.default || '\'\''}`);

         alterColumns.push(`ALTER COLUMN "${change.name}" ${!change.nullable ? 'SET ' : 'DROP '} NOT NULL`);
         // TODO: position
      });

      // CHANGE INDEX
      indexChanges.changes.forEach(change => {
         alterColumns.push(`DROP CONSTRAINT "${change.oldName}"`);
         const fields = change.fields.map(field => `"${field}"`).join(',');
         const type = change.type;

         alterColumns.push(`ADD CONSTRAINT "${change.name}" ${type === 'PRIMARY' ? 'PRIMARY KEY' : type} (${fields})`);
      });

      // CHANGE FOREIGN KEYS
      foreignChanges.changes.forEach(change => {
         alterColumns.push(`DROP CONSTRAINT "${change.oldName}"`);
         alterColumns.push(`
            ADD CONSTRAINT "${change.constraintName}" 
            FOREIGN KEY ("${change.field}") REFERENCES "${change.refTable}" ("${change.refField}") 
            ${change.onUpdate !== 'RESTRICT' ? `ON UPDATE ${change.onUpdate}` : ''}
            ${change.onDelete !== 'RESTRICT' ? `ON DELETE ${change.onDelete}` : ''}
         `);
      });

      // DROP FIELDS
      deletions.forEach(deletion => {
         alterColumns.push(`DROP "${deletion.name}"`);
      });

      // DROP INDEX
      indexChanges.deletions.forEach(deletion => {
         alterColumns.push(`DROP CONSTRAINT "${deletion.name}"`);
      });

      // DROP FOREIGN KEYS
      foreignChanges.deletions.forEach(deletion => {
         alterColumns.push(`DROP CONSTRAINT "${deletion.constraintName}"`);
      });

      if (alterColumns.length)
         sql += alterColumns.join(', ');

      if (newForeigns.length)
         sql = `${sql}; ALTER TABLE "${table}" ${newForeigns.join(';')}`;

      return sql;
   }

   truncateTable (params: { schema: string; table: string }): string {
      const sql = `DELETE FROM "${params.table}"`;
      return sql;
   }

   dropTable (params: { schema: string; table: string }): string {
      const sql = `DROP TABLE "${params.table}"`;
      return sql;
   }

   dropView (params: { schema: string; view: string }): string {
      const sql = `DROP VIEW "${params.view}"`;
      return sql;
   }

   createView (params: antares.CreateViewParams): string {
      const sql = `CREATE VIEW "${params.name}" AS ${params.sql}`;
      return sql;
   }

   dropTrigger (params: { schema: string; trigger: string }): string {
      const sql = `DROP TRIGGER  "${params.trigger}"`;
      return sql;
   }

   createTrigger (params: antares.CreateTriggerParams): string {
      const eventsString = Array.isArray(params.event) ? params.event.join(' OR ') : params.event;

      const sql = `
         CREATE TRIGGER "${params.name}" FOR "${params.table}"
         ${params.activation} ${eventsString}
         AS ${params.sql}
      `;
      return sql;
   }

   dropRoutine (params: { routine: string }): string {
      const sql = `DROP PROCEDURE "${params.routine}"`;
      return sql;
   }

   createRoutine (params: antares.CreateRoutineParams): string {
      const inParams = 'parameters' in params
         ? params.parameters
            .filter(param => param.context === 'IN')
            .reduce((acc: string[], curr) => {
               acc.push(`"${curr.name}" ${curr.type}${curr.length ? `(${curr.length})` : ''}`);
               return acc;
            }, []).join(',')
         : '';

      const ourParams = 'parameters' in params
         ? params.parameters
            .filter(param => param.context === 'OUT')
            .reduce((acc: string[], curr) => {
               acc.push(`"${curr.name}" ${curr.type}${curr.length ? `(${curr.length})` : ''}`);
               return acc;
            }, []).join(',')
         : '';

      const sql = `
         CREATE PROCEDURE "${params.name}"(${inParams})
         ${ourParams ? `RETURNS (${ourParams})` : ''}
         SQL SECURITY ${params.security}
         AS 
            ${params.sql}
         `;

      return sql;
   }
}
