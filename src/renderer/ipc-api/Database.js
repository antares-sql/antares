'use strict';
import { ipcRenderer } from 'electron';

export default class {
   static createDatabase (params) {
      return ipcRenderer.invoke('create-database', params);
   }

   static getStructure (uid) {
      return ipcRenderer.invoke('get-structure', uid);
   }

   static getCollations (uid) {
      return ipcRenderer.invoke('get-collations', uid);
   }

   static getVariables (uid) {
      return ipcRenderer.invoke('get-variables', uid);
   }

   static rawQuery (params) {
      return ipcRenderer.invoke('raw-query', params);
   }
}
