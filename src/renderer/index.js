'use strict';

import devtools from '@vue/devtools';
import { createApp, configureCompat } from 'vue';
import '@mdi/font/css/materialdesignicons.css';
import 'leaflet/dist/leaflet.css';
import '@/scss/main.scss';

import App from '@/App.vue';
import { store } from '@/store';
import { pinia } from '@/stores';
import i18n from '@/i18n';

// @TODO: remove after migrating from vue2 -> vue3
configureCompat({
   MODE: 3
});

i18n.global.locale = store.state.settings.locale;

createApp(App)
   .use(store)
   .use(pinia)
   .use(i18n)
   .mount('#app');

if (process.env.NODE_ENV === 'development')
   devtools.connect();
