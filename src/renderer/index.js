'use strict';
import { createApp } from 'vue';

import '@mdi/font/css/materialdesignicons.css';
import 'leaflet/dist/leaflet.css';
import '@/scss/main.scss';

import App from '@/App.vue';
import { store } from '@/store';
import i18n from '@/i18n';

const app = createApp(App);
app.use(store);
app.use(i18n(store.state.settings.locale));
app.mount('#app');
