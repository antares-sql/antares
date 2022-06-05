import { ipcRenderer } from 'electron';
import { unproxify } from '../libs/unproxify';
import { AlterTableParams, CreateTableParams, IpcResponse, TableForeign, TableIndex, TableInfos } from 'common/interfaces/antares';

export default class {
   static getTableColumns (params: {schema: string; table: string }): Promise<IpcResponse> {
      return ipcRenderer.invoke('get-table-columns', unproxify(params));
   }

   static getTableData (params: {
      uid: string;
      schema: string;
      table: string;
      limit: number;
      page: number;
      sortParams: {
         field: string;
         dir: 'asc' | 'desc' ;
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: any;
   }): Promise<IpcResponse> {
      return ipcRenderer.invoke('get-table-data', unproxify(params));
   }

   static getTableApproximateCount (params: { uid: string; schema: string; table: string }): Promise<IpcResponse<number>> {
      return ipcRenderer.invoke('get-table-count', unproxify(params));
   }

   static getTableOptions (params: { uid: string; schema: string; table: string }): Promise<IpcResponse<TableInfos>> {
      return ipcRenderer.invoke('get-table-options', unproxify(params));
   }

   static getTableIndexes (params: { uid: string; schema: string; table: string }): Promise<IpcResponse<TableIndex[]>> {
      return ipcRenderer.invoke('get-table-indexes', unproxify(params));
   }

   static getKeyUsage (params: { uid: string; schema: string; table: string }): Promise<IpcResponse<TableForeign[]>> {
      return ipcRenderer.invoke('get-key-usage', unproxify(params));
   }

   static updateTableCell (params: {
      uid: string;
      schema: string;
      table: string;
      primary?: string;
      id: number | string;
      content: number | string | boolean | Date | Blob | null;
      type: string;
      field: string;
   }): Promise<IpcResponse> {
      return ipcRenderer.invoke('update-table-cell', unproxify(params));
   }

   static deleteTableRows (params: {
      uid: string;
      schema: string;
      table: string;
      primary?: string;
      field: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rows: {[key: string]: any};
   }): Promise<IpcResponse> {
      return ipcRenderer.invoke('delete-table-rows', unproxify(params));
   }

   static insertTableFakeRows (params: {
      uid: string;
      schema: string;
      table: string;
      row: {[key: string]: string | number | boolean | Date | Buffer};
      repeat: number;
      fields: {[key: string]: string};
      locale: string;
   }): Promise<IpcResponse> {
      return ipcRenderer.invoke('insert-table-fake-rows', unproxify(params));
   }

   static getForeignList (params: {
      uid: string;
      schema: string;
      table: string;
      column: string;
      description: string | false;
   }): Promise<IpcResponse> {
      return ipcRenderer.invoke('get-foreign-list', unproxify(params));
   }

   static createTable (params: CreateTableParams): Promise<IpcResponse> {
      return ipcRenderer.invoke('create-table', unproxify(params));
   }

   static alterTable (params: AlterTableParams): Promise<IpcResponse> {
      return ipcRenderer.invoke('alter-table', unproxify(params));
   }

   static duplicateTable (params: { uid: string; schema: string; table: string }): Promise<IpcResponse> {
      return ipcRenderer.invoke('duplicate-table', unproxify(params));
   }

   static truncateTable (params: { uid: string; schema: string; table: string }): Promise<IpcResponse> {
      return ipcRenderer.invoke('truncate-table', unproxify(params));
   }

   static dropTable (params: { uid: string; schema: string; table: string }): Promise<IpcResponse> {
      return ipcRenderer.invoke('drop-table', unproxify(params));
   }
}
