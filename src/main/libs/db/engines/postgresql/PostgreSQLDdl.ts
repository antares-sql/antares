import dataTypes from 'common/data-types/postgresql';
import * as antares from 'common/interfaces/antares';

import { DdlGenerator } from '../../core/DdlGenerator';

/**
 * Builds DDL statements. Pure: returns SQL, never executes it.
 */
export class PostgreSQLDdl extends DdlGenerator {
   constructor () {
      super(dataTypes);
   }

   createSchema (params: {name: string}): string {
      return `CREATE SCHEMA "${params.name}"`;
   }

   dropSchema (params: { database: string }): string {
      return `DROP SCHEMA "${params.database}" CASCADE`;
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
      const modifyComment: string[] = [];

      let sql = `CREATE TABLE "${schema}"."${options.name}"`;

      // ADD FIELDS
      fields.forEach(field => {
         const typeInfo = this.getTypeInfo(field.type);
         const length = typeInfo.length ? field.enumValues || field.numLength || field.charLength || field.datePrecision : false;

         newColumns.push(`"${field.name}" 
            ${field.type.toUpperCase()}${length ? `(${length}${field.numScale !== null ? `,${field.numScale}` : ''})` : ''} 
            ${field.unsigned ? 'UNSIGNED' : ''} 
            ${field.zerofill ? 'ZEROFILL' : ''}
            ${field.nullable ? 'NULL' : 'NOT NULL'}
            ${field.default !== null ? `DEFAULT ${field.default || '\'\''}` : ''}
            ${field.onUpdate ? `ON UPDATE ${field.onUpdate}` : ''}`);
         if (field.comment != null)
            modifyComment.push(`COMMENT ON COLUMN "${schema}"."${options.name}"."${field.name}" IS '${field.comment}'`);
      });

      // ADD INDEX
      indexes.forEach(index => {
         const fields = index.fields.map(field => `${field}`).join(',');
         const type = index.type;

         if (type === 'PRIMARY')
            newIndexes.push(`PRIMARY KEY (${fields})`);
         else if (type === 'UNIQUE')
            newIndexes.push(`CONSTRAINT "${index.name}" UNIQUE (${fields})`);
         else
            manageIndexes.push(`CREATE INDEX "${index.name}" ON "${schema}"."${options.name}" (${fields})`);
      });

      // ADD FOREIGN KEYS
      foreigns.forEach(foreign => {
         newForeigns.push(`CONSTRAINT "${foreign.constraintName}" FOREIGN KEY ("${foreign.field}") REFERENCES "${schema}"."${foreign.refTable}" ("${foreign.refField}") ON UPDATE ${foreign.onUpdate} ON DELETE ${foreign.onDelete}`);
      });

      sql = `${sql} (${[...newColumns, ...newIndexes, ...newForeigns].join(', ')}); `;
      if (manageIndexes.length) sql = `${sql} ${manageIndexes.join(';')}; `;
      // TABLE COMMENT
      if (options.comment != null) sql = `${sql} COMMENT ON TABLE "${schema}"."${options.name}" IS '${options.comment}'; `;
      // FIELDS COMMENT
      if (modifyComment.length) sql = `${sql} ${modifyComment.join(';')}; `;

      return sql;
   }

