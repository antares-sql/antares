import SSHConfig from '@fabio286/ssh2-promise/lib/sshConfig';
import * as antares from 'common/interfaces/antares';
import * as mysql from 'mysql2/promise';

import { LostConnectionError, TCP_KEEPALIVE_DELAY_MS } from '../../core/connectionHealth';
import { ConnectionLease, createLease } from '../../core/ConnectionLease';
import { SshTunnel } from '../../core/SshTunnel';

export type MySQLParams = mysql.ConnectionOptions & {
   schema: string;
   ssl?: mysql.SslOptions;
   ssh?: SSHConfig;
   readonly: boolean;
   /** Loads table sizes in the structure (information_schema.TABLES, slower than SHOW FULL TABLES) */
   showTableSize?: boolean;
};

export type MySQLConnection = mysql.Pool | mysql.PoolConnection | mysql.Connection;

/**
 * Connections of a MySQL/MariaDB client: main pool (or single connection), the dedicated
 * connections of query tabs with autocommit off, the SSH tunnel and the pool keepalive.
 */
export class MySQLConnections {
   private readonly _params: MySQLParams;
   private readonly _poolSize?: number;
   private readonly _keepaliveMs: number;
   private _main?: mysql.Pool | mysql.Connection;
   private _tunnel?: SshTunnel;
   private _keepaliveTimer?: NodeJS.Timeout;
   /** SQL run on every new session (read only mode, ANSI_QUOTES removal) */
   private _sessionSetup: string[] = [];
   /** Dedicated connections of query tabs with autocommit off */
   private readonly _tabConnections = new Map<string, mysql.Connection>();
   /** Connection id of the query running in each tab, to cancel it */
   private readonly _runningIds = new Map<string, number>();
   /** Standalone connections closed by the server or the network: replaced on the next acquire */
   private readonly _broken = new WeakSet<mysql.Connection>();

   constructor (params: MySQLParams, poolSize?: number, keepaliveMs = 10 * 60 * 1000) {
      this._params = params;
      this._poolSize = poolSize;
      this._keepaliveMs = keepaliveMs;
   }

   get isPool () {
      return !!this._poolSize;
   }

   async getDbConfig (): Promise<mysql.ConnectionOptions> {
      const dbConfig: mysql.ConnectionOptions = {
         host: this._params.host,
         port: this._params.port,
         user: this._params.user,
         password: this._params.password,
         database: undefined as string | undefined,
         ssl: null as mysql.SslOptions,
         supportBigNumbers: true,
         bigNumberStrings: true,
         enableKeepAlive: true,
         keepAliveInitialDelay: TCP_KEEPALIVE_DELAY_MS
      };

      if (this._params.schema?.length) dbConfig.database = this._params.schema;

      if (this._params.ssl) dbConfig.ssl = this._params.ssl;

      if (this._params.ssh) {
         this._tunnel ??= new SshTunnel(this._params.ssh);
         dbConfig.host = undefined;
         dbConfig.port = await this._tunnel.open(this._params.host, this._params.port);
      }

      return dbConfig;
   }

   async connect () {
      this._main = this.isPool ? await this.createPool() : await this.createConnection();

      // ANSI_QUOTES would turn "strings" into identifiers: remove it from the session sql_mode
      const [response] = await this._main.query<mysql.RowDataPacket[]>('SHOW GLOBAL VARIABLES LIKE \'%sql_mode%\'');
      const sqlMode: string[] = response[0]?.Value?.split(',') ?? [];
      const hasAnsiQuotes = sqlMode.includes('ANSI') || sqlMode.includes('ANSI_QUOTES');

      this._sessionSetup = [];
      if (hasAnsiQuotes)
         this._sessionSetup.push(`SET SESSION sql_mode = '${sqlMode.filter(m => !['ANSI', 'ANSI_QUOTES'].includes(m)).join(',')}'`);
      if (this._params.readonly)
         this._sessionSetup.push('SET SESSION TRANSACTION READ ONLY');

      for (const sql of this._sessionSetup)
         await this._main.query(sql);

      if (this.isPool) {
         (this._main as mysql.Pool).on('connection', conn => {
            for (const sql of this._sessionSetup)
               conn.query(sql);
         });
      }
   }

