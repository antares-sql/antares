'use strict';
import { ipcRenderer } from 'electron';
import { toRaw } from 'vue';

export default class {
   static getRoutineInformations (params) {
      return ipcRenderer.invoke('get-routine-informations', toRaw(params));
   }

   static dropRoutine (params) {
      return ipcRenderer.invoke('drop-routine', toRaw(params));
   }

   static alterRoutine (params) {
      return ipcRenderer.invoke('alter-routine', toRaw(params));
   }

   static createRoutine (params) {
      return ipcRenderer.invoke('create-routine', toRaw(params));
   }
}
