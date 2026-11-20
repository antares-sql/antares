import * as antares from 'common/interfaces/antares';

import { QueryBuilder, QueryExecutor } from './QueryBuilder';
import { Clause, QueryDialect } from './QueryDialect';

/*
 * Typed contract of a database client.
 *
 * `DatabaseClient` is what every engine implements. Optional features are separate capability
 * interfaces: callers check them with `hasCapability()` / `requireCapability()` instead of relying
 * on methods that throw "not implemented".
 *
 * Return types are `Promise<unknown>` where engines still return different shapes:
 * they get narrowed as the clients are split up (see refactor plan).
 */

export interface TableRef { schema: string; table: string }

export interface DatabaseClient extends QueryExecutor {
   /** Engine code */
   readonly _client: antares.ClientCode;
   readonly dialect: QueryDialect;

   // Connection
   connect (): Promise<void>;
   destroy (): void | Promise<void>;
   ping (): Promise<unknown>;
   use (schema?: string): unknown;

   // Query
   query (): QueryBuilder;
   schema (schema: string): QueryBuilder;
   select (...args: Clause[]): QueryBuilder;
   from (table: string): QueryBuilder;
   into (table: string): QueryBuilder;
   delete (table: string): QueryBuilder;
   where (...args: Clause[]): QueryBuilder;
   update (...args: Clause[]): QueryBuilder;
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   insert (rows: Record<string, any>[]): QueryBuilder;
   raw<T = antares.QueryResult> (sql: string, args?: antares.QueryParams): Promise<T>;

   // Transactions of query tabs (autocommit off)
   commitTab (tabUid: string): Promise<void>;
   rollbackTab (tabUid: string): Promise<void>;
   destroyConnectionToCommit (tabUid: string): void | Promise<void>;

   // Server
   getVersion (): Promise<unknown>;
   getProcesses (): Promise<unknown>;
   killProcess (id?: number): Promise<unknown>;
   getEngines (): Promise<unknown>;
   getVariables (): unknown;
   getCollations (): unknown;
   getUsers (): Promise<unknown>;
   getTypeInfo (type: string): antares.TypeInformations;

   // Structure
   getStructure (schemas: Set<string>): Promise<unknown>;
   getTableColumns (params: TableRef): Promise<unknown>;
   getTableApproximateCount (params: TableRef): Promise<number>;
   getTableOptions (params: TableRef): Promise<unknown>;
   getTableIndexes (params: TableRef): Promise<unknown>;
   getKeyUsage (params: TableRef): Promise<unknown>;

   // Tables
   createTable (params: antares.CreateTableParams): Promise<unknown>;
   alterTable (params: antares.AlterTableParams): Promise<unknown>;
   duplicateTable (params: TableRef): Promise<unknown>;
   truncateTable (params: TableRef & { force?: boolean }): Promise<unknown>;
   dropTable (params: TableRef): Promise<unknown>;

   // Views
   getViewInformations (params: { schema: string; view: string }): Promise<unknown>;
   createView (params: antares.CreateViewParams): Promise<unknown>;
   alterView (params: { view: antares.AlterViewParams }): Promise<unknown>;
   dropView (params: { schema: string; view: string }): Promise<unknown>;

   // Triggers
   getTriggerInformations (params: { schema: string; trigger: string }): Promise<unknown>;
   createTrigger (params: antares.CreateTriggerParams): Promise<unknown>;
   alterTrigger (params: { trigger: antares.AlterTriggerParams }): Promise<unknown>;
   dropTrigger (params: { schema: string; trigger: string }): Promise<unknown>;
}

// Capabilities. Names match the flags in common/customizations where one exists.

export interface SchemasCapability {
   createSchema (params: { name: string; collation?: string }): Promise<unknown>;
   alterSchema (params: { name: string; collation?: string }): Promise<unknown>;
   dropSchema (params: { database: string }): Promise<unknown>;
}

export interface DatabasesCapability {
   getDatabases (): unknown;
}

export interface DatabaseCollationCapability {
   getDatabaseCollation (params: { database: string }): Promise<unknown>;
}

export interface DbConfigCapability {
   /** Driver connection config, passed to export/import workers */
   getDbConfig (): Promise<unknown>;
}

export interface CancelQueriesCapability {
   killTabQuery (tabUid: string): Promise<unknown>;
}

export interface TableCheckCapability {
   getTableChecks (params: TableRef): Promise<antares.TableCheck[] | false>;
}

export interface TableDdlCapability {
   getTableDll (params: TableRef): Promise<unknown>;
}

export interface MaterializedViewsCapability {
   getMaterializedViewInformations (params: { schema: string; view: string }): Promise<unknown>;
   createMaterializedView (params: antares.CreateViewParams): Promise<unknown>;
   alterMaterializedView (params: { view: antares.AlterViewParams }): Promise<unknown>;
   dropMaterializedView (params: { schema: string; view: string }): Promise<unknown>;
}

