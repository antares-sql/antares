import { ipcRenderer } from 'electron';
import { unproxify } from '../libs/unproxify';
import { AlterRoutineParams, CreateRoutineParams, IpcResponse, RoutineInfos } from 'common/interfaces/antares';

export default class {
   static getRoutineInformations (params: { uid: string; schema: string; routine: string}): Promise<IpcResponse<RoutineInfos>> {
      return ipcRenderer.invoke('get-routine-informations', unproxify(params));
   }

   static dropRoutine (params: { uid: string; schema: string; routine: string}): Promise<IpcResponse> {
      return ipcRenderer.invoke('drop-routine', unproxify(params));
   }

   static alterRoutine (params: { routine: AlterRoutineParams & { uid: string } }): Promise<IpcResponse> {
      return ipcRenderer.invoke('alter-routine', unproxify(params));
   }

   static createRoutine (params: { routine: CreateRoutineParams & { uid: string } }): Promise<IpcResponse> {
      return ipcRenderer.invoke('create-routine', unproxify(params));
   }
}
