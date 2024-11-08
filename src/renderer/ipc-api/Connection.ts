import { ConnectionParams, IpcResponse } from 'common/interfaces/antares';
import { ipcRenderer } from 'electron';

import { unproxify } from '../libs/unproxify';

export default class {
   static makeTest (params: ConnectionParams & { connString?: string }): Promise<IpcResponse> {
      return ipcRenderer.invoke('test-connection', unproxify(params));
   }

   static connect (params: ConnectionParams & { connString?: string }): Promise<IpcResponse> {
      return ipcRenderer.invoke('connect', unproxify(params));
   }

   static abortConnection (uid: string): void {
      ipcRenderer.send('abort-connection', uid);
   }

   static checkConnection (uid: string): Promise<boolean> {
      return ipcRenderer.invoke('check-connection', uid);
   }

   static disconnect (uid: string): Promise<void> {
      return ipcRenderer.invoke('disconnect', uid);
   }
}
