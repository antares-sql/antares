'use strict';
import { ipcRenderer } from 'electron';

export default class {
   static getUsers (params) {
      return ipcRenderer.invoke('get-users', params);
   }
}
