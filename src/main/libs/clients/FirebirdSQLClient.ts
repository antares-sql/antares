import * as path from 'path';
import * as antares from 'common/interfaces/antares';
import * as firebird from 'node-firebird';
import { AntaresCore } from '../AntaresCore';
import dataTypes from 'common/data-types/sqlite';

export class FirebirdSQLClient extends AntaresCore {
   private _schema?: string;
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
      this._connection = await this.getConnection();
   }

   async getConnection () {
      return new Promise<firebird.Database>((resolve, reject) => {
         firebird.attach({ ...this._params, blobAsText: true }, (err, db) => {
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

   async getStructure (_schemas: Set<string>) {
      interface ShowTableResult {
         FORMAT: number;
         NAME: string;
         TYPE: string;
         DESCRIPTION: string | null;
      }

      // type ShowTriggersResult = ShowTableResult

      const { rows: databases } = await this.raw<antares.QueryResult<{ NAME: string}>>('SELECT rdb$get_context(\'SYSTEM\', \'DB_NAME\') as name FROM rdb$database');

      const filteredDatabases = databases.map(db => {
         return { name: path.basename(db.NAME) };
      });

      const tablesArr: ShowTableResult[] = [];
      // const triggersArr: ShowTriggersResult[] = [];
      let schemaSize = 0;

      for (const db of filteredDatabases) {
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
         // const remappedTriggers = triggersArr.filter(trigger => trigger.Db === db.name).map(trigger => {
         //    return {
         //       name: trigger.name,
         //       table: trigger.tbl_name
         //    };
         // });

         return {
            name: db.name,
            size: schemaSize,
            tables: remappedTables,
            functions: [],
            procedures: [],
            triggers: [],
            schedulers: []
         };
      });
   }

   async getTableColumns ({ schema, table }: { schema: string; table: string }) {
      interface TableColumnsResult {
         POSITION: number;
         DESCRIPTION?: string;
         /* eslint-disable camelcase */
         FIELD_NAME: string;
         FIELD_TYPE: string;
         NOT_NULL: 0 | 1;
         DEFAULT_VALUE: string;
         FIELD_LENGTH: number;
         FIELD_PRECISION: number;
         FIELD_SCALE: number;
         /* eslint-enable camelcase */
         SUBTYPE: string;
         COLLATION: string;
         CHARSET: string;
      }

      const { rows: fields } = await this.raw<antares.QueryResult<TableColumnsResult>>(`
         SELECT 
            r.RDB$FIELD_NAME AS field_name,
            r.RDB$DESCRIPTION AS description,
            r.RDB$DEFAULT_VALUE AS default_value,
            r.RDB$NULL_FLAG AS not_null,
            f.RDB$FIELD_LENGTH AS field_length,
            f.RDB$FIELD_PRECISION AS field_precision,
            f.RDB$FIELD_SCALE AS field_scale,
            CASE f.RDB$FIELD_TYPE
               WHEN 261 THEN 'BLOB'
               WHEN 14 THEN 'CHAR'
               WHEN 40 THEN 'CSTRING'
               WHEN 11 THEN 'D_FLOAT'
               WHEN 27 THEN 'DOUBLE'
               WHEN 10 THEN 'FLOAT'
               WHEN 16 THEN 'INT64'
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
         return {
            name: field.FIELD_NAME.trim(),
            key: null,
            type: field.FIELD_TYPE.trim(),
            schema: schema,
            table: table,
            numPrecision: field.FIELD_PRECISION,
            datePrecision: null,
            charLength: field.FIELD_LENGTH,
            nullable: !field.NOT_NULL,
            unsigned: null,
            zerofill: null,
            order: field.POSITION,
            default: field.DEFAULT_VALUE,
            charset: field.CHARSET,
            collation: null,
            autoIncrement: false,
            onUpdate: null,
            comment: field.DESCRIPTION?.trim()
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
            indexType: null as never,
            type: 'PRIMARY',
            cardinality: null as never,
            comment: '',
            indexComment: ''
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
            constraintPosition: null,
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
      const sql = `CREATE TABLE '${params.table}_copy' AS SELECT * FROM '${params.table}'`;
      return await this.raw(sql);
   }

   async truncateTable (params: { schema: string; table: string }) {
      const sql = `DELETE FROM '${params.table}'`;
      return await this.raw(sql);
   }

   async dropTable (params: { schema: string; table: string }) {
      const sql = `DROP TABLE '${params.table}'`;
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

   // async commitTab (tabUid: string) {
   //    const connection = this._connectionsToCommit.get(tabUid);
   //    if (connection) {
   //       connection.prepare('COMMIT').run();
   //       return this.destroyConnectionToCommit(tabUid);
   //    }
   // }

   // async rollbackTab (tabUid: string) {
   //    const connection = this._connectionsToCommit.get(tabUid);
   //    if (connection) {
   //       connection.prepare('ROLLBACK').run();
   //       return this.destroyConnectionToCommit(tabUid);
   //    }
   // }

   // destroyConnectionToCommit (tabUid: string) {
   //    const connection = this._connectionsToCommit.get(tabUid);
   //    if (connection) {
   //       connection.close();
   //       this._connectionsToCommit.delete(tabUid);
   //    }
   // }

   getSQL () {
      // LIMIT
      const limitRaw = this._query.limit ? ` first ${this._query.limit}` : '';

      // SELECT
      const selectArray = this._query.select.reduce(this._reducer, []);
      let selectRaw = '';

      if (selectArray.length)
         selectRaw = selectArray.length ? `SELECT${limitRaw||''} ${selectArray.join(', ')} ` : `SELECT${limitRaw||''} * `;

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

      // OFFSET
      const offsetRaw = this._query.offset ? `OFFSET ${this._query.offset} ` : '';

      return `${selectRaw}${updateRaw ? 'UPDATE' : ''}${insertRaw ? 'INSERT ' : ''}${this._query.delete ? 'DELETE ' : ''}${fromRaw}${updateRaw}${whereRaw}${groupByRaw}${orderByRaw}${offsetRaw}${insertRaw}`;
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
         const keysArr: antares.QueryForeign[] = [];

         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         const { rows, report, fields, keys, duration }: any = await new Promise((resolve, reject) => {
            (async () => {
               let queryResult;
               let remappedFields;

               try {
                  queryResult = await new Promise<unknown[]>((resolve, reject) => {
                     // eslint-disable-next-line @typescript-eslint/no-explicit-any
                     (connection as any).query(query, [], (err: any, res: any, fields: FieldData[]) => { // <- fields is not natively typed or documented
                        if (err) reject(err);
                        else {
                           const remappedResponse = [];

                           for (const row of res) {
                              for (const key in row) {
                                 if (Buffer.isBuffer(row[key]))
                                    row[key] = row[key].toString('binary');
                                 else if (typeof row[key] === 'function')
                                    row[key] = row[key].toString('binary');
                              }

                              remappedResponse.push(row);
                           }

                           // eslint-disable-next-line @typescript-eslint/no-explicit-any
                           remappedFields = fields.map((field: any) => {
                              return {
                                 name: field.alias,
                                 alias: field.alias,
                                 orgName: field.field,
                                 schema: args.schema,
                                 table: field.relation,
                                 tableAlias: field.relation,
                                 orgTable: field.relation,
                                 type: this.types[field.type],
                                 length: field.length
                              };
                           });

                           resolve(remappedResponse);
                        }
                     });
                  });
               }
               catch (err) {
                  reject(err);
               }

               timeStop = new Date();

               // if (args.details) {

               // }

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
