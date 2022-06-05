import { ipcRenderer, OpenDialogOptions, OpenDialogReturnValue } from 'electron';
import { unproxify } from '../libs/unproxify';

export default class {
   static showOpenDialog (options: OpenDialogOptions): Promise<OpenDialogReturnValue> {
      return ipcRenderer.invoke('show-open-dialog', unproxify(options));
   }

   static getDownloadPathDirectory (): Promise<string> {
      return ipcRenderer.invoke('get-download-dir-path');
   }
}
