import { ipcRenderer } from 'electron';

export default store => {
   ipcRenderer.on('checkingForUpdate', () => {
      store.commit('application/CHANGE_UPDATE_STATUS', 'checking');
   });
   ipcRenderer.on('updateAvailable', () => {
      store.commit('application/CHANGE_UPDATE_STATUS', 'available');
   });
   ipcRenderer.on('updateNotAvailable', () => {
      store.commit('application/CHANGE_UPDATE_STATUS', 'noupdate');
   });
   ipcRenderer.on('checkFailed', () => {
      store.commit('application/CHANGE_UPDATE_STATUS', 'nocheck');
   });
   ipcRenderer.on('downloadProgress', (event, data) => {
      store.commit('application/CHANGE_UPDATE_STATUS', 'downloading');
      store.commit('application/CHANGE_PROGRESS_PERCENTAGE', data.percent);
   });
   ipcRenderer.on('updateDownloaded', () => {
      store.commit('application/CHANGE_UPDATE_STATUS', 'downloaded');
   });
};
