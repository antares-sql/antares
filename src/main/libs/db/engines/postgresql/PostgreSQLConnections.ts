import SSHConfig from '@fabio286/ssh2-promise/lib/sshConfig';
import * as antares from 'common/interfaces/antares';
import * as pg from 'pg';
import { ConnectionOptions } from 'tls';

import { ConnectionLease, createLease } from '../../core/ConnectionLease';
import { SshTunnel } from '../../core/SshTunnel';

export type PostgreSQLParams = pg.ClientConfig & {
   schema: string;
   ssl?: ConnectionOptions;
   ssh?: SSHConfig;
   readonly: boolean;
};

export type PostgreSQLConnection = pg.Client | pg.PoolClient;

/**
 * Connections of a PostgreSQL client: main pool (or single client), the dedicated
 * clients of query tabs with autocommit off, the SSH tunnel and the pool keepalive.
 */
export class PostgreSQLConnections {
   private readonly _params: PostgreSQLParams;
   private readonly _poolSize?: number;
   private readonly _keepaliveMs: number;
   private _main?: pg.Pool | pg.Client;
   private _tunnel?: SshTunnel;
   private _keepaliveTimer?: NodeJS.Timeout;
   /** Dedicated clients of query tabs with autocommit off */
   private readonly _tabConnections = new Map<string, pg.Client>();
   /** Backend PID of the query running in each tab, to cancel it */
   private readonly _runningIds = new Map<string, number>();

   constructor (params: PostgreSQLParams, poolSize?: number, keepaliveMs = 10 * 60 * 1000) {
      this._params = params;
      this._poolSize = poolSize;
      this._keepaliveMs = keepaliveMs;
   }

   get isPool () {
      return !!this._poolSize;
   }

   async getDbConfig () {
      this._params.application_name = 'Antares SQL';

      const dbConfig = {
         host: this._params.host,
         port: this._params.port,
         user: this._params.user,
         connectionString: this._params.connectionString,
         database: 'postgres' as string,
         password: this._params.password,
         ssl: null as ConnectionOptions
      };

      if (this._params.database?.length) dbConfig.database = this._params.database;

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
   }

   /** A new standalone client (the exporter streams on its own client) */
   async createConnection () {
      const dbConfig = await this.getDbConfig();
      const client = new pg.Client(dbConfig);
      await client.connect();

      if (this._params.readonly)
         await client.query('SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY');

      client.on('error', err => { // Intercepts errors and converts to rejections
         Promise.reject(err);
      });

      return client;
   }

   /** A new pool (the import worker uses its own) */
   async createPool () {
      const dbConfig = await this.getDbConfig();
      const pool = new pg.Pool({
         ...dbConfig,
         max: this._poolSize,
         idleTimeoutMillis: 0
      });

      if (this._params.readonly) {
         pool.on('connect', conn => {
            conn.query('SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY');
         });
      }

      clearInterval(this._keepaliveTimer);
      this._keepaliveTimer = setInterval(() => this.keepAlive(), this._keepaliveMs);

      pool.on('error', err => { // Intercepts errors and converts to rejections
         Promise.reject(err);
      });

      return pool;
   }

   /**
    * Connection for a query run: the tab client when autocommit is off,
    * otherwise a pooled client (or the single client).
    */
   async acquire (args: antares.QueryParams = {}): Promise<ConnectionLease<PostgreSQLConnection>> {
      let connection: PostgreSQLConnection;
      let fromPool = false;

      if (!args.autocommit && args.tabUid) {
         connection = this._tabConnections.get(args.tabUid);
         if (!connection) {
            const tabConnection = await this.createConnection();
            await tabConnection.query('START TRANSACTION');
            this._tabConnections.set(args.tabUid, tabConnection);
            connection = tabConnection;
         }
      }
      else if (this.isPool) {
         connection = await (this._main as pg.Pool).connect();
         fromPool = true;
      }
      else
         connection = this._main as pg.Client;

      if (args.tabUid && this.isPool)
         this._runningIds.set(args.tabUid, (connection as pg.PoolClient & { processID: number }).processID);

      return createLease(connection, () => {
         if (fromPool) (connection as pg.PoolClient).release();
         if (args.tabUid) this._runningIds.delete(args.tabUid);
      });
   }

   runningId (tabUid: string) {
      return this._runningIds.get(tabUid);
   }

   /** Commits and closes the tab client: the next query of the tab starts a new transaction */
   async commitTab (tabUid: string) {
      const connection = this._tabConnections.get(tabUid);
      if (connection) {
         await connection.query('COMMIT');
         this.closeTab(tabUid);
      }
   }

   async rollbackTab (tabUid: string) {
      const connection = this._tabConnections.get(tabUid);
      if (connection) {
         await connection.query('ROLLBACK');
         this.closeTab(tabUid);
      }
   }

   closeTab (tabUid: string) {
      const connection = this._tabConnections.get(tabUid);
      if (connection) {
         connection.end();
         this._tabConnections.delete(tabUid);
      }
   }

   private async keepAlive () {
      try {
         const connection = await (this._main as pg.Pool).connect();
         await connection.query('SELECT 1+1');
         connection.release();
      }
      catch (_) {}
   }

   destroy () {
      for (const tabUid of [...this._tabConnections.keys()])
         this.closeTab(tabUid);

      this._main?.end();
      this._main = undefined;
      clearInterval(this._keepaliveTimer);
      this._keepaliveTimer = undefined;
      this._tunnel?.close();
   }
}
