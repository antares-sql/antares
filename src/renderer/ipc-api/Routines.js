'use strict';
import { ipcRenderer } from 'electron';
import { unproxify } from '../libs/unproxify';

export default class {
   static getRoutineInformations (params) {
      return ipcRenderer.invoke('get-routine-informations', unproxify(params));
   }

   static dropRoutine (params) {
      return ipcRenderer.invoke('drop-routine', unproxify(params));
   }

   static alterRoutine (params) {
      return ipcRenderer.invoke('alter-routine', unproxify(params));
   }

   static createRoutine (params) {
      return ipcRenderer.invoke('create-routine', unproxify(params));
   }
}
