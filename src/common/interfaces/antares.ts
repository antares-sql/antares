import * as mysql from 'mysql2/promise';
import * as pg from 'pg';
import MysqlExporter from 'src/main/libs/exporters/sql/MysqlExporter';
import PostgreSQLExporter from 'src/main/libs/exporters/sql/PostgreSQLExporter';
import MySQLImporter from 'src/main/libs/importers/sql/MySQLlImporter';
import PostgreSQLImporter from 'src/main/libs/importers/sql/PostgreSQLImporter';
import SSHConfig from 'ssh2-promise/lib/sshConfig';
import { MySQLClient } from '../../main/libs/clients/MySQLClient';
import { PostgreSQLClient } from '../../main/libs/clients/PostgreSQLClient';
import { SQLiteClient } from '../../main/libs/clients/SQLiteClient';

export type Client = MySQLClient | PostgreSQLClient | SQLiteClient
export type ClientCode = 'mysql' | 'maria' | 'pg' | 'sqlite'
export type Exporter = MysqlExporter | PostgreSQLExporter
export type Importer = MySQLImporter | PostgreSQLImporter

/**
 * Pasameters needed to create a new Antares connection to a database
 */
export interface ClientParams {
   client: ClientCode;
   params:
      mysql.ConnectionOptions & {schema: string; ssl?: mysql.SslOptions; ssh?: SSHConfig; readonly: boolean}
      | pg.ClientConfig & {schema: string; ssl?: mysql.SslOptions; ssh?: SSHConfig; readonly: boolean}
      | { databasePath: string; readonly: boolean };
   poolSize?: number;
   logger?: () => void;
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
   ssl: boolean;
   cert?: string;
   key?: string;
   ca?: string;
   untrustedConnection: boolean;
   ciphers?: string;
   ssh: boolean;
   sshHost?: string;
   sshUser?: string;
   sshPass?: string;
   sshKey?: string;
   sshPort?: number;
   sshPassphrase?: string;
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
   created: Date;
   updated: Date;
   engine: string;
   comment: string;
   size: number;
   autoIncrement: number;
   collation: string;
}

export interface TableField {
   name: string;
   key: string;
   type: string;
   schema: string;
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
   enumValues?: string;
   charset?: string;
   collation?: string;
   autoIncrement?: boolean;
   isArray?: boolean;
   onUpdate?: string;
   comment?: string;
   after?: string;
   orgName?: string;
   length?: number;
}

export interface TableIndex {
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

export interface TableOptions {
   name: string;
   type?: 'table' | 'view';
   engine?: string;
   comment?: string;
   collation?: string;
   autoIncrement?: number;
}

export interface CreateTableParams {
   /** Connection UID */
   uid?: string;
   schema: string;
   fields: TableField[];
   foreigns: TableForeign[];
   indexes: TableIndex[];
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
export interface RoutineInfos {
   name: string;
   type: string;
   definer: string;
   created: string;
   updated: string;
   comment?: string;
   charset?: string;
   security?: string;
}

export type FunctionInfos = RoutineInfos

export interface FunctionParam {
   context: string;
   name: string;
   type: string;
   length: number;
}

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
   name: string;
   definition: string;
   type: string;
   definer: string;
   body: string;
   starts: string;
   ends: string;
   enabled: boolean;
   executeAt: string;
   intervalField: string;
   intervalValue: string;
   onCompletion: string;
   originator: string;
   sqlMode: string;
   created: string;
   updated: string;
   lastExecuted: string;
   comment: string;
   charset: string;
   timezone: string;
}

export interface CreateEventParams {
   definer?: string;
   schema: string;
   name: string;
   execution: string;
   every: string[];
   starts: string;
   ends: string;
   at: string;
   preserve: string;
   state: string;
   comment: string;
   sql: string;
}

export interface AlterEventParams extends CreateEventParams {
   oldName?: string;
}

// Schema
export interface SchemaInfos {
   name: string;
   size: number;
   tables: TableInfos[];
   functions: RoutineInfos[];
   procedures: RoutineInfos[];
   triggers: TriggerInfos[];
   schedulers: EventInfos[];
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
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   insert: {[key: string]: any}[];
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

export interface QueryField {
   name: string;
   alias: string;
   orgName: string;
   schema: string;
   table: string;
   tableAlias: string;
   orgTable: string;
   type: string;
   length: number;
}

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
