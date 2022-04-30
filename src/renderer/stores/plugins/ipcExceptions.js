import { ipcRenderer } from 'electron';

export function ipcExceptions ({ store }) {
   ipcRenderer.on('unhandled-exception', (event, error) => {
      store.notifications.addNotification({ status: 'error', message: error.message });
   });
}
