import { WebFrameMain } from 'electron';
import * as path from 'path';

const isDevelopment = process.env.NODE_ENV !== 'production';
const indexPath = path.resolve(__dirname, 'index.html').split(path.sep).join('/');

export function validateSender (frame: WebFrameMain) {
   const frameUrl = new URL(frame.url);
   if ((isDevelopment && frameUrl.host === 'localhost:9080') || frameUrl.href.replace('file:///', '').replace('file://localhost', '') === indexPath) return true;
   return false;
}
