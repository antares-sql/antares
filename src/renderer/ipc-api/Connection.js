'use strict';
import { ipcRenderer } from 'electron';
import { unproxify } from 'common/libs/unproxify';
import connStringConstruct from '../libs/connStringDecode';

export default class {
   static makeTest (params) {
      params = connStringConstruct(params);
      return ipcRenderer.invoke('test-connection', unproxify(params));
   }

   static connect (params) {
      params = connStringConstruct(params);
      return ipcRenderer.invoke('connect', unproxify(params));
   }

   static checkConnection (uid) {
      return ipcRenderer.invoke('check-connection', uid);
   }

   static disconnect (uid) {
      return ipcRenderer.invoke('disconnect', uid);
   }
}
