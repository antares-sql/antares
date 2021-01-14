'use strict';
import { ipcRenderer } from 'electron';

export default class {
   static getSchedulerInformations (params) {
      return ipcRenderer.invoke('get-scheduler-informations', params);
   }

   static dropScheduler (params) {
      return ipcRenderer.invoke('drop-scheduler', params);
   }

   static alterScheduler (params) {
      return ipcRenderer.invoke('alter-scheduler', params);
   }

   static createScheduler (params) {
      return ipcRenderer.invoke('create-scheduler', params);
   }
}
