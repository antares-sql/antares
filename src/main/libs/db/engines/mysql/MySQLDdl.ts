import dataTypes from 'common/data-types/mysql';
import * as antares from 'common/interfaces/antares';

import { DdlGenerator } from '../../core/DdlGenerator';

/**
 * Builds DDL statements. Pure: returns SQL, never executes it.
 */
export class MySQLDdl extends DdlGenerator {
   constructor () {
      super(dataTypes);
   }

   createSchema (params: { name: string; collation: string }): string {
      return `CREATE DATABASE \`${params.name}\` COLLATE ${params.collation}`;
   }

   alterSchema (params: { name: string; collation: string }): string {
      return `ALTER DATABASE \`${params.name}\` COLLATE ${params.collation}`;
   }

   dropSchema (params: { database: string }): string {
      return `DROP DATABASE \`${params.database}\``;
   }

   createTable (params: antares.CreateTableParams): string {
      const {
         schema,
         fields,
         foreigns,
         indexes,
         checks,
         options
      } = params;
      const newColumns: string[] = [];
      const newIndexes: string[] = [];
      const newForeigns: string[] = [];
      const newChecks: string[] = [];

      let sql = `CREATE TABLE \`${schema}\`.\`${options.name}\``;

      // ADD FIELDS
      fields.forEach(field => {
         const typeInfo = this.getTypeInfo(field.type);
         const length = typeInfo.length ? field.enumValues || field.numLength || field.charLength || field.datePrecision : false;

         newColumns.push(`\`${field.name}\` 
            ${field.type.toUpperCase()}${length ? `(${length}${field.numScale ? `,${field.numScale}` : ''})` : ''} 
            ${field.unsigned ? 'UNSIGNED' : ''} 
            ${field.zerofill ? 'ZEROFILL' : ''}
            ${field.nullable ? 'NULL' : 'NOT NULL'}
            ${field.autoIncrement ? 'AUTO_INCREMENT' : ''}
            ${field.default !== null ? `DEFAULT ${field.default || '\'\''}` : ''}
            ${field.comment ? `COMMENT '${field.comment}'` : ''}
            ${field.collation ? `COLLATE ${field.collation}` : ''}
            ${field.onUpdate ? `ON UPDATE ${field.onUpdate}` : ''}`);
      });

      // ADD INDEX
      indexes.forEach(index => {
         const fields = index.fields.map(field => `\`${field}\``).join(',');
         let type = index.type;

         if (type === 'PRIMARY')
            newIndexes.push(`PRIMARY KEY (${fields})`);
         else {
            if (type === 'UNIQUE')
               type = 'UNIQUE INDEX';

            newIndexes.push(`${type} \`${index.name}\` (${fields})`);
         }
      });

      // ADD FOREIGN KEYS
      foreigns.forEach(foreign => {
         newForeigns.push(`CONSTRAINT \`${foreign.constraintName}\` FOREIGN KEY (\`${foreign.field}\`) REFERENCES \`${foreign.refTable}\` (\`${foreign.refField}\`) ON UPDATE ${foreign.onUpdate} ON DELETE ${foreign.onDelete}`);
      });

      // ADD TABLE CHECKS
      checks.forEach(check => {
         if (!check.clause.trim().length) return;
         newChecks.push(`${check.name ? `CONSTRAINT \`${check.name}\` ` : ''}CHECK (${check.clause})`);
      });

      sql = `${sql} (${[...newColumns, ...newIndexes, ...newForeigns, ...newChecks].join(', ')}) COMMENT='${options.comment}', COLLATE='${options.collation}', ENGINE=${options.engine}`;

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
         checkChanges,
         tableStructure,
         options
      } = params;

      const sql = `ALTER TABLE \`${schema}\`.\`${table}\` `;
      const alterOptions: string[] = [];
      const alterColumns: { name: string; clause: string }[] = [];
      const alterKeys: string[] = [];
      const alterDrops: string[] = [];
      const alterQueryes: string[] = [];

      // OPTIONS
      if ('comment' in options) alterOptions.push(`COMMENT='${options.comment}'`);
      if ('engine' in options) alterOptions.push(`ENGINE=${options.engine}`);
      if ('autoIncrement' in options) alterOptions.push(`AUTO_INCREMENT=${+options.autoIncrement}`);
      if ('collation' in options) alterOptions.push(`COLLATE='${options.collation}'`);

      // ADD FIELDS
      additions.forEach(addition => {
         alterColumns.push({
            name: addition.name,
            clause: `ADD COLUMN ${this.columnDefinition(addition, 'add')}${this.columnPosition(addition.after)}`
         });
      });

      // CHANGE FIELDS (only modified or moved columns, see common/libs/tableDiff)
      changes.forEach(change => {
         alterColumns.push({
            name: change.name,
            clause: `CHANGE COLUMN \`${change.orgName}\` ${this.columnDefinition(change, 'change')}${this.columnPosition(change.after)}`
         });
      });

      // Column clauses are applied in the order they are written and AFTER refers to the new names:
      // emitting them in the final column order places every column after an already positioned one
      const finalOrder = (tableStructure?.fields || []).map(field => field.name);
      const position = (name: string) => {
         const i = finalOrder.indexOf(name);
         return i === -1 ? Infinity : i;
      };
      alterColumns.sort((a, b) => position(a.name) - position(b.name));

      // ADD INDEX
      indexChanges.additions.forEach(addition => {
         const fields = addition.fields.map(field => `\`${field}\``).join(',');
         let type = addition.type;

         if (type === 'PRIMARY')
            alterKeys.push(`ADD PRIMARY KEY (${fields})`);
         else {
            if (type === 'UNIQUE')
               type = 'UNIQUE INDEX';

            alterKeys.push(`ADD ${type} \`${addition.name}\` (${fields})`);
         }
      });

      // ADD FOREIGN KEYS
      foreignChanges.additions.forEach(addition => {
         alterKeys.push(`ADD CONSTRAINT \`${addition.constraintName}\` FOREIGN KEY (\`${addition.field}\`) REFERENCES \`${addition.refTable}\` (\`${addition.refField}\`) ON UPDATE ${addition.onUpdate} ON DELETE ${addition.onDelete}`);
      });

      // ADD TABLE CHECKS
      checkChanges.additions.forEach(addition => {
         if (!addition.clause.trim().length) return;
         alterKeys.push(`ADD ${addition.name ? `CONSTRAINT \`${addition.name}\` ` : ''}CHECK (${addition.clause})`);
      });

      // CHANGE INDEX
      indexChanges.changes.forEach(change => {
         if (change.oldType === 'PRIMARY')
            alterKeys.push('DROP PRIMARY KEY');
         else
            alterKeys.push(`DROP INDEX \`${change.oldName}\``);

         const fields = change.fields.map(field => `\`${field}\``).join(',');
         let type = change.type;

         if (type === 'PRIMARY')
            alterKeys.push(`ADD PRIMARY KEY (${fields})`);
         else {
            if (type === 'UNIQUE')
               type = 'UNIQUE INDEX';

            alterKeys.push(`ADD ${type} \`${change.name}\` (${fields})`);
         }
      });

      // CHANGE FOREIGN KEYS
      foreignChanges.changes.forEach(change => {
         alterKeys.push(`DROP FOREIGN KEY \`${change.oldName}\``);
         alterKeys.push(`ADD CONSTRAINT \`${change.constraintName}\` FOREIGN KEY (\`${change.field}\`) REFERENCES \`${change.refTable}\` (\`${change.refField}\`) ON UPDATE ${change.onUpdate} ON DELETE ${change.onDelete}`);
      });

      // CHANGE CHECK TABLE
      checkChanges.changes.forEach(change => {
         if (!change.clause.trim().length) return;
         alterQueryes.push(`${sql} DROP CONSTRAINT \`${change.name}\``);
         alterQueryes.push(`${sql} ADD ${change.name ? `CONSTRAINT \`${change.name}\` ` : ''}CHECK (${change.clause})`);
      });

      // DROP FIELDS
      deletions.forEach(deletion => {
         alterDrops.push(`DROP COLUMN \`${deletion.name}\``);
      });

      // DROP INDEX
      indexChanges.deletions.forEach(deletion => {
         if (deletion.type === 'PRIMARY')
            alterDrops.push('DROP PRIMARY KEY');
         else
            alterDrops.push(`DROP INDEX \`${deletion.name}\``);
      });

      // DROP FOREIGN KEYS
      foreignChanges.deletions.forEach(deletion => {
         alterDrops.push(`DROP FOREIGN KEY \`${deletion.constraintName}\``);
      });

      // DROP CHECK TABLE
      checkChanges.deletions.forEach(deletion => {
         alterQueryes.push(`${sql} DROP CONSTRAINT \`${deletion.name}\``);
      });

      // A single statement for options, columns and keys: at most one table rebuild
      const alterMain = [...alterOptions, ...alterColumns.map(column => column.clause), ...alterKeys];
      if (alterMain.length) alterQueryes.push(sql+alterMain.join(', '));
      if (alterDrops.length) alterQueryes.push(sql+alterDrops.join(', '));

      // RENAME
      if (options.name) alterQueryes.push(`RENAME TABLE \`${schema}\`.\`${table}\` TO \`${schema}\`.\`${options.name}\``);

      return alterQueryes.join(';');
   }

