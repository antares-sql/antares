import sqlite = require('better-sqlite3');
import { DATETIME, FLOAT, NUMBER, TIME } from 'common/fieldTypes';
import * as antares from 'common/interfaces/antares';
import { removeComments } from 'common/libs/sqlUtils';

import { DatabaseClient } from '../db/core/contracts';
import { arrayRowsToObjects, uniqueColumnNames } from '../db/core/resultRows';
import { SQLiteConnections, SQLiteParams } from '../db/engines/sqlite/SQLiteConnections';
import { SQLiteDdl } from '../db/engines/sqlite/SQLiteDdl';
import { SQLiteDialect } from '../db/engines/sqlite/SQLiteDialect';
import { normalizeIntegers, parseTrigger, parseViewSelect } from '../db/engines/sqlite/SQLiteParsers';
import { BaseClient } from './BaseClient';

export class SQLiteClient extends BaseClient implements DatabaseClient {
   protected readonly _ddl = new SQLiteDdl();
   protected readonly _dialect = new SQLiteDialect();
   private _schema?: string;
   private readonly _connections: SQLiteConnections;
   _params: SQLiteParams;

   constructor (args: antares.ClientParams) {
      super(args);

      this._schema = null;
      this._connections = new SQLiteConnections(this._params);
   }

   getTypeInfo (type: string): antares.TypeInformations {
      return this._ddl.getTypeInfo(type);
   }

   async connect () {
      this._connections.connect();
   }

   getConnection () {
      return this._connections.open();
   }

   ping () {
      return this.select('1+1').run();
   }

   destroy () {
      this._connections.destroy();
   }

   use (): void {
      return null;
   }

   async getStructure (schemas: Set<string>) {
      /* eslint-disable camelcase */
      interface ShowTableResult {
         Db?: string;
         type: string;
         name: string;
         tbl_name: string;
         rootpage:4;
         sql: string;
      }

      type ShowTriggersResult = ShowTableResult
      /* eslint-enable camelcase */

      const { rows: databases } = await this.raw<antares.QueryResult<{ name: string}>>('SELECT * FROM pragma_database_list');

      const filteredDatabases = databases;

      const tablesArr: ShowTableResult[] = [];
      const triggersArr: ShowTriggersResult[] = [];
      let schemaSize = 0;

      for (const db of filteredDatabases) {
         if (!schemas.has(db.name)) continue;

         let { rows: tables } = await this.raw<antares.QueryResult<ShowTableResult>>(`
            SELECT * 
            FROM "${db.name}".sqlite_master 
            WHERE type IN ('table', 'view') 
            AND name NOT LIKE 'sqlite\\_%' ESCAPE '\\'
            ORDER BY name
         `);
         if (tables.length) {
            tables = tables.map(table => {
               table.Db = db.name;
               return table;
            });
            tablesArr.push(...tables);
         }

         let { rows: triggers } = await this.raw<antares.QueryResult<ShowTriggersResult>>(`SELECT * FROM "${db.name}".sqlite_master WHERE type='trigger'`);
         if (triggers.length) {
            triggers = triggers.map(trigger => {
               trigger.Db = db.name;
               return trigger;
            });
            triggersArr.push(...triggers);
         }
      }

      return filteredDatabases.map(db => {
         if (schemas.has(db.name)) {
            // TABLES
            const remappedTables = tablesArr.filter(table => table.Db === db.name).map(table => {
               const tableSize = 0;
               schemaSize += tableSize;

               return {
                  name: table.name,
                  type: table.type,
                  rows: false,
                  size: false
               };
            });

            // TRIGGERS
            const remappedTriggers = triggersArr.filter(trigger => trigger.Db === db.name).map(trigger => {
               return {
                  name: trigger.name,
                  table: trigger.tbl_name
               };
            });

            return {
               name: db.name,
               size: schemaSize,
               tables: remappedTables,
               functions: [] as null[],
               procedures: [] as null[],
               triggers: remappedTriggers,
               schedulers: [] as null[]
            };
         }
         else {
            return {
               name: db.name,
               size: 0,
               tables: [],
               functions: [],
               procedures: [],
               triggers: [],
               schedulers: []
            };
         }
      });
   }

   async getTableColumns ({ schema, table }: { schema: string; table: string }) {
      interface TableColumnsResult {
         cid: number;
         name: string;
         type: string;
         notnull: 0 | 1;
         // eslint-disable-next-line camelcase
         dflt_value: string;
         pk: 0 | 1;
      }
      const { rows: fields } = await this.raw<antares.QueryResult<TableColumnsResult>>(`SELECT * FROM "${schema}".pragma_table_info('${table}')`);

      return fields.map(field => {
         const [type, length]: [string, number?] = field.type.includes('(')
            ? field.type.replace(')', '').split('(').map((el: string | number) => {
               if (!isNaN(Number(el))) el = Number(el);
               return el;
            }) as [string, number?]
            : [field.type, null];

         return {
            name: field.name,
            key: null as null,
            type: type.trim(),
            schema: schema,
            table: table,
            numLength: [...NUMBER, ...FLOAT].includes(type) ? length : null,
            datePrecision: null as null,
            charLength: ![...NUMBER, ...FLOAT].includes(type) ? length : null,
            nullable: !field.notnull,
            unsigned: null as null,
            zerofill: null as null,
            order: typeof field.cid === 'string' ? +field.cid + 1 : field.cid + 1,
            default: field.dflt_value,
            charset: null as null,
            collation: null as null,
            autoIncrement: false,
            onUpdate: null as null,
            comment: ''
         };
      });
   }

