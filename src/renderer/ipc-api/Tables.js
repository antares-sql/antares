'use strict';
import { ipcRenderer } from 'electron';

export default class {
   static getTableColumns (params) {
      return ipcRenderer.invoke('getTableColumns', params);
   }

   static getTableData (params) {
      return ipcRenderer.invoke('getTableData', params);
   }

   static getKeyUsage (params) {
      return ipcRenderer.invoke('get-key-usage', params);
   }

   static updateTableCell (params) {
      return ipcRenderer.invoke('updateTableCell', params);
   }

   static deleteTableRows (params) {
      return ipcRenderer.invoke('deleteTableRows', params);
   }

   static insertTableRows (params) {
      return ipcRenderer.invoke('insertTableRows', params);
   }

   static getForeignList (params) {
      return ipcRenderer.invoke('get-foreign-list', params);
   }
}