   private columnDefinition (field: antares.TableField, mode: 'add' | 'change'): string {
      const typeInfo = this.getTypeInfo(field.type);
      const length = typeInfo.length ? field.enumValues || field.numLength || field.charLength || field.datePrecision : false;
      const collation = field.collation ? `COLLATE ${field.collation}` : '';
      const defaultValue = field.default !== null ? `DEFAULT ${field.default || '\'\''}` : '';
      const comment = field.comment ? `COMMENT '${field.comment}'` : '';
      // CHANGE COLUMN redefines the column: repeat its CHECK (or it is dropped), following a rename
      const check = mode === 'change' && field.check
         ? `\n            CHECK (${field.orgName && field.orgName !== field.name
            ? field.check.replaceAll(`\`${field.orgName}\``, `\`${field.name}\``)
            : field.check})`
         : '';

      return `\`${field.name}\` 
            ${field.type.toUpperCase()}${length ? `(${length}${field.numScale ? `,${field.numScale}` : ''})` : ''} 
            ${field.unsigned ? 'UNSIGNED' : ''} 
            ${field.zerofill ? 'ZEROFILL' : ''}
            ${field.nullable ? 'NULL' : 'NOT NULL'}
            ${field.autoIncrement ? 'AUTO_INCREMENT' : ''}
            ${mode === 'add' ? `${defaultValue}\n            ${comment}\n            ${collation}` : `${collation}\n            ${defaultValue}\n            ${comment}`}
            ${field.onUpdate ? `ON UPDATE ${field.onUpdate}` : ''}${check}`.trimEnd();
   }

   /** `undefined` keeps the current position, `false` means FIRST */
   private columnPosition (after: string | false | undefined): string {
      if (after === undefined) return '';
      return after ? `\n            AFTER \`${after}\`` : '\n            FIRST';
   }

   duplicateTable (params: { schema: string; table: string }): string {
      const sql = `CREATE TABLE \`${params.schema}\`.\`${params.table}_copy\` LIKE \`${params.schema}\`.\`${params.table}\``;
      return sql;
   }

   truncateTable (params: { schema: string; table: string; force: boolean }): string {
      let sql = `TRUNCATE TABLE \`${params.schema}\`.\`${params.table}\`;`;
      if (params.force) {
         sql = `
            SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
            ${sql}
            SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1);
         `;
      }
      return sql;
   }

   dropTable (params: { schema: string; table: string }): string {
      const sql = `DROP TABLE \`${params.schema}\`.\`${params.table}\``;
      return sql;
   }

   dropView (params: { schema: string; view: string }): string {
      const sql = `DROP VIEW \`${params.schema}\`.\`${params.view}\``;
      return sql;
   }

   alterView ({ view }: { view: antares.AlterViewParams }): string {
      let sql = `
         USE \`${view.schema}\`; 
         ALTER ALGORITHM = ${view.algorithm}${view.definer ? ` DEFINER=${view.definer}` : ''} 
         SQL SECURITY ${view.security} 
         VIEW \`${view.schema}\`.\`${view.oldName}\` AS ${view.sql} ${view.updateOption ? `WITH ${view.updateOption} CHECK OPTION` : ''}
      `;

      if (view.name !== view.oldName)
         sql += `; RENAME TABLE \`${view.schema}\`.\`${view.oldName}\` TO \`${view.schema}\`.\`${view.name}\``;

      return sql;
   }

   createView (params: antares.CreateViewParams): string {
      const sql = `CREATE ALGORITHM = ${params.algorithm} ${params.definer ? `DEFINER=${params.definer} ` : ''}SQL SECURITY ${params.security} VIEW \`${params.schema}\`.\`${params.name}\` AS ${params.sql} ${params.updateOption ? `WITH ${params.updateOption} CHECK OPTION` : ''}`;
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

   dropRoutine (params: { schema: string; routine: string }): string {
      const sql = `DROP PROCEDURE \`${params.schema}\`.\`${params.routine}\``;
      return sql;
   }

   createRoutine (params: antares.CreateRoutineParams): string {
      const parameters = 'parameters' in params
         ? params.parameters.reduce((acc: string[], curr) => {
            acc.push(`${curr.context} \`${curr.name}\` ${curr.type}${curr.length ? `(${curr.length})` : ''}`);
            return acc;
         }, []).join(',')
         : '';

      const sql = `CREATE ${params.definer ? `DEFINER=${params.definer} ` : ''}PROCEDURE \`${params.schema}\`.\`${params.name}\`(${parameters})
         LANGUAGE SQL
         ${params.deterministic ? 'DETERMINISTIC' : 'NOT DETERMINISTIC'}
         ${params.dataAccess}
         SQL SECURITY ${params.security}
         COMMENT '${params.comment}'
         ${params.sql}`;

      return sql;
   }

   dropFunction (params: { schema: string; func: string }): string {
      const sql = `DROP FUNCTION \`${params.schema}\`.\`${params.func}\``;
      return sql;
   }

   createFunction (params: antares.CreateFunctionParams): string {
      const parameters = 'parameters' in params
         ? params.parameters.reduce((acc: string[], curr) => {
            acc.push(`\`${curr.name}\` ${curr.type}${curr.length ? `(${curr.length})` : ''}`);
            return acc;
         }, []).join(',')
         : '';

      const body = params.returns ? params.sql : 'BEGIN\n  RETURN 0;\nEND';

      const sql = `CREATE ${params.definer ? `DEFINER=${params.definer} ` : ''}FUNCTION \`${params.schema}\`.\`${params.name}\`(${parameters}) RETURNS ${params.returns || 'SMALLINT'}${params.returnsLength ? `(${params.returnsLength})` : ''}
         LANGUAGE SQL
         ${params.deterministic ? 'DETERMINISTIC' : 'NOT DETERMINISTIC'}
         ${params.dataAccess}
         SQL SECURITY ${params.security}
         COMMENT '${params.comment}'
         ${body}`;

      return sql;
   }

   dropEvent (params: { schema: string; scheduler: string }): string {
      const sql = `DROP EVENT \`${params.schema}\`.\`${params.scheduler}\``;
      return sql;
   }

   alterEvent ({ scheduler }: { scheduler: antares.AlterEventParams }): string {
      if (scheduler.execution === 'EVERY' && scheduler.every[0].includes('-'))
         scheduler.every[0] = `'${scheduler.every[0]}'`;

      const sql = `ALTER ${scheduler.definer ? ` DEFINER=${scheduler.definer}` : ''} EVENT \`${scheduler.schema}\`.\`${scheduler.oldName}\` 
      ON SCHEDULE
         ${scheduler.execution === 'EVERY'
      ? `EVERY ${scheduler.every.join(' ')}${scheduler.starts ? ` STARTS '${scheduler.starts}'` : ''}${scheduler.ends ? ` ENDS '${scheduler.ends}'` : ''}`
      : `AT '${scheduler.at}'`}
      ON COMPLETION${!scheduler.preserve ? ' NOT' : ''} PRESERVE
      ${scheduler.name !== scheduler.oldName ? `RENAME TO \`${scheduler.schema}\`.\`${scheduler.name}\`` : ''}
      ${scheduler.state}
      COMMENT '${scheduler.comment}'
      DO ${scheduler.sql}`;

      return sql;
   }

   createEvent (params: antares.CreateEventParams): string {
      const sql = `CREATE ${params.definer ? ` DEFINER=${params.definer}` : ''} EVENT \`${params.schema}\`.\`${params.name}\` 
      ON SCHEDULE
         ${params.execution === 'EVERY'
      ? `EVERY ${params.every.join(' ')}${params.starts ? ` STARTS '${params.starts}'` : ''}${params.ends ? ` ENDS '${params.ends}'` : ''}`
      : `AT '${params.at}'`}
      ON COMPLETION${!params.preserve ? ' NOT' : ''} PRESERVE
      ${params.state}
      COMMENT '${params.comment}'
      DO ${params.sql}`;

      return sql;
   }

   enableEvent ({ schema, scheduler }: { schema: string; scheduler: string }): string {
      const sql = `ALTER EVENT \`${schema}\`.\`${scheduler}\` ENABLE`;
      return sql;
   }

   disableEvent ({ schema, scheduler }: { schema: string; scheduler: string }): string {
      const sql = `ALTER EVENT \`${schema}\`.\`${scheduler}\` DISABLE`;
      return sql;
   }

   killProcess (id: number): string {
      return `KILL ${id}`;
   }
}
