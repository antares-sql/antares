import { FLOAT, NUMBER } from 'common/fieldTypes';
import * as antares from 'common/interfaces/antares';
import { removeComments } from 'common/libs/sqlUtils';
import * as firebird from 'node-firebird';
import * as path from 'path';

import { DatabaseClient, DatabasesCapability, DbConfigCapability, RoutinesCapability, UsersCapability } from '../db/core/contracts';
import { arrayRowsToObjects, uniqueColumnNames } from '../db/core/resultRows';
import { maskSecrets, trimmed } from '../db/core/users';
import { FirebirdConnections } from '../db/engines/firebird/FirebirdConnections';
import { FirebirdDdl } from '../db/engines/firebird/FirebirdDdl';
import { FirebirdDialect } from '../db/engines/firebird/FirebirdDialect';
import { FirebirdUsers } from '../db/engines/firebird/FirebirdUsers';
import { BaseClient } from './BaseClient';

export class FirebirdSQLClient extends BaseClient implements DatabaseClient, DatabasesCapability, DbConfigCapability, RoutinesCapability, UsersCapability {
   protected readonly _ddl = new FirebirdDdl();
   protected readonly _dialect = new FirebirdDialect();
   private readonly _users = new FirebirdUsers();
   private _schema?: string;
   private readonly _connections: FirebirdConnections;
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
      32748: 'TIMESTAMP WITH TIME ZONE', // >= 4.0 (extended format)
      32750: 'TIME WITH TIME ZONE', // >= 4.0 (extended format)
      32752: 'INT128', // >= 4.0
      32754: 'TIMESTAMP WITH TIME ZONE', // >= 4.0
      32756: 'TIME WITH TIME ZONE', // >= 4.0
      32760: 'DECFLOAT', // >= 4.0 DECFLOAT(16)
      32762: 'DECFLOAT', // >= 4.0 DECFLOAT(34)
      32764: 'BOOLEAN', // >= 3.0
      32766: 'NULL' // >= 2.5
   }

   constructor (args: antares.ClientParams) {
      super(args);

      this._schema = null;
      this._connections = new FirebirdConnections(this._params, this._poolSize);
   }

   private _getType (type: string, subType?: number) {
      let fieldType = type?.trim() ?? 'UNKNOWN';

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
      return this._ddl.getTypeInfo(type);
   }

   connect () {
      return this._connections.connect();
   }

   /** A new attachment (used by the exporter: detach it when done) */
   getConnection () {
      return this._connections.attach();
   }

   async getDbConfig () {
      return { ...this._params };
   }

   getConnectionPool () {
      return this._connections.createPool();
   }

   ping () {
      return this.raw('SELECT rdb$get_context(\'SYSTEM\', \'DB_NAME\') FROM rdb$database');
   }

   destroy () {
      this._connections.destroy();
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

         // RDB$RELATION_TYPE is NULL in databases created before ODS 11.1 (Firebird 2.5 and older)
         const { rows: tables } = await this.raw<antares.QueryResult<TableResult>>(`
            SELECT 
               rdb$relation_name AS NAME,
               rdb$format AS FORMAT,
               rdb$description AS DESCRIPTION,
               'table' AS TYPE
            FROM RDB$RELATIONS a
            WHERE COALESCE(RDB$SYSTEM_FLAG, 0) = 0 
            AND (RDB$RELATION_TYPE = 0 OR (RDB$RELATION_TYPE IS NULL AND RDB$VIEW_BLR IS NULL))
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

   /** Connected user and whether it administers the security database (SYSDBA, RDB$ADMIN role or admin user) */
   private async _usersContext () {
      const { rows: [current] } = await this.raw('SELECT CURRENT_USER AS NAME, CURRENT_ROLE AS ROLE_NAME FROM RDB$DATABASE');
      const name = trimmed(current.NAME) as string;
      const role = trimmed(current.ROLE_NAME) as string;

      // SEC$USERS exists since Firebird 3
      const { rows: [own] } = await this.raw('SELECT SEC$ADMIN AS IS_ADMIN FROM SEC$USERS WHERE SEC$USER_NAME = CURRENT_USER')
         .catch(() => {
            throw new Error('Users management requires Firebird 3.0 or later');
         });

      return {
         currentUser: { name },
         canManage: name === 'SYSDBA' || role === 'RDB$ADMIN' || !!own?.IS_ADMIN
      };
   }

   async getUsersManagementInfo (): Promise<antares.UsersManagementInfo> {
      const { currentUser, canManage } = await this._usersContext();
      const { rows: roles } = await this.raw('SELECT RDB$ROLE_NAME AS NAME FROM RDB$ROLES ORDER BY RDB$ROLE_NAME');

      return {
         currentUser,
         canManage,
         hasHost: false,
         canRename: false,
         passwordRequired: true,
         attributes: [
            { name: 'firstName', type: 'text', group: 'account', default: null },
            { name: 'middleName', type: 'text', group: 'account', default: null },
            { name: 'lastName', type: 'text', group: 'account', default: null },
            { name: 'active', type: 'boolean', group: 'account', default: true },
            { name: 'admin', type: 'boolean', group: 'account', default: false, disabled: !canManage }
         ],
         globalPrivileges: [],
         scopes: [],
         roles: roles.map(row => trimmed(row.NAME) as string)
      };
   }

   async getUsersList (): Promise<antares.UserAccount[]> {
      const { currentUser, canManage } = await this._usersContext();
      // Users without admin rights see only their own account
      const { rows } = await this.raw('SELECT SEC$USER_NAME AS NAME, SEC$PLUGIN AS PLUGIN, SEC$ACTIVE AS ACTIVE FROM SEC$USERS ORDER BY SEC$USER_NAME');

      return rows.map(row => {
         const name = trimmed(row.NAME) as string;
         return {
            name,
            plugin: trimmed(row.PLUGIN) as string,
            editable: canManage || name === currentUser.name,
            disabled: !row.ACTIVE
         };
      });
   }

   async getUserDetails (user: antares.UserIdentity): Promise<antares.UserDetails> {
      const name = this._dialect.quoteString(user.name);
      const plugin = user.plugin ? ` AND SEC$PLUGIN = ${this._dialect.quoteString(user.plugin)}` : '';

      const { rows: [row] } = await this.raw(`SELECT * FROM SEC$USERS WHERE SEC$USER_NAME = ${name}${plugin}`);
      if (!row) throw new Error(`User ${user.name} not found`);

      const { rows: roles } = await this.raw(`SELECT RDB$RELATION_NAME AS NAME FROM RDB$USER_PRIVILEGES WHERE RDB$PRIVILEGE = 'M' AND RDB$USER_TYPE = 8 AND RDB$USER = ${name} ORDER BY 1`);

      return {
         name: trimmed(row.SEC$USER_NAME) as string,
         plugin: trimmed(row.SEC$PLUGIN) as string,
         attributes: this._users.attributesOfRow(row),
         globalPrivileges: [],
         privileges: {},
         roles: roles.map(r => trimmed(r.NAME) as string)
      };
   }

   /** Runs users management statements one by one, with passwords masked in the logs */
   private async _runUserStatements (statements: string[], password?: string) {
      const secrets = password ? [this._dialect.quoteString(password)] : [];
      for (const sql of statements)
         await this.raw(sql, { split: false, logContent: maskSecrets(sql, secrets) });
   }

   async createUser (params: antares.SaveUserParams) {
      await this._runUserStatements(this._users.createUser(params), params.password);
   }

   async alterUser (params: antares.SaveUserParams) {
      await this._runUserStatements(this._users.alterUser(params), params.password);
   }

   async dropUser (user: antares.UserIdentity) {
      await this._runUserStatements(this._users.dropUser(await this.getUserDetails(user)));
   }

   async createTable (params: antares.CreateTableParams) {
      return await this.raw(this._ddl.createTable(params));
   }

   async alterTable (params: antares.AlterTableParams) {
      return await this.raw(this._ddl.alterTable(params));
   }

   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   async duplicateTable (params: { schema: string; table: string }) { // TODO: retrive table informations and create a copy
      // const sql = `CREATE TABLE "${params.table}_copy" AS SELECT * FROM "${params.table}"`;
      // return await this.raw(sql);
   }

   async truncateTable (params: { schema: string; table: string }) {
      return await this.raw(this._ddl.truncateTable(params));
   }

   async dropTable (params: { schema: string; table: string }) {
      return await this.raw(this._ddl.dropTable(params));
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
      return await this.raw(this._ddl.dropView(params));
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
      return await this.raw(this._ddl.createView(params));
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
      return await this.raw(this._ddl.dropTrigger(params));
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
      return await this.raw(this._ddl.createTrigger(params), { split: false });
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
      return await this.raw(this._ddl.dropRoutine(params));
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
      return await this.raw(this._ddl.createRoutine(params), { split: false });
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
      await this._connections.commitTab(tabUid);
   }

   async rollbackTab (tabUid: string) {
      await this._connections.rollbackTab(tabUid);
   }

   destroyConnectionToCommit (tabUid: string) {
      this._connections.closeTab(tabUid);
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

      this._logger({ cUid: this._cUid, content: args?.logContent ?? sql, level: 'query' });

      args = {
         nest: false,
         details: false,
         split: true,
         comments: true,
         autocommit: true,
         ...args
      };

      if (!args.comments)
         sql = removeComments(sql, 'firebird');

      const resultsArr = [];
      let paramsArr = [];
      const queries = args.split
         ? this._querySplitter(sql, 'firebird')
         : [sql];

      const lease = await this._connections.acquire(args);
      const connection = lease.connection;

      for (const query of queries) {
         if (!query) continue;

         // Every statement is already committed: the COMMIT of scripts (e.g. dumps for isql) would fail on the driver transaction
         if (args.autocommit && /^\s*COMMIT(\s+WORK)?\s*;?\s*$/i.test(query)) {
            resultsArr.push({ rows: false, report: null, fields: [], keys: [], duration: 0 });
            continue;
         }

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
                        if (err) {
                           reject(err);
                           return;
                        }

                        try { // An error here would leave the query pending forever
                           const remappedResponse = [];
                           // Array rows: object rows would lose columns with the same name
                           const aliases = fields ? uniqueColumnNames(fields.map(field => field.alias)) : [];

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
                              remappedFields = fields.map((field, i) => {
                                 const fieldType = this._getType(this._types[field.type], field.subType);

                                 return {
                                    name: field.alias,
                                    alias: aliases[i],
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

                           resolve(fields ? arrayRowsToObjects(remappedResponse, aliases) : remappedResponse);
                        }
                        catch (error) {
                           reject(error);
                        }
                     }, { asObject: false });
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
                              lease.release();
                              reject(err);
                           }

                           try { // Key usage (foreign keys)
                              const response = await this.getKeyUsage(paramObj);
                              keysArr = keysArr ? [...keysArr, ...response] : response;
                           }
                           catch (err) {
                              lease.release();
                              reject(err);
                           }
                        }
                     }
                  }
               }
               catch (err) {
                  lease.release();
                  reject(err);
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

      lease.release();

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
