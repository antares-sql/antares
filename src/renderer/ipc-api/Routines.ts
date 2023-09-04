import { AlterRoutineParams, CreateRoutineParams, IpcResponse } from 'common/interfaces/antares';
import { ipcRenderer } from 'electron';

import { unproxify } from '../libs/unproxify';

export default class {
   static getRoutineInformations (params: { uid: string; schema: string; routine: string}): Promise<IpcResponse> {
      return ipcRenderer.invoke('get-routine-informations', unproxify(params));
   }

   static dropRoutine (params: { uid: string; schema: string; routine: string}): Promise<IpcResponse> {
      return ipcRenderer.invoke('drop-routine', unproxify(params));
   }

   static alterRoutine (params: { uid: string; routine: AlterRoutineParams }): Promise<IpcResponse> {
      return ipcRenderer.invoke('alter-routine', unproxify(params));
   }

   static createRoutine (params: { routine: CreateRoutineParams & { uid: string } }): Promise<IpcResponse> {
      return ipcRenderer.invoke('create-routine', unproxify(params));
   }
}
