'use strict';
import { ipcRenderer } from 'electron';
import { unproxify } from '../libs/unproxify';

export default class {
   static getFunctionInformations (params) {
      return ipcRenderer.invoke('get-function-informations', unproxify(params));
   }

   static dropFunction (params) {
      return ipcRenderer.invoke('drop-function', unproxify(params));
   }

   static alterFunction (params) {
      return ipcRenderer.invoke('alter-function', unproxify(params));
   }

   static alterTriggerFunction (params) {
      return ipcRenderer.invoke('alter-trigger-function', unproxify(params));
   }

   static createFunction (params) {
      return ipcRenderer.invoke('create-function', unproxify(params));
   }

   static createTriggerFunction (params) {
      return ipcRenderer.invoke('create-trigger-function', unproxify(params));
   }
}
