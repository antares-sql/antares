'use strict';
import { ipcRenderer } from 'electron';

export default class {
   static getKey (params) {
      return ipcRenderer.sendSync('get-key', params);
   }

   static showOpenDialog (options) {
      return ipcRenderer.invoke('showOpenDialog', options);
   }

   static getDownloadPathDirectory () {
      return ipcRenderer.invoke('get-download-dir-path');
   }
}
