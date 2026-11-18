import * as antares from 'common/interfaces/antares';
import { removeComments } from 'common/libs/sqlUtils';
import * as mysql from 'mysql2/promise';

import EncodingToCharset = require('../../../../node_modules/mysql2/lib/constants/encoding_charset.js');
import { CancelQueriesCapability, DatabaseClient, DatabaseCollationCapability, DbConfigCapability, FunctionsCapability, RoutinesCapability, SchedulersCapability, SchemasCapability, TableCheckCapability, TableDdlCapability } from '../db/core/contracts';
import { MySQLConnections, MySQLParams } from '../db/engines/mysql/MySQLConnections';
import { MySQLDdl } from '../db/engines/mysql/MySQLDdl';
import { MariaDBDialect, MySQLDialect } from '../db/engines/mysql/MySQLDialect';
import { ColumnRow, mapColumn, parseCreateTableColumns, parseEvent, parseReturnType, parseRoutine, parseTrigger, parseViewAlgorithm } from '../db/engines/mysql/MySQLParsers';
import { BaseClient } from './BaseClient';
EncodingToCharset.utf8mb3 = 192; // To fix https://github.com/sidorares/node-mysql2/issues/1398 until not included in mysql2

export class MySQLClient extends BaseClient implements DatabaseClient, SchemasCapability, DatabaseCollationCapability, DbConfigCapability, CancelQueriesCapability, TableCheckCapability, TableDdlCapability, RoutinesCapability, FunctionsCapability, SchedulersCapability {
   protected readonly _ddl = new MySQLDdl();
   protected readonly _dialect = this._client === 'maria' ? new MariaDBDialect() : new MySQLDialect();
   private _schema?: string;
   private readonly _connections: MySQLConnections;
   _params: MySQLParams;

   private types: Record<number, string> = {
      0: 'DECIMAL',
      1: 'TINYINT',
      2: 'SMALLINT',
      3: 'INT',
      4: 'FLOAT',
      5: 'DOUBLE',
      6: 'NULL',
      7: 'TIMESTAMP',
      8: 'BIGINT',
      9: 'MEDIUMINT',
      10: 'DATE',
      11: 'TIME',
      12: 'DATETIME',
      13: 'YEAR',
      14: 'NEWDATE',
      15: 'VARCHAR',
      16: 'BIT',
      17: 'TIMESTAMP2',
      18: 'DATETIME2',
      19: 'TIME2',
      245: 'JSON',
      246: 'NEWDECIMAL',
      247: 'ENUM',
      248: 'SET',
      249: 'TINY_BLOB',
      250: 'MEDIUM_BLOB',
      251: 'LONG_BLOB',
      252: 'BLOB',
      253: 'VARCHAR',
      254: 'CHAR',
      255: 'GEOMETRY'
   }

   constructor (args: antares.ClientParams) {
      super(args);

      this._schema = null;
      this._connections = new MySQLConnections(this._params, this._poolSize);
   }

   private _getType (field: mysql.FieldPacket & { columnType?: number; columnLength?: number }) {
      let name = this.types[field.columnType];
      let length = field.columnLength;

      if (['DATE', 'TIME', 'YEAR', 'DATETIME'].includes(name))
         length = field.decimals;

      if (name === 'TIMESTAMP')
         length = 0;

      if (field.charsetNr === 63) { // if binary
         if (name === 'CHAR')
            name = 'BINARY';
         else if (name === 'VARCHAR')
            name = 'VARBINARY';
      }

      if (name === 'BLOB') {
         switch (length) {
            case 765:
               name = 'TYNITEXT';
               break;
            case 196605:
               name = 'TEXT';
               break;
            case 50331645:
               name = 'MEDIUMTEXT';
               break;
            case 4294967295:
               name = field.charsetNr === 63 ? 'LONGBLOB' : 'LONGTEXT';
               break;
            case 255:
               name = 'TINYBLOB';
               break;
            case 65535:
               name = 'BLOB';
               break;
            case 16777215:
               name = 'MEDIUMBLOB';
               break;
            default:
               name = field.charsetNr === 63 ? 'BLOB' : 'TEXT';
         }
      }

      return { name, length };
   }

   getTypeInfo (type: string): antares.TypeInformations {
      return this._ddl.getTypeInfo(type);
   }

   getDbConfig () {
      return this._connections.getDbConfig();
   }

   connect () {
      return this._connections.connect();
   }

   ping () {
      return this.select('1+1').run();
   }

   destroy () {
      this._connections.destroy();
   }

   getSingleConnection () {
      return this._connections.createConnection();
   }

