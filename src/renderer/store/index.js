'use strict';

import Vue from 'vue';
import Vuex from 'vuex';

import application from './modules/application.store';

Vue.use(Vuex);

export default new Vuex.Store({
   strict: true,
   modules: {
      application
   }
});
