'use strict';
import { ipcRenderer } from 'electron';

export default class {
   static getTriggerInformations (params) {
      return ipcRenderer.invoke('get-trigger-informations', params);
   }

   static dropTrigger (params) {
      return ipcRenderer.invoke('drop-trigger', params);
   }

   static alterTrigger (params) {
      return ipcRenderer.invoke('alter-trigger', params);
   }

   static createTrigger (params) {
      return ipcRenderer.invoke('create-trigger', params);
   }

   static toggleTrigger (params) {
      return ipcRenderer.invoke('toggle-trigger', params);
   }
}
