'use strict';

import Vue from 'vue';
import Vuex from 'vuex';
import VuexPersist from 'vuex-persist';

import application from './modules/application.store';
import connections from './modules/connections.store';

const vuexLocalStorage = new VuexPersist({
   key: 'vuex', // The key to store the state on in the storage provider.
   storage: window.localStorage,
   reducer: state => ({
      connections: state.connections.connections
   })
});

Vue.use(Vuex);

export default new Vuex.Store({
   strict: true,
   modules: {
      application,
      connections
   },
   plugins: [vuexLocalStorage.plugin]
});
