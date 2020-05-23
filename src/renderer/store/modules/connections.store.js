'use strict';

export default {
   namespaced: true,
   strict: true,
   state: {
      connections: [],
      is_new_modal: false,
      is_edit_modal: false,
      selected_conection: {}
   },
   getters: {
      getConnections: state => state.connections,
      getSelectedConnection: state => state.selected_conection,
      isNewModal: state => state.is_new_modal,
      isEditModal: state => state.is_edit_modal
   },
   mutations: {
      ADD_CONNECTION (state, connection) {
         state.connections.push(connection);
      },
      DELETE_CONNECTION (state, connection) {
         state.connections = state.connections.filter(el => el.uid !== connection.uid);
      },
      EDIT_CONNECTION (state, connection) {
         const editedConnections = state.connections.map(conn => {
            if (conn.uid === connection.uid) return connection;
            return conn;
         });
         state.connections = editedConnections;
         state.selected_conection = {};
      },
      UPDATE_CONNECTIONS (state, connections) {
         state.connections = connections;
      },
      SHOW_NEW_CONNECTION_MODAL (state) {
         state.is_new_modal = true;
      },
      HIDE_NEW_CONNECTION_MODAL (state) {
         state.is_new_modal = false;
      },
      SHOW_EDIT_CONNECTION_MODAL (state, connection) {
         state.is_edit_modal = true;
         state.selected_conection = connection;
      },
      HIDE_EDIT_CONNECTION_MODAL (state) {
         state.is_edit_modal = false;
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
      },
      showEditConnModal ({ commit }, connection) {
         commit('SHOW_EDIT_CONNECTION_MODAL', connection);
      },
      hideEditConnModal ({ commit }) {
         commit('HIDE_EDIT_CONNECTION_MODAL');
      }
   }
};
