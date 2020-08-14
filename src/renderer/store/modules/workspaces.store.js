'use strict';
import Connection from '@/ipc-api/Connection';
import { uidGen } from 'common/libs/uidGen';

function remapStructure (structure) { // TODO: move to main process and add fields (for autocomplete purpose)
   const databases = structure.map(table => table.TABLE_SCHEMA)
      .filter((value, index, self) => self.indexOf(value) === index);

   return databases.map(db => {
      return {
         name: db,
         tables: structure.filter(table => table.TABLE_SCHEMA === db)
      };
   });
}

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
         return null;
      },
      getWorkspace: state => uid => {
         return state.workspaces.find(workspace => workspace.uid === uid);
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
      ADD_CONNECTED (state, { uid, structure }) {
         state.workspaces = state.workspaces.map(workspace => workspace.uid === uid ? { ...workspace, structure, connected: true } : workspace);
      },
      REMOVE_CONNECTED (state, uid) {
         state.workspaces = state.workspaces.map(workspace => workspace.uid === uid ? { ...workspace, structure: {}, connected: false } : workspace);
      },
      REFRESH_STRUCTURE (state, { uid, structure }) {
         state.workspaces = state.workspaces.map(workspace => workspace.uid === uid ? { ...workspace, structure } : workspace);
      },
      ADD_WORKSPACE (state, workspace) {
         state.workspaces.push(workspace);
      },
      CHANGE_BREADCRUMBS (state, { uid, breadcrumbs }) {
         state.workspaces = state.workspaces.map(workspace => workspace.uid === uid ? { ...workspace, breadcrumbs } : workspace);
      },
      NEW_TAB (state, uid) {
         const newTab = {
            uid: uidGen('T'),
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
            else
               commit('ADD_CONNECTED', { uid: connection.uid, structure: remapStructure(response) });
         }
         catch (err) {
            dispatch('notifications/addNotification', { status: 'error', message: err.stack }, { root: true });
         }
      },
      async refreshStructure ({ dispatch, commit }, uid) {
         try {
            const { status, response } = await Connection.refresh(uid);
            if (status === 'error')
               dispatch('notifications/addNotification', { status, message: response }, { root: true });
            else
               commit('REFRESH_STRUCTURE', { uid, structure: remapStructure(response) });
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
               uid: 1,
               type: 'table',
               fields: [],
               keyUsage: []
            }],
            structure: {},
            breadcrumbs: {}
         };

         commit('ADD_WORKSPACE', workspace);

         if (getters.getWorkspace(uid).tabs.length < 2)
            dispatch('newTab', uid);
      },
      changeBreadcrumbs ({ commit, getters }, payload) {
         commit('CHANGE_BREADCRUMBS', { uid: getters.getSelected, breadcrumbs: payload });
      },
      newTab ({ commit }, uid) {
         commit('NEW_TAB', uid);
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
