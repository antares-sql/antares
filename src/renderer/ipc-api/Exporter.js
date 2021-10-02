'use strict';
import { ipcRenderer } from 'electron';

export default class {
   static getConnectionParams (params) {
        return ipcRenderer.invoke('get-connection-params', params);
   }
}
