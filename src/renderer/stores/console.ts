import { ipcRenderer } from 'electron';
import { defineStore } from 'pinia';
const logsSize = 1000;

export interface ConsoleRecord {
   cUid: string;
   sql: string;
   date: Date;
}

export const useConsoleStore = defineStore('console', {
   state: () => ({
      records: [] as ConsoleRecord[],
      consoleHeight: 0,
      isConsoleOpen: false
   }),
   getters: {
      getLogsByWorkspace: state => (uid: string) => state.records.filter(r => r.cUid === uid)
   },
   actions: {
      putLog (record: ConsoleRecord) {
         this.records.push(record);

         if (this.records.length > logsSize)
            this.records = this.records.slice(0, logsSize);
      },
      resizeConsole (height: number) {
         if (height < 30) {
            this.consoleHeight = 0;
            this.isConsoleOpen = false;
         }
         else
            this.consoleHeight = height;
      },
      toggleConsole () {
         if (this.isConsoleOpen) {
            this.isConsoleOpen = false;
            this.consoleHeight = 0;
         }
         else {
            this.isConsoleOpen = true;
            this.consoleHeight = 250;
         }
      }
   }
});

ipcRenderer.on('toggle-console', () => {
   useConsoleStore().toggleConsole();
});
