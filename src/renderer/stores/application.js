import { defineStore, acceptHMRUpdate } from 'pinia';
import Store from 'electron-store';
const persistentStore = new Store({ name: 'settings' });

export const useApplicationStore = defineStore('application', {
   state: () => ({
      appName: 'Antares - SQL Client',
      appVersion: process.env.PACKAGE_VERSION || 0,
      cachedVersion: persistentStore.get('cached_version', 0),
      isLoading: false,
      isNewModal: false,
      isSettingModal: false,
      isScratchpad: false,
      selectedSettingTab: 'general',
      selectedConection: {},
      updateStatus: 'noupdate', // 'noupdate' | 'available' | 'checking' | 'nocheck' | 'downloading' | 'downloaded' | 'disabled'
      downloadProgress: 0,
      baseCompleter: [] // Needed to reset ace editor, due global-only ace completer
   }),
   getters: {
      getBaseCompleter: state => state.baseCompleter,
      getSelectedConnection: state => state.selectedConection,
      getDownloadProgress: state => Number(state.downloadProgress.toFixed(1))
   },
   actions: {
      checkVersionUpdate () {
         if (this.appVersion !== this.cachedVersion) {
            this.showSettingModal('changelog');
            this.cachedVersion = this.appVersion;
            persistentStore.set('cached_version', this.cachedVersion);
         }
      },
      setLoadingStatus (payload) {
         this.isLoading = payload;
      },
      setBaseCompleters (payload) {
         this.baseCompleter = payload;
      },
      // Modals
      showNewConnModal () {
         this.isNewModal = true;
      },
      hideNewConnModal () {
         this.isNewModal = false;
      },
      showSettingModal (tab) {
         this.selectedSettingTab = tab;
         this.isSettingModal = true;
      },
      hideSettingModal () {
         this.isSettingModal = false;
      },
      showScratchpad () {
         this.isScratchpad = true;
      },
      hideScratchpad () {
         this.isScratchpad = false;
      }
   }
});

if (import.meta.webpackHot)
   import.meta.webpackHot.accept(acceptHMRUpdate(useApplicationStore, import.meta.webpackHot));
