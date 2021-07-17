'use strict';
import Store from 'electron-store';
const persistentStore = new Store({ name: 'settings' });

export default {
   namespaced: true,
   strict: true,
   state: {
      app_name: 'Antares - SQL Client',
      app_version: process.env.PACKAGE_VERSION || 0,
      cached_version: persistentStore.get('cached_version', 0),
      is_loading: false,
      is_new_modal: false,
      is_setting_modal: false,
      is_export_modal: false,
      is_scratchpad: false,
      selected_setting_tab: 'general',
      selected_conection: {},
      update_status: 'noupdate', // noupdate, available, checking, nocheck, downloading, downloaded, disabled
      download_progress: 0,
      base_completer: [] // Needed to reset ace editor, due global-only ace completer
   },
   getters: {
      isLoading: state => state.is_loading,
      appName: state => state.app_name,
      appVersion: state => state.app_version,
      cachedVersion: state => state.cached_version,
      getBaseCompleter: state => state.base_completer,
      getSelectedConnection: state => state.selected_conection,
      isNewModal: state => state.is_new_modal,
      isSettingModal: state => state.is_setting_modal,
      isExportModal: state => state.is_export_modal,
      isScratchpad: state => state.is_scratchpad,
      selectedSettingTab: state => state.selected_setting_tab,
      getUpdateStatus: state => state.update_status,
      getDownloadProgress: state => Number(state.download_progress.toFixed(1))
   },
   mutations: {
      SET_LOADING_STATUS (state, payload) {
         state.is_loading = payload;
      },
      SET_BASE_COMPLETER (state, payload) {
         state.base_completer = payload;
      },
      SHOW_NEW_CONNECTION_MODAL (state) {
         state.is_new_modal = true;
      },
      HIDE_NEW_CONNECTION_MODAL (state) {
         state.is_new_modal = false;
      },
      SHOW_SETTING_MODAL (state, tab) {
         state.selected_setting_tab = tab;
         state.is_setting_modal = true;
      },
      HIDE_SETTING_MODAL (state) {
         state.is_setting_modal = false;
      },
      SHOW_EXPORT_MODAL (state) {
         state.is_export_modal = true;
      },
      HIDE_EXPORT_MODAL (state) {
         state.is_export_modal = false;
      },
      SHOW_SCRATCHPAD (state) {
         state.is_scratchpad = true;
      },
      HIDE_SCRATCHPAD (state) {
         state.is_scratchpad = false;
      },
      CHANGE_CACHED_VERSION (state) {
         state.cached_version = state.app_version;
         persistentStore.set('cached_version', state.cached_version);
      },
      CHANGE_UPDATE_STATUS (state, status) {
         state.update_status = status;
      },
      CHANGE_PROGRESS_PERCENTAGE (state, percentage) {
         state.download_progress = percentage;
      }
   },
   actions: {
      checkVersionUpdate ({ getters, commit, dispatch }) {
         if (getters.appVersion !== getters.cachedVersion) {
            dispatch('showSettingModal', 'changelog');
            commit('CHANGE_CACHED_VERSION');
         }
      },
      setLoadingStatus ({ commit }, payload) {
         commit('SET_LOADING_STATUS', payload);
      },
      setBaseCompleter ({ commit }, payload) {
         commit('SET_BASE_COMPLETER', payload);
      },
      // Modals
      showNewConnModal ({ commit }) {
         commit('SHOW_NEW_CONNECTION_MODAL');
      },
      hideNewConnModal ({ commit }) {
         commit('HIDE_NEW_CONNECTION_MODAL');
      },
      showSettingModal ({ commit }, tab) {
         commit('SHOW_SETTING_MODAL', tab);
      },
      hideSettingModal ({ commit }) {
         commit('HIDE_SETTING_MODAL');
      },
      showScratchpad ({ commit }) {
         commit('SHOW_SCRATCHPAD');
      },
      hideScratchpad ({ commit }) {
         commit('HIDE_SCRATCHPAD');
      },
      showExportModal ({ commit }) {
         console.log(commit);
         commit('SHOW_EXPORT_MODAL');
      },
      hideExportModal ({ commit }) {
         console.log(commit);
         commit('HIDE_EXPORT_MODAL');
      }
   }
};
