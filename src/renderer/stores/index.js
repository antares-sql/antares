// @ts-check
import { createPinia } from 'pinia';
import { ipcUpdates } from './plugins/ipcUpdates';
import { ipcShortcuts } from './plugins/ipcShortcuts';

const pinia = createPinia();
pinia
   .use(ipcUpdates)
   .use(ipcShortcuts);

export { pinia };
