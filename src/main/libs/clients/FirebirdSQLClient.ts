import dataTypes from 'common/data-types/firebird';
import { FLOAT, NUMBER } from 'common/fieldTypes';
import * as antares from 'common/interfaces/antares';
import * as firebird from 'node-firebird';
import * as path from 'path';

import { BaseClient } from './BaseClient';

export class FirebirdSQLClient extends BaseClient {
   private _schema?: string;
   private _runningConnections: Map<string, number>;
   private _connectionsToCommit: Map<string, firebird.Transaction>;
   protected _connection?: firebird.Database | firebird.ConnectionPool;
   _params: firebird.Options;

   private _types: Record<number, string> ={
      452: 'CHAR', // Array of char
      448: 'VARCHAR',
      500: 'SMALLINT',
      496: 'INTEGER',
      482: 'FLOAT',
      480: 'DOUBLE',
      530: 'DOUBLE PRECISION',
      510: 'TIMESTAMP',
      520: 'BLOB',
      540: 'VARCHAR', // ARRAY ???
      550: 'QUAD',
      560: 'TIME',
      570: 'DATE',
      580: 'BIGINT',
      32764: 'BOOLEAN', // >= 3.0
      32766: 'NULL' // >= 2.5
   }

   constructor (args: antares.ClientParams) {
      super(args);

      this._schema = null;
      this._connectionsToCommit = new Map();
   }

   private _getType (type: string, subType?: number) {
      let fieldType = type.trim();

      if ([...NUMBER, ...FLOAT].includes(fieldType)) {
         if (subType === 1)
            fieldType = 'NUMERIC';
         else if (subType === 2)
            fieldType = 'DECIMAL';
      }

      if (fieldType === 'BLOB') {
         if (subType === 1)
            fieldType = 'BLOB-TEXT';
      }

      if (fieldType === 'CHAR') {
         if (subType === 1)
            fieldType = 'CHAR-BINARY';
      }

      return fieldType;
   }

   getTypeInfo (type: string): antares.TypeInformations {
      return dataTypes
         .reduce((acc, group) => [...acc, ...group.types], [])
         .filter(_type => _type.name === type.toUpperCase())[0];
   }

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   protected _reducer (acc: string[], curr: any) {
      const type = typeof curr;

      switch (type) {
         case 'number':
         case 'string':
            return [...acc, curr];
         case 'object':
            if (Array.isArray(curr))
               return [...acc, ...curr];
            else {
               const clausoles = [];
               for (const key in curr)
                  clausoles.push(`"${key}" ${curr[key]}`);

               return clausoles;
            }
      }
   }

   async connect () {
      if (!this._poolSize)
         this._connection = await this.getConnection();
      else
         this._connection = this.getConnectionPool();
   }

   async getConnection () {
      return new Promise<firebird.Database>((resolve, reject) => {
         firebird.attach({ ...this._params, blobAsText: true }, (err, db) => {
            if (err) reject(err);
            else resolve(db);
         });
      });
   }

   getConnectionPool () {
      return firebird.pool(this._poolSize, { ...this._params, blobAsText: true });
   }

   ping () {
      return this.raw('SELECT rdb$get_context(\'SYSTEM\', \'DB_NAME\') FROM rdb$database');
   }

   destroy () {
      if (this._poolSize)
         return (this._connection as firebird.ConnectionPool).destroy();
   }

   use (): void {
      return null;
   }

