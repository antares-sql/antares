'use strict';
import { ipcRenderer } from 'electron';
import { unproxify } from 'common/libs/unproxify';

export default class {
   static getUsers (params) {
      return ipcRenderer.invoke('get-users', unproxify(params));
   }
}
