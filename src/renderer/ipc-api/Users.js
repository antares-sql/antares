'use strict';
import { ipcRenderer } from 'electron';
import { toRaw } from 'vue';

export default class {
   static getUsers (params) {
      return ipcRenderer.invoke('get-users', toRaw(params));
   }
}
