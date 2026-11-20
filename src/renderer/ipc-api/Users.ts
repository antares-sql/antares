import { IpcResponse, SaveUserParams, UserAccount, UserDetails, UserIdentity, UsersManagementInfo } from 'common/interfaces/antares';
import { ipcRenderer } from 'electron';

import { unproxify } from '../libs/unproxify';

export default class {
   static getUsers (params: string): Promise<IpcResponse> {
      return ipcRenderer.invoke('get-users', unproxify(params));
   }

   static getUsersManagementInfo (uid: string): Promise<IpcResponse<UsersManagementInfo>> {
      return ipcRenderer.invoke('get-users-management-info', uid);
   }

   static getUsersList (uid: string): Promise<IpcResponse<UserAccount[]>> {
      return ipcRenderer.invoke('get-users-list', uid);
   }

   static getUserDetails (params: { uid: string; user: UserIdentity }): Promise<IpcResponse<UserDetails>> {
      return ipcRenderer.invoke('get-user-details', unproxify(params));
   }

   static createUser (params: SaveUserParams & { uid: string }): Promise<IpcResponse> {
      return ipcRenderer.invoke('create-user', unproxify(params));
   }

   static alterUser (params: SaveUserParams & { uid: string }): Promise<IpcResponse> {
      return ipcRenderer.invoke('alter-user', unproxify(params));
   }

   static dropUser (params: { uid: string; user: UserIdentity }): Promise<IpcResponse> {
      return ipcRenderer.invoke('drop-user', unproxify(params));
   }
}
