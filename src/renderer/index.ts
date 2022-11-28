'use strict';
import { ipcRenderer } from 'electron';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { VueMaskDirective } from 'v-mask';
import * as FloatingVue from 'floating-vue';
import '@mdi/font/css/materialdesignicons.css';
import 'floating-vue/dist/style.css';
import 'leaflet/dist/leaflet.css';
import '@/scss/main.scss';

import { useApplicationStore } from '@/stores/application';
import { useSettingsStore } from '@/stores/settings';
import { useNotificationsStore } from '@/stores/notifications';
import { useConsoleStore } from '@/stores/console';

import App from '@/App.vue';
import { i18n } from '@/i18n';

// https://github.com/probil/v-mask/issues/498#issuecomment-827027834
const vMaskV2 = VueMaskDirective;
const vMaskV3 = {
   beforeMount: vMaskV2.bind,
   updated: vMaskV2.componentUpdated,
   unmounted: vMaskV2.unbind
};

createApp(App)
   .directive('mask', vMaskV3)
   .use(createPinia())
   .use(i18n)
   .use(FloatingVue)
   .mount('#app');

const { locale } = useSettingsStore();
i18n.global.locale = locale;

// IPC exceptions
ipcRenderer.on('unhandled-exception', (event, error) => {
   useNotificationsStore().addNotification({ status: 'error', message: error.message });
});

// IPC query logs
ipcRenderer.on('query-log', (event, logRecord) => {
   useConsoleStore().putLog(logRecord);
});

ipcRenderer.on('toggle-console', () => {
   useConsoleStore().toggleConsole();
});

// IPC app updates
ipcRenderer.on('checking-for-update', () => {
   useApplicationStore().updateStatus = 'checking';
});

ipcRenderer.on('update-available', () => {
   useApplicationStore().updateStatus = 'available';
});

ipcRenderer.on('update-not-available', () => {
   useApplicationStore().updateStatus = 'noupdate';
});

ipcRenderer.on('check-failed', () => {
   useApplicationStore().updateStatus = 'nocheck';
});

ipcRenderer.on('no-auto-update', () => {
   useApplicationStore().updateStatus = 'disabled';
});

ipcRenderer.on('download-progress', (event, data) => {
   useApplicationStore().updateStatus = 'downloading';
   useApplicationStore().downloadProgress = data.percent;
});

ipcRenderer.on('update-downloaded', () => {
   useApplicationStore().updateStatus = 'downloaded';
});

ipcRenderer.on('link-to-download', () => {
   useApplicationStore().updateStatus = 'link';
});

// IPC shortcuts
ipcRenderer.on('toggle-preferences', () => {
   useApplicationStore().showSettingModal('general');
});

ipcRenderer.on('open-updates-preferences', () => {
   useApplicationStore().showSettingModal('update');
   ipcRenderer.send('check-for-updates');
});

ipcRenderer.on('update-shortcuts', (event, shortcuts) => {
   useSettingsStore().updateShortcuts(shortcuts);
});
