'use strict';
import { ipcRenderer } from 'electron';
import { toRaw } from 'vue';

export default class {
   static createSchema (params) {
      return ipcRenderer.invoke('create-schema', toRaw(params));
   }

   static updateSchema (params) {
      return ipcRenderer.invoke('update-schema', toRaw(params));
   }

   static getDatabaseCollation (params) {
      return ipcRenderer.invoke('get-schema-collation', toRaw(params));
   }

   static deleteSchema (params) {
      return ipcRenderer.invoke('delete-schema', toRaw(params));
   }

   static getStructure (params) {
      return ipcRenderer.invoke('get-structure', toRaw(params));
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

   static killProcess (params) {
      return ipcRenderer.invoke('kill-process', toRaw(params));
   }

   static killTabQuery (params) {
      return ipcRenderer.invoke('kill-tab-query', toRaw(params));
   }

   static commitTab (params) {
      return ipcRenderer.invoke('commit-tab', toRaw(params));
   }

   static rollbackTab (params) {
      return ipcRenderer.invoke('rollback-tab', toRaw(params));
   }

   static destroyConnectionToCommit (params) {
      return ipcRenderer.invoke('destroy-connection-to-commit', toRaw(params));
   }

   static useSchema (params) {
      return ipcRenderer.invoke('use-schema', toRaw(params));
   }

   static rawQuery (params) {
      return ipcRenderer.invoke('raw-query', toRaw(params));
   }

   static export (params) {
      return ipcRenderer.invoke('export', toRaw(params));
   }

   static abortExport () {
      return ipcRenderer.invoke('abort-export');
   }

   static import (params) {
      return ipcRenderer.invoke('import-sql', toRaw(params));
   }

   static abortImport () {
      return ipcRenderer.invoke('abort-import-sql');
   }
}
