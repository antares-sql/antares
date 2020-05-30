'use strict';

export default {
   namespaced: true,
   strict: true,
   state: {
      connections: []
   },
   getters: {
      getConnections: state => state.connections
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
      }
   }
};
