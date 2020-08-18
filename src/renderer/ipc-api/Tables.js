'use strict';
import { ipcRenderer } from 'electron';

export default class {
   static getTableColumns (params) {
      return ipcRenderer.invoke('get-table-columns', params);
   }

   static getTableData (params) {
      return ipcRenderer.invoke('get-table-data', params);
   }

   static getKeyUsage (params) {
      return ipcRenderer.invoke('get-key-usage', params);
   }

   static updateTableCell (params) {
      return ipcRenderer.invoke('update-table-cell', params);
   }

   static deleteTableRows (params) {
      return ipcRenderer.invoke('delete-table-rows', params);
   }

   static insertTableRows (params) {
      return ipcRenderer.invoke('insert-table-rows', params);
   }

   static getForeignList (params) {
      return ipcRenderer.invoke('get-foreign-list', params);
   }
}
