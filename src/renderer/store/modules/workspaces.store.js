'use strict';
import Connection from '@/ipc-api/Connection';
import Database from '@/ipc-api/Database';
import { uidGen } from 'common/libs/uidGen';
const tabIndex = [];
let lastBreadcrumbs = {};

export default {
   namespaced: true,
   strict: true,
   state: {
      workspaces: [],
      selected_workspace: null,
      has_unsaved_changes: false
   },
   getters: {
      getSelected: state => {
         if (state.selected_workspace) return state.selected_workspace;
         if (state.workspaces.length) return state.workspaces[0].uid;
         return null;
      },
      getWorkspace: state => uid => {
         return state.workspaces.find(workspace => workspace.uid === uid);
      },
      getDatabaseVariable: state => (uid, name) => {
         return state.workspaces.find(workspace => workspace.uid === uid).variables.find(variable => variable.name === name);
      },
      getWorkspaceTab: (state, getters) => tUid => {
         if (!getters.getSelected) return;
         const workspace = state.workspaces.find(workspace => workspace.uid === getters.getSelected);
         if ('tabs' in workspace)
            return workspace.tabs.find(tab => tab.uid === tUid);
         return {};
      },
      getConnected: state => {
         return state.workspaces
            .filter(workspace => workspace.connected)
            .map(workspace => workspace.uid);
      }
   },
   mutations: {
      SELECT_WORKSPACE (state, uid) {
         state.selected_workspace = uid;
      },
      ADD_CONNECTED (state, { uid, client, dataTypes, indexTypes, structure }) {
         state.workspaces = state.workspaces.map(workspace => workspace.uid === uid
            ? {
               ...workspace,
               client,
               dataTypes,
               indexTypes,
               structure,
               connected: true
            }
            : workspace);
      },
      REMOVE_CONNECTED (state, uid) {
         state.workspaces = state.workspaces.map(workspace => workspace.uid === uid
            ? {
               ...workspace,
               structure: {},
               connected: false
            }
            : workspace);
      },
      REFRESH_STRUCTURE (state, { uid, structure }) {
         state.workspaces = state.workspaces.map(workspace => workspace.uid === uid
            ? {
               ...workspace,
               structure
            }
            : workspace);
      },
      REFRESH_COLLATIONS (state, { uid, collations }) {
         state.workspaces = state.workspaces.map(workspace => workspace.uid === uid
            ? {
               ...workspace,
               collations
            }
            : workspace);
      },
      REFRESH_VARIABLES (state, { uid, variables }) {
         state.workspaces = state.workspaces.map(workspace => workspace.uid === uid
            ? {
               ...workspace,
               variables
            }
            : workspace);
      },
      REFRESH_ENGINES (state, { uid, engines }) {
         state.workspaces = state.workspaces.map(workspace => workspace.uid === uid
            ? {
               ...workspace,
               engines
            }
            : workspace);
      },
      ADD_WORKSPACE (state, workspace) {
         state.workspaces.push(workspace);
      },
      CHANGE_BREADCRUMBS (state, { uid, breadcrumbs }) {
         state.workspaces = state.workspaces.map(workspace => workspace.uid === uid
            ? {
               ...workspace,
               breadcrumbs
            }
            : workspace);
      },
      NEW_TAB (state, uid) {
         tabIndex[uid] = tabIndex[uid] ? ++tabIndex[uid] : 1;

         const newTab = {
            uid: uidGen('T'),
            index: tabIndex[uid],
            selected: false,
            type: 'query',
            fields: [],
            keyUsage: []
         };
         state.workspaces = state.workspaces.map(workspace => {
            if (workspace.uid === uid) {
               return {
                  ...workspace,
                  tabs: [...workspace.tabs, newTab]
               };
            }
            else
               return workspace;
         });
      },
      REMOVE_TAB (state, { uid, tab: tUid }) {
         state.workspaces = state.workspaces.map(workspace => {
            if (workspace.uid === uid) {
               return {
                  ...workspace,
                  tabs: workspace.tabs.filter(tab => tab.uid !== tUid)
               };
            }
            else
               return workspace;
         });
      },
      SELECT_TAB (state, { uid, tab }) {
         state.workspaces = state.workspaces.map(workspace => workspace.uid === uid ? { ...workspace, selected_tab: tab } : workspace);
      },
      SET_TAB_FIELDS (state, { cUid, tUid, fields }) {
         state.workspaces = state.workspaces.map(workspace => {
            if (workspace.uid === cUid) {
               return {
                  ...workspace,
                  tabs: workspace.tabs.map(tab => {
                     if (tab.uid === tUid)
                        return { ...tab, fields };
                     else
                        return tab;
                  })
               };
            }
            else
               return workspace;
         });
      },
      SET_TAB_KEY_USAGE (state, { cUid, tUid, keyUsage }) {
         state.workspaces = state.workspaces.map(workspace => {
            if (workspace.uid === cUid) {
               return {
                  ...workspace,
                  tabs: workspace.tabs.map(tab => {
                     if (tab.uid === tUid)
                        return { ...tab, keyUsage };
                     else
                        return tab;
                  })
               };
            }
            else
               return workspace;
         });
      }
   },
   actions: {
      selectWorkspace ({ commit }, uid) {
         commit('SELECT_WORKSPACE', uid);
      },
      async connectWorkspace ({ dispatch, commit }, connection) {
         try {
            const { status, response } = await Connection.connect(connection);
            if (status === 'error')
               dispatch('notifications/addNotification', { status, message: response }, { root: true });
            else {
               let dataTypes = [];
               let indexTypes = [];

               switch (connection.client) {
                  case 'mysql':
                  case 'maria':
                     dataTypes = require('common/data-types/mysql');
                     indexTypes = require('common/index-types/mysql');
                     break;
               }
               commit('ADD_CONNECTED', {
                  uid: connection.uid,
                  client: connection.client,
                  dataTypes,
                  indexTypes,
                  structure: response
               });
               dispatch('refreshCollations', connection.uid);
               dispatch('refreshVariables', connection.uid);
               dispatch('refreshEngines', connection.uid);
            }
         }
         catch (err) {
            dispatch('notifications/addNotification', { status: 'error', message: err.stack }, { root: true });
         }
      },
      async refreshStructure ({ dispatch, commit }, uid) {
         try {
            const { status, response } = await Database.getStructure(uid);
            if (status === 'error')
               dispatch('notifications/addNotification', { status, message: response }, { root: true });
            else
               commit('REFRESH_STRUCTURE', { uid, structure: response });
         }
         catch (err) {
            dispatch('notifications/addNotification', { status: 'error', message: err.stack }, { root: true });
         }
      },
      async refreshCollations ({ dispatch, commit }, uid) {
         try {
            const { status, response } = await Database.getCollations(uid);
            if (status === 'error')
               dispatch('notifications/addNotification', { status, message: response }, { root: true });
            else
               commit('REFRESH_COLLATIONS', { uid, collations: response });
         }
         catch (err) {
            dispatch('notifications/addNotification', { status: 'error', message: err.stack }, { root: true });
         }
      },
      async refreshVariables ({ dispatch, commit }, uid) {
         try {
            const { status, response } = await Database.getVariables(uid);
            if (status === 'error')
               dispatch('notifications/addNotification', { status, message: response }, { root: true });
            else
               commit('REFRESH_VARIABLES', { uid, variables: response });
         }
         catch (err) {
            dispatch('notifications/addNotification', { status: 'error', message: err.stack }, { root: true });
         }
      },
      async refreshEngines ({ dispatch, commit }, uid) {
         try {
            const { status, response } = await Database.getEngines(uid);
            if (status === 'error')
               dispatch('notifications/addNotification', { status, message: response }, { root: true });
            else
               commit('REFRESH_ENGINES', { uid, engines: response });
         }
         catch (err) {
            dispatch('notifications/addNotification', { status: 'error', message: err.stack }, { root: true });
         }
      },
      removeConnected ({ commit }, uid) {
         Connection.disconnect(uid);
         commit('REMOVE_CONNECTED', uid);
         commit('SELECT_TAB', { uid, tab: 0 });
      },
      addWorkspace ({ commit, dispatch, getters }, uid) {
         const workspace = {
            uid,
            connected: false,
            selected_tab: 0,
            tabs: [{
               uid: 'data',
               type: 'table',
               fields: [],
               keyUsage: []
            },
            {
               uid: 'prop',
               type: 'table',
               fields: [],
               keyUsage: []
            }],
            structure: {},
            variables: [],
            collations: [],
            breadcrumbs: {}
         };

         commit('ADD_WORKSPACE', workspace);

         if (getters.getWorkspace(uid).tabs.length < 3)
            dispatch('newTab', uid);
      },
      changeBreadcrumbs ({ commit, getters }, payload) {
         const breadcrumbsObj = {
            schema: null,
            table: null,
            trigger: null,
            procedure: null,
            scheduler: null
         };

         const hasLastChildren = Object.keys(lastBreadcrumbs).filter(b => b !== 'schema').some(b => lastBreadcrumbs[b]);
         const hasChildren = Object.keys(payload).filter(b => b !== 'schema').some(b => payload[b]);

         if (lastBreadcrumbs.schema === payload.schema && hasLastChildren && !hasChildren) return;

         if (lastBreadcrumbs.schema !== payload.schema)
            Database.useSchema({ uid: getters.getSelected, schema: payload.schema });

         commit('CHANGE_BREADCRUMBS', { uid: getters.getSelected, breadcrumbs: { ...breadcrumbsObj, ...payload } });
         lastBreadcrumbs = { ...breadcrumbsObj, ...payload };
      },
      newTab ({ commit }, uid) {
         commit('NEW_TAB', uid);
      },
      removeTab ({ commit }, payload) {
         commit('REMOVE_TAB', payload);
      },
      selectTab ({ commit }, payload) {
         commit('SELECT_TAB', payload);
      },
      setTabFields ({ commit }, payload) {
         commit('SET_TAB_FIELDS', payload);
      },
      setTabKeyUsage ({ commit }, payload) {
         commit('SET_TAB_KEY_USAGE', payload);
      }
   }
};
