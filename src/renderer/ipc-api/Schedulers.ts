import { ipcRenderer } from 'electron';
import { unproxify } from '../libs/unproxify';
import { AlterEventParams, CreateEventParams, EventInfos, IpcResponse } from 'common/interfaces/antares';

export default class {
   static getSchedulerInformations (params: { uid: string; schema: string; scheduler: string}): Promise<IpcResponse<EventInfos>> {
      return ipcRenderer.invoke('get-scheduler-informations', unproxify(params));
   }

   static dropScheduler (params: { uid: string; schema: string; scheduler: string}): Promise<IpcResponse> {
      return ipcRenderer.invoke('drop-scheduler', unproxify(params));
   }

   static alterScheduler (params: { scheduler: AlterEventParams & { uid: string } }): Promise<IpcResponse> {
      return ipcRenderer.invoke('alter-scheduler', unproxify(params));
   }

   static createScheduler (params: CreateEventParams & { uid: string }): Promise<IpcResponse> {
      return ipcRenderer.invoke('create-scheduler', unproxify(params));
   }

   static toggleScheduler (params: { uid: string; schema: string; scheduler: string; enabled: boolean}): Promise<IpcResponse> {
      return ipcRenderer.invoke('toggle-scheduler', unproxify(params));
   }
}
