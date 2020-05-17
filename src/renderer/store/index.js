'use strict';

import Vue from 'vue';
import Vuex from 'vuex';
import VuexPersist from 'vuex-persist';

import application from './modules/application.store';
import connections from './modules/connections.store';
import workspaces from './modules/workspaces.store';
import notifications from './modules/notifications.store';

const vuexLocalStorage = new VuexPersist({
   key: 'application', // The key to store the state on in the storage provider.
   storage: window.localStorage,
   reducer: state => ({
      connections: state.connections
   })
});

Vue.use(Vuex);

export default new Vuex.Store({
   strict: true,
   modules: {
      application,
      connections,
      workspaces,
      notifications
   },
   plugins: [vuexLocalStorage.plugin]
});
