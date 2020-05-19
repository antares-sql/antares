'use strict';
import Connection from '@/ipc-api/Connection';

export default {
   namespaced: true,
   strict: true,
   state: {
      workspaces: [],
      connected_workspaces: [], // TODO: move to state.workspaces
      selected_workspace: null
   },
   getters: {
      getSelected: state => {
         if (state.selected_workspace) return state.selected_workspace;
         if (state.workspaces.length) return state.workspaces[0].uid;
         return null;
      },
      getWorkspaces: state => state.workspaces,
      getConnected: state => state.connected_workspaces
   },
   mutations: {
      SELECT_WORKSPACE (state, uid) {
         state.selected_workspace = uid;
      },
      ADD_CONNECTED (state, { uid, structure }) {
         state.connected_workspaces.push(uid);
         state.workspaces = state.workspaces.map(workspace => workspace.uid === uid ? { ...workspace, structure } : workspace);
      },
      REMOVE_CONNECTED (state, uid) {
         state.connected_workspaces = state.connected_workspaces.filter(value => value !== uid);
         state.workspaces = state.workspaces.map(workspace => workspace.uid === uid ? { ...workspace, structure: {} } : workspace);
      },
      ADD_WORKSPACE (state, workspace) {
         state.workspaces.push(workspace);
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
               commit('ADD_CONNECTED', { uid: connection.uid, structure: response });
         }
         catch (err) {
            dispatch('notifications/addNotification', { status: 'error', message: err.stack }, { root: true });
         }
      },
      async removeConnected ({ commit }, uid) {
         Connection.disconnect(uid);
         commit('REMOVE_CONNECTED', uid);
      },
      addWorkspace ({ commit }, uid) {
         const workspace = {
            uid,
            connected: false,
            tabs: [],
            structure: {}
         };
         commit('ADD_WORKSPACE', workspace);
      }
   }
};
