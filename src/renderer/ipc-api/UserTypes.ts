import { AlterUserTypeParams, IpcResponse, UserTypeDetails } from 'common/interfaces/antares';
import { ipcRenderer } from 'electron';

import { unproxify } from '../libs/unproxify';

export default class {
   static getUserTypeInformations (params: { uid: string; schema: string; userType: string }): Promise<IpcResponse<UserTypeDetails>> {
      return ipcRenderer.invoke('get-user-type-informations', unproxify(params));
   }

   static createUserType (params: { uid: string; userType: UserTypeDetails }): Promise<IpcResponse> {
      return ipcRenderer.invoke('create-user-type', unproxify(params));
   }

   static alterUserType (params: AlterUserTypeParams & { uid: string }): Promise<IpcResponse> {
      return ipcRenderer.invoke('alter-user-type', unproxify(params));
   }

   static dropUserType (params: { uid: string; schema: string; userType: string }): Promise<IpcResponse> {
      return ipcRenderer.invoke('drop-user-type', unproxify(params));
   }
}
