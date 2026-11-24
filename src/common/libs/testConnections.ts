import customizations from 'common/customizations';
import { ClientCode, ConnectionParams } from 'common/interfaces/antares';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Connections to the test databases of docker/docker-compose.yml.
 * Shared by the integration tests and the debug-only "Apply debug connections" setting.
 * Every value can be overridden through environment variables (ANTARES_TEST_*).
 */
type Env = Record<string, string | undefined>;

export type TestEngineName = 'mysql' | 'maria' | 'pg' | 'firebird';

export interface TestDatabase {
   client: ClientCode;
   label: string;
   host: string;
   port: number;
   user: string;
   password: string;
   database?: string;
   /** Host and port of the database as seen from the `ssh` service */
   remote: [string, number];
}

export interface TestSsh {
   host: string;
   port: number;
   username: string;
   password: string;
}

export function getTestDatabases (env: Env = process.env): Record<TestEngineName, TestDatabase> {
   const get = (key: string, fallback: string) => env[key] ?? fallback;
   const host = get('ANTARES_TEST_HOST', '127.0.0.1');
   const password = get('ANTARES_TEST_PASSWORD', 'antares');

   return {
      mysql: {
         client: 'mysql',
         label: 'MySQL',
         host,
         port: +get('ANTARES_TEST_MYSQL_PORT', '33306'),
         user: 'root',
         password,
         remote: ['mysql', 3306]
      },
      maria: {
         client: 'maria',
         label: 'MariaDB',
         host,
         port: +get('ANTARES_TEST_MARIADB_PORT', '33307'),
         user: 'root',
         password,
         remote: ['mariadb', 3306]
      },
      pg: {
         client: 'pg',
         label: 'PostgreSQL',
         host,
         port: +get('ANTARES_TEST_PG_PORT', '55432'),
         user: 'postgres',
         password,
         database: 'antares_test',
         remote: ['postgres', 5432]
      },
      firebird: {
         client: 'firebird',
         label: 'Firebird',
         host,
         port: +get('ANTARES_TEST_FIREBIRD_PORT', '33050'),
         user: 'SYSDBA',
         password,
         database: '/var/lib/firebird/data/antares_test.fdb',
         remote: ['firebird', 3050]
      }
   };
}

export function getTestSsh (env: Env = process.env): TestSsh {
   const get = (key: string, fallback: string) => env[key] ?? fallback;
   return {
      host: get('ANTARES_TEST_HOST', '127.0.0.1'),
      port: +get('ANTARES_TEST_SSH_PORT', '32222'),
      username: 'antares',
      password: 'antares'
   };
}

/**
 * Folder of the SQLite sample databases, filled by `npm run test:db:samples`.
 * Relative to the working directory, that is the repository root both in development and in tests.
 */
export function getSampleSqliteDir (env: Env = process.env): string {
   return env.ANTARES_TEST_SQLITE_DIR ?? path.resolve('docker', 'samples', 'sqlite');
}

/** SQLite sample database files (sorted), empty if the samples were not loaded */
export function getSampleSqliteFiles (env: Env = process.env): string[] {
   const dir = getSampleSqliteDir(env);
   try {
      return fs.readdirSync(dir)
         .filter(file => file.endsWith('.db'))
         .sort()
         .map(file => path.join(dir, file));
   }
   catch {
      return [];
   }
}

/** Firebird sample database in the docker container, created by `npm run test:db:samples` */
export function getSampleFirebirdDatabase (): string {
   return '/var/lib/firebird/data/samples.fdb';
}

/** Fixed prefix: debug connections are recognized (and replaced) by uid */
export const DEBUG_CONNECTION_PREFIX = 'CDEBUG';
export const DEBUG_FOLDER_UID = 'FDEBUG';

const baseConnection = (): Omit<ConnectionParams, 'uid' | 'client' | 'host' | 'port' | 'user' | 'password'> => ({
   ask: false,
   readonly: false,
   singleConnectionMode: false,
   showTableSize: false,
   ssl: false,
   cert: '',
   key: '',
   ca: '',
   ciphers: '',
   untrustedConnection: false,
   ssh: false,
   sshHost: '',
   sshUser: '',
   sshPass: '',
   sshPassphrase: null,
   sshKey: '',
   sshPort: 22,
   sshKeepAliveInterval: 1800
});

/**
 * Connections to the docker test databases, direct and through the SSH server,
 * plus one per SQLite sample database (see scripts/sampleDatabases.js)
 */
export function getDebugConnections (env: Env = process.env): ConnectionParams[] {
   const databases = getTestDatabases(env);
   const ssh = getTestSsh(env);
   const connections: ConnectionParams[] = [];

   for (const [engine, db] of Object.entries(databases) as [TestEngineName, TestDatabase][]) {
      const common = {
         ...baseConnection(),
         client: db.client,
         user: db.user,
         password: db.password,
         database: db.database
      };

      connections.push({
         ...common,
         uid: `${DEBUG_CONNECTION_PREFIX}${engine.toUpperCase()}`,
         name: `Docker ${db.label}`,
         host: db.host,
         port: db.port
      });

      if (!customizations[db.client].sshConnection) continue;

      connections.push({
         ...common,
         uid: `${DEBUG_CONNECTION_PREFIX}${engine.toUpperCase()}SSH`,
         name: `Docker ${db.label} (SSH)`,
         host: db.remote[0],
         port: db.remote[1],
         ssh: true,
         sshHost: ssh.host,
         sshPort: ssh.port,
         sshUser: ssh.username,
         sshPass: ssh.password
      });
   }

   // Firebird samples are a database of their own (see scripts/sampleDatabases.js)
   const firebird = databases.firebird;
   connections.push({
      ...baseConnection(),
      uid: `${DEBUG_CONNECTION_PREFIX}FIREBIRDSAMPLES`,
      name: `Docker ${firebird.label} samples`,
      client: firebird.client,
      host: firebird.host,
      port: firebird.port,
      user: firebird.user,
      password: firebird.password,
      database: getSampleFirebirdDatabase()
   });

   for (const databasePath of getSampleSqliteFiles(env)) {
      const name = path.basename(databasePath, '.db');
      connections.push({
         ...baseConnection(),
         uid: `${DEBUG_CONNECTION_PREFIX}SQLITE${name.toUpperCase().replace(/[^A-Z0-9]/g, '')}`,
         name: `SQLite ${name}`,
         client: 'sqlite',
         host: '127.0.0.1',
         port: null,
         user: '',
         password: '',
         databasePath
      });
   }

   return connections;
}
