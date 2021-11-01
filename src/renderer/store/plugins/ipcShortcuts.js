import { ipcRenderer } from 'electron';

export default store => {
   ipcRenderer.on('toggle-preferences', (event, error) => {
      store.dispatch('application/showSettingModal', 'general');
   });

   ipcRenderer.on('open-updates-preferences', (event, error) => {
      store.dispatch('application/showSettingModal', 'update');
      ipcRenderer.send('check-for-updates');
   });
};
