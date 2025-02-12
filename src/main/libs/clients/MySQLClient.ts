import SSH2Promise = require('@fabio286/ssh2-promise');
import SSHConfig from '@fabio286/ssh2-promise/lib/sshConfig';
import dataTypes from 'common/data-types/mysql';
import * as antares from 'common/interfaces/antares';
import * as mysql from 'mysql2/promise';

import * as EncodingToCharset from '../../../../node_modules/mysql2/lib/constants/encoding_charset.js';
import { BaseClient } from './BaseClient';
EncodingToCharset.utf8mb3 = 192; // To fix https://github.com/sidorares/node-mysql2/issues/1398 until not included in mysql2

export class MySQLClient extends BaseClient {
   private _schema?: string;
   private _runningConnections: Map<string, number>;
   private _connectionsToCommit: Map<string, mysql.Connection | mysql.PoolConnection>;
   private _keepaliveTimer: NodeJS.Timer;
   private _keepaliveMs: number;
   private sqlMode?: string[];
   _connection?: mysql.Connection | mysql.Pool;
   _params: mysql.ConnectionOptions & {schema: string; ssl?: mysql.SslOptions; ssh?: SSHConfig; readonly: boolean};

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
      this._runningConnections = new Map();
      this._connectionsToCommit = new Map();
      this._keepaliveMs = 10*60*1000;
   }

   private get isPool () {
      return 'getConnection' in this._connection;
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
      return dataTypes
         .reduce((acc, group) => [...acc, ...group.types], [])
         .filter((_type) => _type.name === type.toUpperCase())[0];
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
                  clausoles.push(`\`${key}\` ${curr[key]}`);

               return clausoles;
            }
      }
   }

   async getDbConfig (): Promise<mysql.ConnectionOptions> {
      const dbConfig = {
         host: this._params.host,
         port: this._params.port,
         user: this._params.user,
         password: this._params.password,
         database: undefined as string | undefined,
         ssl: null as mysql.SslOptions,
         supportBigNumbers: true,
         bigNumberStrings: true
      };

      if (this._params.schema?.length) dbConfig.database = this._params.schema;

      if (this._params.ssl) dbConfig.ssl = this._params.ssl;

      if (this._params.ssh) {
         try {
            if (this._params.ssh.password === '') delete this._params.ssh.password;
            if (this._params.ssh.passphrase === '') delete this._params.ssh.passphrase;

            this._ssh = new SSH2Promise({
               ...this._params.ssh,
               reconnect: true,
               reconnectTries: 3,
               debug: process.env.NODE_ENV !== 'production' ? (s) => console.log(s) : null
            });

            const tunnel = await this._ssh.addTunnel({
               remoteAddr: this._params.host,
               remotePort: this._params.port
            });

            dbConfig.host = this._ssh.config[0].host;
            dbConfig.port = tunnel.localPort;
         }
         catch (err) {
            if (this._ssh) {
               this._ssh.close();
               this._ssh.closeTunnel();
            }
            throw err;
         }
      }

      return dbConfig;
   }

   async connect () {
      if (!this._poolSize)
         this._connection = await this.getSingleConnection();
      else
         this._connection = await this.getConnectionPool();

      // ANSI_QUOTES check
      const [response] = await this._connection.query<mysql.RowDataPacket[]>('SHOW GLOBAL VARIABLES LIKE \'%sql_mode%\'');
      this.sqlMode = response[0]?.Value?.split(',');
      const hasAnsiQuotes = this.sqlMode.includes('ANSI') || this.sqlMode.includes('ANSI_QUOTES');

      if (hasAnsiQuotes)
         await this._connection.query(`SET SESSION sql_mode = '${this.sqlMode.filter((m: string) => !['ANSI', 'ANSI_QUOTES'].includes(m)).join(',')}'`);

      if (this._params.readonly)
         await this._connection.query('SET SESSION TRANSACTION READ ONLY');

      if (this._poolSize) {
         const hasAnsiQuotes = this.sqlMode.includes('ANSI') || this.sqlMode.includes('ANSI_QUOTES');

         this._connection.on('connection', conn => {
            if (this._params.readonly)
               conn.query('SET SESSION TRANSACTION READ ONLY');

            if (hasAnsiQuotes)
               conn.query(`SET SESSION sql_mode = '${this.sqlMode.filter((m: string) => !['ANSI', 'ANSI_QUOTES'].includes(m)).join(',')}'`);
         });
      }
   }

   ping () {
      return this.select('1+1').run();
   }

   destroy () {
      this._connection.end();
      clearInterval(this._keepaliveTimer);
      this._keepaliveTimer = undefined;
      if (this._ssh) {
         this._ssh.close();
         this._ssh.closeTunnel();
      }
   }

   async getSingleConnection () {
      const dbConfig = await this.getDbConfig();
      const connection = await mysql.createConnection({
         ...dbConfig,
         dateStrings: true
         // typeCast: (field, next) => {
         //    if (field.type === 'DATETIME')
         //       return field.string();
         //    else
         //       return next();
         // }
      });

      return connection;
   }

   async getConnectionPool () {
      const dbConfig = await this.getDbConfig();
      const connection = mysql.createPool({
         ...dbConfig,
         connectionLimit: this._poolSize,
         enableKeepAlive: true,
         dateStrings: true
         // typeCast: (field, next) => {
         //    if (field.type === 'DATETIME')
         //       return field.string();
         //    else
         //       return next();
         // }
      });

      this._keepaliveTimer = setInterval(async () => {
         await this.keepAlive();
      }, this._keepaliveMs);

      return connection;
   }

   async getConnection (args?: antares.QueryParams, retry?: boolean): Promise<mysql.Pool | mysql.PoolConnection | mysql.Connection> {
      let connection;

      try {
         if (args && !args.autocommit && args.tabUid) { // autocommit OFF
            if (this._connectionsToCommit.has(args.tabUid))
               connection = this._connectionsToCommit.get(args.tabUid);
            else {
               connection = await this.getSingleConnection();
               await connection.query('SET SESSION autocommit=0');
               this._connectionsToCommit.set(args.tabUid, connection);
            }
         }
         else// autocommit ON
            connection = this.isPool ? await (this._connection as mysql.Pool).getConnection() : this._connection;

         if (args && args.tabUid && this.isPool) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this._runningConnections.set(args.tabUid, (connection as any).connection.connectionId);
         }

         if (args && args.schema)
            await connection.query(`USE \`${args.schema}\``);

         return connection;
      }
      catch (error) {
         if (error.code === 'ECONNRESET' && !retry) {
            this.destroy();
            await this.connect();
            return this.getConnection(args, true);
         }
         else if (error instanceof AggregateError)
            throw new Error(error.errors.reduce((acc, curr) => acc +' | '+ curr.message, ''));
         else
            throw new Error(error.message);
      }
   }

   private async keepAlive () {
      try {
         const connection = await (this._connection as mysql.Pool).getConnection();
         await connection.ping();
         connection.release();
      }
      catch (_) {}
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

      try {
         const { rows: functionRows } = await this.raw('SHOW FUNCTION STATUS');
         const { rows: procedureRows } = await this.raw('SHOW PROCEDURE STATUS');
         functions = functionRows;
         procedures = procedureRows;
      }
      catch (err) {
         this._logger({ content: err.sqlMessage, cUid: this._cUid, level: 'error' });
      }

      try { // Avoid exception with event_scheduler DISABLED with MariaDB 10
         const { rows } = await this.raw('SELECT *, EVENT_SCHEMA AS `Db`, EVENT_NAME AS `Name` FROM information_schema.`EVENTS`');
         schedulers = rows;
      }
      catch (err) {
         console.log(err);
      }

      const tablesArr: ShowTableResult[] = [];
      const triggersArr: ShowTriggersResult[] = [];
      let schemaSize = 0;

      const Store = require('electron-store');

      Store.initRenderer();
      const settingsStore = new Store({ name: 'settings' });

      for (const db of filteredDatabases) {
         if (!schemas.has(db.Database)) continue;

         const showTableSize = settingsStore.get('show_table_size', false);

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
      interface TableColumnsResult {
         COLUMN_TYPE: string;
         NUMERIC_PRECISION: number;
         COLUMN_NAME: string;
         COLUMN_DEFAULT: string;
         COLUMN_KEY: string;
         DATA_TYPE: string;
         TABLE_SCHEMA: string;
         TABLE_NAME: string;
         NUMERIC_SCALE: number;
         DATETIME_PRECISION: number;
         CHARACTER_MAXIMUM_LENGTH: number;
         IS_NULLABLE: string;
         ORDINAL_POSITION: number;
         CHARACTER_SET_NAME: string;
         COLLATION_NAME: string;
         EXTRA: string;
         COLUMN_COMMENT: string;
      }

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
         .run<TableColumnsResult>();

      let fields: CreateTableResult[] = [];
      try {
         const { rows } = await this.raw<antares.QueryResult<CreateTableResult>>(`SHOW CREATE TABLE \`${schema}\`.\`${table}\``);
         fields = rows;
      }
      catch (_) {}

      const remappedFields = fields.map(row => {
         if (!row['Create Table']) return false;

         let n = 0;
         return row['Create Table']
            .split('')
            .reduce((acc: string, curr: string) => {
               if (curr === ')') n--;
               if (n !== 0) acc += curr;
               if (curr === '(') n++;
               return acc;
            }, '')
            .replaceAll('\n', '')
            .split(/,\s?(?![^(]*\))/)
            .map((f: string) => {
               try {
                  const fieldArr = f.trim().split(' ');
                  const nameAndType = fieldArr.slice(0, 2);
                  if (nameAndType[0].charAt(0) !== '`') return null;

                  const details = fieldArr.slice(2).join(' ');
                  let defaultValue = null;
                  if (details.includes('DEFAULT'))
                     defaultValue = details.match(/(?<=DEFAULT ).*?$/gs)[0].split(' COMMENT')[0];
                  const typeAndLength = nameAndType[1].replace(')', '').split('(');

                  return {
                     name: nameAndType[0].replaceAll('`', ''),
                     type: typeAndLength[0].toUpperCase(),
                     length: typeAndLength[1] ? typeAndLength[1] : null,
                     default: defaultValue
                  };
               }
               catch (err) {
                  return null;
               }
            })
            .filter(Boolean)
            .reduce((acc: Record<string, { name: string; type: string; length: string; default: string}>, curr) => {
               acc[curr.name] = curr;
               return acc;
            }, {});
      })[0];

      return rows.map((field) => {
         const numLengthMatch = field.COLUMN_TYPE.match(/int\(([^)]+)\)/);
         const numLength = numLengthMatch ? +numLengthMatch.pop() : field.NUMERIC_PRECISION || null;
         const enumValues = /(enum|set)/.test(field.COLUMN_TYPE)
            ? field.COLUMN_TYPE.match(/\(([^)]+)\)/)[0].slice(1, -1)
            : null;

         const defaultValue = (remappedFields && remappedFields[field.COLUMN_NAME])
            ? remappedFields[field.COLUMN_NAME].default
            : field.COLUMN_DEFAULT;

         return {
            name: field.COLUMN_NAME,
            key: field.COLUMN_KEY.toLowerCase(),
            type: (remappedFields && remappedFields[field.COLUMN_NAME])
               ? remappedFields[field.COLUMN_NAME].type
               : field.DATA_TYPE.toUpperCase(),
            schema: field.TABLE_SCHEMA,
            table: field.TABLE_NAME,
            numPrecision: field.NUMERIC_PRECISION,
            numScale: Number(field.NUMERIC_SCALE),
            numLength,
            enumValues,
            datePrecision: field.DATETIME_PRECISION,
            charLength: field.CHARACTER_MAXIMUM_LENGTH,
            nullable: field.IS_NULLABLE.includes('YES'),
            unsigned: field.COLUMN_TYPE.includes('unsigned'),
            zerofill: field.COLUMN_TYPE.includes('zerofill'),
            order: field.ORDINAL_POSITION,
            default: defaultValue,
            charset: field.CHARACTER_SET_NAME,
            collation: field.COLLATION_NAME,
            autoIncrement: field.EXTRA.includes('auto_increment'),
            generated: ['VIRTUAL GENERATED', 'VIRTUAL STORED'].includes(field.EXTRA),
            onUpdate: field.EXTRA.toLowerCase().includes('on update')
               ? field.EXTRA.substr(field.EXTRA.indexOf('on update') + 9, field.EXTRA.length).trim()
               : '',
            comment: field.COLUMN_COMMENT
         };
      });
   }

   async getTableApproximateCount ({ schema, table }: { schema: string; table: string }): Promise<number> {
      const { rows } = await this.raw(`SELECT table_rows "count" FROM information_schema.tables WHERE table_name = "${table}" AND table_schema = "${schema}"`);

      return rows.length ? rows[0].count : 0;
   }

   async getTableChecks ({ schema, table }: { schema: string; table: string }): Promise<antares.TableCheck[]> {
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
      return await this.raw(`CREATE DATABASE \`${params.name}\` COLLATE ${params.collation}`);
   }

   async alterSchema (params: { name: string; collation: string }) {
      return await this.raw(`ALTER DATABASE \`${params.name}\` COLLATE ${params.collation}`);
   }

   async dropSchema (params: { database: string }) {
      return await this.raw(`DROP DATABASE \`${params.database}\``);
   }

   async getDatabaseCollation (params: { database: string }) {
      let collation: string;
      const { rows: collaitons } = await this.raw<antares.QueryResult<{DEFAULT_COLLATION_NAME: string}>>(`SELECT \`DEFAULT_COLLATION_NAME\` FROM \`information_schema\`.\`SCHEMATA\` WHERE \`SCHEMA_NAME\`='${params.database}'`);

      if (collaitons.length)
         collation = collaitons[0].DEFAULT_COLLATION_NAME;

      return collation;
   }

   async createTable (params: antares.CreateTableParams) {
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

      return await this.raw(sql);
   }

   async alterTable (params: antares.AlterTableParams) {
      const {
         table,
         schema,
         additions,
         deletions,
         changes,
         indexChanges,
         foreignChanges,
         checkChanges,
         options
      } = params;

      const sql = `ALTER TABLE \`${schema}\`.\`${table}\` `;
      const alterColumnsAdd: string[] = [];
      const alterColumnsChange: string[] = [];
      const alterColumnsDrop: string[] = [];
      const alterQueryes: string[] = [];

      // OPTIONS
      if ('comment' in options) alterColumnsChange.push(`COMMENT='${options.comment}'`);
      if ('engine' in options) alterColumnsChange.push(`ENGINE=${options.engine}`);
      if ('autoIncrement' in options) alterColumnsChange.push(`AUTO_INCREMENT=${+options.autoIncrement}`);
      if ('collation' in options) alterColumnsChange.push(`COLLATE='${options.collation}'`);

      // ADD FIELDS
      additions.forEach(addition => {
         const typeInfo = this.getTypeInfo(addition.type);
         const length = typeInfo.length ? addition.enumValues || addition.numLength || addition.charLength || addition.datePrecision : false;

         alterColumnsAdd.push(`ADD COLUMN \`${addition.name}\` 
            ${addition.type.toUpperCase()}${length ? `(${length}${addition.numScale ? `,${addition.numScale}` : ''})` : ''} 
            ${addition.unsigned ? 'UNSIGNED' : ''} 
            ${addition.zerofill ? 'ZEROFILL' : ''}
            ${addition.nullable ? 'NULL' : 'NOT NULL'}
            ${addition.autoIncrement ? 'AUTO_INCREMENT' : ''}
            ${addition.default !== null ? `DEFAULT ${addition.default || '\'\''}` : ''}
            ${addition.comment ? `COMMENT '${addition.comment}'` : ''}
            ${addition.collation ? `COLLATE ${addition.collation}` : ''}
            ${addition.onUpdate ? `ON UPDATE ${addition.onUpdate}` : ''}
            ${addition.after ? `AFTER \`${addition.after}\`` : 'FIRST'}`);
      });

      // ADD INDEX
      indexChanges.additions.forEach(addition => {
         const fields = addition.fields.map(field => `\`${field}\``).join(',');
         let type = addition.type;

         if (type === 'PRIMARY')
            alterColumnsAdd.push(`ADD PRIMARY KEY (${fields})`);
         else {
            if (type === 'UNIQUE')
               type = 'UNIQUE INDEX';

            alterColumnsAdd.push(`ADD ${type} \`${addition.name}\` (${fields})`);
         }
      });

      // ADD FOREIGN KEYS
      foreignChanges.additions.forEach(addition => {
         alterColumnsAdd.push(`ADD CONSTRAINT \`${addition.constraintName}\` FOREIGN KEY (\`${addition.field}\`) REFERENCES \`${addition.refTable}\` (\`${addition.refField}\`) ON UPDATE ${addition.onUpdate} ON DELETE ${addition.onDelete}`);
      });

      // ADD TABLE CHECKS
      checkChanges.additions.forEach(addition => {
         if (!addition.clause.trim().length) return;
         alterColumnsAdd.push(`ADD ${addition.name ? `CONSTRAINT \`${addition.name}\` ` : ''}CHECK (${addition.clause})`);
      });

      // CHANGE FIELDS
      changes.forEach(change => {
         const typeInfo = this.getTypeInfo(change.type);
         const length = typeInfo.length ? change.enumValues || change.numLength || change.charLength || change.datePrecision : false;

         alterColumnsChange.push(`CHANGE COLUMN \`${change.orgName}\` \`${change.name}\` 
            ${change.type.toUpperCase()}${length ? `(${length}${change.numScale ? `,${change.numScale}` : ''})` : ''} 
            ${change.unsigned ? 'UNSIGNED' : ''} 
            ${change.zerofill ? 'ZEROFILL' : ''}
            ${change.nullable ? 'NULL' : 'NOT NULL'}
            ${change.autoIncrement ? 'AUTO_INCREMENT' : ''}
            ${change.collation ? `COLLATE ${change.collation}` : ''}
            ${change.default !== null ? `DEFAULT ${change.default || '\'\''}` : ''}
            ${change.comment ? `COMMENT '${change.comment}'` : ''}
            ${change.onUpdate ? `ON UPDATE ${change.onUpdate}` : ''}
            ${change.after ? `AFTER \`${change.after}\`` : 'FIRST'}`);
      });

      // CHANGE INDEX
      indexChanges.changes.forEach(change => {
         if (change.oldType === 'PRIMARY')
            alterColumnsChange.push('DROP PRIMARY KEY');
         else
            alterColumnsChange.push(`DROP INDEX \`${change.oldName}\``);

         const fields = change.fields.map(field => `\`${field}\``).join(',');
         let type = change.type;

         if (type === 'PRIMARY')
            alterColumnsChange.push(`ADD PRIMARY KEY (${fields})`);
         else {
            if (type === 'UNIQUE')
               type = 'UNIQUE INDEX';

            alterColumnsChange.push(`ADD ${type} \`${change.name}\` (${fields})`);
         }
      });

      // CHANGE FOREIGN KEYS
      foreignChanges.changes.forEach(change => {
         alterColumnsChange.push(`DROP FOREIGN KEY \`${change.oldName}\``);
         alterColumnsChange.push(`ADD CONSTRAINT \`${change.constraintName}\` FOREIGN KEY (\`${change.field}\`) REFERENCES \`${change.refTable}\` (\`${change.refField}\`) ON UPDATE ${change.onUpdate} ON DELETE ${change.onDelete}`);
      });

      // CHANGE CHECK TABLE
      checkChanges.changes.forEach(change => {
         if (!change.clause.trim().length) return;
         alterQueryes.push(`${sql} DROP CONSTRAINT \`${change.name}\``);
         alterQueryes.push(`${sql} ADD ${change.name ? `CONSTRAINT \`${change.name}\` ` : ''}CHECK (${change.clause})`);
      });

      // DROP FIELDS
      deletions.forEach(deletion => {
         alterColumnsDrop.push(`DROP COLUMN \`${deletion.name}\``);
      });

      // DROP INDEX
      indexChanges.deletions.forEach(deletion => {
         if (deletion.type === 'PRIMARY')
            alterColumnsDrop.push('DROP PRIMARY KEY');
         else
            alterColumnsDrop.push(`DROP INDEX \`${deletion.name}\``);
      });

      // DROP FOREIGN KEYS
      foreignChanges.deletions.forEach(deletion => {
         alterColumnsDrop.push(`DROP FOREIGN KEY \`${deletion.constraintName}\``);
      });

      // DROP CHECK TABLE
      checkChanges.deletions.forEach(deletion => {
         alterQueryes.push(`${sql} DROP CONSTRAINT \`${deletion.name}\``);
      });

      if (alterColumnsAdd.length) alterQueryes.push(sql+alterColumnsAdd.join(', '));
      if (alterColumnsChange.length) alterQueryes.push(sql+alterColumnsChange.join(', '));
      if (alterColumnsDrop.length) alterQueryes.push(sql+alterColumnsDrop.join(', '));

      // RENAME
      if (options.name) alterQueryes.push(`RENAME TABLE \`${schema}\`.\`${table}\` TO \`${schema}\`.\`${options.name}\``);

      return await this.raw(alterQueryes.join(';'));
   }

   async duplicateTable (params: { schema: string; table: string }) {
      const sql = `CREATE TABLE \`${params.schema}\`.\`${params.table}_copy\` LIKE \`${params.schema}\`.\`${params.table}\``;
      return await this.raw(sql);
   }

   async truncateTable (params: { schema: string; table: string; force: boolean }) {
      let sql = `TRUNCATE TABLE \`${params.schema}\`.\`${params.table}\`;`;
      if (params.force) {
         sql = `
            SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
            ${sql}
            SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1);
         `;
      }
      return await this.raw(sql);
   }

   async dropTable (params: { schema: string; table: string }) {
      const sql = `DROP TABLE \`${params.schema}\`.\`${params.table}\``;
      return await this.raw(sql);
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
         algorithm: algorithm[0]['Create View'].match(/(?<=CREATE ALGORITHM=).*?(?=\s)/gs)[0],
         definer: viewInfo[0].DEFINER.split('@').map((str: string) => `\`${str}\``).join('@'),
         security: viewInfo[0].SECURITY_TYPE,
         updateOption: viewInfo[0].CHECK_OPTION === 'NONE' ? '' : viewInfo[0].CHECK_OPTION,
         sql: viewInfo[0].VIEW_DEFINITION,
         name: viewInfo[0].TABLE_NAME
      };
   }

   async dropView (params: { schema: string; view: string }) {
      const sql = `DROP VIEW \`${params.schema}\`.\`${params.view}\``;
      return await this.raw(sql);
   }

   async alterView ({ view }: { view: antares.AlterViewParams }) {
      let sql = `
         USE \`${view.schema}\`; 
         ALTER ALGORITHM = ${view.algorithm}${view.definer ? ` DEFINER=${view.definer}` : ''} 
         SQL SECURITY ${view.security} 
         VIEW \`${view.schema}\`.\`${view.oldName}\` AS ${view.sql} ${view.updateOption ? `WITH ${view.updateOption} CHECK OPTION` : ''}
      `;

      if (view.name !== view.oldName)
         sql += `; RENAME TABLE \`${view.schema}\`.\`${view.oldName}\` TO \`${view.schema}\`.\`${view.name}\``;

      return await this.raw(sql);
   }

   async createView (params: antares.CreateViewParams) {
      const sql = `CREATE ALGORITHM = ${params.algorithm} ${params.definer ? `DEFINER=${params.definer} ` : ''}SQL SECURITY ${params.security} VIEW \`${params.schema}\`.\`${params.name}\` AS ${params.sql} ${params.updateOption ? `WITH ${params.updateOption} CHECK OPTION` : ''}`;
      return await this.raw(sql);
   }

   async getTriggerInformations ({ schema, trigger }: { schema: string; trigger: string }) {
      const sql = `SHOW CREATE TRIGGER \`${schema}\`.\`${trigger}\``;
      const results = await this.raw(sql);

      return results.rows.map(row => {
         return {
            definer: row['SQL Original Statement'].match(/(?<=DEFINER=).*?(?=\s)/gs)[0],
            sql: row['SQL Original Statement'].match(/(BEGIN|begin)(.*)(END|end)/gs)[0],
            name: row.Trigger,
            table: row['SQL Original Statement'].match(/(?<=ON `).*?(?=`)/gs)[0],
            activation: row['SQL Original Statement'].match(/(BEFORE|AFTER)/gs)[0],
            event: row['SQL Original Statement'].match(/(INSERT|UPDATE|DELETE)/gs)[0]
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
               definer: null,
               sql: '',
               parameters: [],
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

         let dataAccess = 'CONTAINS SQL';
         if (row['Create Procedure'].includes('NO SQL'))
            dataAccess = 'NO SQL';
         if (row['Create Procedure'].includes('READS SQL DATA'))
            dataAccess = 'READS SQL DATA';
         if (row['Create Procedure'].includes('MODIFIES SQL DATA'))
            dataAccess = 'MODIFIES SQL DATA';

         return {
            definer: row['Create Procedure'].match(/(?<=DEFINER=).*?(?=\s)/gs)[0],
            sql: row['Create Procedure'].match(/(BEGIN|begin)(.*)(END|end)/gs)[0],
            parameters: parameters || [],
            name: row.Procedure,
            comment: row['Create Procedure'].match(/(?<=COMMENT ').*?(?=')/gs) ? row['Create Procedure'].match(/(?<=COMMENT ').*?(?=')/gs)[0] : '',
            security: row['Create Procedure'].includes('SQL SECURITY INVOKER') ? 'INVOKER' : 'DEFINER',
            deterministic: row['Create Procedure'].includes('DETERMINISTIC'),
            dataAccess
         };
      })[0];
   }

   async dropRoutine (params: { schema: string; routine: string }) {
      const sql = `DROP PROCEDURE \`${params.schema}\`.\`${params.routine}\``;
      return await this.raw(sql);
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

      return await this.raw(sql, { split: false });
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
               definer: null,
               sql: '',
               parameters: [],
               name: row.Function,
               comment: '',
               security: 'DEFINER',
               deterministic: false,
               dataAccess: 'CONTAINS SQL',
               returns: 'INT',
               returnsLength: null
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

         let dataAccess = 'CONTAINS SQL';
         if (row['Create Function'].includes('NO SQL'))
            dataAccess = 'NO SQL';
         if (row['Create Function'].includes('READS SQL DATA'))
            dataAccess = 'READS SQL DATA';
         if (row['Create Function'].includes('MODIFIES SQL DATA'))
            dataAccess = 'MODIFIES SQL DATA';

         const output = row['Create Function'].match(/(?<=RETURNS ).*?(?=\s)/gs).length ? row['Create Function'].match(/(?<=RETURNS ).*?(?=\s)/gs)[0].replace(')', '').split('(') : ['', null];

         return {
            definer: row['Create Function'].match(/(?<=DEFINER=).*?(?=\s)/gs)[0],
            sql: row['Create Function'].match(/(BEGIN|begin)(.*)(END|end)/gs)[0],
            parameters: parameters || [],
            name: row.Function,
            comment: row['Create Function'].match(/(?<=COMMENT ').*?(?=')/gs) ? row['Create Function'].match(/(?<=COMMENT ').*?(?=')/gs)[0] : '',
            security: row['Create Function'].includes('SQL SECURITY INVOKER') ? 'INVOKER' : 'DEFINER',
            deterministic: row['Create Function'].includes('DETERMINISTIC'),
            dataAccess,
            returns: output[0].toUpperCase(),
            returnsLength: +output[1]
         };
      })[0];
   }

   async dropFunction (params: { schema: string; func: string }) {
      const sql = `DROP FUNCTION \`${params.schema}\`.\`${params.func}\``;
      return await this.raw(sql);
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

      return await this.raw(sql, { split: false });
   }

   async getEventInformations ({ schema, scheduler }: { schema: string; scheduler: string }) {
      interface CreateFunctionResult {
         'Create Event'?: string;
         Event: string;
      }

      const results = await this.raw<antares.QueryResult<CreateFunctionResult>>(`SHOW CREATE EVENT \`${schema}\`.\`${scheduler}\``);

      return results.rows.map(row => {
         const schedule = row['Create Event'];
         const execution = schedule.includes('EVERY') ? 'EVERY' : 'ONCE';
         const every = execution === 'EVERY' ? row['Create Event'].match(/(?<=EVERY )(\s*([^\s]+)){0,2}/gs)[0].replaceAll('\'', '').split(' ') : [];
         const starts = execution === 'EVERY' && schedule.includes('STARTS') ? schedule.match(/(?<=STARTS ').*?(?='\s)/gs)[0] : '';
         const ends = execution === 'EVERY' && schedule.includes('ENDS') ? schedule.match(/(?<=ENDS ').*?(?='\s)/gs)[0] : '';
         const at = execution === 'ONCE' && schedule.includes('AT') ? schedule.match(/(?<=AT ').*?(?='\s)/gs)[0] : '';

         return {
            definer: row['Create Event'].match(/(?<=DEFINER=).*?(?=\s)/gs)[0],
            sql: row['Create Event'].match(/(?<=DO )(.*)/gs)[0],
            name: row.Event,
            comment: row['Create Event'].match(/(?<=COMMENT ').*?(?=')/gs) ? row['Create Event'].match(/(?<=COMMENT ').*?(?=')/gs)[0] : '',
            state: row['Create Event'].includes('ENABLE') ? 'ENABLE' : row['Create Event'].includes('DISABLE ON SLAVE') ? 'DISABLE ON SLAVE' : 'DISABLE',
            preserve: row['Create Event'].includes('ON COMPLETION PRESERVE'),
            execution,
            every,
            starts,
            ends,
            at
         };
      })[0];
   }

   async dropEvent (params: { schema: string; scheduler: string }) {
      const sql = `DROP EVENT \`${params.schema}\`.\`${params.scheduler}\``;
      return await this.raw(sql);
   }

   async alterEvent ({ scheduler }: { scheduler: antares.AlterEventParams }) {
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

      return await this.raw(sql, { split: false });
   }

   async createEvent (params: antares.CreateEventParams) {
      const sql = `CREATE ${params.definer ? ` DEFINER=${params.definer}` : ''} EVENT \`${params.schema}\`.\`${params.name}\` 
      ON SCHEDULE
         ${params.execution === 'EVERY'
      ? `EVERY ${params.every.join(' ')}${params.starts ? ` STARTS '${params.starts}'` : ''}${params.ends ? ` ENDS '${params.ends}'` : ''}`
      : `AT '${params.at}'`}
      ON COMPLETION${!params.preserve ? ' NOT' : ''} PRESERVE
      ${params.state}
      COMMENT '${params.comment}'
      DO ${params.sql}`;

      return await this.raw(sql, { split: false });
   }

   async enableEvent ({ schema, scheduler }: { schema: string; scheduler: string }) {
      const sql = `ALTER EVENT \`${schema}\`.\`${scheduler}\` ENABLE`;
      return await this.raw(sql, { split: false });
   }

   async disableEvent ({ schema, scheduler }: { schema: string; scheduler: string }) {
      const sql = `ALTER EVENT \`${schema}\`.\`${scheduler}\` DISABLE`;
      return await this.raw(sql, { split: false });
   }

   async getCollations () {
      interface ShowCollationResult {
         Charset: string;
         Collation: string;
         Compiled: string;
         Default: string;
         Id: number;
         Sortlen: number;
      }

      const { rows } = await this.raw<antares.QueryResult<ShowCollationResult>>('SHOW COLLATION');

      return rows.map(row => {
         return {
            charset: row.Charset,
            collation: row.Collation,
            compiled: row.Compiled.includes('Yes'),
            default: row.Default.includes('Yes'),
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
      return await this.raw(`KILL ${id}`);
   }

   async killTabQuery (tabUid: string) {
      const id = this._runningConnections.get(tabUid);
      if (id)
         return await this.killProcess(id);
   }

   async commitTab (tabUid: string) {
      const connection = this._connectionsToCommit.get(tabUid);
      if (connection)
         await connection.query('COMMIT');
   }

   async rollbackTab (tabUid: string) {
      const connection = this._connectionsToCommit.get(tabUid);
      if (connection)
         await connection.query('ROLLBACK');
   }

   destroyConnectionToCommit (tabUid: string) {
      const connection = this._connectionsToCommit.get(tabUid);
      if (connection) {
         (connection as mysql.Connection).destroy();
         this._connectionsToCommit.delete(tabUid);
      }
   }

   getSQL () {
      // SELECT
      const selectArray = this._query.select.reduce(this._reducer, []);
      let selectRaw = '';

      if (selectArray.length)
         selectRaw = selectArray.length ? `SELECT ${selectArray.join(', ')} ` : 'SELECT * ';

      // FROM
      let fromRaw = '';

      if (!this._query.update.length && !Object.keys(this._query.insert).length && !!this._query.from)
         fromRaw = 'FROM';
      else if (Object.keys(this._query.insert).length)
         fromRaw = 'INTO';

      fromRaw += this._query.from ? ` ${this._query.schema ? `\`${this._query.schema}\`.` : ''}\`${this._query.from}\` ` : '';

      // WHERE
      const whereArray = this._query.where.reduce(this._reducer, []);
      const whereRaw = whereArray.length ? `WHERE ${whereArray.join(' AND ')} ` : '';

      // UPDATE
      const updateArray = this._query.update.reduce(this._reducer, []);
      const updateRaw = updateArray.length ? `SET ${updateArray.join(', ')} ` : '';

      // INSERT
      let insertRaw = '';

      if (this._query.insert.length) {
         const fieldsList = Object.keys(this._query.insert[0]).map(col => '`' + col + '`');
         const rowsList = this._query.insert.map(el => `(${Object.values(el).join(', ')})`);

         insertRaw = `(${fieldsList.join(', ')}) VALUES ${rowsList.join(', ')} `;
      }

      // GROUP BY
      const groupByArray = this._query.groupBy.reduce(this._reducer, []);
      const groupByRaw = groupByArray.length ? `GROUP BY ${groupByArray.join(', ')} ` : '';

      // ORDER BY
      const orderByArray = this._query.orderBy.reduce(this._reducer, []);
      const orderByRaw = orderByArray.length ? `ORDER BY ${orderByArray.join(', ')} ` : '';

      // LIMIT
      const limitRaw = this._query.limit ? `LIMIT ${this._query.limit} ` : '';

      // OFFSET
      const offsetRaw = this._query.offset ? `OFFSET ${this._query.offset} ` : '';

      return `${selectRaw}${updateRaw ? 'UPDATE' : ''}${insertRaw ? 'INSERT ' : ''}${this._query.delete ? 'DELETE ' : ''}${fromRaw}${updateRaw}${whereRaw}${groupByRaw}${orderByRaw}${limitRaw}${offsetRaw}${insertRaw}`;
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
         sql = sql.replace(/(\/\*(.|[\r\n])*?\*\/)|(--(.*|[\r\n]))/gm, '');// Remove comments

      const nestTables = args.nest ? '.' : false;
      const resultsArr: antares.QueryResult[] = [];
      let paramsArr = [];
      const queries = args.split
         ? this._querySplitter(sql, 'mysql')
         : [sql];

      const connection = await this.getConnection(args);

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
                           if (this.isPool && args.autocommit) {
                              (connection as mysql.PoolConnection).release();
                              this._runningConnections.delete(args.tabUid);
                           }
                           reject(err);
                        }

                        try { // Key usage (foreign keys)
                           const response = await this.getKeyUsage(paramObj);
                           keysArr = keysArr ? [...keysArr, ...response] : response;
                        }
                        catch (err) {
                           if (this.isPool && args.autocommit) {
                              (connection as mysql.PoolConnection).release();
                              this._runningConnections.delete(args.tabUid);
                           }
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
               if (this.isPool && args.autocommit) {
                  (connection as mysql.PoolConnection).release();
                  this._runningConnections.delete(args.tabUid);
               }
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

      if (this.isPool && args.autocommit) {
         (connection as mysql.PoolConnection).release();
         this._runningConnections.delete(args.tabUid);
      }

      const result = resultsArr.length === 1 ? resultsArr[0] : resultsArr;

      return result as unknown as T;
   }
}
