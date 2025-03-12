import { ShortcutRecord } from 'common/shortcuts';
import { ipcRenderer } from 'electron';
import * as Store from 'electron-store';
import { defineStore } from 'pinia';

import { AvailableLocale, i18n } from '@/i18n';

const settingsStore = new Store({ name: 'settings' });
const shortcutsStore = new Store({ name: 'shortcuts' });
const isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)');
const defaultAppTheme = isDarkTheme.matches ? 'dark' : 'light';
const defaultEditorTheme = isDarkTheme.matches ? 'twilight' : 'sqlserver';

export type EditorFontSize = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge';
export type ApplicationTheme = 'light' | 'dark';

export const useSettingsStore = defineStore('settings', {
   state: () => ({
      locale: settingsStore.get('locale', 'en-US') as AvailableLocale,
      allowPrerelease: settingsStore.get('allow_prerelease', false) as boolean,
      explorebarSize: settingsStore.get('explorebar_size', null) as number,
      notificationsTimeout: settingsStore.get('notifications_timeout', 5) as number,
      showTableSize: settingsStore.get('show_table_size', false) as boolean,
      dataTabLimit: settingsStore.get('data_tab_limit', 1000) as number,
      queryRowLimit: settingsStore.get('query_row_limit', 1000) as number,
      autoComplete: settingsStore.get('auto_complete', true) as boolean,
      lineWrap: settingsStore.get('line_wrap', true) as boolean,
      executeSelected: settingsStore.get('execute_selected', true) as boolean,
      applicationTheme: settingsStore.get('application_theme', defaultAppTheme) as ApplicationTheme,
      editorTheme: settingsStore.get('editor_theme', defaultEditorTheme) as string,
      editorFontSize: settingsStore.get('editor_font_size', 'medium') as EditorFontSize,
      restoreTabs: settingsStore.get('restore_tabs', true) as boolean,
      disableBlur: settingsStore.get('disable_blur', false) as boolean,
      shortcuts: shortcutsStore.get('shortcuts', []) as ShortcutRecord[],
      defaultCopyType: settingsStore.get('default_copy_type', 'cell') as string
   }),
   actions: {
      changeLocale (locale: AvailableLocale) {
         this.locale = locale;
         i18n.global.locale = locale;
         settingsStore.set('locale', this.locale);
      },
      changePageSize (limit: number) {
         this.dataTabLimit = limit;
         settingsStore.set('data_tab_limit', this.dataTabLimit);
      },
      changeQueryLimit (limit: number) {
         this.queryRowLimit = limit;
         settingsStore.set('query_row_limit', this.dataTabLimit);
      },
      changeAllowPrerelease (allow: boolean) {
         this.allowPrerelease = allow;
         settingsStore.set('allow_prerelease', this.allowPrerelease);
      },
      updateNotificationsTimeout (timeout: number) {
         this.notificationsTimeout = timeout;
         settingsStore.set('notifications_timeout', this.notificationsTimeout);
      },
      changeShowTableSize (show: boolean) {
         this.showTableSize = show;
         settingsStore.set('show_table_size', this.showTableSize);
      },
      changeExplorebarSize (size: number) {
         this.explorebarSize = size;
         settingsStore.set('explorebar_size', this.explorebarSize);
      },
      changeAutoComplete (val: boolean) {
         this.autoComplete = val;
         settingsStore.set('auto_complete', this.autoComplete);
      },
      changeLineWrap (val: boolean) {
         this.lineWrap = val;
         settingsStore.set('line_wrap', this.lineWrap);
      },
      changeExecuteSelected (val: boolean) {
         this.executeSelected = val;
         settingsStore.set('execute_selected', this.executeSelected);
      },
      changeApplicationTheme (theme: string) {
         this.applicationTheme = theme;
         settingsStore.set('application_theme', this.applicationTheme);
         ipcRenderer.send('refresh-theme-settings');
      },
      changeEditorTheme (theme: string) {
         this.editorTheme = theme;
         settingsStore.set('editor_theme', this.editorTheme);
      },
      changeEditorFontSize (size: EditorFontSize) {
         this.editorFontSize = size;
         settingsStore.set('editor_font_size', this.editorFontSize);
      },
      changeRestoreTabs (val: boolean) {
         this.restoreTabs = val;
         settingsStore.set('restore_tabs', this.restoreTabs);
      },
      changeDisableBlur (val: boolean) {
         this.disableBlur = val;
         settingsStore.set('disable_blur', this.disableBlur);
      },
      updateShortcuts (shortcuts: ShortcutRecord[]) {
         this.shortcuts = shortcuts;
      },
      changeDefaultCopyType (type: string) {
         this.defaultCopyType = type;
         settingsStore.set('default_copy_type', this.defaultCopyType);
      }
   }
});
