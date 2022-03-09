'use strict';
import { ipcRenderer } from 'electron';

import connString from '../libs/testStringDecode';

export default class {
   static makeTest (params) {
      params = connString(params);
      return ipcRenderer.invoke('test-connection', params);
   }

   static connect (params) {
      params = connString(params);
      return ipcRenderer.invoke('connect', params);
   }

   static disconnect (uid) {
      return ipcRenderer.invoke('disconnect', uid);
   }
}
