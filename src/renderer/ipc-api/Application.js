'use strict';
import { ipcRenderer } from 'electron';
import { toRaw } from 'vue';

export default class {
   static getKey (params) {
      return ipcRenderer.sendSync('get-key', toRaw(params));
   }

   static showOpenDialog (options) {
      return ipcRenderer.invoke('show-open-dialog', toRaw(options));
   }

   static getDownloadPathDirectory () {
      return ipcRenderer.invoke('get-download-dir-path');
   }
}
