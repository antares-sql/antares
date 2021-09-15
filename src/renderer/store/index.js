'use strict';

import Vue from 'vue';
import Vuex from 'vuex';

import application from './modules/application.store';
import settings from './modules/settings.store';
import history from './modules/history.store';
import scratchpad from './modules/scratchpad.store';
import connections from './modules/connections.store';
import workspaces from './modules/workspaces.store';
import notifications from './modules/notifications.store';

import ipcUpdates from './plugins/ipcUpdates';
import ipcExceptions from './plugins/ipcExceptions';

Vue.use(Vuex);

export default new Vuex.Store({
   strict: true,
   modules: {
      application,
      settings,
      history,
      scratchpad,
      connections,
      workspaces,
      notifications
   },
   plugins: [
      ipcUpdates,
      ipcExceptions
   ]
});
