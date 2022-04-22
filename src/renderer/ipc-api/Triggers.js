'use strict';
import { ipcRenderer } from 'electron';
import { toRaw } from 'vue';

export default class {
   static getTriggerInformations (params) {
      return ipcRenderer.invoke('get-trigger-informations', toRaw(params));
   }

   static dropTrigger (params) {
      return ipcRenderer.invoke('drop-trigger', toRaw(params));
   }

   static alterTrigger (params) {
      return ipcRenderer.invoke('alter-trigger', toRaw(params));
   }

   static createTrigger (params) {
      return ipcRenderer.invoke('create-trigger', toRaw(params));
   }

   static toggleTrigger (params) {
      return ipcRenderer.invoke('toggle-trigger', toRaw(params));
   }
}
