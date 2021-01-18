'use strict';

import Vue from 'vue';
import Vuex from 'vuex';

import application from './modules/application.store';
import settings from './modules/settings.store';
import connections from './modules/connections.store';
import workspaces from './modules/workspaces.store';
import notifications from './modules/notifications.store';

import ipcUpdates from './plugins/ipcUpdates';

Vue.use(Vuex);

export default new Vuex.Store({
   strict: true,
   modules: {
      application,
      settings,
      connections,
      workspaces,
      notifications
   },
   plugins: [
      ipcUpdates
   ]
});
