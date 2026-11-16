import * as antares from 'common/interfaces/antares';
import * as firebird from 'node-firebird';

import { ConnectionLease, createLease } from '../../core/ConnectionLease';

export type FirebirdConnection = firebird.Database | firebird.Transaction;

interface TabTransaction {
   database: firebird.Database;
   transaction: firebird.Transaction;
}

const promisify = (fn: (cb: (err?: Error) => void) => void) =>
   new Promise<void>((resolve, reject) => fn(err => err ? reject(err) : resolve()));

/**
 * Connections of a Firebird client: pool (or single attachment) and the dedicated
 * attachments + transactions of query tabs with autocommit off.
 */
export class FirebirdConnections {
   private readonly _params: firebird.Options;
   private readonly _poolSize?: number;
   private _pool?: firebird.ConnectionPool;
   private _single?: firebird.Database;
   private readonly _tabTransactions = new Map<string, TabTransaction>();

   constructor (params: firebird.Options, poolSize?: number) {
      this._params = params;
      this._poolSize = poolSize;
   }

   get isPool () {
      return !!this._poolSize;
   }

   async connect () {
      if (this.isPool)
         this._pool = this.createPool();
      else
         this._single = await this.attach();
   }

   /** A new attachment */
   attach () {
      return new Promise<firebird.Database>((resolve, reject) => {
         firebird.attach({ ...this._params, blobAsText: true }, (err, db) => {
            if (err) reject(err);
            else resolve(db);
         });
      });
   }

   createPool () {
      return firebird.pool(this._poolSize, { ...this._params, blobAsText: true });
   }

   /**
    * Connection for a query run: the tab transaction when autocommit is off,
    * otherwise a pooled attachment (returned to the pool on release) or the single attachment.
    */
   async acquire (args: antares.QueryParams = {}): Promise<ConnectionLease<FirebirdConnection>> {
      if (!args.autocommit && args.tabUid) {
         let tab = this._tabTransactions.get(args.tabUid);
         if (!tab) {
            const database = await this.attach();
            const transaction = await new Promise<firebird.Transaction>((resolve, reject) => {
               database.transaction(firebird.ISOLATION_READ_COMMITTED, (err, transaction) => {
                  if (err) reject(err);
                  else resolve(transaction);
               });
            });
            tab = { database, transaction };
            this._tabTransactions.set(args.tabUid, tab);
         }
         return createLease(tab.transaction);
      }

      if (this.isPool) {
         const database = await new Promise<firebird.Database>((resolve, reject) => {
            this._pool.get((err, db) => {
               if (err) reject(err);
               else resolve(db);
            });
         });
         return createLease(database, () => database.detach()); // back to the pool
      }

      return createLease(this._single);
   }

   /** Commits and closes the tab transaction: the next query of the tab starts a new one */
   async commitTab (tabUid: string) {
      const tab = this._tabTransactions.get(tabUid);
      if (tab) {
         await promisify(cb => tab.transaction.commit(cb));
         this._closeTab(tabUid);
      }
   }

   async rollbackTab (tabUid: string) {
      const tab = this._tabTransactions.get(tabUid);
      if (tab) {
         await promisify(cb => tab.transaction.rollback(cb));
         this._closeTab(tabUid);
      }
   }

   /** Discards the tab transaction (rolled back by the server when the attachment closes) */
   closeTab (tabUid: string) {
      const tab = this._tabTransactions.get(tabUid);
      if (tab) {
         this._tabTransactions.delete(tabUid);
         tab.transaction.rollback(() => tab.database.detach());
      }
   }

   private _closeTab (tabUid: string) {
      const tab = this._tabTransactions.get(tabUid);
      this._tabTransactions.delete(tabUid);
      tab?.database.detach();
   }

   destroy () {
      for (const [tabUid, tab] of [...this._tabTransactions]) {
         this._tabTransactions.delete(tabUid);
         tab.database.detach();
      }

      this._pool?.destroy();
      this._pool = undefined;
      this._single?.detach();
      this._single = undefined;
   }
}
