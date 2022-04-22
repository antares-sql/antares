'use strict';
import { createApp } from 'vue';

import '@mdi/font/css/materialdesignicons.css';
import 'leaflet/dist/leaflet.css';
import '@/scss/main.scss';

import App from '@/App.vue';
import { store } from '@/store';
import i18n from '@/i18n';

i18n.global.locale = store.state.settings.locale;

const app = createApp(App);
app.use(store);
app.use(i18n);
app.mount('#app');
