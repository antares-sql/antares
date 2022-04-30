// @ts-check
import { createPinia } from 'pinia';
import { ipcUpdates } from './plugins/ipcUpdates';
import { ipcShortcuts } from './plugins/ipcShortcuts';
import { ipcExceptions } from './plugins/ipcExceptions';

const pinia = createPinia();
pinia
   .use(ipcUpdates)
   .use(ipcShortcuts)
   .use(ipcExceptions);

export { pinia };
