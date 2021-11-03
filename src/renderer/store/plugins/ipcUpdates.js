import { ipcRenderer } from 'electron';

export default store => {
   ipcRenderer.on('checking-for-update', () => {
      store.commit('application/CHANGE_UPDATE_STATUS', 'checking');
   });

   ipcRenderer.on('update-available', () => {
      store.commit('application/CHANGE_UPDATE_STATUS', 'available');
   });

   ipcRenderer.on('update-not-available', () => {
      store.commit('application/CHANGE_UPDATE_STATUS', 'noupdate');
   });

   ipcRenderer.on('check-failed', () => {
      store.commit('application/CHANGE_UPDATE_STATUS', 'nocheck');
   });

   ipcRenderer.on('no-auto-update', () => {
      store.commit('application/CHANGE_UPDATE_STATUS', 'disabled');
   });

   ipcRenderer.on('download-progress', (event, data) => {
      store.commit('application/CHANGE_UPDATE_STATUS', 'downloading');
      store.commit('application/CHANGE_PROGRESS_PERCENTAGE', data.percent);
   });

   ipcRenderer.on('update-downloaded', () => {
      store.commit('application/CHANGE_UPDATE_STATUS', 'downloaded');
   });

   ipcRenderer.on('link-to-download', () => {
      store.commit('application/CHANGE_UPDATE_STATUS', 'link');
   });
};