   getConnectionPool () {
      return this._connections.createPool();
   }

   /** Connection for a query (used by the exporter to stream rows: release it when done) */
   async getConnection (args?: antares.QueryParams) {
      return (await this._connections.acquire(args)).connection;
   }

   use (schema: string) {
      this._schema = schema;
      return this.raw(`USE \`${schema}\``);
   }

   async getStructure (schemas: Set<string>) {
      /* eslint-disable camelcase */
      interface ShowTableResult {
         TABLE_SCHEMA?: string;
         TABLE_NAME: string;
         TABLE_TYPE: string;
         TABLE_ROWS: number;
         ENGINE: string;
         DATA_LENGTH: number;
         INDEX_LENGTH: number;
         TABLE_COLLATION: string;
         TABLE_COMMENT: string;
      }

      interface ShowTriggersResult {
         Db?: string;
         Trigger: string;
         Event: string;
         Table: string;
         Statement: string;
         Timing: string;
         Created: Date;
         sql_mode: string;
         Definer: string;
         character_set_client: string;
         collation_connection: string;
         'Database Collation': string;
      }
      /* eslint-enable camelcase */

      const { rows: databases } = await this.raw<antares.QueryResult<{ Database: string}>>('SHOW DATABASES');

      let filteredDatabases = databases;

      if (this._params.schema)
         filteredDatabases = filteredDatabases.filter(db => db.Database === this._params.schema);

      /* eslint-disable @typescript-eslint/no-explicit-any */
      let functions: any[] = [];
      let procedures: any[] = [];
      let schedulers: any[] = [];
      /* eslint-enable @typescript-eslint/no-explicit-any */

      // Only the routines/events of the requested schemas
      const schemaList = [...schemas].map(schema => this._dialect.quoteString(schema)).join(', ');

      if (schemaList) {
         try {
            const { rows: functionRows } = await this.raw(`SHOW FUNCTION STATUS WHERE \`Db\` IN (${schemaList})`);
            const { rows: procedureRows } = await this.raw(`SHOW PROCEDURE STATUS WHERE \`Db\` IN (${schemaList})`);
            functions = functionRows;
            procedures = procedureRows;
         }
         catch (err) {
            this._logger({ content: err.sqlMessage, cUid: this._cUid, level: 'error' });
         }

         try { // Avoid exception with event_scheduler DISABLED with MariaDB 10
            const { rows } = await this.raw(`SELECT *, EVENT_SCHEMA AS \`Db\`, EVENT_NAME AS \`Name\` FROM information_schema.\`EVENTS\` WHERE EVENT_SCHEMA IN (${schemaList})`);
            schedulers = rows;
         }
         catch (err) {
            console.log(err);
         }
      }

      const tablesArr: ShowTableResult[] = [];
      const triggersArr: ShowTriggersResult[] = [];
      let schemaSize = 0;

      const showTableSize = !!this._params.showTableSize;

      for (const db of filteredDatabases) {
         if (!schemas.has(db.Database)) continue;

         if (showTableSize) {
            let { rows: tables } = await this.raw<antares.QueryResult<ShowTableResult>>(`
               SELECT
                  TABLE_NAME,
                  TABLE_TYPE,
                  ENGINE,
                  DATA_LENGTH,
                  INDEX_LENGTH,
                  TABLE_COMMENT,
                  TABLE_COLLATION, 
                  CREATE_TIME,
                  UPDATE_TIME
               FROM information_schema.TABLES
               WHERE TABLE_SCHEMA = "${db.Database}"
               ORDER BY TABLE_NAME
            `);

            if (tables.length) {
               tables = tables.map(table => {
                  table.TABLE_SCHEMA = db.Database;
                  return table;
               });
               tablesArr.push(...tables);
            }
         }
         else {
            let { rows: tables } = await this.raw<antares.QueryResult<ShowTableResult>>(`SHOW FULL TABLES FROM \`${db.Database}\``);

            if (tables.length) {
               tables = tables.map(table => {
                  const [name, type] = Object.values(table);
                  table.TABLE_SCHEMA = db.Database;
                  table.TABLE_NAME = name;
                  table.TABLE_TYPE = type;
                  return table;
               });
               tablesArr.push(...tables);
            }
         }

         let { rows: triggers } = await this.raw<antares.QueryResult<ShowTriggersResult>>(`SHOW TRIGGERS FROM \`${db.Database}\``);
         if (triggers.length) {
            triggers = triggers.map(trigger => {
               trigger.Db = db.Database;
               return trigger;
            });
            triggersArr.push(...triggers);
         }
      }

      return filteredDatabases.map(db => {
         if (schemas.has(db.Database)) {
            // TABLES
            const remappedTables: antares.TableInfos[] = tablesArr.filter(table => table.TABLE_SCHEMA === db.Database).map(table => {
               let tableType;
               switch (table.TABLE_TYPE) {
                  case 'VIEW':
                     tableType = 'view';
                     break;
                  default:
                     tableType = 'table';
                     break;
               }

               const tableSize = Number(table.DATA_LENGTH) + Number(table.INDEX_LENGTH);
               schemaSize += tableSize;

               return {
                  name: table.TABLE_NAME,
                  type: tableType,
                  rows: table.TABLE_ROWS,
                  engine: table.ENGINE,
                  comment: table.TABLE_COMMENT,
                  size: tableSize,
                  collation: table.TABLE_COLLATION
               };
            });

            // PROCEDURES
            const remappedProcedures: antares.RoutineInfos[] = procedures.filter(procedure => procedure.Db === db.Database).map(procedure => {
               return {
                  name: procedure.Name,
                  type: procedure.Type,
                  definer: procedure.Definer,
                  created: procedure.Created,
                  updated: procedure.Modified,
                  comment: procedure.Comment,
                  charset: procedure.character_set_client,
                  security: procedure.Security_type
               };
            });

            // FUNCTIONS
            const remappedFunctions: antares.FunctionInfos[] = functions.filter(func => func.Db === db.Database).map(func => {
               return {
                  name: func.Name,
                  type: func.Type,
                  definer: func.Definer,
                  created: func.Created,
                  updated: func.Modified,
                  comment: func.Comment,
                  charset: func.character_set_client,
                  security: func.Security_type
               };
            });

            // SCHEDULERS
            const remappedSchedulers: antares.EventInfos[] = schedulers.filter(scheduler => scheduler.Db === db.Database).map(scheduler => {
               return {
                  name: scheduler.EVENT_NAME,
                  schema: scheduler.Db,
                  sql: scheduler.EVENT_DEFINITION,
                  execution: scheduler.EVENT_TYPE === 'RECURRING' ? 'EVERY' : 'ONCE',
                  definer: scheduler.DEFINER,
                  starts: scheduler.STARTS,
                  ends: scheduler.ENDS,
                  state: scheduler.STATUS === 'ENABLED' ? 'ENABLE' : scheduler.STATE === 'DISABLED' ? 'DISABLE' : 'DISABLE ON SLAVE',
                  enabled: scheduler.STATUS === 'ENABLED',
                  at: scheduler.EXECUTE_AT,
                  every: [scheduler.INTERVAL_FIELD, scheduler.INTERVAL_VALUE],
                  preserve: scheduler.ON_COMPLETION.includes('PRESERVE'),
                  comment: scheduler.EVENT_COMMENT
               };
            });

            // TRIGGERS
            const remappedTriggers: antares.TriggerInfos[] = triggersArr.filter(trigger => trigger.Db === db.Database).map(trigger => {
               return {
                  name: trigger.Trigger,
                  statement: trigger.Statement,
                  timing: trigger.Timing,
                  definer: trigger.Definer,
                  event: trigger.Event,
                  table: trigger.Table,
                  sqlMode: trigger.sql_mode,
                  created: trigger.Created,
                  charset: trigger.character_set_client
               };
            });

            return {
               name: db.Database,
               size: schemaSize,
               tables: remappedTables,
               functions: remappedFunctions,
               procedures: remappedProcedures,
               triggers: remappedTriggers,
               schedulers: remappedSchedulers
            };
         }
         else {
            return {
               name: db.Database,
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
      interface CreateTableResult {
         'Create Table'?: string;
         Table: string;
      }

      const { rows } = await this
         .select('*')
         .schema('information_schema')
         .from('COLUMNS')
         .where({ TABLE_SCHEMA: `= '${schema}'`, TABLE_NAME: `= '${table}'` })
         .orderBy({ ORDINAL_POSITION: 'ASC' })
         .run<ColumnRow>();

      let fields: CreateTableResult[] = [];
      try {
         const { rows } = await this.raw<antares.QueryResult<CreateTableResult>>(`SHOW CREATE TABLE \`${schema}\`.\`${table}\``);
         fields = rows;
      }
      catch (_) {}

      const createColumns = parseCreateTableColumns(fields[0]?.['Create Table']);

      return rows.map(field => mapColumn(field, createColumns));
   }

   async getTableApproximateCount ({ schema, table }: { schema: string; table: string }): Promise<number> {
      const { rows } = await this.raw(`SELECT table_rows "count" FROM information_schema.tables WHERE table_name = "${table}" AND table_schema = "${schema}"`);

      return rows.length ? rows[0].count : 0;
   }

   async getTableChecks ({ schema, table }: { schema: string; table: string }): Promise<antares.TableCheck[] | false> {
      const { rows: checkTableExists } = await this.raw('SELECT table_name FROM information_schema.tables WHERE table_schema = "information_schema" AND table_name = "CHECK_CONSTRAINTS"');

      if (!checkTableExists.length)// check if CHECK_CONSTRAINTS table exists
         return false;

      const { rows } = await this.raw(`
            SELECT 
               CONSTRAINT_NAME as name, 
               CHECK_CLAUSE as clausole 
            FROM information_schema.CHECK_CONSTRAINTS 
            WHERE CONSTRAINT_SCHEMA = "${schema}" 
            AND CONSTRAINT_NAME IN (
               SELECT
                  CONSTRAINT_NAME
               FROM
                  information_schema.TABLE_CONSTRAINTS
               WHERE
                  TABLE_SCHEMA = "${schema}"
                  AND TABLE_NAME = "${table}"
                  AND CONSTRAINT_TYPE = 'CHECK'
            )
         `);

      if (rows.length) {
         return rows.map(row => ({
            name: row.name,
            clause: row.clausole
         }));
      }
      return [];
   }

   async getTableOptions ({ schema, table }: { schema: string; table: string }) {
      /* eslint-disable camelcase */
      interface TableOptionsResult {
         Name: string;
         Rows: string;
         Create_time: string;
         Update_time: string;
         Engine: string;
         Data_length: number;
         Index_length: number;
         Auto_increment: string;
         Collation: string;
         Comment: string;
      }
      /* eslint-enable camelcase */

      const { rows } = await this.raw<antares.QueryResult<TableOptionsResult>>(`SHOW TABLE STATUS FROM \`${schema}\` WHERE Name = '${table}'`);

      if (rows.length) {
         let tableType;
         switch (rows[0].Comment) {
            case 'VIEW':
               tableType = 'view';
               break;
            default:
               tableType = 'table';
               break;
         }

         return {
            name: rows[0].Name,
            type: tableType,
            rows: rows[0].Rows,
            created: rows[0].Create_time,
            updated: rows[0].Update_time,
            engine: rows[0].Engine,
            comment: rows[0].Comment,
            size: rows[0].Data_length + rows[0].Index_length,
            autoIncrement: rows[0].Auto_increment,
            collation: rows[0].Collation
         };
      }
      return {};
   }

   async getTableIndexes ({ schema, table }: { schema: string; table: string }) {
      /* eslint-disable camelcase */
      interface ShowIntexesResult {
         Non_unique: number;
         Column_name: string;
         Index_type: string;
         Key_name: string;
         Cardinality: number;
         Comment: string;
         Index_comment: string;
      }
      /* eslint-enable camelcase */

      const { rows } = await this.raw<antares.QueryResult<ShowIntexesResult>>(`SHOW INDEXES FROM \`${table}\` FROM \`${schema}\``);

      return rows.map(row => {
         return {
            unique: !Number(row.Non_unique),
            name: row.Key_name,
            column: row.Column_name,
            indexType: row.Index_type,
            type: row.Key_name === 'PRIMARY' ? 'PRIMARY' : !Number(row.Non_unique) ? 'UNIQUE' : row.Index_type === 'FULLTEXT' ? 'FULLTEXT' : 'INDEX',
            cardinality: row.Cardinality,
            comment: row.Comment,
            indexComment: row.Index_comment
         };
      });
   }

   async getTableDll ({ schema, table }: { schema: string; table: string }) {
      const { rows } = await this.raw<antares.QueryResult<{
         'Create Table'?: string;
         Table: string;
      }>>(`SHOW CREATE TABLE \`${schema}\`.\`${table}\``);

      if (rows.length)
         return rows[0]['Create Table'];
      else return '';
   }

   async getKeyUsage ({ schema, table }: { schema: string; table: string }) {
      interface KeyResult {
         TABLE_SCHEMA: string;
         TABLE_NAME: string;
         COLUMN_NAME: string;
         ORDINAL_POSITION: number;
         POSITION_IN_UNIQUE_CONSTRAINT: number;
         CONSTRAINT_NAME: string;
         REFERENCED_TABLE_SCHEMA: string;
         REFERENCED_TABLE_NAME: string;
         REFERENCED_COLUMN_NAME: string;
      }

      interface KeyExtraResult {
         CONSTRAINT_NAME: string;
         UPDATE_RULE: string;
         DELETE_RULE: string;
      }

      const { rows } = await this
         .select('*')
         .schema('information_schema')
         .from('KEY_COLUMN_USAGE')
         .where({ TABLE_SCHEMA: `= '${schema}'`, TABLE_NAME: `= '${table}'`, REFERENCED_TABLE_NAME: 'IS NOT NULL' })
         .run<KeyResult>();

      const { rows: extras } = await this
         .select('*')
         .schema('information_schema')
         .from('REFERENTIAL_CONSTRAINTS')
         .where({ CONSTRAINT_SCHEMA: `= '${schema}'`, TABLE_NAME: `= '${table}'`, REFERENCED_TABLE_NAME: 'IS NOT NULL' })
         .run<KeyExtraResult>();

      return rows.map(field => {
         const extra = extras.find(x => x.CONSTRAINT_NAME === field.CONSTRAINT_NAME);
         return {
            schema: field.TABLE_SCHEMA,
            table: field.TABLE_NAME,
            field: field.COLUMN_NAME,
            position: field.ORDINAL_POSITION,
            constraintPosition: field.POSITION_IN_UNIQUE_CONSTRAINT,
            constraintName: field.CONSTRAINT_NAME,
            refSchema: field.REFERENCED_TABLE_SCHEMA,
            refTable: field.REFERENCED_TABLE_NAME,
            refField: field.REFERENCED_COLUMN_NAME,
            onUpdate: extra.UPDATE_RULE,
            onDelete: extra.DELETE_RULE
         } as antares.QueryForeign;
      });
   }

   async getUsers () {
      const { rows } = await this.raw('SELECT `user` as \'user\', `host` as \'host\', authentication_string AS `password` FROM `mysql`.`user`');

      return rows.map(row => {
         return {
            name: row.user,
            host: row.host,
            password: row.password
         } as {name: string; host: string; password: string};
      });
   }

   async createSchema (params: { name: string; collation: string }) {
      return await this.raw(this._ddl.createSchema(params));
   }

   async alterSchema (params: { name: string; collation: string }) {
      return await this.raw(this._ddl.alterSchema(params));
   }

   async dropSchema (params: { database: string }) {
      return await this.raw(this._ddl.dropSchema(params));
   }

   async getDatabaseCollation (params: { database: string }) {
      let collation: string;
      const { rows: collaitons } = await this.raw<antares.QueryResult<{DEFAULT_COLLATION_NAME: string}>>(`SELECT \`DEFAULT_COLLATION_NAME\` FROM \`information_schema\`.\`SCHEMATA\` WHERE \`SCHEMA_NAME\`='${params.database}'`);

      if (collaitons.length)
         collation = collaitons[0].DEFAULT_COLLATION_NAME;

      return collation;
   }

   async createTable (params: antares.CreateTableParams) {
      return await this.raw(this._ddl.createTable(params));
   }

   async alterTable (params: antares.AlterTableParams) {
      return await this.raw(this._ddl.alterTable(params));
   }

   async duplicateTable (params: { schema: string; table: string }) {
      return await this.raw(this._ddl.duplicateTable(params));
   }

   async truncateTable (params: { schema: string; table: string; force: boolean }) {
      return await this.raw(this._ddl.truncateTable(params));
   }

   async dropTable (params: { schema: string; table: string }) {
      return await this.raw(this._ddl.dropTable(params));
   }

   async getViewInformations ({ schema, view }: { schema: string; view: string }) {
      const { rows: algorithm } = await this.raw(`SHOW CREATE VIEW \`${schema}\`.\`${view}\``);
      const { rows: viewInfo } = await this.raw(`
          SELECT * 
          FROM INFORMATION_SCHEMA.VIEWS
          WHERE TABLE_SCHEMA = '${schema}' 
          AND TABLE_NAME = '${view}'
       `);

      return {
         algorithm: parseViewAlgorithm(algorithm[0]['Create View']),
         definer: viewInfo[0].DEFINER.split('@').map((str: string) => `\`${str}\``).join('@'),
         security: viewInfo[0].SECURITY_TYPE,
         updateOption: viewInfo[0].CHECK_OPTION === 'NONE' ? '' : viewInfo[0].CHECK_OPTION,
         sql: viewInfo[0].VIEW_DEFINITION,
         name: viewInfo[0].TABLE_NAME
      };
   }

   async dropView (params: { schema: string; view: string }) {
      return await this.raw(this._ddl.dropView(params));
   }

   async alterView (params: { view: antares.AlterViewParams }) {
      return await this.raw(this._ddl.alterView(params));
   }

   async createView (params: antares.CreateViewParams) {
      return await this.raw(this._ddl.createView(params));
   }

   async getTriggerInformations ({ schema, trigger }: { schema: string; trigger: string }) {
      const sql = `SHOW CREATE TRIGGER \`${schema}\`.\`${trigger}\``;
      const results = await this.raw(sql);

      return results.rows.map(row => parseTrigger(row['SQL Original Statement'], row.Trigger))[0];
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

   async getRoutineInformations ({ schema, routine }: { schema: string; routine: string }) {
      interface CreateProcedureResult {
         'Create Procedure'?: string;
         Procedure: string;
      }

      interface ProcedureParamsResult {
         PARAMETER_NAME: string;
         DATA_TYPE: string;
         NUMERIC_PRECISION: string;
         DATETIME_PRECISION: string;
         CHARACTER_MAXIMUM_LENGTH: string;
         PARAMETER_MODE: string;
      }

      const results = await this.raw<antares.QueryResult<CreateProcedureResult>>(`SHOW CREATE PROCEDURE \`${schema}\`.\`${routine}\``);

      return results.rows.map(async row => {
         if (!row['Create Procedure']) {
            return {
               definer: null as string,
               sql: '',
               parameters: [] as antares.FunctionParam[],
               name: row.Procedure,
               comment: '',
               security: 'DEFINER',
               deterministic: false,
               dataAccess: 'CONTAINS SQL'
            };
         }

         const sql = `SELECT * 
            FROM information_schema.parameters 
            WHERE SPECIFIC_NAME = '${routine}'
            AND SPECIFIC_SCHEMA = '${schema}'
            ORDER BY ORDINAL_POSITION
         `;

         const results = await this.raw<antares.QueryResult<ProcedureParamsResult>>(sql);

         const parameters = results.rows.map(row => {
            return {
               name: row.PARAMETER_NAME,
               type: row.DATA_TYPE.toUpperCase(),
               length: row.NUMERIC_PRECISION || row.DATETIME_PRECISION || row.CHARACTER_MAXIMUM_LENGTH || '',
               context: row.PARAMETER_MODE
            };
         });

         const { definer, sql: body, comment, security, deterministic, dataAccess } = parseRoutine(row['Create Procedure']);

         return {
            definer,
            sql: body,
            parameters: parameters || [],
            name: row.Procedure,
            comment,
            security,
            deterministic,
            dataAccess
         };
      })[0];
   }

   async dropRoutine (params: { schema: string; routine: string }) {
      return await this.raw(this._ddl.dropRoutine(params));
   }

   async alterRoutine ({ routine }: {routine: antares.AlterRoutineParams}) {
      const tempProcedure = Object.assign({}, routine);
      tempProcedure.name = `Antares_${tempProcedure.name}_tmp`;

      try {
         await this.createRoutine(tempProcedure);
         await this.dropRoutine({ schema: routine.schema, routine: tempProcedure.name });
         await this.dropRoutine({ schema: routine.schema, routine: routine.oldName });
         await this.createRoutine(routine);
      }
      catch (err) {
         return Promise.reject(err);
      }
   }

   async createRoutine (params: antares.CreateRoutineParams) {
      return await this.raw(this._ddl.createRoutine(params), { split: false });
   }

   async getFunctionInformations ({ schema, func }: { schema: string; func: string }) {
      interface CreateFunctionResult {
         'Create Function'?: string;
         Function: string;
      }

      interface FunctionParamsResult {
         PARAMETER_NAME: string;
         DATA_TYPE: string;
         NUMERIC_PRECISION: string;
         DATETIME_PRECISION: string;
         CHARACTER_MAXIMUM_LENGTH: string;
         PARAMETER_MODE: string;
      }

      const results = await this.raw<antares.QueryResult<CreateFunctionResult>>(`SHOW CREATE FUNCTION \`${schema}\`.\`${func}\``);

      return results.rows.map(async row => {
         if (!row['Create Function']) {
            return {
               definer: null as string,
               sql: '',
               parameters: [] as antares.FunctionParam[],
               name: row.Function,
               comment: '',
               security: 'DEFINER',
               deterministic: false,
               dataAccess: 'CONTAINS SQL',
               returns: 'INT',
               returnsLength: null as number
            };
         }

         const sql = `SELECT * 
            FROM information_schema.parameters 
            WHERE SPECIFIC_NAME = '${func}'
            AND SPECIFIC_SCHEMA = '${schema}'
            ORDER BY ORDINAL_POSITION
         `;

         const results = await this.raw<antares.QueryResult<FunctionParamsResult>>(sql);

         const parameters = results.rows.filter(row => row.PARAMETER_MODE).map(row => {
            return {
               name: row.PARAMETER_NAME,
               type: row.DATA_TYPE.toUpperCase(),
               length: row.NUMERIC_PRECISION || row.DATETIME_PRECISION || row.CHARACTER_MAXIMUM_LENGTH || '',
               context: row.PARAMETER_MODE
            };
         });

         const { definer, sql: body, comment, security, deterministic, dataAccess, returns } = parseRoutine(row['Create Function']);

         return {
            definer,
            sql: body,
            parameters: parameters || [],
            name: row.Function,
            comment,
            security,
            deterministic,
            dataAccess,
            ...parseReturnType(returns)
         };
      })[0];
   }

   async dropFunction (params: { schema: string; func: string }) {
      return await this.raw(this._ddl.dropFunction(params));
   }

   async alterFunction ({ func }: { func: antares.AlterFunctionParams }) {
      const tempProcedure = Object.assign({}, func);
      tempProcedure.name = `Antares_${tempProcedure.name}_tmp`;

      try {
         await this.createFunction(tempProcedure);
         await this.dropFunction({ schema: func.schema, func: tempProcedure.name });
         await this.dropFunction({ schema: func.schema, func: func.oldName });
         await this.createFunction(func);
      }
      catch (err) {
         return Promise.reject(err);
      }
   }

   async createFunction (params: antares.CreateFunctionParams) {
      return await this.raw(this._ddl.createFunction(params), { split: false });
   }

   async getEventInformations ({ schema, scheduler }: { schema: string; scheduler: string }) {
      interface CreateFunctionResult {
         'Create Event'?: string;
         Event: string;
      }

      const results = await this.raw<antares.QueryResult<CreateFunctionResult>>(`SHOW CREATE EVENT \`${schema}\`.\`${scheduler}\``);

      return results.rows.map(row => parseEvent(row['Create Event'], row.Event))[0];
   }

   async dropEvent (params: { schema: string; scheduler: string }) {
      return await this.raw(this._ddl.dropEvent(params));
   }

   async alterEvent (params: { scheduler: antares.AlterEventParams }) {
      return await this.raw(this._ddl.alterEvent(params), { split: false });
   }

   async createEvent (params: antares.CreateEventParams) {
      return await this.raw(this._ddl.createEvent(params), { split: false });
   }

   async enableEvent (params: { schema: string; scheduler: string }) {
      return await this.raw(this._ddl.enableEvent(params), { split: false });
   }

   async disableEvent (params: { schema: string; scheduler: string }) {
      return await this.raw(this._ddl.disableEvent(params), { split: false });
   }

   async getCollations () {
      interface ShowCollationResult {
         // MariaDB 10.10+ lists charset-independent collations (uca1400_*) with NULL Charset, Id and Default
         Charset: string | null;
         Collation: string;
         Compiled: string | null;
         Default: string | null;
         Id: number | null;
         Sortlen: number;
      }

      const { rows } = await this.raw<antares.QueryResult<ShowCollationResult>>('SHOW COLLATION');

      return rows.map(row => {
         return {
            charset: row.Charset,
            collation: row.Collation,
            compiled: !!row.Compiled?.includes('Yes'),
            default: !!row.Default?.includes('Yes'),
            id: row.Id,
            sortLen: row.Sortlen
         };
      });
   }

   async getVariables () {
      interface ShowVariablesResult {
         // eslint-disable-next-line camelcase
         Variable_name: string;
         Value: string;
      }

      const { rows } = await this.raw<antares.QueryResult<ShowVariablesResult>>('SHOW VARIABLES');

      return rows.map(row => {
         return {
            name: row.Variable_name,
            value: row.Value
         };
      });
   }

   async getVariable (variable: string, level?: 'global' | 'session') {
      const sql = `SHOW${level ? ' ' + level.toUpperCase() : ''} VARIABLES LIKE '%${variable}%'`;
      const { rows } = await this.raw(sql);

      if (rows.length) {
         return {
            name: rows[0].Variable_name,
            value: rows[0].Value
         };
      }
   }

   async getEngines () {
      const sql = 'SHOW ENGINES';
      const { rows } = await this.raw(sql);

      return rows.map(row => {
         return {
            name: row.Engine,
            support: row.Support,
            comment: row.Comment,
            transactions: row.Transactions,
            xa: row.XA,
            savepoints: row.Savepoints,
            isDefault: row.Support.includes('DEFAULT')
         } as {
            name: string;
            support: string;
            comment: string;
            transactions: string;
            xa: string;
            savepoints: string;
            isDefault: boolean;
         };
      });
   }

   async getVersion () {
      const sql = 'SHOW VARIABLES LIKE \'%vers%\'';
      const { rows } = await this.raw(sql);

      return rows.reduce((acc, curr) => {
         switch (curr.Variable_name) {
            case 'version':
               acc.number = curr.Value.split('-')[0];
               break;
            case 'version_comment':
               acc.name = curr.Value.replace('(GPL)', '');
               break;
            case 'version_compile_machine':
               acc.arch = curr.Value;
               break;
            case 'version_compile_os':
               acc.os = curr.Value;
               break;
         }
         return acc;
      }, {}) as {
         number: string;
         name: string;
         arch: string;
         os: string;
      };
   }

   async getProcesses () {
      const sql = 'SELECT `ID`, `USER`, `HOST`, `DB`, `COMMAND`, `TIME`, `STATE`, LEFT(`INFO`, 51200) AS `INFO` FROM `information_schema`.`PROCESSLIST`';

      const { rows } = await this.raw(sql);

      return rows.map(row => {
         return {
            id: row.ID,
            user: row.USER,
            host: row.HOST,
            db: row.DB,
            command: row.COMMAND,
            time: row.TIME,
            state: row.STATE,
            info: row.INFO
         } as {
            id: number;
            user: string;
            host: string;
            db: string;
            command: string;
            time: number;
            state: string;
            info: string;
         };
      });
   }

   async killProcess (id: number) {
      return await this.raw(this._ddl.killProcess(id));
   }

   async killTabQuery (tabUid: string) {
      const id = this._connections.runningId(tabUid);
      if (id)
         return await this.killProcess(id);
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
         sql = removeComments(sql);

      const nestTables = args.nest ? '.' : false;
      const resultsArr: antares.QueryResult[] = [];
      let paramsArr = [];
      const queries = args.split
         ? this._querySplitter(sql, 'mysql')
         : [sql];

      const lease = await this._connections.acquire(args);
      const connection = lease.connection;

      for (const query of queries) {
         if (!query) continue;
         const timeStart = new Date();
         let timeStop: Date;
         let keysArr: antares.QueryForeign[] = [];

         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         const { rows, report, fields, keys, duration }: any = await new Promise((resolve, reject) => {
            connection.query({ sql: query, nestTables }).then(async ([response, fields]) => {
               timeStop = new Date();
               const queryResult = response;
               const fieldsArr = fields ? Array.isArray(fields[0]) ? fields[0] : fields : false;// Some times fields are nested in an array

               let remappedFields = fieldsArr
                  ? fieldsArr.map(field => {
                     if (!field || Array.isArray(field))
                        return undefined;

                     const type = this._getType(field as undefined);

                     return {
                        name: field.orgName,
                        alias: field.name,
                        orgName: field.orgName,
                        schema: args.schema || (field as mysql.FieldPacket & {schema: string}).schema,
                        table: field.table,
                        tableAlias: field.table,
                        orgTable: field.orgTable,
                        type: type.name,
                        length: type.length
                     };
                  }).filter(Boolean)
                  : [];

               if (args.details) {
                  let cachedTable: string;

                  if (remappedFields.length) {
                     paramsArr = remappedFields.map(field => {
                        if (field.orgTable) cachedTable = field.orgTable;// Needed for some queries on information_schema
                        return {
                           table: field.orgTable || cachedTable,
                           schema: field.schema || 'INFORMATION_SCHEMA'
                        };
                     }).filter((val, i, arr) => arr.findIndex(el => el.schema === val.schema && el.table === val.table) === i);

                     for (const paramObj of paramsArr) {
                        if (!paramObj.table || !paramObj.schema) continue;

                        try { // Column details
                           const response = await this.getTableColumns(paramObj);
                           remappedFields = remappedFields.map(field => {
                              const detailedField = response.find(f => f.name === field.name);
                              if (detailedField && field.orgTable === paramObj.table && field.schema === paramObj.schema)
                                 field = { ...field, ...detailedField };
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

               resolve({
                  duration: timeStop.getTime() - timeStart.getTime(),
                  rows: Array.isArray(queryResult) ? queryResult.some(el => Array.isArray(el)) ? queryResult[0] : queryResult : false,
                  report: !Array.isArray(queryResult) ? queryResult : false,
                  fields: remappedFields,
                  keys: keysArr
               });
            }).catch((err) => {
               lease.release();
               reject(err);
            });
         });

         resultsArr.push({
            rows,
            report,
            fields,
            keys,
            duration
         });
      }

      lease.release();

      const result = resultsArr.length === 1 ? resultsArr[0] : resultsArr;

      return result as unknown as T;
   }
}
