'use strict';
import i18n from '@/i18n';
import Store from 'electron-store';
const persistentStore = new Store({ name: 'settings' });
const isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)');
const defaultAppTheme = isDarkTheme.matches ? 'dark' : 'light';
const defaultEditorTheme = isDarkTheme.matches ? 'twilight' : 'sqlserver';

export default {
   namespaced: true,
   strict: true,
   state: {
      locale: persistentStore.get('locale', 'en-US'),
      allow_prerelease: persistentStore.get('allow_prerelease', true),
      explorebar_size: persistentStore.get('explorebar_size', null),
      notifications_timeout: persistentStore.get('notifications_timeout', 5),
      data_tab_limit: persistentStore.get('data_tab_limit', 1000),
      auto_complete: persistentStore.get('auto_complete', true),
      line_wrap: persistentStore.get('line_wrap', true),
      application_theme: persistentStore.get('application_theme', defaultAppTheme),
      editor_theme: persistentStore.get('editor_theme', defaultEditorTheme),
      editor_font_size: persistentStore.get('editor_font_size', 'medium'),
      restore_tabs: persistentStore.get('restore_tabs', true)
   },
   getters: {
      getLocale: state => state.locale,
      getDataTabLimit: state => state.data_tab_limit,
      getAllowPrerelease: state => state.allow_prerelease,
      getExplorebarSize: state => state.explorebar_size,
      getNotificationsTimeout: state => state.notifications_timeout,
      getAutoComplete: state => state.auto_complete,
      getLineWrap: state => state.line_wrap,
      getApplicationTheme: state => state.application_theme,
      getEditorTheme: state => state.editor_theme,
      getEditorFontSize: state => state.editor_font_size,
      getRestoreTabs: state => state.restore_tabs
   },
   mutations: {
      SET_LOCALE (state, locale) {
         state.locale = locale;
         i18n.locale = locale;
         persistentStore.set('locale', state.locale);
      },
      SET_DATA_TAB_LIMIT (state, limit) {
         state.data_tab_limit = limit;
         persistentStore.set('data_tab_limit', state.data_tab_limit);
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
      SET_APPLICATION_THEME (state, theme) {
         state.application_theme = theme;
         persistentStore.set('application_theme', state.application_theme);
      },
      SET_EDITOR_THEME (state, theme) {
         state.editor_theme = theme;
         persistentStore.set('editor_theme', state.editor_theme);
      },
      SET_EDITOR_FONT_SIZE (state, size) {
         state.editor_font_size = size;
         persistentStore.set('editor_font_size', state.editor_font_size);
      },
      SET_RESTORE_TABS (state, val) {
         state.restore_tabs = val;
         persistentStore.set('restore_tabs', state.restore_tabs);
      }
   },
   actions: {
      changeLocale ({ commit }, locale) {
         commit('SET_LOCALE', locale);
      },
      changePageSize ({ commit }, limit) {
         commit('SET_DATA_TAB_LIMIT', limit);
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
      changeApplicationTheme ({ commit }, theme) {
         commit('SET_APPLICATION_THEME', theme);
      },
      changeEditorTheme ({ commit }, theme) {
         commit('SET_EDITOR_THEME', theme);
      },
      changeEditorFontSize ({ commit }, size) {
         commit('SET_EDITOR_FONT_SIZE', size);
      },
      changeRestoreTabs ({ commit }, size) {
         commit('SET_RESTORE_TABS', size);
      }
   }
};
