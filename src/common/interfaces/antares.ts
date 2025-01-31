import SSHConfig from '@fabio286/ssh2-promise/lib/sshConfig';
import * as mysql from 'mysql2/promise';
import * as pg from 'pg';
import { FirebirdSQLClient } from 'src/main/libs/clients/FirebirdSQLClient';
import MysqlExporter from 'src/main/libs/exporters/sql/MysqlExporter';
import PostgreSQLExporter from 'src/main/libs/exporters/sql/PostgreSQLExporter';
import MySQLImporter from 'src/main/libs/importers/sql/MySQLlImporter';
import PostgreSQLImporter from 'src/main/libs/importers/sql/PostgreSQLImporter';

import { MySQLClient } from '../../main/libs/clients/MySQLClient';
import { PostgreSQLClient } from '../../main/libs/clients/PostgreSQLClient';
import { SQLiteClient } from '../../main/libs/clients/SQLiteClient';

export type Client = MySQLClient | PostgreSQLClient | SQLiteClient | FirebirdSQLClient
export type ClientCode = 'mysql' | 'maria' | 'pg' | 'sqlite' | 'firebird'
export type Exporter = MysqlExporter | PostgreSQLExporter
export type Importer = MySQLImporter | PostgreSQLImporter

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface IpcResponse<T = any> {
   status: 'success' | 'error' | 'abort';
   response?: T;
}

/**
 * Pasameters needed to create a new Antares connection to a database
 */
export interface ClientParams {
   client: ClientCode;
   uid?: string;
   params:
      mysql.ConnectionOptions & {schema: string; ssl?: mysql.SslOptions; ssh?: SSHConfig; readonly: boolean}
      | pg.ClientConfig & {schema: string; ssl?: mysql.SslOptions; ssh?: SSHConfig; readonly: boolean}
      | { databasePath: string; readonly: boolean };
   poolSize?: number;
   logger?: () => void;
   querySplitter?: (sql: string, clieng?: string) => string[];
}

/**
 * Paramenets insered by user in connection mask
 */
export interface ConnectionParams {
   uid: string;
   name?: string;
   client: ClientCode;
   host: string;
   database?: string;
   schema?: string;
   databasePath?: string;
   port: number;
   user: string;
   password: string;
   ask: boolean;
   readonly: boolean;
   singleConnectionMode: boolean;
   ssl: boolean;
   cert?: string;
   key?: string;
   ca?: string;
   connString?: string;
   untrustedConnection: boolean;
   ciphers?: string;
   ssh: boolean;
   sshHost?: string;
   sshUser?: string;
   sshPass?: string;
   sshKey?: string;
   sshPort?: number;
   sshPassphrase?: string;
   sshKeepAliveInterval?: number;
}

export interface TypeInformations {
   name: string;
   length: boolean;
   scale: boolean;
   collation: boolean;
   unsigned: boolean;
   zerofill: boolean;
}

export interface TypesGroup {
   group: string;
   types: TypeInformations[];
}

// Tables
export interface TableInfos {
   name: string;
   type: string;
   rows: number;
   engine: string;
   comment: string;
   size: number | false;
   collation: string;
   autoIncrement?: boolean;
}

export type TableOptions = Partial<TableInfos>;

export interface TableField {
   // eslint-disable-next-line camelcase
   _antares_id?: string;
   name: string;
   type: string;
   schema: string;
   table?: string;
   numPrecision?: number;
   numLength?: number;
   datePrecision?: number;
   charLength?: number;
   numScale?: number;
   nullable?: boolean;
   unsigned?: boolean;
   zerofill?: boolean;
   order?: number;
   default?: string;
   defaultType?: string;
   enumValues?: string;
   charset?: string;
   collation?: string;
   autoIncrement?: boolean;
   isArray?: boolean;
   onUpdate?: string;
   comment?: string;
   after?: string;
   orgName?: string;
   length?: number | false;
   alias: string;
   tableAlias: string;
   orgTable: string;
   key?: 'pri' | 'uni' | '';
}

export interface TableIndex {
   // eslint-disable-next-line camelcase
   _antares_id?: string;
   name: string;
   fields: string[];
   type: string;
   comment?: string;
   indexType?: string;
   indexComment?: string;
   cardinality?: number;
   oldType?: string;
   oldName?: string;
}

export interface TableForeign {
   // eslint-disable-next-line camelcase
   _antares_id?: string;
   constraintName: string;
   refSchema: string;
   table: string;
   refTable: string;
   field: string;
   refField: string;
   onUpdate: string;
   onDelete: string;
   oldName?: string;
}

export interface TableCheck {
   // eslint-disable-next-line camelcase
   _antares_id?: string;
   name: string;
   clause: string;
}

