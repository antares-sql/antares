'use strict';

export default {
   namespaced: true,
   strict: true,
   state: {
      connections: [],
      is_new_modal: false
   },
   getters: {
      getConnections: state => state.connections,
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
      }
   }
};
