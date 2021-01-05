'use strict';
import { ipcRenderer } from 'electron';

export default class {
   static getRoutineInformations (params) {
      return ipcRenderer.invoke('get-routine-informations', params);
   }

   static dropRoutine (params) {
      return ipcRenderer.invoke('drop-routine', params);
   }

   static alterRoutine (params) {
      return ipcRenderer.invoke('alter-routine', params);
   }

   static createRoutine (params) {
      return ipcRenderer.invoke('create-routine', params);
   }
}
