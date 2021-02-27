'use strict';
import i18n from '@/i18n';
import Store from 'electron-store';
const persistentStore = new Store({ name: 'settings' });

export default {
   namespaced: true,
   strict: true,
   state: {
      locale: persistentStore.get('locale', 'en-US'),
      allow_prerelease: persistentStore.get('allow_prerelease', true),
      explorebar_size: persistentStore.get('explorebar_size', null),
      notifications_timeout: persistentStore.get('notifications_timeout', 5),
      auto_complete: persistentStore.get('auto_complete', true),
      line_wrap: persistentStore.get('line_wrap', true),
      application_theme: persistentStore.get('application_theme', 'dark'),
      editor_theme: persistentStore.get('editor_theme', 'twilight')
   },
   getters: {
      getLocale: state => state.locale,
      getAllowPrerelease: state => state.allow_prerelease,
      getExplorebarSize: state => state.explorebar_size,
      getNotificationsTimeout: state => state.notifications_timeout,
      getAutoComplete: state => state.auto_complete,
      getLineWrap: state => state.line_wrap,
      getApplicationTheme: state => state.application_theme,
      getEditorTheme: state => state.editor_theme
   },
   mutations: {
      SET_LOCALE (state, locale) {
         state.locale = locale;
         i18n.locale = locale;
         persistentStore.set('locale', state.locale);
      },
      SET_ALLOW_PRERELEASE (state, allow) {
         state.allow_prerelease = allow;
         persistentStore.set('allow_prerelease', state.allow_prerelease);
      },
      SET_NOTIFICATIONS_TIMEOUT (state, timeout) {
         state.notifications_timeout = timeout;
         persistentStore.set('notifications_timeout', state.notifications_timeout);
      },
      SET_AUTO_COMPLETE (state, val) {
         state.auto_complete = val;
         persistentStore.set('auto_complete', state.auto_complete);
      },
      SET_LINE_WRAP (state, val) {
         state.line_wrap = val;
         persistentStore.set('line_wrap', state.line_wrap);
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
      changeAllowPrerelease ({ commit }, allow) {
         commit('SET_ALLOW_PRERELEASE', allow);
      },
      updateNotificationsTimeout ({ commit }, timeout) {
         commit('SET_NOTIFICATIONS_TIMEOUT', timeout);
      },
      changeExplorebarSize ({ commit }, size) {
         commit('SET_EXPLOREBAR_SIZE', size);
      },
      changeAutoComplete ({ commit }, val) {
         commit('SET_AUTO_COMPLETE', val);
      },
      changeLineWrap ({ commit }, val) {
         commit('SET_LINE_WRAP', val);
      },
      changeEditorTheme ({ commit }, theme) {
         commit('SET_EDITOR_THEME', theme);
      }
   }
};
