'use strict';

import Vue from 'vue';

import 'material-design-icons/iconfont/material-icons.css';
import '@/scss/main.scss';

import App from '@/App.vue';
import store from '@/store';
import i18n from '@/i18n';

i18n.locale = store.state.settings.locale;
Vue.config.productionTip = false;

new Vue({
   render: h => h(App),
   store,
   i18n
}).$mount('#app');
