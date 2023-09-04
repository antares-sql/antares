import { AlterViewParams, CreateViewParams, IpcResponse } from 'common/interfaces/antares';
import { ipcRenderer } from 'electron';

import { unproxify } from '../libs/unproxify';

export default class {
   static getViewInformations (params: { uid: string; schema: string; view: string }): Promise<IpcResponse> {
      return ipcRenderer.invoke('get-view-informations', unproxify(params));
   }

   static dropView (params: { uid: string; schema: string; view: string }): Promise<IpcResponse> {
      return ipcRenderer.invoke('drop-view', unproxify(params));
   }

   static alterView (params: { view: AlterViewParams & { uid: string }}): Promise<IpcResponse> {
      return ipcRenderer.invoke('alter-view', unproxify(params));
   }

   static createView (params: CreateViewParams & { uid: string }): Promise<IpcResponse> {
      return ipcRenderer.invoke('create-view', unproxify(params));
   }
}
