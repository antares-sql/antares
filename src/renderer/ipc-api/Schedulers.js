'use strict';
import { ipcRenderer } from 'electron';
import { unproxify } from 'common/libs/unproxify';

export default class {
   static getSchedulerInformations (params) {
      return ipcRenderer.invoke('get-scheduler-informations', unproxify(params));
   }

   static dropScheduler (params) {
      return ipcRenderer.invoke('drop-scheduler', unproxify(params));
   }

   static alterScheduler (params) {
      return ipcRenderer.invoke('alter-scheduler', unproxify(params));
   }

   static createScheduler (params) {
      return ipcRenderer.invoke('create-scheduler', unproxify(params));
   }

   static toggleScheduler (params) {
      return ipcRenderer.invoke('toggle-scheduler', unproxify(params));
   }
}
