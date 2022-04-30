import { ipcRenderer } from 'electron';

export function ipcShortcuts ({ store }) {
   ipcRenderer.on('toggle-preferences', () => {
      store.application.showSettingModal('general');
   });

   ipcRenderer.on('open-updates-preferences', () => {
      store.application.showSettingModal('update');
      ipcRenderer.send('check-for-updates');
   });
}
