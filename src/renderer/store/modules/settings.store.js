'use strict';
import i18n from '@/i18n';
import Store from 'electron-store';
const persistentStore = new Store({ name: 'settings' });

export default {
   namespaced: true,
   strict: true,
   state: {
      locale: persistentStore.get('locale') || 'en-US',
      explorebar_size: persistentStore.get('explorebar_size') || null,
      notifications_timeout: persistentStore.get('notifications_timeout') || 5,
      application_theme: persistentStore.get('application_theme') || 'dark',
      editor_theme: persistentStore.get('editor_theme') || 'twilight'
   },
   getters: {
      getLocale: state => state.locale,
      getExplorebarSize: state => state.explorebar_size,
      getNotificationsTimeout: state => state.notifications_timeout,
      getApplicationTheme: state => state.application_theme,
      getEditorTheme: state => state.editor_theme
   },
   mutations: {
      SET_LOCALE (state, locale) {
         state.locale = locale;
         i18n.locale = locale;
         persistentStore.set('locale', state.locale);
      },
      SET_NOTIFICATIONS_TIMEOUT (state, timeout) {
         state.notifications_timeout = timeout;
         persistentStore.set('notifications_timeout', state.notifications_timeout);
      },
      SET_EXPLOREBAR_SIZE (state, size) {
         state.explorebar_size = size;
         persistentStore.set('explorebar_size', state.explorebar_size);
      },
      SET_EDITOR_THEME (state, theme) {
         state.editor_theme = theme;
      }
   },
   actions: {
      changeLocale ({ commit }, locale) {
         commit('SET_LOCALE', locale);
      },
      updateNotificationsTimeout ({ commit }, timeout) {
         commit('SET_NOTIFICATIONS_TIMEOUT', timeout);
      },
      changeExplorebarSize ({ commit }, size) {
         commit('SET_EXPLOREBAR_SIZE', size);
      },
      changeEditorTheme ({ commit }, theme) {
         commit('SET_EDITOR_THEME', theme);
      }
   }
};