   async getTableApproximateCount ({ schema, table }: { schema: string; table: string }): Promise<number> {
      const { rows } = await this.raw(`SELECT COUNT(*) AS count FROM "${schema}"."${table}"`);

      return rows.length ? rows[0].count : 0;
   }

   async getTableOptions ({ table }: { table: string }) {
      return { name: table };
   }

   async getTableIndexes ({ schema, table }: { schema: string; table: string }) {
      interface TableColumnsResult {
         type: string;
         name: string;
         // eslint-disable-next-line camelcase
         tbl_name: string;
         rootpage:4;
         sql: string;
      }

      interface ShowIndexesResult {
         seq: number;
         name: string;
         unique: 0 | 1;
         origin: string;
         partial: 0 | 1;
      }

      const remappedIndexes = [];
      const { rows: primaryKeys } = await this.raw<antares.QueryResult<TableColumnsResult>>(`SELECT * FROM "${schema}".pragma_table_info('${table}') WHERE pk != 0`);

      for (const key of primaryKeys) {
         remappedIndexes.push({
            name: 'PRIMARY',
            column: key.name,
            type: 'PRIMARY'
         });
      }

      const { rows: indexes } = await this.raw<antares.QueryResult<ShowIndexesResult>>(`SELECT * FROM "${schema}".pragma_index_list('${table}');`);

      for (const index of indexes) {
         const { rows: details } = await this.raw(`SELECT * FROM "${schema}".pragma_index_info('${index.name}');`);

         for (const detail of details) {
            remappedIndexes.push({
               name: index.name,
               column: detail.name,
               indexType: null as never,
               type: index.unique === 1 ? 'UNIQUE' : 'INDEX',
               cardinality: null as never,
               comment: '',
               indexComment: ''
            });
         }
      }

      return remappedIndexes;
   }

   async getKeyUsage ({ schema, table }: { schema: string; table: string }) {
      /* eslint-disable camelcase */
      interface KeyResult {
         from: string;
         id: number;
         table: string;
         to: string;
         on_update: string;
         on_delete: string;
      }
      /* eslint-enable camelcase */

      const { rows } = await this.raw<antares.QueryResult<KeyResult>>(`SELECT * FROM "${schema}".pragma_foreign_key_list('${table}');`);

      return rows.map(field => {
         return {
            schema: schema,
            table: table,
            field: field.from,
            position: field.id + 1,
            constraintPosition: null as null,
            constraintName: field.id,
            refSchema: schema,
            refTable: field.table,
            refField: field.to,
            onUpdate: field.on_update,
            onDelete: field.on_delete
         };
      });
   }

   async getUsers (): Promise<void> {
      return null;
   }

