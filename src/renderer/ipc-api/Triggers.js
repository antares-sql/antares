'use strict';
import { ipcRenderer } from 'electron';
import { unproxify } from '../libs/unproxify';

export default class {
   static getTriggerInformations (params) {
      return ipcRenderer.invoke('get-trigger-informations', unproxify(params));
   }

   static dropTrigger (params) {
      return ipcRenderer.invoke('drop-trigger', unproxify(params));
   }

   static alterTrigger (params) {
      return ipcRenderer.invoke('alter-trigger', unproxify(params));
   }

   static createTrigger (params) {
      return ipcRenderer.invoke('create-trigger', unproxify(params));
   }

   static toggleTrigger (params) {
      return ipcRenderer.invoke('toggle-trigger', unproxify(params));
   }
}
