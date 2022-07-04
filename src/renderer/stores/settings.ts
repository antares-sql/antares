import { defineStore } from 'pinia';
import { ipcRenderer } from 'electron';
import i18n from '@/i18n';
import * as Store from 'electron-store';
const persistentStore = new Store({ name: 'settings' });
const isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)');
const defaultAppTheme = isDarkTheme.matches ? 'dark' : 'light';
const defaultEditorTheme = isDarkTheme.matches ? 'twilight' : 'sqlserver';

export type EditorFontSize = 'small' | 'medium' | 'large';
export type ApplicationTheme = 'light' | 'dark';

export const useSettingsStore = defineStore('settings', {
   state: () => ({
      locale: persistentStore.get('locale', 'en-US') as string,
      allowPrerelease: persistentStore.get('allow_prerelease', true) as boolean,
      explorebarSize: persistentStore.get('explorebar_size', null) as number,
      notificationsTimeout: persistentStore.get('notifications_timeout', 5) as number,
      dataTabLimit: persistentStore.get('data_tab_limit', 1000) as number,
      autoComplete: persistentStore.get('auto_complete', true) as boolean,
      lineWrap: persistentStore.get('line_wrap', true) as boolean,
      applicationTheme: persistentStore.get('application_theme', defaultAppTheme) as ApplicationTheme,
      editorTheme: persistentStore.get('editor_theme', defaultEditorTheme) as string,
      editorFontSize: persistentStore.get('editor_font_size', 'medium') as EditorFontSize,
      restoreTabs: persistentStore.get('restore_tabs', true) as boolean,
      disableBlur: persistentStore.get('disable_blur', false) as boolean,
      disableScratchpad: persistentStore.get('disable_scratchpad', false) as boolean
   }),
   actions: {
      changeLocale (locale: string) {
         this.locale = locale;
         i18n.global.locale = locale;
         persistentStore.set('locale', this.locale);
      },
      changePageSize (limit: number) {
         this.dataTabLimit = limit;
         persistentStore.set('data_tab_limit', this.dataTabLimit);
      },
      changeAllowPrerelease (allow: boolean) {
         this.allowPrerelease = allow;
         persistentStore.set('allow_prerelease', this.allowPrerelease);
      },
      updateNotificationsTimeout (timeout: number) {
         this.notificationsTimeout = timeout;
         persistentStore.set('notifications_timeout', this.notificationsTimeout);
      },
      changeExplorebarSize (size: number) {
         this.explorebarSize = size;
         persistentStore.set('explorebar_size', this.explorebarSize);
      },
      changeAutoComplete (val: boolean) {
         this.autoComplete = val;
         persistentStore.set('auto_complete', this.autoComplete);
      },
      changeLineWrap (val: boolean) {
         this.lineWrap = val;
         persistentStore.set('line_wrap', this.lineWrap);
      },
      changeApplicationTheme (theme: string) {
         this.applicationTheme = theme;
         persistentStore.set('application_theme', this.applicationTheme);
         ipcRenderer.send('refresh-theme-settings');
      },
      changeEditorTheme (theme: string) {
         this.editorTheme = theme;
         persistentStore.set('editor_theme', this.editorTheme);
      },
      changeEditorFontSize (size: EditorFontSize) {
         this.editorFontSize = size;
         persistentStore.set('editor_font_size', this.editorFontSize);
      },
      changeRestoreTabs (val: boolean) {
         this.restoreTabs = val;
         persistentStore.set('restore_tabs', this.restoreTabs);
      },
      changeDisableBlur (val: boolean) {
         this.disableBlur = val;
         persistentStore.set('disable_blur', this.disableBlur);
      },
      changeDisableScratchpad (val: boolean) {
         this.disableScratchpad = val;
         persistentStore.set('disable_scratchpad', this.disableScratchpad);
      }
   }
});
