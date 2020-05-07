'use strict';

import Vue from 'vue';

import 'devicons/css/devicons.min.css';
import 'material-design-icons/iconfont/material-icons.css';
import '@/scss/main.scss';

import App from '@/App.vue';
import store from '@/store';
import router from '@/routes';

Vue.config.productionTip = false;

new Vue({
   render: h => h(App),
   store,
   router
}).$mount('#app');