   alterTable (params: antares.AlterTableParams): string {
      const {
         table,
         schema,
         additions,
         deletions,
         changes,
         indexChanges,
         foreignChanges,
         options
      } = params;

      let sql = '';
      const alterColumns: string[] = [];
      const renameColumns: string[] = [];
      const createSequences: string[] = [];
      const manageIndexes: string[] = [];
      const modifyComment: string[] = [];

      // ADD FIELDS
      additions.forEach(addition => {
         const typeInfo = this.getTypeInfo(addition.type);
         const length = typeInfo.length ? addition.numLength || addition.charLength || addition.datePrecision : false;

         alterColumns.push(`ADD COLUMN "${addition.name}" 
            ${addition.type.toUpperCase()}${length ? `(${length}${addition.numScale !== null ? `,${addition.numScale}` : ''})` : ''}${addition.isArray ? '[]' : ''} 
            ${addition.unsigned ? 'UNSIGNED' : ''} 
            ${addition.zerofill ? 'ZEROFILL' : ''}
            ${addition.nullable ? 'NULL' : 'NOT NULL'}
            ${addition.default !== null ? `DEFAULT ${addition.default || '\'\''}` : ''}
            ${addition.onUpdate ? `ON UPDATE ${addition.onUpdate}` : ''}`);
         if (addition.comment != null)
            modifyComment.push(`COMMENT ON COLUMN "${schema}"."${table}"."${addition.name}" IS '${addition.comment}'`);
      });

      // ADD INDEX
      indexChanges.additions.forEach(addition => {
         const fields = addition.fields.map(field => `"${field}"`).join(',');
         const type = addition.type;

         if (type === 'PRIMARY')
            alterColumns.push(`ADD PRIMARY KEY (${fields})`);
         else if (type === 'UNIQUE')
            alterColumns.push(`ADD CONSTRAINT "${addition.name}" UNIQUE (${fields})`);
         else
            manageIndexes.push(`CREATE INDEX "${addition.name}" ON "${schema}"."${table}" (${fields})`);
      });

      // ADD FOREIGN KEYS
      foreignChanges.additions.forEach(addition => {
         alterColumns.push(`ADD CONSTRAINT "${addition.constraintName}" FOREIGN KEY ("${addition.field}") REFERENCES "${schema}"."${addition.refTable}" (${addition.refField}) ON UPDATE ${addition.onUpdate} ON DELETE ${addition.onDelete}`);
      });

      // CHANGE FIELDS
      changes.forEach(change => {
         const typeInfo = this.getTypeInfo(change.type);
         const length = typeInfo.length ? change.numLength || change.charLength || change.datePrecision : false;
         let localType;

         switch (change.type) {
            case 'SERIAL':
               localType = 'integer';
               break;
            case 'SMALLSERIAL':
               localType = 'smallint';
               break;
            case 'BIGSERIAL':
               localType = 'bigint';
               break;
            default:
               localType = change.type.toLowerCase();
         }

         alterColumns.push(`ALTER COLUMN "${change.name}" TYPE ${localType}${length ? `(${length}${change.numScale ? `,${change.numScale}` : ''})` : ''}${change.isArray ? '[]' : ''} USING "${change.name}"::${localType}`);
         alterColumns.push(`ALTER COLUMN "${change.name}" ${change.nullable ? 'DROP NOT NULL' : 'SET NOT NULL'}`);
         alterColumns.push(`ALTER COLUMN "${change.name}" ${change.default !== null ? `SET DEFAULT ${change.default || '\'\''}` : 'DROP DEFAULT'}`);

         if (['SERIAL', 'SMALLSERIAL', 'BIGSERIAL'].includes(change.type)) {
            const sequenceName = `${table}_${change.name}_seq`.replace(' ', '_');
            createSequences.push(`CREATE SEQUENCE IF NOT EXISTS ${sequenceName} OWNED BY "${table}"."${change.name}"`);
            alterColumns.push(`ALTER COLUMN "${change.name}" SET DEFAULT nextval('${sequenceName}')`);
         }

         if (change.orgName !== change.name)
            renameColumns.push(`ALTER TABLE "${schema}"."${table}" RENAME COLUMN "${change.orgName}" TO "${change.name}"`);
         if (change.comment != null)
            modifyComment.push(`COMMENT ON COLUMN "${schema}"."${table}"."${change.name}" IS '${change.comment}'`);
      });

      // CHANGE INDEX
      indexChanges.changes.forEach(change => {
         if (['PRIMARY', 'UNIQUE'].includes(change.oldType))
            alterColumns.push(`DROP CONSTRAINT ${change.oldName}`);
         else
            manageIndexes.push(`DROP INDEX ${change.oldName}`);

         const fields = change.fields.map(field => `"${field}"`).join(',');
         const type = change.type;

         if (type === 'PRIMARY')
            alterColumns.push(`ADD PRIMARY KEY (${fields})`);
         else if (type === 'UNIQUE')
            alterColumns.push(`ADD CONSTRAINT "${change.name}" UNIQUE (${fields})`);
         else
            manageIndexes.push(`CREATE INDEX "${change.name}" ON "${schema}"."${table}" (${fields})`);
      });

      // CHANGE FOREIGN KEYS
      foreignChanges.changes.forEach(change => {
         alterColumns.push(`DROP CONSTRAINT "${change.oldName}"`);
         alterColumns.push(`ADD CONSTRAINT "${change.constraintName}" FOREIGN KEY (${change.field}) REFERENCES "${schema}"."${change.refTable}" ("${change.refField}") ON UPDATE ${change.onUpdate} ON DELETE ${change.onDelete}`);
      });

      // DROP FIELDS
      deletions.forEach(deletion => {
         alterColumns.push(`DROP COLUMN "${deletion.name}"`);
      });

      // DROP INDEX
      indexChanges.deletions.forEach(deletion => {
         if (['PRIMARY', 'UNIQUE'].includes(deletion.type))
            alterColumns.push(`DROP CONSTRAINT "${deletion.name}"`);
         else
            manageIndexes.push(`DROP INDEX "${deletion.name}"`);
      });

      // DROP FOREIGN KEYS
      foreignChanges.deletions.forEach(deletion => {
         alterColumns.push(`DROP CONSTRAINT "${deletion.constraintName}"`);
      });

      if (alterColumns.length) sql += `ALTER TABLE "${schema}"."${table}" ${alterColumns.join(', ')}; `;
      if (createSequences.length) sql = `${createSequences.join(';')}; ${sql}`;
      if (manageIndexes.length) sql = `${manageIndexes.join(';')}; ${sql}`;
      // TABLE COMMENT
      if (options.comment != null) sql = `${sql} COMMENT ON TABLE "${schema}"."${table}" IS '${options.comment}'; `;
      // FIELDS COMMENT
      if (modifyComment.length) sql = `${sql} ${modifyComment.join(';')}; `;
      if (options.name) sql += `ALTER TABLE "${schema}"."${table}" RENAME TO "${options.name}"; `;
      // RENAME
      if (renameColumns.length) sql = `${renameColumns.join(';')}; ${sql}`;

      return sql;
   }

