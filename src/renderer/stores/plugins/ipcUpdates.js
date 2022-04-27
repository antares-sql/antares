import { ipcRenderer } from 'electron';

export function ipcUpdates ({ store }) {
   ipcRenderer.on('checking-for-update', () => {
      store.application.updateStatus = 'checking';
   });

   ipcRenderer.on('update-available', () => {
      store.application.updateStatus = 'available';
   });

   ipcRenderer.on('update-not-available', () => {
      store.application.updateStatus = 'noupdate';
   });

   ipcRenderer.on('check-failed', () => {
      store.application.updateStatus = 'nocheck';
   });

   ipcRenderer.on('no-auto-update', () => {
      store.application.updateStatus = 'disabled';
   });

   ipcRenderer.on('download-progress', (event, data) => {
      store.application.updateStatus = 'downloading';
      store.application.downloadprogress = data.percent;
   });

   ipcRenderer.on('update-downloaded', () => {
      store.application.updateStatus = 'downloaded';
   });

   ipcRenderer.on('link-to-download', () => {
      store.application.updateStatus = 'link';
   });
}
