import { ipcRenderer } from 'electron';
import { unproxify } from '../libs/unproxify';
import { AlterTriggerParams, CreateTriggerParams, IpcResponse } from 'common/interfaces/antares';

export default class {
   static getTriggerInformations (params: { uid: string; schema: string; trigger: string }): Promise<IpcResponse> {
      return ipcRenderer.invoke('get-trigger-informations', unproxify(params));
   }

   static dropTrigger (params: { uid: string; schema: string; trigger: string }): Promise<IpcResponse> {
      return ipcRenderer.invoke('drop-trigger', unproxify(params));
   }

   static alterTrigger (params: { trigger: AlterTriggerParams & { uid: string }}): Promise<IpcResponse> {
      return ipcRenderer.invoke('alter-trigger', unproxify(params));
   }

   static createTrigger (params: CreateTriggerParams & { uid: string }): Promise<IpcResponse> {
      return ipcRenderer.invoke('create-trigger', unproxify(params));
   }

   static toggleTrigger (params: { uid: string; schema: string; trigger: string; enabled: boolean }): Promise<IpcResponse> {
      return ipcRenderer.invoke('toggle-trigger', unproxify(params));
   }
}
