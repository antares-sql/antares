import { defineStore } from 'pinia';
import * as Store from 'electron-store';
import { uidGen } from 'common/libs/uidGen';
const persistentStore = new Store({ name: 'history' });
const historySize = 1000;

export interface HistoryRecord {
   uid: string;
   sql: string;
   date: Date;
   schema?: string;
}

export const useHistoryStore = defineStore('history', {
   state: () => ({
      history: persistentStore.get('history', {}) as {[key: string]: HistoryRecord[]},
      favorites: persistentStore.get('favorites', {})
   }),
   getters: {
      getHistoryByWorkspace: state => (uid: string) => state.history[uid]
   },
   actions: {
      saveHistory (args: { uid: string; query: string; schema: string; tabUid: string }) {
         if (this.getHistoryByWorkspace(args.uid) &&
            this.getHistoryByWorkspace(args.uid).length &&
            this.getHistoryByWorkspace(args.uid)[0].sql === args.query
         ) return;

         if (!(args.uid in this.history))
            this.history[args.uid] = [];

         this.history[args.uid] = [
            {
               uid: uidGen('H'),
               sql: args.query,
               date: new Date(),
               schema: args.schema
            },
            ...this.history[args.uid]
         ];

         if (this.history[args.uid].length > historySize)
            this.history[args.uid] = this.history[args.uid].slice(0, historySize);

         persistentStore.set('history', this.history);
      },
      deleteQueryFromHistory (query: Partial<HistoryRecord> & { workspace: string}) {
         this.history[query.workspace] = (this.history[query.workspace] as HistoryRecord[]).filter(q => q.uid !== query.uid);
         persistentStore.set('history', this.history);
      }
   }
});
