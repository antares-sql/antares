import * as antares from 'common/interfaces/antares';
import * as fs from 'fs';
import { SslOptions } from 'mysql2';

export interface SshParams {
   host: string;
   username: string;
   password: string;
   port: number;
   privateKey?: string;
   passphrase: string;
   keepaliveInterval?: number;
}

export interface ClientConnectionParams {
   host: string;
   port: number;
   user: string;
   password: string;
   // eslint-disable-next-line camelcase
   application_name: string;
   readonly: boolean;
   connectionString?: string;
   database: string;
   schema: string;
   databasePath: string;
   ssl?: SslOptions;
   ssh?: SshParams;
}

/** Reads the content of key/certificate files. Injected to keep the conversion pure */
export type ReadTextFile = (path: string) => string;

const readTextFile: ReadTextFile = path => fs.readFileSync(path).toString();

/**
 * Converts the connection saved by the UI into the params of a database client
 * (used by both "test connection" and "connect").
 */
export function buildClientParams (conn: antares.ConnectionParams, readFile: ReadTextFile = readTextFile): ClientConnectionParams {
   const params: ClientConnectionParams = {
      host: conn.host,
      port: +conn.port,
      user: conn.user,
      password: conn.password,
      application_name: 'Antares SQL',
      readonly: conn.readonly,
      connectionString: conn.connString,
      database: conn.database || '',
      schema: conn.schema || '',
      databasePath: conn.databasePath || '',
      ssl: undefined,
      ssh: undefined
   };

   if (conn.ssl) {
      params.ssl = {
         key: conn.key ? readFile(conn.key) : null,
         cert: conn.cert ? readFile(conn.cert) : null,
         ca: conn.ca ? readFile(conn.ca) : null,
         ciphers: conn.ciphers,
         rejectUnauthorized: !conn.untrustedConnection
      };
   }

   if (conn.ssh) {
      params.ssh = {
         host: conn.sshHost,
         username: conn.sshUser,
         password: conn.sshPass,
         port: conn.sshPort ? conn.sshPort : 22,
         privateKey: conn.sshKey ? readFile(conn.sshKey) : undefined,
         passphrase: conn.sshPassphrase,
         keepaliveInterval: conn.sshKeepAliveInterval ? conn.sshKeepAliveInterval * 1000 : undefined
      };
   }

   return params;
}
