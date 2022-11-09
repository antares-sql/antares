import * as path from 'path';
import * as antares from 'common/interfaces/antares';
import * as firebird from 'node-firebird';
import { AntaresCore } from '../AntaresCore';
import dataTypes from 'common/data-types/sqlite';
import { FLOAT, NUMBER } from 'common/fieldTypes';

export class FirebirdSQLClient extends AntaresCore {
   private _schema?: string;
   private _runningConnections: Map<string, number>;
   private _connectionsToCommit: Map<string, firebird.Database>;
   protected _connection?: firebird.Database;
   _params: firebird.Options;

   private types: {[key: number]: string} ={
      452: 'CHAR', // Array of char
      448: 'VARCHAR',
      500: 'SMALLINT',
      496: 'INTEGER',
      482: 'FLOAT',
      480: 'DOUBLE',
      530: 'DOUBLE PRECISION',
      510: 'TIMESTAMP',
      520: 'BLOB',
      540: 'ARRAY',
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

   getTypeInfo (type: string): antares.TypeInformations {
      return dataTypes
         .reduce((acc, group) => [...acc, ...group.types], [])
         .filter(_type => _type.name === type.toUpperCase())[0];
   }

   async connect () {
      if (!this._poolSize)
         this._connection = await this.getConnection();
      else
         this._connection = await this.getConnectionPool();
   }

   async getConnection () {
      return new Promise<firebird.Database>((resolve, reject) => {
         firebird.attach({ ...this._params, blobAsText: true }, (err, db) => {
            if (err) reject(err);
            else resolve(db);
         });
      });
   }

   async getConnectionPool () {
      const pool = firebird.pool(this._poolSize, { ...this._params, blobAsText: true });
      return new Promise<firebird.Database>((resolve, reject) => {
         pool.get((err, db) => {
            if (err) reject(err);
            else resolve(db);
         });
      });
   }

   destroy () {
      return this._connection.detach();
   }

   use (): void {
      return null;
   }

   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   async getStructure (_schemas: Set<string>) {
      interface ShowTableResult {
         FORMAT: number;
         NAME: string;
         TYPE: string;
         DESCRIPTION: string | null;
      }

      interface ShowTriggersResult {
         NAME: string;
         RELATION: string;
         SOURCE: string;
      }

      const { rows: databases } = await this.raw<antares.QueryResult<{ NAME: string}>>('SELECT rdb$get_context(\'SYSTEM\', \'DB_NAME\') as name FROM rdb$database');

      const filteredDatabases = databases.map(db => {
         return { name: path.basename(db.NAME) };
      });

      const tablesArr: ShowTableResult[] = [];
      const triggersArr: ShowTriggersResult[] = [];
      let schemaSize = 0;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const _db of filteredDatabases) {
         // if (!schemas.has(db.name)) continue;

         const { rows: tables } = await this.raw<antares.QueryResult<ShowTableResult>>(`
            SELECT 
               rdb$relation_name AS name,
               rdb$format AS format,
               rdb$description AS description,
               'table' AS type
            FROM RDB$RELATIONS a
            WHERE COALESCE(RDB$SYSTEM_FLAG, 0) = 0 
            AND RDB$RELATION_TYPE = 0         
         `);

         tablesArr.push(...tables);

         const { rows: triggers } = await this.raw<antares.QueryResult<ShowTriggersResult>>(`
            SELECT
               RDB$TRIGGER_NAME as name,
               RDB$RELATION_NAME as relation,
               RDB$TRIGGER_SOURCE as source
            FROM RDB$TRIGGERS
            WHERE RDB$SYSTEM_FLAG=0;
         `);

         triggersArr.push(...triggers);
      }

      return filteredDatabases.map(db => {
         // TABLES
         const remappedTables = tablesArr.map(table => {
            const tableSize = 0;
            schemaSize += tableSize;

            return {
               name: table.NAME.trim(),
               type: table.TYPE.trim(),
               rows: false,
               size: false
            };
         });

         // TRIGGERS
         const remappedTriggers = triggersArr.map(trigger => {
            return {
               name: trigger.NAME,
               table: trigger.RELATION,
               statement: trigger.SOURCE
            };
         });

         return {
            name: db.name,
            size: schemaSize,
            tables: remappedTables,
            functions: [],
            procedures: [],
            triggers: remappedTriggers,
            schedulers: []
         };
      });
   }

