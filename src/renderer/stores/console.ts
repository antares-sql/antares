import { defineStore } from 'pinia';
import { useWorkspacesStore } from './workspaces';
const logsSize = 1000;

export interface ConsoleRecord {
   cUid: string;
   sql: string;
   date: Date;
}

export const useConsoleStore = defineStore('console', {
   state: () => ({
      records: [] as ConsoleRecord[],
      consolesHeight: new Map<string, number>(),
      consolesOpened: new Set([])
   }),
   getters: {
      getLogsByWorkspace: state => (uid: string) => state.records.filter(r => r.cUid === uid),
      isConsoleOpen: state => (uid: string) => state.consolesOpened.has(uid),
      consoleHeight: state => {
         const uid = useWorkspacesStore().getSelected;
         return state.consolesHeight.get(uid) || 0;
      }
   },
   actions: {
      putLog (record: ConsoleRecord) {
         this.records.push(record);

         if (this.records.length > logsSize)
            this.records = this.records.slice(0, logsSize);
      },
      openConsole () {
         const uid = useWorkspacesStore().getSelected;
         this.consolesOpened.add(uid);
         this.consolesHeight.set(uid, 250);
      },
      closeConsole () {
         const uid = useWorkspacesStore().getSelected;
         this.consolesOpened.delete(uid);
         this.consolesHeight.set(uid, 0);
      },
      resizeConsole (height: number) {
         const uid = useWorkspacesStore().getSelected;
         if (height < 30)
            this.closeConsole();
         else
            this.consolesHeight.set(uid, height);
      },
      toggleConsole () {
         const uid = useWorkspacesStore().getSelected;

         if (this.consolesOpened.has(uid))
            this.closeConsole();
         else
            this.openConsole();
      }
   }
});
