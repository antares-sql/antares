'use strict';
import { ipcRenderer } from 'electron';
import { toRaw } from 'vue';

export default class {
   static getViewInformations (params) {
      return ipcRenderer.invoke('get-view-informations', toRaw(params));
   }

   static dropView (params) {
      return ipcRenderer.invoke('drop-view', toRaw(params));
   }

   static alterView (params) {
      return ipcRenderer.invoke('alter-view', toRaw(params));
   }

   static createView (params) {
      return ipcRenderer.invoke('create-view', toRaw(params));
   }
}
