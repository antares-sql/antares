'use strict';
import { ipcRenderer } from 'electron';
import { unproxify } from '../libs/unproxify';

export default class {
   static getTableColumns (params) {
      return ipcRenderer.invoke('get-table-columns', unproxify(params));
   }

   static getTableData (params) {
      return ipcRenderer.invoke('get-table-data', unproxify(params));
   }

   static getTableApproximateCount (params) {
      return ipcRenderer.invoke('get-table-count', unproxify(params));
   }

   static getTableOptions (params) {
      return ipcRenderer.invoke('get-table-options', unproxify(params));
   }

   static getTableIndexes (params) {
      return ipcRenderer.invoke('get-table-indexes', unproxify(params));
   }

   static getKeyUsage (params) {
      return ipcRenderer.invoke('get-key-usage', unproxify(params));
   }

   static updateTableCell (params) {
      return ipcRenderer.invoke('update-table-cell', unproxify(params));
   }

   static deleteTableRows (params) {
      return ipcRenderer.invoke('delete-table-rows', unproxify(params));
   }

   static insertTableRows (params) {
      return ipcRenderer.invoke('insert-table-rows', unproxify(params));
   }

   static insertTableFakeRows (params) {
      return ipcRenderer.invoke('insert-table-fake-rows', unproxify(params));
   }

   static getForeignList (params) {
      return ipcRenderer.invoke('get-foreign-list', unproxify(params));
   }

   static createTable (params) {
      return ipcRenderer.invoke('create-table', unproxify(params));
   }

   static alterTable (params) {
      return ipcRenderer.invoke('alter-table', unproxify(params));
   }

   static duplicateTable (params) {
      return ipcRenderer.invoke('duplicate-table', unproxify(params));
   }

   static truncateTable (params) {
      return ipcRenderer.invoke('truncate-table', unproxify(params));
   }

   static dropTable (params) {
      return ipcRenderer.invoke('drop-table', unproxify(params));
   }
}
