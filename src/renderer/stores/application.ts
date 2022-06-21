import { defineStore } from 'pinia';
import * as Store from 'electron-store';
import { Ace } from 'ace-builds';
const persistentStore = new Store({ name: 'settings' });

export const useApplicationStore = defineStore('application', {
   state: () => ({
      appName: 'Antares - SQL Client',
      appVersion: process.env.PACKAGE_VERSION || '0',
      cachedVersion: persistentStore.get('cached_version', '0') as string,
      isLoading: false,
      isNewModal: false,
      isSettingModal: false,
      isScratchpad: false,
      selectedSettingTab: 'general',
      selectedConection: {},
      updateStatus: 'noupdate', // 'noupdate' | 'available' | 'checking' | 'nocheck' | 'downloading' | 'downloaded' | 'disabled'
      downloadProgress: 0,
      baseCompleter: [] as Ace.Completer[] // Needed to reset ace editor, due global-only ace completer
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
      setLoadingStatus (payload: boolean) {
         this.isLoading = payload;
      },
      setBaseCompleters (payload: Ace.Completer[]) {
         this.baseCompleter = payload;
      },
      // Modals
      showNewConnModal () {
         this.isNewModal = true;
      },
      hideNewConnModal () {
         this.isNewModal = false;
      },
      showSettingModal (tab: string) {
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
