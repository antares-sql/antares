import { ipcRenderer } from 'electron';

export default store => {
   ipcRenderer.on('unhandled-exception', (event, error) => {
      store.dispatch('notifications/addNotification', { status: 'error', message: error.message });
   });
};
