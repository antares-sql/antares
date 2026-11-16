import Database from 'better-sqlite3';
import customizations from 'common/customizations';
import { Customizations } from 'common/interfaces/customizations';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { vi } from 'vitest';

import { ClientsFactory } from '../../../src/main/libs/ClientsFactory';
import { EngineTypes, engineTypes } from '../../unit/clients/fixtures';

/**
 * Test database connections. Defaults match docker/docker-compose.yml;
 * every value can be overridden through environment variables.
 */
const env = (key: string, fallback: string) => process.env[key] ?? fallback;
const host = env('ANTARES_TEST_HOST', '127.0.0.1');

export type EngineName = 'mysql' | 'maria' | 'pg' | 'sqlite' | 'firebird';

export interface ConnectOptions {
   /** Defaults to 5 like the app; 0 = single connection mode */
   poolSize?: number;
}

export interface TestEngine {
   name: EngineName;
   /** Schema name to use in client calls */
   schema: string;
   types: EngineTypes;
   customizations: Customizations;
   // Clients don't share a typed contract yet (see refactor plan, phase 2)
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   connect: (opts?: ConnectOptions) => Promise<any>;
   cleanup?: () => void;
}

const sqlitePath = path.join(os.tmpdir(), `antares-it-${process.pid}.db`);

const factories: Record<EngineName, () => Omit<TestEngine, 'name' | 'customizations'>> = {
   mysql: () => ({
      schema: 'antares_test',
      types: engineTypes.mysql,
      connect: opts => connectClient('mysql', {
         host,
         port: +env('ANTARES_TEST_MYSQL_PORT', '33306'),
         user: 'root',
         password: env('ANTARES_TEST_PASSWORD', 'antares'),
         schema: ''
      }, opts)
   }),
   maria: () => ({
      schema: 'antares_test',
      types: engineTypes.mysql,
      connect: opts => connectClient('maria', {
         host,
         port: +env('ANTARES_TEST_MARIADB_PORT', '33307'),
         user: 'root',
         password: env('ANTARES_TEST_PASSWORD', 'antares'),
         schema: ''
      }, opts)
   }),
   pg: () => ({
      schema: 'public',
      types: engineTypes.pg,
      connect: opts => connectClient('pg', {
         host,
         port: +env('ANTARES_TEST_PG_PORT', '55432'),
         user: 'postgres',
         password: env('ANTARES_TEST_PASSWORD', 'antares'),
         database: 'antares_test',
         schema: ''
      }, opts)
   }),
   sqlite: () => ({
      schema: 'main',
      types: engineTypes.sqlite,
      connect: opts => {
         new Database(sqlitePath).close(); // client requires an existing file
         return connectClient('sqlite', { databasePath: sqlitePath, readonly: false }, opts);
      },
      cleanup: () => fs.rmSync(sqlitePath, { force: true })
   }),
   firebird: () => ({
      schema: 'antares_test',
      types: engineTypes.firebird,
      connect: opts => connectClient('firebird', {
         host,
         port: +env('ANTARES_TEST_FIREBIRD_PORT', '33050'),
         user: 'SYSDBA',
         password: env('ANTARES_TEST_PASSWORD', 'antares'),
         database: '/var/lib/firebird/data/antares_test.fdb'
      }, opts)
   })
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function connectClient (client: EngineName, params: Record<string, any>, opts: ConnectOptions = {}) {
   const connection = ClientsFactory.getClient({
      client,
      uid: `it-${client}`,
      params: params as never,
      poolSize: opts.poolSize ?? 5 // same default as the app (ipc-handlers/connection.ts)
   });

   // User settings live in electron-store, which needs a real Electron main process
   if ('_getShowTableSizeSetting' in connection)
      vi.spyOn(connection as never, '_getShowTableSizeSetting').mockReturnValue(false as never);

   await connection.connect();
   return connection;
}

/**
 * Engines to test, from `ANTARES_TEST_ENGINES` (comma separated). Defaults to all.
 * e.g. ANTARES_TEST_ENGINES=sqlite,pg
 */
export function getTestEngines (): TestEngine[] {
   const selected = (process.env.ANTARES_TEST_ENGINES ?? 'mysql,maria,pg,sqlite,firebird')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean) as EngineName[];

   return selected.map(name => ({
      name,
      customizations: customizations[name],
      ...factories[name]()
   }));
}