   getDatabases (): null[] {
      return [];
   }

   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   async getStructure (_schemas: Set<string>) {
      interface TableResult {
         FORMAT: number;
         NAME: string;
         TYPE: string;
         DESCRIPTION: string | null;
      }

      interface TriggersResult {
         NAME: string;
         RELATION: string;
         SOURCE: string;
      }

      interface ProcedureResult {
         NAME: string;
         COMMENT: string;
         DEFINER: string;
         SOURCE: string;
      }

      const { rows: databases } = await this.raw<antares.QueryResult<{ NAME: string}>>('SELECT rdb$get_context(\'SYSTEM\', \'DB_NAME\') as name FROM rdb$database');

      const filteredDatabases = databases.map(db => {
         return { name: path.basename(db.NAME) };
      });

      const tablesArr: TableResult[] = [];
      const triggersArr: TriggersResult[] = [];
      const proceduresArr: ProcedureResult[] = [];
      let schemaSize = 0;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const _db of filteredDatabases) {
         // if (!schemas.has(db.name)) continue;

         const { rows: tables } = await this.raw<antares.QueryResult<TableResult>>(`
            SELECT 
               rdb$relation_name AS NAME,
               rdb$format AS FORMAT,
               rdb$description AS DESCRIPTION,
               'table' AS TYPE
            FROM RDB$RELATIONS a
            WHERE COALESCE(RDB$SYSTEM_FLAG, 0) = 0 
            AND RDB$RELATION_TYPE = 0         
         `);

         const { rows: views } = await this.raw<antares.QueryResult<TableResult>>(`
            SELECT 
               DISTINCT RDB$VIEW_NAME AS NAME,
               'view' AS TYPE
            FROM RDB$VIEW_RELATIONS    
         `);

         tablesArr.push(...tables, ...views);

         const { rows: triggers } = await this.raw<antares.QueryResult<TriggersResult>>(`
            SELECT
               RDB$TRIGGER_NAME as NAME,
               RDB$RELATION_NAME as RELATION,
               RDB$TRIGGER_SOURCE as SOURCE
            FROM RDB$TRIGGERS
            WHERE RDB$SYSTEM_FLAG=0
            ORDER BY RDB$TRIGGER_NAME;
         `);

         triggersArr.push(...triggers);

         const { rows: procedures } = await this.raw(`
            SELECT 
               RDB$PROCEDURE_NAME AS NAME, 
               RDB$DESCRIPTION AS COMMENT, 
               RDB$PROCEDURE_SOURCE AS SOURCE, 
               RDB$OWNER_NAME AS DEFINER
               FROM RDB$PROCEDURES 
            WHERE RDB$SYSTEM_FLAG=0
            ORDER BY RDB$PROCEDURE_NAME;
         `);

         proceduresArr.push(...procedures);
      }

