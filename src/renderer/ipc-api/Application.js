'use strict';
import { ipcRenderer } from 'electron';
import { unproxify } from '../libs/unproxify';

export default class {
   static getKey (params) {
      return ipcRenderer.sendSync('get-key', unproxify(params));
   }

   static showOpenDialog (options) {
      return ipcRenderer.invoke('show-open-dialog', unproxify(options));
   }

   static getDownloadPathDirectory () {
      return ipcRenderer.invoke('get-download-dir-path');
   }
}
