'use strict';
import { ipcRenderer } from 'electron';

export default class {
   static createSchema (params) {
      return ipcRenderer.invoke('create-schema', params);
   }

   static updateSchema (params) {
      return ipcRenderer.invoke('update-schema', params);
   }

   static getDatabaseCollation (params) {
      return ipcRenderer.invoke('get-schema-collation', params);
   }

   static deleteSchema (params) {
      return ipcRenderer.invoke('delete-schema', params);
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

   static getProcesses (uid) {
      return ipcRenderer.invoke('get-processes', uid);
   }

   static useSchema (params) {
      return ipcRenderer.invoke('use-schema', params);
   }

   static rawQuery (params) {
      return ipcRenderer.invoke('raw-query', params);
   }
}