      return filteredDatabases.map(db => {
         // TABLES
         const remappedTables = tablesArr.map(table => {
            const tableSize = 0;
            schemaSize += tableSize;

            return {
               name: table.NAME?.trim(),
               type: table.TYPE?.trim(),
               rows: false,
               size: false
            };
         });

         // TRIGGERS
         const remappedTriggers = triggersArr.map(trigger => {
            return {
               name: trigger.NAME?.trim(),
               table: trigger.RELATION?.trim(),
               statement: trigger.SOURCE
            };
         });

         // PROCEDURES
         const remappedProcedures = proceduresArr.map(procedure => {
            return {
               name: procedure.NAME?.trim(),
               definer: procedure.DEFINER,
               comment: procedure.COMMENT?.trim()
            };
         });

         return {
            name: db.name,
            size: schemaSize,
            tables: remappedTables,
            functions: [] as null[],
            procedures: remappedProcedures,
            triggers: remappedTriggers,
            schedulers: [] as null[]
         };
      });
   }

   async getTableColumns ({ schema, table }: { schema: string; table: string }) {
      interface TableColumnsResult {
         DESCRIPTION?: string;
         FIELD_NAME: string;
         FIELD_TYPE: string;
         FIELD_POSITION: number;
         NOT_NULL: 0 | 1;
         DEFAULT_VALUE: Buffer;
         DEFAULT_SOURCE: string;
         FIELD_LENGTH: number;
         FIELD_PRECISION: number;
         FIELD_SCALE: number;
         EXTERNAL_TYPE: number;
         SUBTYPE: number;
         COLLATION?: string;
         CHARSET: string;
      }

      /*
      FIELD_SUB_TYPE

      BLOB
         0 - untyped
         1 - text
         2 - BLR
         3 - access control list
         4 - reserved for future use
         5 - encoded table metadata description
         6 - for storing the details of a cross-database transaction that ends abnormally
      CHAR
         0 - untyped data
         1 - fixed binary data
      NUMERIC FIELD
         0 or NULL - the data type matches the value in the RDB$FIELD_TYPE field
         1 - NUMERIC
         2 - DECIMAL
      */

      const { rows: fields } = await this.raw<antares.QueryResult<TableColumnsResult>>(`
         SELECT 
            r.RDB$FIELD_NAME AS FIELD_NAME,
            r.RDB$DESCRIPTION AS DESCRIPTION,
            r.RDB$DEFAULT_VALUE AS DEFAULT_VALUE,
            r.RDB$NULL_FLAG AS NOT_NULL,
            r.RDB$FIELD_POSITION AS FIELD_POSITION,
            f.RDB$FIELD_LENGTH AS FIELD_LENGTH,
            f.RDB$FIELD_PRECISION AS FIELD_PRECISION,
            f.RDB$FIELD_SCALE AS FIELD_SCALE,
            f.RDB$EXTERNAL_TYPE AS EXTERNAL_TYPE,
            r.RDB$DEFAULT_SOURCE AS DEFAULT_SOURCE,
            CASE f.RDB$FIELD_TYPE
               WHEN 261 THEN 'BLOB'
               WHEN 14 THEN 'CHAR'
               WHEN 40 THEN 'CSTRING'
               WHEN 11 THEN 'D_FLOAT'
               WHEN 27 THEN 'DOUBLE PRECISION'
               WHEN 10 THEN 'FLOAT'
               WHEN 16 THEN 'BIGINT'
               WHEN 8 THEN 'INTEGER'
               WHEN 9 THEN 'QUAD'
               WHEN 7 THEN 'SMALLINT'
               WHEN 12 THEN 'DATE'
               WHEN 13 THEN 'TIME'
               WHEN 35 THEN 'TIMESTAMP'
               WHEN 37 THEN 'VARCHAR'
               ELSE 'UNKNOWN'
            END AS FIELD_TYPE,
            f.RDB$FIELD_SUB_TYPE AS SUBTYPE,
            -- coll.RDB$COLLATION_NAME AS COLLATION,
            cset.RDB$CHARACTER_SET_NAME AS CHARSET
         FROM RDB$RELATION_FIELDS r
         LEFT JOIN RDB$FIELDS f ON r.RDB$FIELD_SOURCE = f.RDB$FIELD_NAME
         -- LEFT JOIN RDB$COLLATIONS coll ON f.RDB$COLLATION_ID = coll.RDB$COLLATION_ID
         LEFT JOIN RDB$CHARACTER_SETS cset ON f.RDB$CHARACTER_SET_ID = cset.RDB$CHARACTER_SET_ID
         WHERE r.RDB$RELATION_NAME='${table}'
         ORDER BY r.RDB$FIELD_POSITION;
      `);

      return fields.map(field => {
         const defaultValue = field.DEFAULT_SOURCE ? field.DEFAULT_SOURCE.replace('DEFAULT ', '') : null;
         const fieldType = this._getType(field.FIELD_TYPE, field.SUBTYPE);

         return {
            name: field.FIELD_NAME.trim(),
            key: null as null,
            type: fieldType,
            schema: schema,
            table: table,
            numPrecision: field.FIELD_PRECISION ? field.FIELD_PRECISION : null,
            numScale: Math.abs(field.FIELD_SCALE),
            datePrecision: field.FIELD_NAME.trim() === 'TIMESTAMP' ? 4 : null,
            charLength: ![...NUMBER, ...FLOAT].includes(fieldType) ? field.FIELD_LENGTH : null,
            nullable: !field.NOT_NULL,
            unsigned: null as null,
            zerofill: null as null,
            order: field.FIELD_POSITION+1,
            default: defaultValue,
            charset: field.CHARSET,
            collation: null as null,
            autoIncrement: false,
            onUpdate: null as null,
            comment: field.DESCRIPTION?.trim()
         };
      });
   }

   async getTableApproximateCount ({ table }: { schema: string; table: string }): Promise<number> {
      const { rows } = await this.raw(`SELECT COUNT(*) AS nRows FROM "${table}"`);

      return rows.length ? rows[0].NROWS : 0;
   }

   async getTableOptions ({ table }: { table: string }) {
      return { name: table };
   }

   async getTableIndexes ({ table }: { schema: string; table: string }) {
      interface ShowIndexesResult {
         INDEX_NAME: string;
         FIELD_NAME: string;
         TABLE_NAME: string;
         INDEX_TYPE: string;
         INDEX_UNIQUE: number;
      }

      const remappedIndexes = [];

      const { rows: indexes } = await this.raw<antares.QueryResult<ShowIndexesResult>>(`
         SELECT
            ix.rdb$index_name AS INDEX_NAME,
            sg.rdb$field_name AS FIELD_NAME,
            rc.rdb$relation_name AS TABLE_NAME,
            rc.rdb$constraint_type AS INDEX_TYPE,
            ix.RDB$UNIQUE_FLAG AS INDEX_UNIQUE
         FROM
            rdb$indices ix
            LEFT JOIN rdb$index_segments sg ON ix.rdb$index_name = sg.rdb$index_name
            LEFT JOIN rdb$relation_constraints rc ON rc.rdb$index_name = ix.rdb$index_name
         WHERE
            rc.rdb$relation_name = '${table}'
      `);

      for (const index of indexes) {
         remappedIndexes.push({
            name: index.INDEX_NAME.trim(),
            column: index.FIELD_NAME.trim(),
            indexType: null as never,
            type: index.INDEX_TYPE.trim() === 'PRIMARY KEY' ? 'PRIMARY' : index.INDEX_TYPE.trim(),
            cardinality: null as never,
            comment: '',
            indexComment: ''
         });
      }

      return remappedIndexes;
   }

   async getKeyUsage ({ schema, table }: { schema: string; table: string }) {
      /* eslint-disable camelcase */
      interface KeyResult {
         PKTABLE_NAME: string;
         PKCOLUMN_NAME: string;
         FKTABLE_NAME: string;
         FKCOLUMN_NAME: string;
         KEY_SEQ: number;
         UPDATE_RULE: string;
         DELETE_RULE: string;
         PK_NAME: string;
         FK_NAME: string;
      }
      /* eslint-enable camelcase */

      const { rows } = await this.raw<antares.QueryResult<KeyResult>>(`
         SELECT 
            PK.RDB$RELATION_NAME as PKTABLE_NAME,
            ISP.RDB$FIELD_NAME as PKCOLUMN_NAME,
            FK.RDB$RELATION_NAME as FKTABLE_NAME,
            ISF.RDB$FIELD_NAME as FKCOLUMN_NAME,
            (ISP.RDB$FIELD_POSITION + 1) as KEY_SEQ,
            RC.RDB$UPDATE_RULE as UPDATE_RULE,
            RC.RDB$DELETE_RULE as DELETE_RULE,
            PK.RDB$CONSTRAINT_NAME as PK_NAME,
            FK.RDB$CONSTRAINT_NAME as FK_NAME
         FROM
            RDB$RELATION_CONSTRAINTS PK,
            RDB$RELATION_CONSTRAINTS FK,
            RDB$REF_CONSTRAINTS RC,
            RDB$INDEX_SEGMENTS ISP,
            RDB$INDEX_SEGMENTS ISF
         WHERE FK.RDB$RELATION_NAME = '${table}' 
            and FK.RDB$CONSTRAINT_NAME = RC.RDB$CONSTRAINT_NAME 
            and PK.RDB$CONSTRAINT_NAME = RC.RDB$CONST_NAME_UQ 
            and ISP.RDB$INDEX_NAME = PK.RDB$INDEX_NAME 
            and ISF.RDB$INDEX_NAME = FK.RDB$INDEX_NAME 
            and ISP.RDB$FIELD_POSITION = ISF.RDB$FIELD_POSITION 
         ORDER BY 1, 5 
      `);

      return rows.map(field => {
         return {
            schema: schema,
            table: table,
            field: field.FKCOLUMN_NAME.trim(),
            position: field.KEY_SEQ,
            constraintPosition: null as null,
            constraintName: field.FK_NAME.trim(),
            refSchema: schema,
            refTable: field.PKTABLE_NAME.trim(),
            refField: field.PKCOLUMN_NAME.trim(),
            onUpdate: field.UPDATE_RULE.trim(),
            onDelete: field.DELETE_RULE.trim()
         };
      });
   }

   async getUsers (): Promise<void> {
      return null;
   }

   async createTable (params: antares.CreateTableParams) {
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

      return await this.raw(sql);
   }

   async alterTable (params: antares.AlterTableParams) {
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

      return await this.raw(sql);
   }

   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   async duplicateTable (params: { schema: string; table: string }) { // TODO: retrive table informations and create a copy
      // const sql = `CREATE TABLE "${params.table}_copy" AS SELECT * FROM "${params.table}"`;
      // return await this.raw(sql);
   }

   async truncateTable (params: { schema: string; table: string }) {
      const sql = `DELETE FROM "${params.table}"`;
      return await this.raw(sql);
   }

   async dropTable (params: { schema: string; table: string }) {
      const sql = `DROP TABLE "${params.table}"`;
      return await this.raw(sql);
   }

   async getViewInformations ({ view }: { schema: string; view: string }) {
      const sql = `
         SELECT rdb$view_source as sql
         FROM rdb$relations
         WHERE rdb$relation_name = '${view}'
      `;
      const results = await this.raw(sql);

      return results.rows.map(row => {
         return {
            sql: row.SQL,
            name: view
         };
      })[0];
   }

   async dropView (params: { schema: string; view: string }) {
      const sql = `DROP VIEW "${params.view}"`;
      return await this.raw(sql);
   }

   async alterView ({ view }: { view: antares.AlterViewParams }) {
      try {
         await this.dropView({ schema: view.schema, view: view.oldName });
         await this.createView(view);
      }
      catch (err) {
         return Promise.reject(err);
      }
   }

   async createView (params: antares.CreateViewParams) {
      const sql = `CREATE VIEW "${params.name}" AS ${params.sql}`;
      return await this.raw(sql);
   }

   async getTriggerInformations ({ trigger }: { schema: string; trigger: string }) {
      const sql = `
         SELECT
            RDB$TRIGGER_NAME as name,
            RDB$RELATION_NAME as relation,
            RDB$TRIGGER_SOURCE as sql,
            RDB$TRIGGER_TYPE as type
         FROM RDB$TRIGGERS
         WHERE RDB$SYSTEM_FLAG=0
         AND RDB$TRIGGER_NAME = '${trigger}';
      `;
      const results = await this.raw(sql);

      const eventsMap = new Map([
         [1, ['INSERT']],
         [2, ['INSERT']],
         [3, ['UPDATE']],
         [4, ['UPDATE']],
         [5, ['DELETE']],
         [6, ['DELETE']],
         [17, ['INSERT', 'UPDATE']],
         [18, ['INSERT', 'UPDATE']],
         [25, ['INSERT', 'DELETE']],
         [26, ['INSERT', 'DELETE']],
         [27, ['UPDATE', 'DELETE']],
         [28, ['UPDATE', 'DELETE']],
         [113, ['INSERT', 'UPDATE', 'DELETE']],
         [114, ['INSERT', 'UPDATE', 'DELETE']]
      ]);

      return results.rows.map(row => {
         return {
            sql: row.SQL.match(/(BEGIN|begin)(.*)(END|end)/gs)[0],
            name: trigger,
            table: row.RELATION.trim(),
            activation: row.TYPE%2 ? 'BEFORE' : 'AFTER',
            event: eventsMap.get(row.TYPE)
         };
      })[0];
   }

   async dropTrigger (params: { schema: string; trigger: string }) {
      const sql = `DROP TRIGGER  "${params.trigger}"`;
      return await this.raw(sql);
   }

   async alterTrigger ({ trigger } : {trigger: antares.AlterTriggerParams}) {
      const tempTrigger = Object.assign({}, trigger);
      tempTrigger.name = `Antares_${tempTrigger.name}_tmp`;

      try {
         await this.createTrigger(tempTrigger);
         await this.dropTrigger({ schema: trigger.schema, trigger: tempTrigger.name });
         await this.dropTrigger({ schema: trigger.schema, trigger: trigger.oldName });
         await this.createTrigger(trigger);
      }
      catch (err) {
         return Promise.reject(err);
      }
   }

   async createTrigger (params: antares.CreateTriggerParams) {
      const eventsString = Array.isArray(params.event) ? params.event.join(' OR ') : params.event;

      const sql = `
         CREATE TRIGGER "${params.name}" FOR "${params.table}"
         ${params.activation} ${eventsString}
         AS ${params.sql}
      `;
      return await this.raw(sql, { split: false });
   }

   async getRoutineInformations ({ routine }: { schema: string; routine: string }) {
      interface ProcedureResult {
         NAME: string;
         COMMENT: string;
         DEFINER: string;
         SOURCE: string;
         SECURITY: boolean;
      }

      interface ProcedureParamsResult {
         PARAMETER_NAME: string;
         FIELD_TYPE: string;
         FIELD_LENGTH: string;
         FIELD_PRECISION: string;
         FIELD_SCALE: string;
         CONTEXT: string;
      }

      const { rows: [procedure] } = await this.raw<antares.QueryResult<ProcedureResult>>(`
         SELECT 
            RDB$PROCEDURE_NAME AS NAME, 
            RDB$DESCRIPTION AS COMMENT, 
            RDB$PROCEDURE_SOURCE AS SOURCE, 
            RDB$OWNER_NAME AS DEFINER,
            RDB$SQL_SECURITY AS SECURITY
         FROM RDB$PROCEDURES 
         WHERE RDB$SYSTEM_FLAG = 0
         AND RDB$PROCEDURE_NAME = '${routine}';
      `);

      if (procedure) {
         const { rows: parameters } = await this.raw<antares.QueryResult<ProcedureParamsResult>>(`
            SELECT 
               p.RDB$PARAMETER_NAME AS PARAMETER_NAME,
               p.RDB$PARAMETER_TYPE AS CONTEXT,
               CASE f.RDB$FIELD_TYPE
                  WHEN 261 THEN 'BLOB'
                  WHEN 14 THEN 'CHAR'
                  WHEN 40 THEN 'CSTRING'
                  WHEN 11 THEN 'D_FLOAT'
                  WHEN 27 THEN 'DOUBLE PRECISION'
                  WHEN 10 THEN 'FLOAT'
                  WHEN 16 THEN 'BIGINT'
                  WHEN 8 THEN 'INTEGER'
                  WHEN 9 THEN 'QUAD'
                  WHEN 7 THEN 'SMALLINT'
                  WHEN 12 THEN 'DATE'
                  WHEN 13 THEN 'TIME'
                  WHEN 35 THEN 'TIMESTAMP'
                  WHEN 37 THEN 'VARCHAR'
                  ELSE 'UNKNOWN'
               END AS FIELD_TYPE,
               f.RDB$FIELD_LENGTH AS FIELD_LENGTH,
               f.RDB$FIELD_PRECISION AS FIELD_PRECISION,
               f.RDB$FIELD_SCALE AS FIELD_SCALE
            FROM RDB$PROCEDURE_PARAMETERS p
            JOIN RDB$FIELDS f ON f.RDB$FIELD_NAME = p.RDB$FIELD_SOURCE
            WHERE p.RDB$SYSTEM_FLAG = 0
            AND RDB$PROCEDURE_NAME = '${routine}'
            ORDER BY p.RDB$PARAMETER_TYPE, p.RDB$PARAMETER_NUMBER
         `);

         const remappedParams = parameters.map(param => {
            const length = this.getTypeInfo(param.FIELD_TYPE.trim()).length ? param.FIELD_LENGTH || param.FIELD_PRECISION : null;
            return {
               name: param.PARAMETER_NAME.trim(),
               type: param.FIELD_TYPE.trim(),
               length: length,
               context: param.CONTEXT ? 'OUT' : 'IN'
            };
         });

         return {
            definer: procedure.DEFINER,
            sql: procedure.SOURCE,
            parameters: remappedParams || [],
            name: procedure.NAME.trim(),
            comment: '',
            security: procedure.SECURITY === false ? 'INVOKER' : 'DEFINER',
            deterministic: false,
            dataAccess: 'CONTAINS SQL'
         };
      }
      else {
         return {
            definer: null,
            sql: '',
            parameters: [],
            name: routine,
            comment: '',
            security: 'DEFINER',
            deterministic: false,
            dataAccess: 'CONTAINS SQL'
         };
      }
   }

   async dropRoutine (params: { routine: string }) {
      const sql = `DROP PROCEDURE "${params.routine}"`;
      return await this.raw(sql);
   }

   async alterRoutine ({ routine }: {routine: antares.AlterRoutineParams}) {
      const tempProcedure = Object.assign({}, routine);
      tempProcedure.name = `Antares_${tempProcedure.name}_tmp`;

      try {
         await this.createRoutine(tempProcedure);
         await this.dropRoutine({ routine: tempProcedure.name });
         await this.dropRoutine({ routine: routine.oldName });
         await this.createRoutine(routine);
      }
      catch (err) {
         return Promise.reject(err);
      }
   }

   async createRoutine (params: antares.CreateRoutineParams) {
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

      return await this.raw(sql, { split: false });
   }

   async getEngines () {
      return {
         name: 'Firebird',
         support: 'YES',
         comment: '',
         isDefault: true
      };
   }

   async getVersion () {
      const sql = `
         SELECT 
            rdb$get_context('SYSTEM', 'ENGINE_VERSION') as version,
            rdb$get_context('SYSTEM', 'NETWORK_PROTOCOL') as protocol,
            RDB$GET_CONTEXT('SYSTEM', 'CLIENT_ADDRESS') AS address
         FROM rdb$database`;
      const { rows } = await this.raw(sql);

      return {
         number: rows[0].VERSION,
         name: 'Firebird SQL',
         arch: rows[0].PROTOCOL,
         os: rows[0].ADDRESS
      };
   }

   async getProcesses (): Promise<void> {
      return null;
   }

   async killProcess (): Promise<void> {
      return null;
   }

   async commitTab (tabUid: string) {
      const connection = this._connectionsToCommit.get(tabUid);
      if (connection) {
         connection.commit();
         return this.destroyConnectionToCommit(tabUid);
      }
   }

   async rollbackTab (tabUid: string) {
      const connection = this._connectionsToCommit.get(tabUid);
      if (connection) {
         connection.rollback();
         return this.destroyConnectionToCommit(tabUid);
      }
   }

   destroyConnectionToCommit (tabUid: string) {
      this._connectionsToCommit.delete(tabUid);
   }

   getSQL () {
      // LIMIT
      const limitRaw = this._query.limit ? ` FIRST ${this._query.limit}` : '';

      // OFFSET
      const offsetRaw = this._query.offset ? ` SKIP ${this._query.offset}` : '';

      // SELECT
      const selectArray = this._query.select.reduce(this._reducer, []);
      let selectRaw = '';

      if (selectArray.length)
         selectRaw = selectArray.length ? `SELECT${limitRaw||''}${offsetRaw||''} ${selectArray.join(', ')} ` : `SELECT${limitRaw||''}${offsetRaw||''} * `;

      // FROM
      let fromRaw = '';

      if (!this._query.update.length && !Object.keys(this._query.insert).length && !!this._query.from)
         fromRaw = 'FROM';
      else if (Object.keys(this._query.insert).length)
         fromRaw = 'INTO';

      fromRaw += this._query.from ? ` "${this._query.from}" ` : '';

      // WHERE
      const whereArray = this._query.where
         .reduce(this._reducer, [])
         ?.map(clausole => clausole.replace('= null', 'IS NULL'));
      const whereRaw = whereArray.length ? `WHERE ${whereArray.join(' AND ')} ` : '';

      // UPDATE
      const updateArray = this._query.update.reduce(this._reducer, []);
      const updateRaw = updateArray.length ? `SET ${updateArray.join(', ')} ` : '';

      // INSERT
      let insertRaw = '';

      if (this._query.insert.length) {
         const fieldsList = Object.keys(this._query.insert[0]).map(col => '"' + col + '"');
         const rowsList = this._query.insert.map(el => `(${Object.values(el).join(', ')})`);

         insertRaw = `(${fieldsList.join(', ')}) VALUES ${rowsList.join(', ')} `;
      }

      // GROUP BY
      const groupByArray = this._query.groupBy.reduce(this._reducer, []);
      const groupByRaw = groupByArray.length ? `GROUP BY ${groupByArray.join(', ')} ` : '';

      // ORDER BY
      const orderByArray = this._query.orderBy.reduce(this._reducer, []);
      const orderByRaw = orderByArray.length ? `ORDER BY ${orderByArray.join(', ')} ` : '';

      return `${selectRaw}${updateRaw ? `UPDATE${' '+limitRaw||''}` : ''}${insertRaw ? 'INSERT ' : ''}${this._query.delete ? 'DELETE ' : ''}${fromRaw}${updateRaw}${whereRaw}${groupByRaw}${orderByRaw}${' '+(this._query.delete ? ` ROWS ${this._query.limit}` : '')||''}${insertRaw}`;
   }

   async raw<T = antares.QueryResult> (sql: string, args?: antares.QueryParams) {
      interface FieldData {
         type: number;
         nullable: boolean;
         subType: number;
         scale: number;
         length: number;
         field: string;
         relation: string;
         alias: string;
       }

      this._logger({ cUid: this._cUid, content: sql, level: 'query' });

      args = {
         nest: false,
         details: false,
         split: true,
         comments: true,
         autocommit: true,
         ...args
      };

      if (!args.comments)
         sql = sql.replace(/(\/\*(.|[\r\n])*?\*\/)|(--(.*|[\r\n]))/gm, '');// Remove comments

      const resultsArr = [];
      let paramsArr = [];
      const queries = args.split
         ? this._querySplitter(sql, 'firebird')
         : [sql];

      let connection: firebird.Database | firebird.Transaction;
      const isPool = this._poolSize;

      if (!args.autocommit && args.tabUid) { // autocommit OFF
         if (this._connectionsToCommit.has(args.tabUid))
            connection = this._connectionsToCommit.get(args.tabUid);
         else {
            connection = await this.getConnection();

            const transaction = await new Promise<firebird.Transaction>((resolve, reject) => {
               (connection as firebird.Database).transaction(firebird.ISOLATION_READ_COMMITTED, (err, transaction) => {
                  if (err) reject(err);
                  else resolve(transaction);
               });
            });
            connection = transaction;
            this._connectionsToCommit.set(args.tabUid, transaction);
         }
      }
      else { // autocommit ON
         if (isPool) {
            const pool = this._connection as firebird.ConnectionPool;
            connection = await new Promise<firebird.Database>((resolve, reject) => {
               pool.get((err, db) => {
                  if (err) reject(err);
                  else resolve(db);
               });
            });
         }
         else
            connection = this._connection as firebird.Database;
      }

      for (const query of queries) {
         if (!query) continue;
         const timeStart = new Date();
         let timeStop;
         let keysArr: antares.QueryForeign[] = [];

         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         const { rows, report, fields, keys, duration }: any = await new Promise((resolve, reject) => {
            (async () => {
               let queryResult;
               let remappedFields: {
                  name: string;
                  alias: string;
                  orgName: string;
                  schema: string;
                  table: string;
                  tableAlias: string;
                  orgTable: string;
                  type: string;
                  length: number;
                  key?: string;
              }[];

               try {
                  queryResult = await new Promise<unknown[]>((resolve, reject) => {
                     // eslint-disable-next-line @typescript-eslint/no-explicit-any
                     (connection as any).query(query, [], async (err: any, res: any, fields: FieldData[]) => { // <- fields is not natively typed or documented
                        if (err) reject(err);
                        else {
                           const remappedResponse = [];

                           if (res) {
                              for (const row of res) {
                                 for (const key in row) {
                                    if (Buffer.isBuffer(row[key]))
                                       row[key] = row[key].toString('binary');
                                    else if (typeof row[key] === 'function') {
                                       const result = await new Promise((resolve, reject) => {
                                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                          row[key]((err: any, _name: string, event: any) => {
                                             if (err)
                                                return reject(err);

                                             const buffArr: Buffer[] = [];
                                             event.on('data', (chunk: Buffer) => {
                                                buffArr.push(chunk);
                                             });

                                             event.on('end', () => {
                                                resolve(Buffer.concat(buffArr));
                                             });
                                          });
                                       });

                                       row[key] = result;
                                    }
                                 }

                                 remappedResponse.push(row);
                              }
                           }

                           if (fields) {
                              remappedFields = fields.map(field => {
                                 const fieldType = this._getType(this._types[field.type], field.subType);

                                 return {
                                    name: field.alias,
                                    alias: field.alias,
                                    orgName: field.field,
                                    schema: args.schema,
                                    table: field.relation,
                                    tableAlias: field.relation,
                                    orgTable: field.relation,
                                    type: fieldType,
                                    length: fieldType === 'TIMESTAMP' ? 4 : field.length,
                                    key: undefined as string
                                 };
                              });
                           }

                           resolve(remappedResponse);
                        }
                     });
                  });

                  if (args.details) {
                     if (remappedFields?.length) {
                        paramsArr = remappedFields.map(field => {
                           return {
                              table: field.orgTable,
                              schema: field.schema
                           };
                        }).filter((val, i, arr) => arr.findIndex(el => el.table === val.table) === i);

                        for (const paramObj of paramsArr) {
                           if (!paramObj.table || !paramObj.schema) continue;

                           try { // Column details
                              const indexes = await this.getTableIndexes(paramObj);
                              remappedFields = remappedFields.map(field => {
                                 const fieldIndex = indexes.find(i => i.column === field.name);
                                 if (fieldIndex) {
                                    const key = fieldIndex.type === 'PRIMARY KEY' ? 'pri' : fieldIndex.type === 'UNIQUE' ? 'uni' : 'fk';
                                    field = { ...field, key };
                                 }

                                 return field;
                              });
                           }
                           catch (err) {
                              if (args.autocommit) {
                                 this._runningConnections.delete(args.tabUid);
                                 (connection as firebird.Database).detach();
                              }

                              this.destroy();
                              reject(err);
                           }

                           try { // Key usage (foreign keys)
                              const response = await this.getKeyUsage(paramObj);
                              keysArr = keysArr ? [...keysArr, ...response] : response;
                           }
                           catch (err) {
                              if (args.autocommit) {
                                 this._runningConnections.delete(args.tabUid);
                                 (connection as firebird.Database).detach();
                              }

                              this.destroy();
                              reject(err);
                           }
                        }
                     }
                  }
               }
               catch (err) {
                  reject(err);
                  this.destroy();
                  if (args.autocommit)
                     (connection as firebird.Database).detach();
               }

               timeStop = new Date();

               resolve({
                  duration: timeStop.getTime() - timeStart.getTime(),
                  rows: Array.isArray(queryResult) ? queryResult.some(el => Array.isArray(el)) ? [] : queryResult : false,
                  report: null,
                  fields: remappedFields,
                  keys: keysArr
               });
            })();
         });

         resultsArr.push({ rows, report, fields, keys, duration });
      }

      if (args.autocommit)
         (connection as firebird.Database).detach();

      const result = resultsArr.length === 1 ? resultsArr[0] : resultsArr;

      return result as unknown as T;
   }

   getVariables (): null[] {
      return [];
   }

   getCollations (): null[] {
      return [];
   }
}
