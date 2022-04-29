'use strict';
import { createApp, configureCompat } from 'vue';
import '@mdi/font/css/materialdesignicons.css';
import 'leaflet/dist/leaflet.css';
import '@/scss/main.scss';
import { VueMaskDirective } from 'v-mask';
import { useSettingsStore } from '@/stores/settings';

import App from '@/App.vue';
import { pinia } from '@/stores';
import i18n from '@/i18n';

// @TODO: remove after migrating from vue2 -> vue3
configureCompat({
   MODE: 3
});

// https://github.com/probil/v-mask/issues/498#issuecomment-827027834
const vMaskV2 = VueMaskDirective;
const vMaskV3 = {
   beforeMount: vMaskV2.bind,
   updated: vMaskV2.componentUpdated,
   unmounted: vMaskV2.unbind
};

createApp(App)
   .directive('mask', vMaskV3)
   .use(pinia)
   .use(i18n)
   .mount('#app');

const { locale } = useSettingsStore();
i18n.global.locale = locale;
