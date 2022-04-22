'use strict';
import { ipcRenderer } from 'electron';
import { toRaw } from 'vue';

export default class {
   static getSchedulerInformations (params) {
      return ipcRenderer.invoke('get-scheduler-informations', toRaw(params));
   }

   static dropScheduler (params) {
      return ipcRenderer.invoke('drop-scheduler', toRaw(params));
   }

   static alterScheduler (params) {
      return ipcRenderer.invoke('alter-scheduler', toRaw(params));
   }

   static createScheduler (params) {
      return ipcRenderer.invoke('create-scheduler', toRaw(params));
   }

   static toggleScheduler (params) {
      return ipcRenderer.invoke('toggle-scheduler', toRaw(params));
   }
}
