import * as antares from 'common/interfaces/antares';
import * as exporter from 'common/interfaces/exporter';
import * as importer from 'common/interfaces/importer';

import { DatabaseClient } from './core/contracts';
import { firebirdEngine } from './engines/firebird';
import { mysqlEngine } from './engines/mysql';
import { postgresqlEngine } from './engines/postgresql';
import { sqliteEngine } from './engines/sqlite';

/**
 * Everything the app needs to know about a database engine.
 * Adding an engine = implementing its client (+ optional exporter/importer) and registering it here.
 */
export interface EngineDefinition {
   /** Client codes served by this engine (e.g. mysql + maria) */
   codes: antares.ClientCode[];
   createClient (args: antares.ClientParams): DatabaseClient;
   /** SQL dump (export worker). The client is connected */
   createExporter? (client: DatabaseClient, tables: exporter.TableParams[], options: exporter.ExportOptions): antares.Exporter;
   /** SQL file import (import worker) */
   createImporter? (client: DatabaseClient, options: importer.ImportOptions): Promise<antares.Importer>;
}

const engines: EngineDefinition[] = [mysqlEngine, postgresqlEngine, sqliteEngine, firebirdEngine];

export function getEngine (code: antares.ClientCode): EngineDefinition {
   const engine = engines.find(e => e.codes.includes(code));
   if (!engine)
      throw new Error(`Unknown database client: ${code}`);
   return engine;
}

export function createClient (args: antares.ClientParams): DatabaseClient {
   return getEngine(args.client).createClient(args);
}

export const registeredClientCodes = (): antares.ClientCode[] => engines.flatMap(e => e.codes);
