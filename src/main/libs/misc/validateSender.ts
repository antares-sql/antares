import { WebFrameMain } from 'electron';
import * as path from 'path';

const isDevelopment = process.env.NODE_ENV !== 'production';
const isWindows = process.platform === 'win32';
const indexPath = path.resolve(__dirname, 'index.html').split(path.sep).join('/');

export function validateSender (frame: WebFrameMain) {
   if (process.windowsStore) return true; // TEMP HOTFIX
   const frameUrl = new URL(frame.url);
   const prefix = isWindows ? 'file:///' : 'file://';
   const framePath = frameUrl.href.replace(prefix, '');

   if ((isDevelopment && frameUrl.host === 'localhost:9080') || framePath === indexPath) return true;
   return false;
}
