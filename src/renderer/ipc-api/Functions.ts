import { AlterFunctionParams, CreateFunctionParams, IpcResponse } from 'common/interfaces/antares';
import { ipcRenderer } from 'electron';
import { unproxify } from '../libs/unproxify';

export default class {
   static getFunctionInformations (params: { uid: string; schema: string; func: string}): Promise<IpcResponse> {
      return ipcRenderer.invoke('get-function-informations', unproxify(params));
   }

   static dropFunction (params: { uid: string; schema: string; func: string}): Promise<IpcResponse> {
      return ipcRenderer.invoke('drop-function', unproxify(params));
   }

   static alterFunction (params: { func: AlterFunctionParams }): Promise<IpcResponse> {
      return ipcRenderer.invoke('alter-function', unproxify(params));
   }

   static alterTriggerFunction (params: { uid: string; func: AlterFunctionParams }): Promise<IpcResponse> {
      return ipcRenderer.invoke('alter-trigger-function', unproxify(params));
   }

   static createFunction (params: CreateFunctionParams & { uid: string }): Promise<IpcResponse> {
      return ipcRenderer.invoke('create-function', unproxify(params));
   }

   static createTriggerFunction (params: CreateFunctionParams & { uid: string }): Promise<IpcResponse> {
      return ipcRenderer.invoke('create-trigger-function', unproxify(params));
   }
}
