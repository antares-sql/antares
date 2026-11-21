import { ShortcutRecord } from 'common/shortcuts';
import Store from 'electron-store';
import { defineStore } from 'pinia';

import { AvailableLocale, i18n } from '@/i18n';

const settingsStore = new Store({ name: 'settings' });
const shortcutsStore = new Store({ name: 'shortcuts' });
const isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)');
const defaultAppTheme = isDarkTheme.matches ? 'dark' : 'light';

/** Root font size of the interface: everything sized in rem scales with it (Spectre base is 20px) */
export const uiFontSizes = { small: 18, medium: 20, large: 22, xlarge: 24, xxlarge: 26 } as const;
export type UiFontSize = keyof typeof uiFontSizes;

export type EditorFontSize = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge';
/** Id of the active theme: a built-in one ('dark', 'light') or an installed one (see stores/themes) */
export type ApplicationTheme = string;

export const useSettingsStore = defineStore('settings', {
   state: () => ({
      locale: settingsStore.get('locale', 'en-US') as AvailableLocale,
      allowPrerelease: settingsStore.get('allow_prerelease', false) as boolean,
      explorebarSize: settingsStore.get('explorebar_size', null) as number,
      notificationsTimeout: settingsStore.get('notifications_timeout', 5) as number,
      dataTabLimit: settingsStore.get('data_tab_limit', 1000) as number,
      autoComplete: settingsStore.get('auto_complete', true) as boolean,
      lineWrap: settingsStore.get('line_wrap', true) as boolean,
      executeSelected: settingsStore.get('execute_selected', true) as boolean,
      applicationTheme: settingsStore.get('application_theme', defaultAppTheme) as ApplicationTheme,
      editorFontSize: settingsStore.get('editor_font_size', 'medium') as EditorFontSize,
      uiFontSize: settingsStore.get('ui_font_size', 'medium') as UiFontSize,
      restoreTabs: settingsStore.get('restore_tabs', true) as boolean,
      disableBlur: settingsStore.get('disable_blur', false) as boolean,
      shortcuts: shortcutsStore.get('shortcuts', []) as ShortcutRecord[],
      defaultCopyType: settingsStore.get('default_copy_type', 'cell') as string
   }),
   actions: {
      changeLocale (locale: AvailableLocale) {
         this.locale = locale;
         i18n.global.locale.value = locale;
         settingsStore.set('locale', this.locale);
      },
      changePageSize (limit: number) {
         this.dataTabLimit = limit;
         settingsStore.set('data_tab_limit', this.dataTabLimit);
      },
      changeAllowPrerelease (allow: boolean) {
         this.allowPrerelease = allow;
         settingsStore.set('allow_prerelease', this.allowPrerelease);
      },
      updateNotificationsTimeout (timeout: number) {
         this.notificationsTimeout = timeout;
         settingsStore.set('notifications_timeout', this.notificationsTimeout);
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
      },
      changeUiFontSize (size: UiFontSize) {
         this.uiFontSize = size in uiFontSizes ? size : 'medium';
         settingsStore.set('ui_font_size', this.uiFontSize);
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
