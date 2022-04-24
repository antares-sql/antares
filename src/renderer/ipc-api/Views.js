'use strict';
import { ipcRenderer } from 'electron';
import { unproxify } from '../libs/unproxify';

export default class {
   static getViewInformations (params) {
      return ipcRenderer.invoke('get-view-informations', unproxify(params));
   }

   static dropView (params) {
      return ipcRenderer.invoke('drop-view', unproxify(params));
   }

   static alterView (params) {
      return ipcRenderer.invoke('alter-view', unproxify(params));
   }

   static createView (params) {
      return ipcRenderer.invoke('create-view', unproxify(params));
   }
}