   async createTable (params: antares.CreateTableParams) {
      return await this.raw(this._ddl.createTable(params));
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

         // Get table triggers before drop
         const { rows: triggers } = await this.raw(`SELECT * FROM "${schema}".sqlite_master WHERE type='trigger' AND tbl_name = '${table}'`);
         const remappedTriggers = triggers.map(row => ({ schema, ...parseTrigger(row.sql, row.name) }));

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

         // Recreates triggers
         for (const trigger of remappedTriggers)
            await this.createTrigger(trigger);

         await this.raw('PRAGMA foreign_keys = 1');
         await this.raw('COMMIT');
      }
      catch (err) {
         await this.raw('ROLLBACK');
         return Promise.reject(err);
      }
   }

   async duplicateTable (params: { schema: string; table: string }) {
      return await this.raw(this._ddl.duplicateTable(params));
   }

   async truncateTable (params: { schema: string; table: string }) {
      return await this.raw(this._ddl.truncateTable(params));
   }

   async dropTable (params: { schema: string; table: string }) {
      return await this.raw(this._ddl.dropTable(params));
   }

   async getViewInformations ({ schema, view }: { schema: string; view: string }) {
      const sql = `SELECT "sql" FROM "${schema}".sqlite_master WHERE "type"='view' AND name='${view}'`;
      const results = await this.raw(sql);

      return results.rows.map(row => ({ sql: parseViewSelect(row.sql), name: view }))[0];
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

   async getTriggerInformations ({ schema, trigger }: { schema: string; trigger: string }) {
      const sql = `SELECT "sql" FROM "${schema}".sqlite_master WHERE "type"='trigger' AND name='${trigger}'`;
      const results = await this.raw(sql);

      return results.rows.map(row => parseTrigger(row.sql, trigger))[0];
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

   async getEngines () {
      return {
         name: 'SQLite',
         support: 'YES',
         comment: '',
         isDefault: true
      };
   }

   async getVersion () {
      const os = require('os');
      const sql = 'SELECT sqlite_version() AS version';
      const { rows } = await this.raw(sql);

      return {
         number: rows[0].version,
         name: 'SQLite',
         arch: process.arch,
         os: `${os.type()} ${os.release()}`
      };
   }

   async getProcesses (): Promise<void> {
      return null;
   }

   async killProcess (): Promise<void> {
      return null;
   }

   async commitTab (tabUid: string) {
      this._connections.commitTab(tabUid);
   }

   async rollbackTab (tabUid: string) {
      this._connections.rollbackTab(tabUid);
   }

   destroyConnectionToCommit (tabUid: string) {
      this._connections.closeTab(tabUid);
   }

   async raw<T = antares.QueryResult> (sql: string, args?: antares.QueryParams) {
      this._logger({ cUid: this._cUid, content: sql, level: 'query' });// TODO: replace BLOB content with a placeholder

      args = {
         nest: false,
         details: false,
         split: true,
         comments: true,
         autocommit: true,
         ...args
      };

      if (!args.comments)
         sql = removeComments(sql);

      const resultsArr = [];
      let paramsArr = [];
      const queries = args.split
         ? this._querySplitter(sql, 'sqlite')
         : [sql];

      const { connection } = this._connections.acquire(args);

      for (const query of queries) {
         if (!query) continue;
         const timeStart = new Date();
         let timeStop;
         const keysArr: antares.QueryForeign[] = [];

         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         const { rows, report, fields, keys, duration }: any = await new Promise((resolve, reject) => {
            (async () => {
               let queryRunResult: sqlite.RunResult;
               // eslint-disable-next-line @typescript-eslint/no-explicit-any
               let queryAllResult: any[];
               let affectedRows;
               let fields;
               const detectedTypes: Record<string, string> = {};
               let aliases: string[] = [];

               try {
                  const stmt = connection.prepare(query);

                  if (stmt.reader) {
                     fields = stmt.columns();
                     // Array rows: object rows would lose columns with the same name
                     aliases = uniqueColumnNames(fields.map(field => field.name));
                     // Read integers as BigInt so values beyond 2^53 are not rounded (they may be primary keys)
                     const arrayRows = stmt.safeIntegers(true).raw(true).all() as unknown[][];
                     queryAllResult = arrayRowsToObjects(arrayRows, aliases).map(normalizeIntegers);

                     if (queryAllResult.length) {
                        aliases.forEach(alias => {
                           detectedTypes[alias] = typeof queryAllResult[0][alias];
                        });
                     }
                  }
                  else {
                     queryRunResult = stmt.run();
                     affectedRows = queryRunResult.changes;
                  }
               }
               catch (err) {
                  reject(err);
               }

               timeStop = new Date();

               let remappedFields = fields
                  ? fields.map((field, i) => {
                     const alias = aliases[i] ?? field.name;
                     let [parsedType, length]: [string, number?] = field.type?.includes('(')
                        ? field.type.replace(')', '').split('(').map((el: string | number) => {
                           if (!isNaN(Number(el)))
                              el = Number(el);
                           else
                              el = (el as string).trim();
                           return el;
                        }) as [string, number?]
                        : [field.type, null];

                     if ([...TIME, ...DATETIME].includes(parsedType)) {
                        const firstNotNull = queryAllResult.find(res => res[alias] !== null);
                        if (firstNotNull && String(firstNotNull[alias]).includes('.'))
                           length = String(firstNotNull[alias]).split('.').pop().length;
                     }

                     return {
                        name: field.name,
                        alias,
                        orgName: field.column,
                        schema: field.database,
                        table: field.table,
                        tableAlias: field.table,
                        orgTable: field.table,
                        type: field.type !== null ? parsedType : detectedTypes[alias],
                        length,
                        key: undefined as string
                     };
                  }).filter(Boolean)
                  : [];

               if (args.details) {
                  paramsArr = remappedFields.map(field => {
                     return {
                        table: field.table,
                        schema: field.schema
                     };
                  }).filter((val, i, arr) => arr.findIndex(el => el.schema === val.schema && el.table === val.table) === i);

                  for (const paramObj of paramsArr) {
                     if (!paramObj.table || !paramObj.schema) continue;

                     try {
                        const indexes = await this.getTableIndexes(paramObj);

                        remappedFields = remappedFields.map(field => {
                           const fieldIndex = indexes.find(i => i.column === field.name);
                           if (field.table === paramObj.table && field.schema === paramObj.schema) {
                              if (fieldIndex) {
                                 const key = fieldIndex.type === 'PRIMARY' ? 'pri' : fieldIndex.type === 'UNIQUE' ? 'uni' : 'mul';
                                 field = { ...field, key };
                              }
                           }

                           return field;
                        });
                     }
                     catch (err) {
                        reject(err);
                     }
                  }
               }

               resolve({
                  duration: timeStop.getTime() - timeStart.getTime(),
                  rows: Array.isArray(queryAllResult) ? queryAllResult.some(el => Array.isArray(el)) ? [] : queryAllResult : false,
                  report: affectedRows !== undefined ? { affectedRows } : null,
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