   /** A new standalone connection */
   async createConnection () {
      const dbConfig = await this.getDbConfig();
      const connection = await mysql.createConnection({ ...dbConfig, dateStrings: true });
      // Fatal errors of an idle connection (server restart, network drop) would be unhandled errors
      // of the main process: mark the connection, it is replaced on the next acquire
      connection.on('error', () => this._broken.add(connection));
      connection.on('end', () => this._broken.add(connection));
      return connection;
   }

   private isBroken (connection: mysql.Connection) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inner = (connection as any).connection;
      return this._broken.has(connection) || !!inner?._closing || !!inner?._fatalError;
   }

   /** A new pool (the import worker uses its own) */
   async createPool () {
      const dbConfig = await this.getDbConfig();
      const pool = mysql.createPool({
         ...dbConfig,
         connectionLimit: this._poolSize,
         enableKeepAlive: true,
         dateStrings: true
      });

      clearInterval(this._keepaliveTimer);
      this._keepaliveTimer = setInterval(() => this.keepAlive(), this._keepaliveMs);

      return pool;
   }

   /**
    * Connection for a query run: the tab connection when autocommit is off,
    * otherwise a pooled connection (or the single connection).
    */
   async acquire (args: antares.QueryParams = {}, retry = false): Promise<ConnectionLease<MySQLConnection>> {
      try {
         let connection: MySQLConnection;
         let fromPool = false;

         if (!args.autocommit && args.tabUid) {
            connection = this._tabConnections.get(args.tabUid);
            if (connection && this.isBroken(connection as mysql.Connection)) {
               this.closeTab(args.tabUid);
               throw new LostConnectionError();
            }
            if (!connection) {
               const tabConnection = await this.createConnection();
               for (const sql of this._sessionSetup)
                  await tabConnection.query(sql);
               await tabConnection.query('SET SESSION autocommit=0');
               this._tabConnections.set(args.tabUid, tabConnection);
               connection = tabConnection;
            }
         }
         else if (this.isPool) {
            connection = await (this._main as mysql.Pool).getConnection();
            fromPool = true;
         }
         else {
            if (!this._main || this.isBroken(this._main as mysql.Connection))
               await this.reconnect();
            connection = this._main;
         }

         if (args.tabUid && this.isPool) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this._runningIds.set(args.tabUid, (connection as any).connection.connectionId);
         }

         if (args.schema)
            await connection.query(`USE \`${args.schema}\``);

         return createLease(connection, () => {
            if (fromPool) (connection as mysql.PoolConnection).release();
            if (args.tabUid) this._runningIds.delete(args.tabUid);
         });
      }
      catch (error) {
         if (error instanceof LostConnectionError)
            throw error;
         else if (error.code === 'ECONNRESET' && !retry) {
            await this.reconnect();
            return this.acquire(args, true);
         }
         else if (error instanceof AggregateError)
            throw new Error(error.errors.reduce((acc, curr) => acc + ' | ' + curr.message, ''));
         else
            throw new Error(error.message);
      }
   }

   runningId (tabUid: string) {
      return this._runningIds.get(tabUid);
   }

   async commitTab (tabUid: string) {
      await this._tabConnections.get(tabUid)?.query('COMMIT');
   }

   async rollbackTab (tabUid: string) {
      await this._tabConnections.get(tabUid)?.query('ROLLBACK');
   }

   closeTab (tabUid: string) {
      const connection = this._tabConnections.get(tabUid);
      if (connection) {
         connection.destroy();
         this._tabConnections.delete(tabUid);
      }
   }

   private async keepAlive () {
      try {
         const connection = await (this._main as mysql.Pool).getConnection();
         await connection.ping();
         connection.release();
      }
      catch (_) {}
   }

   /** Recreates the main pool/connection (and the tunnel), leaving tab transactions alone */
   private async reconnect () {
      this.closeMain();
      this._tunnel?.close();
      await this.connect();
   }

   private closeMain () {
      if (this.isPool)
         (this._main as mysql.Pool)?.end().catch((): null => null);
      else // end() of a connection already closed by the server would reject
         (this._main as mysql.Connection)?.destroy();
      this._main = undefined;
      clearInterval(this._keepaliveTimer);
      this._keepaliveTimer = undefined;
   }

   destroy () {
      for (const tabUid of [...this._tabConnections.keys()])
         this.closeTab(tabUid);

      this.closeMain();
      this._tunnel?.close();
   }
}