export interface TriggerToggleCapability {
   enableTrigger (params: { schema: string; trigger: string }): Promise<unknown>;
   disableTrigger (params: { schema: string; trigger: string }): Promise<unknown>;
}

export interface RoutinesCapability {
   getRoutineInformations (params: { schema: string; routine: string }): Promise<unknown>;
   createRoutine (params: antares.CreateRoutineParams): Promise<unknown>;
   alterRoutine (params: { routine: antares.AlterRoutineParams }): Promise<unknown>;
   dropRoutine (params: { schema?: string; routine: string }): Promise<unknown>;
}

export interface FunctionsCapability {
   getFunctionInformations (params: { schema: string; func: string }): Promise<unknown>;
   createFunction (params: antares.CreateFunctionParams): Promise<unknown>;
   alterFunction (params: { func: antares.AlterFunctionParams }): Promise<unknown>;
   dropFunction (params: { schema: string; func: string }): Promise<unknown>;
}

export interface TriggerFunctionsCapability {
   createTriggerFunction (params: antares.CreateFunctionParams): Promise<unknown>;
   alterTriggerFunction (params: { func: antares.CreateFunctionParams }): Promise<unknown>;
}

export interface SchedulersCapability {
   getEventInformations (params: { schema: string; scheduler: string }): Promise<unknown>;
   createEvent (params: antares.CreateEventParams): Promise<unknown>;
   alterEvent (params: { scheduler: antares.AlterEventParams }): Promise<unknown>;
   dropEvent (params: { schema: string; scheduler: string }): Promise<unknown>;
   enableEvent (params: { schema: string; scheduler: string }): Promise<unknown>;
   disableEvent (params: { schema: string; scheduler: string }): Promise<unknown>;
}

export interface UsersCapability {
   getUsersManagementInfo (): Promise<antares.UsersManagementInfo>;
   getUsersList (): Promise<antares.UserAccount[]>;
   getUserDetails (user: antares.UserIdentity): Promise<antares.UserDetails>;
   createUser (params: antares.SaveUserParams): Promise<void>;
   alterUser (params: antares.SaveUserParams): Promise<void>;
   dropUser (user: antares.UserIdentity): Promise<void>;
}

export interface Capabilities {
   schemas: SchemasCapability;
   databases: DatabasesCapability;
   databaseCollation: DatabaseCollationCapability;
   dbConfig: DbConfigCapability;
   cancelQueries: CancelQueriesCapability;
   tableCheck: TableCheckCapability;
   tableDdl: TableDdlCapability;
   materializedViews: MaterializedViewsCapability;
   triggerToggle: TriggerToggleCapability;
   routines: RoutinesCapability;
   functions: FunctionsCapability;
   triggerFunctions: TriggerFunctionsCapability;
   schedulers: SchedulersCapability;
   users: UsersCapability;
}

export type Capability = keyof Capabilities;

/** Methods that make up each capability: a client has the capability when it implements all of them */
export const capabilityMethods: { [K in Capability]: (keyof Capabilities[K])[] } = {
   schemas: ['createSchema', 'alterSchema', 'dropSchema'],
   databases: ['getDatabases'],
   databaseCollation: ['getDatabaseCollation'],
   dbConfig: ['getDbConfig'],
   cancelQueries: ['killTabQuery'],
   tableCheck: ['getTableChecks'],
   tableDdl: ['getTableDll'],
   materializedViews: ['getMaterializedViewInformations', 'createMaterializedView', 'alterMaterializedView', 'dropMaterializedView'],
   triggerToggle: ['enableTrigger', 'disableTrigger'],
   routines: ['getRoutineInformations', 'createRoutine', 'alterRoutine', 'dropRoutine'],
   functions: ['getFunctionInformations', 'createFunction', 'alterFunction', 'dropFunction'],
   triggerFunctions: ['createTriggerFunction', 'alterTriggerFunction'],
   schedulers: ['getEventInformations', 'createEvent', 'alterEvent', 'dropEvent', 'enableEvent', 'disableEvent'],
   users: ['getUsersManagementInfo', 'getUsersList', 'getUserDetails', 'createUser', 'alterUser', 'dropUser']
};

export function hasCapability<K extends Capability> (client: DatabaseClient, capability: K): client is DatabaseClient & Capabilities[K] {
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   return capabilityMethods[capability].every(method => typeof (client as any)[method] === 'function');
}

export class UnsupportedCapabilityError extends Error {
   constructor (client: antares.ClientCode, capability: Capability) {
      super(`"${capability}" is not supported by ${client}`);
      this.name = 'UnsupportedCapabilityError';
   }
}

/** Returns the client typed with the capability, or throws UnsupportedCapabilityError */
export function requireCapability<K extends Capability> (client: DatabaseClient, capability: K): DatabaseClient & Capabilities[K] {
   if (!hasCapability(client, capability))
      throw new UnsupportedCapabilityError(client._client, capability);
   return client;
}
