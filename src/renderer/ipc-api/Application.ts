import { ShortcutRecord } from 'common/shortcuts';
import { ipcRenderer, OpenDialogOptions, OpenDialogReturnValue } from 'electron';

import { unproxify } from '../libs/unproxify';

export default class {
   static showOpenDialog (options: OpenDialogOptions): Promise<OpenDialogReturnValue> {
      return ipcRenderer.invoke('show-open-dialog', unproxify(options));
   }

   static showSaveDialog (options: OpenDialogOptions): Promise<OpenDialogReturnValue> {
      return ipcRenderer.invoke('show-save-dialog', unproxify(options));
   }

   static getDownloadPathDirectory (): Promise<string> {
      return ipcRenderer.invoke('get-download-dir-path');
   }

   static reloadShortcuts () {
      return ipcRenderer.invoke('reload-shortcuts');
   }

   static updateShortcuts (shortcuts: ShortcutRecord[]) {
      return ipcRenderer.invoke('update-shortcuts', unproxify(shortcuts));
   }

   static restoreDefaultShortcuts () {
      return ipcRenderer.invoke('resotre-default-shortcuts');
   }

   static unregisterShortcuts () {
      return ipcRenderer.invoke('unregister-shortcuts');
   }

   static readFile (path: string): Promise<string> {
      return ipcRenderer.invoke('read-file', path);
   }

   static writeFile (path: string, content:any) {
      return ipcRenderer.invoke('write-file', path, content);
   }
}
