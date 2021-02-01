'use strict';
import { ipcRenderer } from 'electron';

export default class {
   static createDatabase (params) {
      return ipcRenderer.invoke('create-database', params);
   }

   static updateDatabase (params) {
      return ipcRenderer.invoke('update-database', params);
   }

   static getDatabaseCollation (params) {
      return ipcRenderer.invoke('get-database-collation', params);
   }

   static deleteDatabase (params) {
      return ipcRenderer.invoke('delete-database', params);
   }

   static getStructure (params) {
      return ipcRenderer.invoke('get-structure', params);
   }

   static getCollations (uid) {
      return ipcRenderer.invoke('get-collations', uid);
   }

   static getVariables (uid) {
      return ipcRenderer.invoke('get-variables', uid);
   }

   static getEngines (uid) {
      return ipcRenderer.invoke('get-engines', uid);
   }

   static getVersion (uid) {
      return ipcRenderer.invoke('get-version', uid);
   }

   static useSchema (params) {
      return ipcRenderer.invoke('use-schema', params);
   }

   static rawQuery (params) {
      return ipcRenderer.invoke('raw-query', params);
   }
}
