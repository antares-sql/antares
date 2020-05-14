'use strict';

export default {
   namespaced: true,
   strict: true,
   state: {
      connections: [],
      is_new_modal: false,
      connection_selected: null
   },
   getters: {
      getConnections: state => state.connections,
      getSelected: state => {
         if (state.connection_selected) return state.connection_selected;
         if (state.connections.length) return state.connections[0].uid;
         return null;
      },
      isNewModal: state => state.is_new_modal
   },
   mutations: {
      ADD_CONNECTION (state, connection) {
         state.connections.push(connection);
      },
      SHOW_NEW_CONNECTION_MODAL (state) {
         state.is_new_modal = true;
      },
      HIDE_NEW_CONNECTION_MODAL (state) {
         state.is_new_modal = false;
      },
      SELECT_CONNECTION (state, uid) {
         state.connection_selected = uid;
      }
   },
   actions: {
      addConnection ({ commit }, connection) {
         commit('ADD_CONNECTION', connection);
      },
      // Modals
      showNewConnModal ({ commit }) {
         commit('SHOW_NEW_CONNECTION_MODAL');
      },
      hideNewConnModal ({ commit }) {
         commit('HIDE_NEW_CONNECTION_MODAL');
      },
      selectConnection ({ commit }, uid) {
         commit('SELECT_CONNECTION', uid);
      }
   }
};
