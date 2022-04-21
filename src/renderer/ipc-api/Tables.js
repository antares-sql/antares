'use strict';
import { ipcRenderer } from 'electron';

export default class {
   static getTableColumns (params) {
      return ipcRenderer.invoke('get-table-columns', { ...params });
   }

   static getTableData (params) {
      return ipcRenderer.invoke('get-table-data', { ...params });
   }

   static getTableApproximateCount (params) {
      return ipcRenderer.invoke('get-table-count', { ...params });
   }

   static getTableOptions (params) {
      return ipcRenderer.invoke('get-table-options', { ...params });
   }

   static getTableIndexes (params) {
      return ipcRenderer.invoke('get-table-indexes', { ...params });
   }

   static getKeyUsage (params) {
      return ipcRenderer.invoke('get-key-usage', { ...params });
   }

   static updateTableCell (params) {
      return ipcRenderer.invoke('update-table-cell', { ...params });
   }

   static deleteTableRows (params) {
      return ipcRenderer.invoke('delete-table-rows', { ...params });
   }

   static insertTableRows (params) {
      return ipcRenderer.invoke('insert-table-rows', { ...params });
   }

   static insertTableFakeRows (params) {
      return ipcRenderer.invoke('insert-table-fake-rows', { ...params });
   }

   static getForeignList (params) {
      return ipcRenderer.invoke('get-foreign-list', { ...params });
   }

   static createTable (params) {
      return ipcRenderer.invoke('create-table', { ...params });
   }

   static alterTable (params) {
      return ipcRenderer.invoke('alter-table', { ...params });
   }

   static duplicateTable (params) {
      return ipcRenderer.invoke('duplicate-table', { ...params });
   }

   static truncateTable (params) {
      return ipcRenderer.invoke('truncate-table', { ...params });
   }

   static dropTable (params) {
      return ipcRenderer.invoke('drop-table', { ...params });
   }
}