   async getTableColumns ({ schema, table }: { schema: string; table: string }) {
      interface TableColumnsResult {
         DESCRIPTION?: string;
         /* eslint-disable camelcase */
         FIELD_NAME: string;
         FIELD_TYPE: string;
         FIELD_POSITION: number;
         NOT_NULL: 0 | 1;
         DEFAULT_VALUE: Buffer;
         DEFAULT_SOURCE: string;
         FIELD_LENGTH: number;
         FIELD_PRECISION: number;
         FIELD_SCALE: number;
         /* eslint-enable camelcase */
         SUBTYPE: number;
         EXTERNAL_TYPE: number;
         COLLATION: string;
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
            r.RDB$FIELD_NAME AS field_name,
            r.RDB$DESCRIPTION AS description,
            r.RDB$DEFAULT_VALUE AS default_value,
            r.RDB$NULL_FLAG AS not_null,
            r.RDB$FIELD_POSITION AS field_position,
            f.RDB$FIELD_LENGTH AS field_length,
            f.RDB$FIELD_PRECISION AS field_precision,
            f.RDB$FIELD_SCALE AS field_scale,
            f.RDB$EXTERNAL_TYPE AS external_type,
            r.RDB$DEFAULT_SOURCE AS default_source,
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
            END AS field_type,
            f.RDB$FIELD_SUB_TYPE AS subtype,
            -- coll.RDB$COLLATION_NAME AS collation,
            cset.RDB$CHARACTER_SET_NAME AS charset
         FROM RDB$RELATION_FIELDS r
         LEFT JOIN RDB$FIELDS f ON r.RDB$FIELD_SOURCE = f.RDB$FIELD_NAME
         -- LEFT JOIN RDB$COLLATIONS coll ON f.RDB$COLLATION_ID = coll.RDB$COLLATION_ID
         LEFT JOIN RDB$CHARACTER_SETS cset ON f.RDB$CHARACTER_SET_ID = cset.RDB$CHARACTER_SET_ID
         WHERE r.RDB$RELATION_NAME='${table}'
         ORDER BY r.RDB$FIELD_POSITION;
      `);

      return fields.map(field => {
         const defaultValue = field.DEFAULT_SOURCE ? field.DEFAULT_SOURCE.replace('DEFAULT ', '') : null;
         let fieldType = field.FIELD_TYPE.trim();

         if ([...NUMBER, ...FLOAT].includes(fieldType)) {
            if (field.SUBTYPE === 1)
               fieldType = 'NUMERIC';
            else if (field.SUBTYPE === 2)
               fieldType = 'DECIMAL';
         }

         return {
            name: field.FIELD_NAME.trim(),
            key: null,
            type: fieldType,
            schema: schema,
            table: table,
            numPrecision: field.FIELD_PRECISION ? field.FIELD_PRECISION : null,
            numScale: Math.abs(field.FIELD_SCALE),
            datePrecision: field.FIELD_NAME.trim() === 'TIMESTAMP' ? 4 : null,
            charLength: ![...NUMBER, ...FLOAT].includes(fieldType) ? field.FIELD_LENGTH : null,
            nullable: !field.NOT_NULL,
            unsigned: null,
            zerofill: null,
            order: field.FIELD_POSITION+1,
            default: defaultValue,
            charset: field.CHARSET,
            collation: null,
            autoIncrement: false,
            onUpdate: null,
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
            type: index.INDEX_TYPE.trim(),
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
            constraintPosition: null,
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
         const length = typeInfo?.length ? field.enumValues || field.numLength || field.charLength || field.datePrecision : false;

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

      return await this.raw(sql);
   }

   async alterTable (params: antares.AlterTableParams) {
      const {
         table,
         schema,
         additions,
         deletions,
         changes,
         tableStructure
      } = params;

      try {
         await this.raw('BEGIN TRANSACTION');
         await this.raw('PRAGMA foreign_keys = 0');

         const tmpName = `Antares_${table}_tmp`;
         await this.raw(`CREATE TABLE "${tmpName}" AS SELECT * FROM "${table}"`);
         await this.dropTable(params);

         const createTableParams = {
            schema: schema,
            fields: tableStructure.fields,
            foreigns: tableStructure.foreigns,
            indexes: tableStructure.indexes.filter(index => !index.name.includes('sqlite_autoindex')),
            options: { name: tableStructure.name }
         };
         await this.createTable(createTableParams);
         const insertFields = createTableParams.fields
            .filter(field => {
               return (
                  additions.every(add => add.name !== field.name) &&
                  deletions.every(del => del.name !== field.name)
               );
            })
            .reduce((acc, curr) => {
               acc.push(`"${curr.name}"`);
               return acc;
            }, []);

         const selectFields = insertFields.map(field => {
            const renamedField = changes.find(change => `"${change.name}"` === field);
            if (renamedField)
               return `"${renamedField.orgName}"`;
            return field;
         });

         await this.raw(`INSERT INTO "${createTableParams.options.name}" (${insertFields.join(',')}) SELECT ${selectFields.join(',')} FROM "${tmpName}"`);

         await this.dropTable({ schema: schema, table: tmpName });
         await this.raw('PRAGMA foreign_keys = 1');
         await this.raw('COMMIT');
      }
      catch (err) {
         await this.raw('ROLLBACK');
         return Promise.reject(err);
      }
   }

   async duplicateTable (params: { schema: string; table: string }) { // TODO: retrive table informations and create a copy
      const sql = `CREATE TABLE "${params.table}_copy" AS SELECT * FROM "${params.table}"`;
      return await this.raw(sql);
   }

   async truncateTable (params: { schema: string; table: string }) {
      const sql = `DELETE FROM "${params.table}"`;
      return await this.raw(sql);
   }

   async dropTable (params: { schema: string; table: string }) {
      const sql = `DROP TABLE "${params.table}"`;
      return await this.raw(sql);
   }

   async getViewInformations ({ schema, view }: { schema: string; view: string }) {
      const sql = `SELECT "sql" FROM "${schema}".sqlite_master WHERE "type"='view' AND name='${view}'`;
      const results = await this.raw(sql);

      return results.rows.map(row => {
         return {
            sql: row.sql.match(/(?<=AS ).*?$/gs)[0],
            name: view
         };
      })[0];
   }

   async dropView (params: { schema: string; view: string }) {
      const sql = `DROP VIEW '${params.view}'`;
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
      const sql = `CREATE VIEW '${params.name}' AS ${params.sql}`;
      return await this.raw(sql);
   }

   async getTriggerInformations ({ schema, trigger }: { schema: string; trigger: string }) {
      const sql = `SELECT "sql" FROM "${schema}".sqlite_master WHERE "type"='trigger' AND name='${trigger}'`;
      const results = await this.raw(sql);

      return results.rows.map(row => {
         return {
            sql: row.sql.match(/(BEGIN|begin)(.*)(END|end)/gs)[0],
            name: trigger,
            table: row.sql.match(/(?<=ON `).*?(?=`)/gs)[0],
            activation: row.sql.match(/(BEFORE|AFTER)/gs)[0],
            event: row.sql.match(/(INSERT|UPDATE|DELETE)/gs)[0]
         };
      })[0];
   }

   async dropTrigger (params: { schema: string; trigger: string }) {
      const sql = `DROP TRIGGER \`${params.schema}\`.\`${params.trigger}\``;
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
      const sql = `CREATE ${params.definer ? `DEFINER=${params.definer} ` : ''}TRIGGER \`${params.schema}\`.\`${params.name}\` ${params.activation} ${params.event} ON \`${params.table}\` FOR EACH ROW ${params.sql}`;
      return await this.raw(sql, { split: false });
   }

   async getEngines () {
      return {
         name: 'SQLite',
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
      // const connection = this._connectionsToCommit.get(tabUid);
      // if (connection) {
      //    connection.prepare('COMMIT').run();
      //    return this.destroyConnectionToCommit(tabUid);
      // }
   }

   async rollbackTab (tabUid: string) {
      // const connection = this._connectionsToCommit.get(tabUid);
      // if (connection) {
      //    connection.prepare('ROLLBACK').run();
      //    return this.destroyConnectionToCommit(tabUid);
      // }
   }

   destroyConnectionToCommit (tabUid: string) {
      // const connection = this._connectionsToCommit.get(tabUid);
      // if (connection) {
      //    connection.close();
      //    this._connectionsToCommit.delete(tabUid);
      // }
   }

   getSQL () {
      // LIMIT
      const limitRaw = this._query.limit ? ` first ${this._query.limit}` : '';

      // OFFSET
      const offsetRaw = this._query.offset ? ` skip ${this._query.offset}` : '';

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

      fromRaw += this._query.from ? ` ${this._query.from} ` : '';

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
         const fieldsList = Object.keys(this._query.insert[0]);
         const rowsList = this._query.insert.map(el => `(${Object.values(el).join(', ')})`);

         insertRaw = `(${fieldsList.join(', ')}) VALUES ${rowsList.join(', ')} `;
      }

      // GROUP BY
      const groupByArray = this._query.groupBy.reduce(this._reducer, []);
      const groupByRaw = groupByArray.length ? `GROUP BY ${groupByArray.join(', ')} ` : '';

      // ORDER BY
      const orderByArray = this._query.orderBy.reduce(this._reducer, []);
      const orderByRaw = orderByArray.length ? `ORDER BY ${orderByArray.join(', ')} ` : '';

      return `${selectRaw}${updateRaw ? 'UPDATE' : ''}${insertRaw ? 'INSERT ' : ''}${this._query.delete ? 'DELETE ' : ''}${fromRaw}${updateRaw}${whereRaw}${groupByRaw}${orderByRaw}${insertRaw}`;
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

      this._logger({ cUid: this._cUid, sql });

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
         ? sql.split(/((?:[^;'"]*(?:"(?:\\.|[^"])*"|'(?:\\.|[^'])*')[^;'"]*)+)|;/gm)
            .filter(Boolean)
            .map(q => q.trim())
         : [sql];

      let connection: firebird.Database;

      if (!args.autocommit && args.tabUid) { // autocommit OFF
         if (this._connectionsToCommit.has(args.tabUid))
            connection = this._connectionsToCommit.get(args.tabUid);

         else {
            connection = await this.getConnection();
            await new Promise((resolve, reject) => {
               connection.query('BEGIN TRANSACTION', [], (err, res) => {
                  if (err) reject(err);
                  else resolve(res);
               });
            });
            this._connectionsToCommit.set(args.tabUid, connection);
         }
      }
      else// autocommit ON
         connection = this._connection;

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
                                 let fieldType = this.types[field.type];

                                 if ([...NUMBER, ...FLOAT].includes(fieldType)) {
                                    if (field.subType === 1)
                                       fieldType = 'NUMERIC';
                                    else if (field.subType === 2)
                                       fieldType = 'DECIMAL';
                                 }

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
                     if (remappedFields.length) {
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
                                 this._connection.detach();
                                 this._runningConnections.delete(args.tabUid);
                              }
                              reject(err);
                           }

                           try { // Key usage (foreign keys)
                              const response = await this.getKeyUsage(paramObj);
                              keysArr = keysArr ? [...keysArr, ...response] : response;
                           }
                           catch (err) {
                              if (args.autocommit) {
                                 this._connection.detach();
                                 this._runningConnections.delete(args.tabUid);
                              }
                              reject(err);
                           }
                        }
                     }
                  }
               }
               catch (err) {
                  reject(err);
                  this._connection.detach();
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