export interface CreateTableParams {
   /** Connection UID */
   uid?: string;
   schema: string;
   fields: TableField[];
   foreigns: TableForeign[];
   indexes: TableIndex[];
   checks?: TableCheck[];
   options: TableOptions;
}

export interface AlterTableParams {
   /** Connection UID */
   uid?: string;
   schema: string;
   table: string;
   additions: TableField[];
   changes: TableField[];
   deletions: TableField[];
   tableStructure: {
      name: string;
      fields: TableField[];
      foreigns: TableForeign[];
      indexes: TableIndex[];
   };
   indexChanges: {
      additions: TableIndex[];
      changes: TableIndex[];
      deletions: TableIndex[];
   };
   foreignChanges: {
      additions: TableForeign[];
      changes: TableForeign[];
      deletions: TableForeign[];
   };
   checkChanges?: {
      additions: TableCheck[];
      changes: TableCheck[];
      deletions: TableCheck[];
   };
   options: TableOptions;
}

// Views
export type ViewInfos = TableInfos
export interface CreateViewParams {
   schema: string;
   name: string;
   algorithm: string;
   definer: string;
   security: string;
   sql: string;
   updateOption: string;
}

export interface AlterViewParams extends CreateViewParams {
   oldName?: string;
}

// Triggers
export interface TriggerInfos {
   name: string;
   statement: string;
   timing: string;
   definer: string;
   event: string;
   table: string;
   sqlMode: string;
   created: Date;
   charset: string;
   enabled?: boolean;
}

export interface CreateTriggerParams {
   definer?: string;
   schema: string;
   name: string;
   activation: string;
   event: string;
   table: string;
   sql: string;
}

export interface AlterTriggerParams extends CreateTriggerParams {
   oldName?: string;
}

// Routines & Functions

export interface FunctionParam {
   // eslint-disable-next-line camelcase
   _antares_id: string;
   context: string;
   name: string;
   type: string;
   length: number;
}

export interface RoutineInfos {
   name: string;
   type?: string;
   definer: string;
   created?: string;
   sql?: string;
   updated?: string;
   comment?: string;
   charset?: string;
   security?: string;
   language?: string;
   dataAccess?: string;
   deterministic?: boolean;
   parameters?: FunctionParam[];
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   returns?: any;
   returnsLength?: number;
}

export type FunctionInfos = RoutineInfos
export type TriggerFunctionInfos = FunctionInfos

export interface CreateRoutineParams {
   name: string;
   parameters?: FunctionParam[];
   definer: string;
   schema: string;
   deterministic: boolean;
   dataAccess: string;
   security: string;
   comment?: string;
   language?: string;
   sql: string;
}

export interface AlterRoutineParams extends CreateRoutineParams {
   oldName?: string;
}

export interface CreateFunctionParams {
   name: string;
   parameters?: FunctionParam[];
   definer: string;
   schema: string;
   deterministic: boolean;
   dataAccess: string;
   security: string;
   comment?: string;
   sql: string;
   returns: string;
   returnsLength: number;
   language?: string;
}

export interface AlterFunctionParams extends CreateFunctionParams {
   oldName?: string;
}

// Events
export interface EventInfos {
   definer?: string;
   schema: string;
   name: string;
   execution: string;
   every: string[];
   starts: string;
   ends: string;
   at: string;
   preserve: boolean;
   state: string;
   comment: string;
   enabled?: boolean;
   sql: string;
}

export type CreateEventParams = EventInfos;

export interface AlterEventParams extends CreateEventParams {
   oldName?: string;
}

// Schema
export interface SchemaInfos {
   name: string;
   size: number;
   tables: TableInfos[];
   functions: FunctionInfos[];
   procedures: RoutineInfos[];
   triggers: TriggerInfos[];
   schedulers: EventInfos[];
}

export interface CollationInfos {
   charset: string;
   collation: string;
   compiled: boolean;
   default: boolean;
   id: string | number;
   sortLen: number;
}

// Query
export interface QueryBuilderObject {
   schema: string;
   select: string[];
   from: string;
   where: string[];
   groupBy: string[];
   orderBy: string[];
   limit: number;
   offset: number;
   join: string[];
   update: string[];
   insert: Record<string, string | boolean | number>[];
   delete: boolean;
}

export interface QueryParams {
   nest?: boolean;
   details?: boolean;
   split?: boolean;
   comments?: boolean;
   autocommit?: boolean;
   schema?: string;
   tabUid?: string;
}

/**
 * @deprecated Use TableFIeld
 */
export type QueryField = TableField

export interface QueryForeign {
   schema: string;
   table: string;
   field: string;
   position: number;
   constraintPosition: number;
   constraintName: string;
   refSchema: string;
   refTable: string;
   refField: string;
   onUpdate: string;
   onDelete: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface QueryResult<T = any> {
   rows: T[];
   report: { affectedRows: number };
   fields: QueryField[];
   keys: QueryForeign[];
   duration: number;
}
