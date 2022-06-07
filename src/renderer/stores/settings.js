import { defineStore, acceptHMRUpdate } from 'pinia';
import { ipcRenderer } from 'electron';
import i18n from '@/i18n';
import Store from 'electron-store';
const persistentStore = new Store({ name: 'settings' });
const isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)');
const defaultAppTheme = isDarkTheme.matches ? 'dark' : 'light';
const defaultEditorTheme = isDarkTheme.matches ? 'twilight' : 'sqlserver';

export const useSettingsStore = defineStore('settings', {
   state: () => ({
      locale: persistentStore.get('locale', 'en-US'),
      allowPrerelease: persistentStore.get('allow_prerelease', true),
      explorebarSize: persistentStore.get('explorebar_size', null),
      notificationsTimeout: persistentStore.get('notifications_timeout', 5),
      dataTabLimit: persistentStore.get('data_tab_limit', 1000),
      autoComplete: persistentStore.get('auto_complete', true),
      lineWrap: persistentStore.get('line_wrap', true),
      applicationTheme: persistentStore.get('application_theme', defaultAppTheme),
      editorTheme: persistentStore.get('editor_theme', defaultEditorTheme),
      editorFontSize: persistentStore.get('editor_font_size', 'medium'),
      restoreTabs: persistentStore.get('restore_tabs', true),
      disableBlur: persistentStore.get('disable_blur', false)
   }),
   actions: {
      changeLocale (locale) {
         this.locale = locale;
         i18n.global.locale = locale;
         persistentStore.set('locale', this.locale);
      },
      changePageSize (limit) {
         this.dataTabLimit = limit;
         persistentStore.set('data_tab_limit', this.dataTabLimit);
      },
      changeAllowPrerelease (allow) {
         this.allowPrerelease = allow;
         persistentStore.set('allow_prerelease', this.allowPrerelease);
      },
      updateNotificationsTimeout (timeout) {
         this.notificationsTimeout = timeout;
         persistentStore.set('notifications_timeout', this.notificationsTimeout);
      },
      changeExplorebarSize (size) {
         this.explorebarSize = size;
         persistentStore.set('explorebar_size', this.explorebarSize);
      },
      changeAutoComplete (val) {
         this.autoComplete = val;
         persistentStore.set('auto_complete', this.autoComplete);
      },
      changeLineWrap (val) {
         this.lineWrap = val;
         persistentStore.set('line_wrap', this.lineWrap);
      },
      changeApplicationTheme (theme) {
         this.applicationTheme = theme;
         persistentStore.set('application_theme', this.applicationTheme);
         ipcRenderer.send('refresh-theme-settings');
      },
      changeEditorTheme (theme) {
         this.editorTheme = theme;
         persistentStore.set('editor_theme', this.editorTheme);
      },
      changeEditorFontSize (size) {
         this.editorFontSize = size;
         persistentStore.set('editor_font_size', this.editorFontSize);
      },
      changeRestoreTabs (val) {
         this.restoreTabs = val;
         persistentStore.set('restore_tabs', this.restoreTabs);
      },
      changeDisableBlur (val) {
         this.disableBlur = val;
         persistentStore.set('disable_blur', this.disableBlur);
      }
   }
});

if (import.meta.webpackHot)
   import.meta.webpackHot.accept(acceptHMRUpdate(useSettingsStore, import.meta.webpackHot));
