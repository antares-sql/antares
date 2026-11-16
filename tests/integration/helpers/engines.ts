import Database from 'better-sqlite3';
import customizations from 'common/customizations';
import { Customizations } from 'common/interfaces/customizations';
import { getTestDatabases } from 'common/libs/testConnections';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { vi } from 'vitest';

import { ClientsFactory } from '../../../src/main/libs/ClientsFactory';
import { EngineTypes, engineTypes } from '../../unit/clients/fixtures';

/**
 * Test database connections. Defaults match docker/docker-compose.yml;
 * every value can be overridden through environment variables (see common/libs/testConnections.ts).
 */
const db = getTestDatabases();

export type EngineName = 'mysql' | 'maria' | 'pg' | 'sqlite' | 'firebird';

export interface ConnectOptions {
   /** Overrides connection params (e.g. host/port/ssh for tunnels) */
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   overrides?: Record<string, any>;
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
         host: db.mysql.host,
         port: db.mysql.port,
         user: db.mysql.user,
         password: db.mysql.password,
         schema: ''
      }, opts)
   }),
   maria: () => ({
      schema: 'antares_test',
      types: engineTypes.mysql,
      connect: opts => connectClient('maria', {
         host: db.maria.host,
         port: db.maria.port,
         user: db.maria.user,
         password: db.maria.password,
         schema: ''
      }, opts)
   }),
   pg: () => ({
      schema: 'public',
      types: engineTypes.pg,
      connect: opts => connectClient('pg', {
         host: db.pg.host,
         port: db.pg.port,
         user: db.pg.user,
         password: db.pg.password,
         database: db.pg.database,
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
         host: db.firebird.host,
         port: db.firebird.port,
         user: db.firebird.user,
         password: db.firebird.password,
         database: db.firebird.database
      }, opts)
   })
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function connectClient (client: EngineName, params: Record<string, any>, opts: ConnectOptions = {}) {
   const connection = ClientsFactory.getClient({
      client,
      uid: `it-${client}`,
      params: { ...params, ...opts.overrides } as never,
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
