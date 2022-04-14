import * as mysql from 'mysql2/promise';
import * as pg from 'pg';
import SSHConfig from 'ssh2-promise/lib/sshConfig';
import { MySQLClient } from '../../main/libs/clients/MySQLClient';
import { PostgreSQLClient } from '../../main/libs/clients/PostgreSQLClient';
import { SQLiteClient } from '../../main/libs/clients/SQLiteClient';

export type Client = MySQLClient | PostgreSQLClient | SQLiteClient
export type ClientCode = 'mysql' | 'maria' | 'pg' | 'sqlite'

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

// Tables
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
   default?: number | string;
   enumValues?: string;
   charset?: string;
   collation?: string;
   autoIncrement?: boolean;
   isArray?: boolean;
   onUpdate?: string;
   comment?: string;
   after?: string;
   orgName?: string;
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

// Query
export interface QueryBuilderObject {
   schema: string;
   select: string[];
   from: string;
   where: string[];
   groupBy: string[];
   orderBy: string[];
   limit: string[];
   offset: string[];
   join: string[];
   update: string[];
   insert: string[];
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
