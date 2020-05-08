'use strict';

import Vue from 'vue';

import 'material-design-icons/iconfont/material-icons.css';
import '@/scss/main.scss';

import App from '@/App.vue';
import store from '@/store';

Vue.config.productionTip = false;

new Vue({
   render: h => h(App),
   store
}).$mount('#app');
