'use strict';
import Store from 'electron-store';
import Connection from '@/ipc-api/Connection';
import Schema from '@/ipc-api/Schema';
import Users from '@/ipc-api/Users';
import { uidGen } from 'common/libs/uidGen';
const persistentStore = new Store({ name: 'tabs' });
const tabIndex = [];

export default {
   namespaced: true,
   strict: true,
   state: {
      workspaces: [],
      selected_workspace: null
   },
   getters: {
      getSelected: state => {
         if (state.selected_workspace) return state.selected_workspace;
         if (state.workspaces.length) return state.workspaces[0].uid;
         return 'NEW';
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
            .filter(workspace => workspace.connectionStatus === 'connected')
            .map(workspace => workspace.uid);
      },
      getLoadedSchemas: state => uid => {
         return state.workspaces.find(workspace => workspace.uid === uid).loadedSchemas;
      },
      getSearchTerm: state => uid => {
         return state.workspaces.find(workspace => workspace.uid === uid).searchTerm;
      }
   },
   mutations: {
      SELECT_WORKSPACE (state, uid) {
         if (!uid)
            state.selected_workspace = state.workspaces.length ? state.workspaces[0].uid : 'NEW';
         else
            state.selected_workspace = uid;
      },
      SET_CONNECTED (state, payload) {
         const { uid, client, dataTypes, indexTypes, customizations, structure, version } = payload;

         const cachedTabs = payload.restoreTabs ? persistentStore.get(uid, []) : [];

         if (cachedTabs.length) {
            tabIndex[uid] = cachedTabs.reduce((acc, curr) => {
               if (curr.index > acc) acc = curr.index;
               return acc;
            }, null);
         }

         state.workspaces = state.workspaces.map(workspace => workspace.uid === uid
            ? {
               ...workspace,
               client,
               dataTypes,
               indexTypes,
               customizations,
               structure,
               connectionStatus: 'connected',
               tabs: cachedTabs,
               selectedTab: cachedTabs.length ? cachedTabs[0].uid : null,
               version
            }
            : workspace);
      },
      SET_CONNECTING (state, uid) {
         state.workspaces = state.workspaces.map(workspace => workspace.uid === uid
            ? {
               ...workspace,
               structure: {},
               breadcrumbs: {},
               loadedSchemas: new Set(),
               connectionStatus: 'connecting'
            }
            : workspace);
      },
      SET_FAILED (state, uid) {
         state.workspaces = state.workspaces.map(workspace => workspace.uid === uid
            ? {
               ...workspace,
               structure: {},
               breadcrumbs: {},
               loadedSchemas: new Set(),
               connectionStatus: 'failed'
            }
            : workspace);
      },
      SET_DISCONNECTED (state, uid) {
         state.workspaces = state.workspaces.map(workspace => workspace.uid === uid
            ? {
               ...workspace,
               structure: {},
               breadcrumbs: {},
               loadedSchemas: new Set(),
               connectionStatus: 'disconnected'
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
      REFRESH_SCHEMA (state, { uid, schema, schemaElements }) {
         state.workspaces = state.workspaces.map(workspace => {
            if (workspace.uid === uid) {
               const schemaIndex = workspace.structure.findIndex(s => s.name === schema);

               if (schemaIndex !== -1)
                  workspace.structure[schemaIndex] = schemaElements;
               else
                  workspace.structure.push(schemaElements);
            }
            return workspace;
         });
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
      REFRESH_USERS (state, { uid, users }) {
         state.workspaces = state.workspaces.map(workspace => workspace.uid === uid
            ? {
               ...workspace,
               users
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
      SET_SEARCH_TERM (state, { uid, term }) {
         state.workspaces = state.workspaces.map(workspace => workspace.uid === uid
            ? {
               ...workspace,
               searchTerm: term
            }
            : workspace);
      },
      NEW_TAB (state, { uid, tab, content, type, autorun, schema, elementName, elementType }) {
         if (type === 'query')
            tabIndex[uid] = tabIndex[uid] ? ++tabIndex[uid] : 1;

         const newTab = {
            uid: tab,
            index: type === 'query' ? tabIndex[uid] : null,
            selected: false,
            type,
            schema,
            elementName,
            elementType,
            fields: [],
            keyUsage: [],
            content: content || '',
            autorun: !!autorun
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

         persistentStore.set(uid, state.workspaces.find(workspace => workspace.uid === uid).tabs);
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

         persistentStore.set(uid, state.workspaces.find(workspace => workspace.uid === uid).tabs);
      },
      REMOVE_TABS (state, { uid, schema, elementName, elementType }) { // Multiple tabs based on schema and element name
         if (elementType === 'procedure') elementType = 'routine'; // TODO: pass directly "routine"

         state.workspaces = state.workspaces.map(workspace => {
            if (workspace.uid === uid) {
               return {
                  ...workspace,
                  tabs: workspace.tabs.filter(tab =>
                     tab.schema !== schema ||
                     tab.elementName !== elementName ||
                     tab.elementType !== elementType
                  )
               };
            }
            else
               return workspace;
         });

         persistentStore.set(uid, state.workspaces.find(workspace => workspace.uid === uid).tabs);
      },
      REPLACE_TAB (state, { uid, tab: tUid, type, schema, content, elementName, elementType }) {
         state.workspaces = state.workspaces.map(workspace => {
            if (workspace.uid === uid) {
               return {
                  ...workspace,
                  tabs: workspace.tabs.map(tab => {
                     if (tab.uid === tUid)
                        return { ...tab, type, schema, content, elementName, elementType };

                     return tab;
                  })
               };
            }
            else
               return workspace;
         });

         persistentStore.set(uid, state.workspaces.find(workspace => workspace.uid === uid).tabs);
      },
      RENAME_TABS (state, { uid, schema, elementName, elementType, elementNewName }) {
         state.workspaces = state.workspaces.map(workspace => {
            if (workspace.uid === uid) {
               return {
                  ...workspace,
                  tabs: workspace.tabs.map(tab => {
                     if (tab.elementName === elementName && tab.schema === schema) {
                        return {
                           ...tab,
                           elementName: elementNewName
                        };
                     }

                     return tab;
                  })
               };
            }
            else
               return workspace;
         });

         persistentStore.set(uid, state.workspaces.find(workspace => workspace.uid === uid).tabs);
      },
      SELECT_TAB (state, { uid, tab }) {
         state.workspaces = state.workspaces.map(workspace => workspace.uid === uid ? { ...workspace, selectedTab: tab } : workspace);
      },
      UPDATE_TABS (state, { uid, tabs }) {
         state.workspaces = state.workspaces.map(workspace => workspace.uid === uid ? { ...workspace, tabs } : workspace);
         persistentStore.set(uid, state.workspaces.find(workspace => workspace.uid === uid).tabs);
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

         persistentStore.set(uid, state.workspaces.find(workspace => workspace.uid === uid).tabs);
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

         persistentStore.set(uid, state.workspaces.find(workspace => workspace.uid === uid).tabs);
      },
      SET_UNSAVED_CHANGES (state, { uid, tUid, isChanged }) {
         state.workspaces = state.workspaces.map(workspace => {
            if (workspace.uid === uid) {
               return {
                  ...workspace,
                  tabs: workspace.tabs.map(tab => {
                     if (tab.uid === tUid)
                        return { ...tab, isChanged };

                     return tab;
                  })
               };
            }
            else
               return workspace;
         });
      },
      ADD_LOADED_SCHEMA (state, payload) {
         state.workspaces = state.workspaces.map(workspace => {
            if (workspace.uid === payload.uid)
               workspace.loadedSchemas.add(payload.schema);
            return workspace;
         });
      },
      ADD_LOADING_ELEMENT (state, payload) {
         state.workspaces = state.workspaces.map(workspace => {
            if (workspace.uid === payload.uid)
               workspace.loadingElements.push(payload.element);
            return workspace;
         });
      },
      REMOVE_LOADING_ELEMENT (state, payload) {
         state.workspaces = state.workspaces.map(workspace => {
            if (workspace.uid === payload.uid) {
               const loadingElements = workspace.loadingElements.filter(el =>
                  el.schema !== payload.element.schema &&
                  el.name !== payload.element.name &&
                  el.type !== payload.element.type
               );

               workspace = { ...workspace, loadingElements };
            }
            return workspace;
         });
      }
   },
   actions: {
      selectWorkspace ({ commit }, uid) {
         commit('SELECT_WORKSPACE', uid);
      },
      async connectWorkspace ({ dispatch, commit, getters, rootGetters }, connection) {
         commit('SET_CONNECTING', connection.uid);

         try {
            const { status, response } = await Connection.connect(connection);
            if (status === 'error') {
               dispatch('notifications/addNotification', { status, message: response }, { root: true });
               commit('SET_FAILED', connection.uid);
            }
            else {
               let dataTypes = [];
               let indexTypes = [];
               let customizations = {};

               switch (connection.client) {
                  case 'mysql':
                  case 'maria':
                     dataTypes = require('common/data-types/mysql');
                     indexTypes = require('common/index-types/mysql');
                     customizations = require('common/customizations/mysql');
                     break;
                  case 'pg':
                     dataTypes = require('common/data-types/postgresql');
                     indexTypes = require('common/index-types/postgresql');
                     customizations = require('common/customizations/postgresql');
                     break;
               }

               const { status, response: version } = await Schema.getVersion(connection.uid);

               if (status === 'error')
                  dispatch('notifications/addNotification', { status, message: version }, { root: true });

               // Check if Maria or MySQL
               const isMySQL = version.name.includes('MySQL');

               if (isMySQL && connection.client !== 'mysql') {
                  const connProxy = Object.assign({}, connection);
                  connProxy.client = 'mysql';
                  dispatch('connections/editConnection', connProxy, { root: true });
               }
               else if (!isMySQL && connection.client === 'mysql') {
                  const connProxy = Object.assign({}, connection);
                  connProxy.client = 'maria';
                  dispatch('connections/editConnection', connProxy, { root: true });
               }

               commit('SET_CONNECTED', {
                  uid: connection.uid,
                  client: connection.client,
                  dataTypes,
                  indexTypes,
                  customizations,
                  structure: response,
                  version,
                  restoreTabs: rootGetters['settings/getRestoreTabs']
               });
               dispatch('refreshCollations', connection.uid);
               dispatch('refreshVariables', connection.uid);
               dispatch('refreshEngines', connection.uid);
               dispatch('refreshUsers', connection.uid);
            }
         }
         catch (err) {
            dispatch('notifications/addNotification', { status: 'error', message: err.stack }, { root: true });
         }
      },
      async refreshStructure ({ dispatch, commit, getters }, uid) {
         try {
            const { status, response } = await Schema.getStructure({ uid, schemas: getters.getLoadedSchemas(uid) });

            if (status === 'error')
               dispatch('notifications/addNotification', { status, message: response }, { root: true });
            else
               commit('REFRESH_STRUCTURE', { uid, structure: response });
         }
         catch (err) {
            dispatch('notifications/addNotification', { status: 'error', message: err.stack }, { root: true });
         }
      },
      async refreshSchema ({ dispatch, commit }, { uid, schema }) {
         try {
            const { status, response } = await Schema.getStructure({ uid, schemas: new Set([schema]) });
            if (status === 'error')
               dispatch('notifications/addNotification', { status, message: response }, { root: true });
            else
               commit('REFRESH_SCHEMA', { uid, schema, schemaElements: response.find(_schema => _schema.name === schema) });
         }
         catch (err) {
            dispatch('notifications/addNotification', { status: 'error', message: err.stack }, { root: true });
         }
      },
      async refreshCollations ({ dispatch, commit }, uid) {
         try {
            const { status, response } = await Schema.getCollations(uid);
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
            const { status, response } = await Schema.getVariables(uid);
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
            const { status, response } = await Schema.getEngines(uid);
            if (status === 'error')
               dispatch('notifications/addNotification', { status, message: response }, { root: true });
            else
               commit('REFRESH_ENGINES', { uid, engines: response });
         }
         catch (err) {
            dispatch('notifications/addNotification', { status: 'error', message: err.stack }, { root: true });
         }
      },
      async refreshUsers ({ dispatch, commit }, uid) {
         try {
            const { status, response } = await Users.getUsers(uid);
            if (status === 'error')
               dispatch('notifications/addNotification', { status, message: response }, { root: true });
            else
               commit('REFRESH_USERS', { uid, users: response });
         }
         catch (err) {
            dispatch('notifications/addNotification', { status: 'error', message: err.stack }, { root: true });
         }
      },
      removeConnected ({ commit }, uid) {
         Connection.disconnect(uid);
         commit('SET_DISCONNECTED', uid);
         commit('SELECT_TAB', { uid, tab: 0 });
      },
      addWorkspace ({ commit }, uid) {
         const workspace = {
            uid,
            connectionStatus: 'disconnected',
            selectedTab: 0,
            searchTerm: '',
            tabs: [],
            structure: {},
            variables: [],
            collations: [],
            users: [],
            breadcrumbs: {},
            loadingElements: [],
            loadedSchemas: new Set()
         };

         commit('ADD_WORKSPACE', workspace);
      },
      changeBreadcrumbs ({ commit, getters }, payload) {
         const breadcrumbsObj = {
            schema: null,
            table: null,
            trigger: null,
            triggerFunction: null,
            procedure: null,
            function: null,
            scheduler: null,
            view: null,
            query: null
         };

         commit('CHANGE_BREADCRUMBS', { uid: getters.getSelected, breadcrumbs: { ...breadcrumbsObj, ...payload } });
      },
      addLoadedSchema ({ commit, getters }, schema) {
         commit('ADD_LOADED_SCHEMA', { uid: getters.getSelected, schema });
      },
      addLoadingElement ({ commit, getters }, element) {
         commit('ADD_LOADING_ELEMENT', { uid: getters.getSelected, element });
      },
      removeLoadingElement ({ commit, getters }, element) {
         commit('REMOVE_LOADING_ELEMENT', { uid: getters.getSelected, element });
      },
      setSearchTerm ({ commit, getters }, term) {
         commit('SET_SEARCH_TERM', { uid: getters.getSelected, term });
      },
      newTab ({ state, commit }, { uid, content, type, autorun, schema, elementName, elementType }) {
         let tabUid;
         const workspaceTabs = state.workspaces.find(workspace => workspace.uid === uid);

         switch (type) {
            case 'temp-data':
            case 'temp-trigger-props':
            case 'temp-trigger-function-props':
            case 'temp-function-props':
            case 'temp-routine-props':
            case 'temp-scheduler-props': {
               const existentTab = workspaceTabs
                  ? workspaceTabs.tabs.find(tab =>
                     tab.schema === schema &&
                     tab.elementName === elementName &&
                     tab.elementType === elementType &&
                     [type, type.replace('temp-', '')].includes(tab.type))
                  : false;

               if (existentTab) { // if tab exists
                  tabUid = existentTab.uid;
               }
               else {
                  const tempTabs = workspaceTabs ? workspaceTabs.tabs.filter(tab => tab.type.includes('temp-')) : false;

                  if (tempTabs && tempTabs.length) { // if temp tab already opened
                     for (const tab of tempTabs) {
                        if (tab.isChanged) {
                           commit('REPLACE_TAB', { // make permanent a temp table with unsaved changes
                              uid,
                              tab: tab.uid,
                              type: tab.type.replace('temp-', ''),
                              schema: tab.schema,
                              elementName: tab.elementName,
                              elementType: tab.elementType
                           });

                           tabUid = uidGen('T');
                           commit('NEW_TAB', { uid, tab: tabUid, content, type, autorun, schema, elementName, elementType });
                        }
                        else {
                           commit('REPLACE_TAB', { uid, tab: tab.uid, type, schema, elementName, elementType });
                           tabUid = tab.uid;
                        }
                     }
                  }
                  else {
                     tabUid = uidGen('T');
                     commit('NEW_TAB', { uid, tab: tabUid, content, type, autorun, schema, elementName, elementType });
                  }
               }
            }
               break;
            case 'data':
            case 'table-props':
            case 'trigger-props':
            case 'trigger-function-props':
            case 'function-props':
            case 'routine-props':
            case 'scheduler-props': {
               const existentTab = workspaceTabs
                  ? workspaceTabs.tabs.find(tab =>
                     tab.schema === schema &&
                     tab.elementName === elementName &&
                     tab.elementType === elementType &&
                     [`temp-${type}`, type].includes(tab.type))
                  : false;

               if (existentTab) {
                  commit('REPLACE_TAB', { uid, tab: existentTab.uid, type, schema, elementName, elementType });
                  tabUid = existentTab.uid;
               }
               else {
                  tabUid = uidGen('T');
                  commit('NEW_TAB', { uid, tab: tabUid, content, type, autorun, schema, elementName, elementType });
               }
            }
               break;
            default:
               tabUid = uidGen('T');
               commit('NEW_TAB', { uid, tab: tabUid, content, type, autorun, schema, elementName, elementType });
               break;
         }

         commit('SELECT_TAB', { uid, tab: tabUid });
      },
      checkSelectedTabExists ({ state, commit }, uid) {
         const workspace = state.workspaces.find(workspace => workspace.uid === uid);
         const isSelectedExistent = workspace
            ? workspace.tabs.some(tab => tab.uid === workspace.selectedTab)
            : false;

         if (!isSelectedExistent && workspace.tabs.length)
            commit('SELECT_TAB', { uid, tab: workspace.tabs[workspace.tabs.length - 1].uid });
      },
      updateTabContent ({ commit }, { uid, tab, type, schema, content }) {
         commit('REPLACE_TAB', { uid, tab, type, schema, content });
      },
      renameTabs ({ commit }, payload) {
         commit('RENAME_TABS', payload);
      },
      removeTab ({ commit, dispatch }, payload) {
         commit('REMOVE_TAB', payload);
         dispatch('checkSelectedTabExists', payload.uid);
      },
      removeTabs ({ commit, dispatch }, payload) {
         commit('REMOVE_TABS', payload);
         dispatch('checkSelectedTabExists', payload.uid);
      },
      selectTab ({ commit }, payload) {
         commit('SELECT_TAB', payload);
      },
      updateTabs ({ commit }, payload) {
         commit('UPDATE_TABS', payload);
      },
      setTabFields ({ commit }, payload) {
         commit('SET_TAB_FIELDS', payload);
      },
      setTabKeyUsage ({ commit }, payload) {
         commit('SET_TAB_KEY_USAGE', payload);
      },
      setUnsavedChanges ({ commit }, payload) {
         commit('SET_UNSAVED_CHANGES', payload);
      }
   }
};
