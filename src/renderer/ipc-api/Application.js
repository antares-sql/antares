'use strict';
import { ipcRenderer } from 'electron';

export default class {
   static getKey (params) {
      return ipcRenderer.sendSync('get-key', params);
   }
}