   duplicateTable (params: { schema: string; table: string }): string {
      const sql = `CREATE TABLE "${params.schema}"."${params.table}_copy" (LIKE "${params.schema}"."${params.table}" INCLUDING ALL)`;
      return sql;
   }

   truncateTable (params: { schema: string; table: string }): string {
      const sql = `TRUNCATE TABLE "${params.schema}"."${params.table}"`;
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

   dropMaterializedView (params: { schema: string; view: string }): string {
      const sql = `DROP MATERIALIZED VIEW "${params.schema}"."${params.view}"`;
      return sql;
   }

   alterView ({ view }: { view: antares.AlterViewParams }): string {
      let sql = `CREATE OR REPLACE VIEW "${view.schema}"."${view.oldName}" AS ${view.sql}`;

      if (view.name !== view.oldName)
         sql += `; ALTER VIEW "${view.schema}"."${view.oldName}" RENAME TO "${view.name}"`;

      return sql;
   }

   createView (params: antares.CreateViewParams): string {
      const sql = `CREATE VIEW "${params.schema}"."${params.name}" AS ${params.sql}`;
      return sql;
   }

   createMaterializedView (params: antares.CreateViewParams): string {
      const sql = `CREATE MATERIALIZED VIEW "${params.schema}"."${params.name}" AS ${params.sql}`;
      return sql;
   }

   dropTrigger (params: { schema: string; trigger: string }): string {
      const triggerParts = params.trigger.split('.');
      const sql = `DROP TRIGGER "${triggerParts[1]}" ON "${params.schema}"."${triggerParts[0]}"`;
      return sql;
   }

   createTrigger (params: antares.CreateTriggerParams): string {
      const eventsString = Array.isArray(params.event) ? params.event.join(' OR ') : params.event;
      const sql = `CREATE TRIGGER "${params.name}" ${params.activation} ${eventsString} ON "${params.schema}"."${params.table}" FOR EACH ROW ${params.sql}`;
      return sql;
   }

   enableTrigger ({ schema, trigger }: { schema: string; trigger: string }): string {
      const [table, triggerName] = trigger.split('.');
      const sql = `ALTER TABLE "${schema}"."${table}" ENABLE TRIGGER "${triggerName}"`;
      return sql;
   }

   disableTrigger ({ schema, trigger }: { schema: string; trigger: string }): string {
      const [table, triggerName] = trigger.split('.');
      const sql = `ALTER TABLE "${schema}"."${table}" DISABLE TRIGGER "${triggerName}"`;
      return sql;
   }

   dropRoutine (params: { schema: string; routine: string }): string {
      const sql = `DROP PROCEDURE "${params.schema}"."${params.routine}"`;
      return sql;
   }

   createRoutine (routine: antares.CreateRoutineParams): string {
      const parameters = 'parameters' in routine
         ? routine.parameters.reduce((acc, curr) => {
            acc.push(`${curr.context} ${curr.name} ${curr.type}`);
            return acc;
         }, []).join(',')
         : '';

      const sql = `CREATE PROCEDURE "${routine.schema}"."${routine.name}"(${parameters})
         LANGUAGE ${routine.language}
         SECURITY ${routine.security}
         AS ${routine.sql}`;

      return sql;
   }

   dropFunction (params: { schema: string; func: string }): string {
      const sql = `DROP FUNCTION "${params.schema}"."${params.func}"`;
      return sql;
   }

   createFunction (func: antares.CreateFunctionParams): string {
      const parameters = 'parameters' in func
         ? func.parameters.reduce((acc, curr) => {
            acc.push(`${curr.context} ${curr.name || ''} ${curr.type}`);
            return acc;
         }, []).join(',')
         : '';

      const body = func.returns ? func.sql : '$function$\n$function$';

      const sql = `CREATE FUNCTION "${func.schema}"."${func.name}" (${parameters})
         RETURNS ${func.returns || 'void'}
         LANGUAGE ${func.language}
         SECURITY ${func.security}
         AS ${body}`;

      return sql;
   }

   alterTriggerFunction ({ func }: { func: antares.CreateFunctionParams}): string {
      const body = func.returns ? func.sql : '$function$\n$function$';

      const sql = `CREATE OR REPLACE FUNCTION "${func.schema}"."${func.name}" ()
         RETURNS TRIGGER
         LANGUAGE ${func.language}
         AS ${body}`;

      return sql;
   }

   createTriggerFunction (func: antares.CreateFunctionParams): string {
      const body = func.returns ? func.sql : '$function$\r\nBEGIN\r\n\r\nEND\r\n$function$';

      const sql = `CREATE FUNCTION "${func.schema}"."${func.name}" ()
         RETURNS TRIGGER
         LANGUAGE ${func.language}
         AS ${body}`;

      return sql;
   }

   killProcess (id: number): string {
      return `SELECT pg_terminate_backend(${id})`;
   }
}
