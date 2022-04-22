'use strict';
import { ipcRenderer } from 'electron';
import { unproxify } from 'common/libs/unproxify';

export default class {
   static createSchema (params) {
      return ipcRenderer.invoke('create-schema', unproxify(params));
   }

   static updateSchema (params) {
      return ipcRenderer.invoke('update-schema', unproxify(params));
   }

   static getDatabaseCollation (params) {
      return ipcRenderer.invoke('get-schema-collation', unproxify(params));
   }

   static deleteSchema (params) {
      return ipcRenderer.invoke('delete-schema', unproxify(params));
   }

   static getStructure (params) {
      return ipcRenderer.invoke('get-structure', unproxify(params, false));
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
      return ipcRenderer.invoke('kill-process', unproxify(params));
   }

   static killTabQuery (params) {
      return ipcRenderer.invoke('kill-tab-query', unproxify(params));
   }

   static commitTab (params) {
      return ipcRenderer.invoke('commit-tab', unproxify(params));
   }

   static rollbackTab (params) {
      return ipcRenderer.invoke('rollback-tab', unproxify(params));
   }

   static destroyConnectionToCommit (params) {
      return ipcRenderer.invoke('destroy-connection-to-commit', unproxify(params));
   }

   static useSchema (params) {
      return ipcRenderer.invoke('use-schema', unproxify(params));
   }

   static rawQuery (params) {
      return ipcRenderer.invoke('raw-query', unproxify(params));
   }

   static export (params) {
      return ipcRenderer.invoke('export', unproxify(params));
   }

   static abortExport () {
      return ipcRenderer.invoke('abort-export');
   }

   static import (params) {
      return ipcRenderer.invoke('import-sql', unproxify(params));
   }

   static abortImport () {
      return ipcRenderer.invoke('abort-import-sql');
   }
}
