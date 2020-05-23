'use strict';

export default {
   namespaced: true,
   strict: true,
   state: {
      connections: [],
      is_new_modal: false,
      is_edit_modal: false
   },
   getters: {
      getConnections: state => state.connections,
      isNewModal: state => state.is_new_modal
   },
   mutations: {
      ADD_CONNECTION (state, connection) {
         state.connections.push(connection);
      },
      DELETE_CONNECTION (state, connection) {
         state.connections = state.connections.filter(el => el.uid !== connection.uid);
      },
      UPDATE_CONNECTIONS (state, connections) {
         state.connections = connections;
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
      deleteConnection ({ commit }, connection) {
         commit('DELETE_CONNECTION', connection);
      },
      editConnection ({ commit }, connection) {
         commit('EDIT_CONNECTION', connection);
      },
      updateConnections ({ commit }, connections) {
         commit('UPDATE_CONNECTIONS', connections);
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
