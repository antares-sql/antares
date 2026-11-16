import * as antares from 'common/interfaces/antares';

import sqlite = require('better-sqlite3');

import { ConnectionLease, createLease } from '../../core/ConnectionLease';

export interface SQLiteParams {
   databasePath: string;
   readonly: boolean;
}

/**
 * Connections of an SQLite client: the main database handle and the dedicated
 * handles of query tabs with autocommit off.
 */
export class SQLiteConnections {
   private readonly _params: SQLiteParams;
   private _main?: sqlite.Database;
   private readonly _tabConnections = new Map<string, sqlite.Database>();

   constructor (params: SQLiteParams) {
      this._params = params;
   }

   connect () {
      this._main = this.open();
   }

   /** A new handle on the database file */
   open () {
      return sqlite(this._params.databasePath, {
         fileMustExist: true,
         readonly: this._params.readonly
      });
   }

   /** The tab handle when autocommit is off, otherwise the main handle */
   acquire (args: antares.QueryParams = {}): ConnectionLease<sqlite.Database> {
      if (!args.autocommit && args.tabUid) {
         let connection = this._tabConnections.get(args.tabUid);
         if (!connection) {
            connection = this.open();
            connection.prepare('BEGIN TRANSACTION').run();
            this._tabConnections.set(args.tabUid, connection);
         }
         return createLease(connection);
      }

      return createLease(this._main);
   }

   /** Commits and closes the tab handle: the next query of the tab starts a new transaction */
   commitTab (tabUid: string) {
      const connection = this._tabConnections.get(tabUid);
      if (connection) {
         connection.prepare('COMMIT').run();
         this.closeTab(tabUid);
      }
   }

   rollbackTab (tabUid: string) {
      const connection = this._tabConnections.get(tabUid);
      if (connection) {
         connection.prepare('ROLLBACK').run();
         this.closeTab(tabUid);
      }
   }

   closeTab (tabUid: string) {
      const connection = this._tabConnections.get(tabUid);
      if (connection) {
         connection.close();
         this._tabConnections.delete(tabUid);
      }
   }

   destroy () {
      for (const tabUid of [...this._tabConnections.keys()])
         this.closeTab(tabUid);

      this._main?.close();
      this._main = undefined;
   }
}
