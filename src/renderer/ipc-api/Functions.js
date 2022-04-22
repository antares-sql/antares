'use strict';
import { ipcRenderer } from 'electron';
import { toRaw } from 'vue';

export default class {
   static getFunctionInformations (params) {
      return ipcRenderer.invoke('get-function-informations', toRaw(params));
   }

   static dropFunction (params) {
      return ipcRenderer.invoke('drop-function', toRaw(params));
   }

   static alterFunction (params) {
      return ipcRenderer.invoke('alter-function', toRaw(params));
   }

   static alterTriggerFunction (params) {
      return ipcRenderer.invoke('alter-trigger-function', toRaw(params));
   }

   static createFunction (params) {
      return ipcRenderer.invoke('create-function', toRaw(params));
   }

   static createTriggerFunction (params) {
      return ipcRenderer.invoke('create-trigger-function', toRaw(params));
   }
}
