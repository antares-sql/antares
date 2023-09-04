import { ConnectionParams, IpcResponse } from 'common/interfaces/antares';
import { ipcRenderer } from 'electron';

import connStringConstruct from '../libs/connStringDecode';
import { unproxify } from '../libs/unproxify';

export default class {
   static makeTest (params: ConnectionParams & { pgConnString?: string }): Promise<IpcResponse> {
      const newParams = connStringConstruct(params) as ConnectionParams;
      return ipcRenderer.invoke('test-connection', unproxify(newParams));
   }

   static connect (params: ConnectionParams & { pgConnString?: string }): Promise<IpcResponse> {
      const newParams = connStringConstruct(params) as ConnectionParams;
      return ipcRenderer.invoke('connect', unproxify(newParams));
   }

   static checkConnection (uid: string): Promise<boolean> {
      return ipcRenderer.invoke('check-connection', uid);
   }

   static disconnect (uid: string): Promise<void> {
      return ipcRenderer.invoke('disconnect', uid);
   }
}
