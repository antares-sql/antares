import { ipcRenderer } from 'electron';
import { unproxify } from '../libs/unproxify';
import { IpcResponse } from 'common/interfaces/antares';

export default class {
   static getDatabases (params: string): Promise<IpcResponse> {
      return ipcRenderer.invoke('get-databases', unproxify(params));
   }
}
