'use strict';
import { ipcRenderer } from 'electron';

export default class {
   static getViewInformations (params) {
      return ipcRenderer.invoke('get-view-informations', params);
   }

   static dropView (params) {
      return ipcRenderer.invoke('drop-view', params);
   }
}
