'use strict';
import Connection from '@/ipc-api/Connection';
import Schema from '@/ipc-api/Schema';
import Users from '@/ipc-api/Users';
import { uidGen } from 'common/libs/uidGen';
const tabIndex = [];
let lastBreadcrumbs = {};

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
            .filter(workspace => workspace.connection_status === 'connected')
            .map(workspace => workspace.uid);
      },
      getLoadedSchemas: state => uid => {
         return state.workspaces.find(workspace => workspace.uid === uid).loaded_schemas;
      },
      getSearchTerm: state => uid => {
         return state.workspaces.find(workspace => workspace.uid === uid).search_term;
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

         state.workspaces = state.workspaces.map(workspace => workspace.uid === uid
            ? {
               ...workspace,
               client,
               dataTypes,
               indexTypes,
               customizations,
               structure,
               connection_status: 'connected',
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
               loaded_schemas: new Set(),
               connection_status: 'connecting'
            }
            : workspace);
      },
      SET_FAILED (state, uid) {
         state.workspaces = state.workspaces.map(workspace => workspace.uid === uid
            ? {
               ...workspace,
               structure: {},
               breadcrumbs: {},
               loaded_schemas: new Set(),
               connection_status: 'failed'
            }
            : workspace);
      },
      SET_DISCONNECTED (state, uid) {
         state.workspaces = state.workspaces.map(workspace => workspace.uid === uid
            ? {
               ...workspace,
               structure: {},
               breadcrumbs: {},
               loaded_schemas: new Set(),
               connection_status: 'disconnected'
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
               search_term: term
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
      REMOVE_TABS (state, { uid, schema, elementName, elementType }) { // Multiple tabs based on schema and element name
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
      },
      REPLACE_TAB (state, { uid, tab: tUid, type, schema, elementName, elementType }) {
         state.workspaces = state.workspaces.map(workspace => {
            if (workspace.uid === uid) {
               return {
                  ...workspace,
                  tabs: workspace.tabs.map(tab => {
                     if (tab.uid === tUid)
                        return { ...tab, type, schema, elementName, elementType };

                     return tab;
                  })
               };
            }
            else
               return workspace;
         });
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
      },
      SELECT_TAB (state, { uid, tab }) {
         state.workspaces = state.workspaces.map(workspace => workspace.uid === uid ? { ...workspace, selected_tab: tab } : workspace);
      },
      UPDATE_TABS (state, { uid, tabs }) {
         state.workspaces = state.workspaces.map(workspace => workspace.uid === uid ? { ...workspace, tabs } : workspace);
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
      SET_PENDING_BREADCRUMBS (state, payload) {
         state.pending_breadcrumbs = payload;
      },
      ADD_LOADED_SCHEMA (state, payload) {
         state.workspaces = state.workspaces.map(workspace => {
            if (workspace.uid === payload.uid)
               workspace.loaded_schemas.add(payload.schema);
            return workspace;
         });
      }
   },
   actions: {
      selectWorkspace ({ commit }, uid) {
         commit('SELECT_WORKSPACE', uid);
      },
      async connectWorkspace ({ dispatch, commit }, connection) {
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
                  version
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
      addWorkspace ({ commit, dispatch, getters }, uid) {
         const workspace = {
            uid,
            connection_status: 'disconnected',
            selected_tab: 0,
            search_term: '',
            tabs: [],
            structure: {},
            variables: [],
            collations: [],
            users: [],
            breadcrumbs: {},
            loaded_schemas: new Set()
         };

         commit('ADD_WORKSPACE', workspace);

         if (getters.getWorkspace(uid).tabs.length < 3)
            dispatch('newTab', { uid, type: 'query' });
      },
      changeBreadcrumbs ({ commit, getters }, payload) {
         const breadcrumbsObj = {
            schema: null,
            table: null,
            trigger: null,
            procedure: null,
            function: null,
            scheduler: null,
            view: null,
            query: null
         };

         const hasLastChildren = Object.keys(lastBreadcrumbs).filter(b => b !== 'schema').some(b => lastBreadcrumbs[b]);
         const hasChildren = Object.keys(payload).filter(b => b !== 'schema').some(b => payload[b]);

         if (lastBreadcrumbs.schema === payload.schema && hasLastChildren && !hasChildren) return;

         if (lastBreadcrumbs.schema !== payload.schema)
            Schema.useSchema({ uid: getters.getSelected, schema: payload.schema });

         commit('CHANGE_BREADCRUMBS', { uid: getters.getSelected, breadcrumbs: { ...breadcrumbsObj, ...payload } });
         lastBreadcrumbs = { ...breadcrumbsObj, ...payload };

         if (payload.schema)
            commit('ADD_LOADED_SCHEMA', { uid: getters.getSelected, schema: payload.schema });
      },
      setSearchTerm ({ commit, getters }, term) {
         commit('SET_SEARCH_TERM', { uid: getters.getSelected, term });
      },
      newTab ({ state, commit }, { uid, content, type, autorun, schema, elementName, elementType }) {
         let tabUid;
         const workspaceTabs = state.workspaces.find(workspace => workspace.uid === uid);

         switch (type) {
            case 'temp-data': {
               const existentTab = workspaceTabs
                  ? workspaceTabs.tabs.find(tab =>
                     tab.schema === schema &&
                     tab.elementName === elementName &&
                     tab.elementType === elementType &&
                     ['temp-data', 'data'].includes(tab.type))
                  : false;

               if (existentTab) { // if data tab exists
                  tabUid = existentTab.uid;
               }
               else {
                  const tempTabs = workspaceTabs ? workspaceTabs.tabs.filter(tab => tab.type === 'temp-data') : false;
                  if (tempTabs && tempTabs.length) { // if temp table already opened
                     for (const tab of tempTabs) {
                        commit('REPLACE_TAB', { uid, tab: tab.uid, type, schema, elementName, elementType });
                        tabUid = tab.uid;
                     }
                  }
                  else {
                     tabUid = uidGen('T');
                     commit('NEW_TAB', { uid, tab: tabUid, content, type, autorun, schema, elementName, elementType });
                  }
               }
            }
               break;
            case 'data': {
               const existentTab = workspaceTabs
                  ? workspaceTabs.tabs.find(tab =>
                     tab.schema === schema &&
                        tab.elementName === elementName &&
                        tab.elementType === elementType &&
                        ['temp-data', 'data'].includes(tab.type))
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
            case 'table-props': {
               const existentTab = workspaceTabs
                  ? workspaceTabs.tabs.find(tab =>
                     tab.elementName === elementName &&
                        tab.elementType === elementType &&
                        tab.type === type)
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
            case 'temp-trigger-props': {
               const existentTab = workspaceTabs
                  ? workspaceTabs.tabs.find(tab =>
                     tab.schema === schema &&
                        tab.elementName === elementName &&
                        tab.elementType === elementType &&
                        ['temp-trigger-props', 'trigger-props'].includes(tab.type))
                  : false;

               if (existentTab) { // if tab exists
                  tabUid = existentTab.uid;
               }
               else {
                  const tempTabs = workspaceTabs ? workspaceTabs.tabs.filter(tab => tab.type === 'temp-trigger-props') : false;
                  if (tempTabs && tempTabs.length) { // if temp tab already opened
                     for (const tab of tempTabs) {
                        commit('REPLACE_TAB', { uid, tab: tab.uid, type, schema, elementName, elementType });
                        tabUid = tab.uid;
                     }
                  }
                  else {
                     tabUid = uidGen('T');
                     commit('NEW_TAB', { uid, tab: tabUid, content, type, autorun, schema, elementName, elementType });
                  }
               }
            }
               break;
            case 'trigger-props': {
               const existentTab = workspaceTabs
                  ? workspaceTabs.tabs.find(tab =>
                     tab.schema === schema &&
                     tab.elementName === elementName &&
                     tab.elementType === elementType &&
                     ['temp-trigger-props', 'trigger-props'].includes(tab.type))
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
            ? workspace.tabs.some(tab => tab.uid === workspace.selected_tab)
            : false;

         if (!isSelectedExistent)
            commit('SELECT_TAB', { uid, tab: workspace.tabs[workspace.tabs.length - 1].uid });
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
