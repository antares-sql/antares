import { ipcRenderer } from 'electron';
import { unproxify } from '../libs/unproxify';
import { IpcResponse/*, EventInfos, QueryResult, RoutineInfos, TableInfos, TriggerInfos */ } from 'common/interfaces/antares';
import { ExportOptions } from 'common/interfaces/exporter';
import { ImportOptions } from 'common/interfaces/importer';

export default class {
   static createSchema (params: { uid: string; name: string; collation?: string }): Promise<IpcResponse> {
      return ipcRenderer.invoke('create-schema', unproxify(params));
   }

   static updateSchema (params: { uid: string; name: string; collation?: string }): Promise<IpcResponse> {
      return ipcRenderer.invoke('update-schema', unproxify(params));
   }

   static getDatabaseCollation (params: { uid: string; database: string }) {
      return ipcRenderer.invoke('get-schema-collation', unproxify(params));
   }

   static deleteSchema (params: { uid: string; database: string }): Promise<IpcResponse> {
      return ipcRenderer.invoke('delete-schema', unproxify(params));
   }

   static getStructure (params: { uid: string; schemas: Set<string> }): Promise<IpcResponse/* <{
      name: string;
      size: number;
      tables: TableInfos[];
      functions: RoutineInfos[];
      procedures: RoutineInfos[];
      triggers: TriggerInfos[];
      schedulers: EventInfos[];
   }[]> */> {
      return ipcRenderer.invoke('get-structure', unproxify(params, false));
   }

   static getCollations (uid: string): Promise<IpcResponse/* <{
      charset: string;
      collation: string;
      compiled: boolean;
      default: boolean;
      id: number;
      sortLen: number;
   }[]> */> {
      return ipcRenderer.invoke('get-collations', uid);
   }

   static getVariables (uid: string): Promise<IpcResponse/* <{ name: string; value: string }[]> */> {
      return ipcRenderer.invoke('get-variables', uid);
   }

   static getEngines (uid: string): Promise<IpcResponse/* <{
      name: string;
      support: string;
      comment: string;
      transactions: string;
      xa: string;
      savepoints: string;
      isDefault: boolean;
   }[]> */> {
      return ipcRenderer.invoke('get-engines', uid);
   }

   static getVersion (uid: string): Promise<IpcResponse/* <{
      number: string;
      name: string;
      arch: string;
      os: string;
   }> */> {
      return ipcRenderer.invoke('get-version', uid);
   }

   static getProcesses (uid: string): Promise<IpcResponse/* <{
      id: number;
      user: string;
      host: string;
      db: string;
      command: string;
      time: number;
      state: string;
      info: string;
   }[]> */> {
      return ipcRenderer.invoke('get-processes', uid);
   }

   static killProcess (params: { uid: string; pid: number }): Promise<IpcResponse> {
      return ipcRenderer.invoke('kill-process', unproxify(params));
   }

   static killTabQuery (params: { uid: string; tabUid: string }): Promise<IpcResponse> {
      return ipcRenderer.invoke('kill-tab-query', unproxify(params));
   }

   static commitTab (params: { uid: string; tabUid: string }): Promise<IpcResponse> {
      return ipcRenderer.invoke('commit-tab', unproxify(params));
   }

   static rollbackTab (params: { uid: string; tabUid: string }): Promise<IpcResponse> {
      return ipcRenderer.invoke('rollback-tab', unproxify(params));
   }

   static destroyConnectionToCommit (params: { uid: string; tabUid: string }): Promise<IpcResponse> {
      return ipcRenderer.invoke('destroy-connection-to-commit', unproxify(params));
   }

   static useSchema (params: { uid: string; schema: string }): Promise<IpcResponse> {
      return ipcRenderer.invoke('use-schema', unproxify(params));
   }

   static rawQuery (params: { uid: string; query: string; schema: string; tabUid: string; autocommit?: boolean }): Promise<IpcResponse/* <QueryResult> */> {
      return ipcRenderer.invoke('raw-query', unproxify(params));
   }

   static export (params: { uid: string; type: string; tables: string; options: ExportOptions }): Promise<IpcResponse> {
      return ipcRenderer.invoke('export', unproxify(params));
   }

   static abortExport (): Promise<IpcResponse> {
      return ipcRenderer.invoke('abort-export');
   }

   static import (params: ImportOptions): Promise<IpcResponse> {
      return ipcRenderer.invoke('import-sql', unproxify(params));
   }

   static abortImport (): Promise<IpcResponse> {
      return ipcRenderer.invoke('abort-import-sql');
   }
}
