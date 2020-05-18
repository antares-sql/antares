'use strict';
import Connection from '@/ipc-api/Connection';

export default {
   namespaced: true,
   strict: true,
   state: {
      workspaces: [],
      connected_workspaces: [],
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
      ADD_CONNECTED (state, uid) {
         state.connected_workspaces.push(uid);
      },
      REMOVE_CONNECTED (state, uid) {
         state.connected_workspaces = state.connected_workspaces.filter(value => value !== uid);
      },
      ADD_WORKSPACE (state, workspace) {
         state.workspaces.push(workspace);
      }
   },
   actions: {
      selectWorkspace ({ commit }, uid) {
         commit('SELECT_WORKSPACE', uid);
      },
      addConnected ({ commit }, uid) {
         commit('ADD_CONNECTED', uid);
      },
      async removeConnected ({ commit }, uid) {
         Connection.disconnect(uid);
         commit('REMOVE_CONNECTED', uid);
      },
      addWorkspace ({ commit }, uid) {
         const workspace = {
            uid,
            tabs: []
         };
         commit('ADD_WORKSPACE', workspace);
      }
   }
};
