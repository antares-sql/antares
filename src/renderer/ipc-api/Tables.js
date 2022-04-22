'use strict';
import { ipcRenderer } from 'electron';
import { toRaw } from 'vue';

export default class {
   static getTableColumns (params) {
      return ipcRenderer.invoke('get-table-columns', toRaw(params));
   }

   static getTableData (params) {
      return ipcRenderer.invoke('get-table-data', toRaw(params));
   }

   static getTableApproximateCount (params) {
      return ipcRenderer.invoke('get-table-count', toRaw(params));
   }

   static getTableOptions (params) {
      return ipcRenderer.invoke('get-table-options', toRaw(params));
   }

   static getTableIndexes (params) {
      return ipcRenderer.invoke('get-table-indexes', toRaw(params));
   }

   static getKeyUsage (params) {
      return ipcRenderer.invoke('get-key-usage', toRaw(params));
   }

   static updateTableCell (params) {
      return ipcRenderer.invoke('update-table-cell', toRaw(params));
   }

   static deleteTableRows (params) {
      return ipcRenderer.invoke('delete-table-rows', toRaw(params));
   }

   static insertTableRows (params) {
      return ipcRenderer.invoke('insert-table-rows', toRaw(params));
   }

   static insertTableFakeRows (params) {
      return ipcRenderer.invoke('insert-table-fake-rows', toRaw(params));
   }

   static getForeignList (params) {
      return ipcRenderer.invoke('get-foreign-list', toRaw(params));
   }

   static createTable (params) {
      return ipcRenderer.invoke('create-table', toRaw(params));
   }

   static alterTable (params) {
      return ipcRenderer.invoke('alter-table', toRaw(params));
   }

   static duplicateTable (params) {
      return ipcRenderer.invoke('duplicate-table', toRaw(params));
   }

   static truncateTable (params) {
      return ipcRenderer.invoke('truncate-table', toRaw(params));
   }

   static dropTable (params) {
      return ipcRenderer.invoke('drop-table', toRaw(params));
   }
}
