'use strict';
export default {
   namespaced: true,
   strict: true,
   state: {
      app_name: 'Antares - SQL Client',
      app_version: process.env.PACKAGE_VERSION || 0,
      is_loading: false,
      is_new_modal: false,
      is_edit_modal: false,
      is_setting_modal: false,
      selected_setting_tab: 'general',
      selected_conection: {},
      update_status: 'noupdate', // noupdate, available, checking, nocheck, downloading, downloaded
      download_progress: 0
   },
   getters: {
      isLoading: state => state.is_loading,
      appName: state => state.app_name,
      appVersion: state => state.app_version,
      getSelectedConnection: state => state.selected_conection,
      isNewModal: state => state.is_new_modal,
      isEditModal: state => state.is_edit_modal,
      isSettingModal: state => state.is_setting_modal,
      selectedSettingTab: state => state.selected_setting_tab,
      getUpdateStatus: state => state.update_status,
      getDownloadProgress: state => Number(state.download_progress.toFixed(1))
   },
   mutations: {
      SET_LOADING_STATUS (state, payload) {
         state.is_loading = payload;
      },
      SHOW_NEW_CONNECTION_MODAL (state) {
         state.is_new_modal = true;
      },
      HIDE_NEW_CONNECTION_MODAL (state) {
         state.is_new_modal = false;
      },
      SHOW_EDIT_CONNECTION_MODAL (state, connection) {
         state.is_edit_modal = true;
         state.selected_conection = connection;
      },
      HIDE_EDIT_CONNECTION_MODAL (state) {
         state.is_edit_modal = false;
      },
      SHOW_SETTING_MODAL (state, tab) {
         state.selected_setting_tab = tab;
         state.is_setting_modal = true;
      },
      HIDE_SETTING_MODAL (state) {
         state.is_setting_modal = false;
      },
      CHANGE_UPDATE_STATUS (state, status) {
         state.update_status = status;
      },
      CHANGE_PROGRESS_PERCENTAGE (state, percentage) {
         state.download_progress = percentage;
      }
   },
   actions: {
      setLoadingStatus ({ commit }, payload) {
         commit('SET_LOADING_STATUS', payload);
      },
      // Modals
      showNewConnModal ({ commit }) {
         commit('SHOW_NEW_CONNECTION_MODAL');
      },
      hideNewConnModal ({ commit }) {
         commit('HIDE_NEW_CONNECTION_MODAL');
      },
      showEditConnModal ({ commit }, connection) {
         commit('SHOW_EDIT_CONNECTION_MODAL', connection);
      },
      hideEditConnModal ({ commit }) {
         commit('HIDE_EDIT_CONNECTION_MODAL');
      },
      showSettingModal ({ commit }, tab) {
         commit('SHOW_SETTING_MODAL', tab);
      },
      hideSettingModal ({ commit }) {
         commit('HIDE_SETTING_MODAL');
      }
   }
};
