'use strict';
// import { uidGen } from 'common/libs/utilities';

export default {
   namespaced: true,
   strict: true,
   state: {
      workspaces: [],
      connected_workspaces: [],
      workspace_selected: null
   },
   getters: {
      getSelected: state => {
         if (state.workspace_selected) return state.workspace_selected;
         if (state.workspaces.length) return state.workspaces[0].uid;
         return null;
      },
      getWorkspaces: state => state.workspaces,
      getConnected: state => state.connected_workspaces
   },
   mutations: {
      SELECT_WORKSPACE (state, uid) {
         state.workspace_selected = uid;
      },
      ADD_CONNECTED (state, uid) {
         state.connected_workspaces.push(uid);
      },
      REMOVE_CONNECTED (state, uid) {
         state.connected_workspaces = state.connected_workspaces.filter(item => item.uid !== uid);
      }
   },
   actions: {
      selectWorkspace ({ commit }, uid) {
         commit('SELECT_WORKSPACE', uid);
      },
      addConnected ({ commit }, uid) {
         commit('ADD_CONNECTED', uid);
      },
      removeConnected ({ commit }, uid) {
         commit('REMOVE_CONNECTED', uid);
      }
   }
};
