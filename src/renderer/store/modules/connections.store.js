'use strict';
import Store from 'electron-store';
import crypto from 'crypto';
const key = localStorage.getItem('key');

if (!key)
   localStorage.setItem('key', crypto.randomBytes(16).toString('hex'));
else
   localStorage.setItem('key', key);

const persistentStore = new Store({
   name: 'connections',
   encryptionKey: key,
   clearInvalidConfig: true
});

export default {
   namespaced: true,
   strict: true,
   state: {
      connections: persistentStore.get('connections', [])
   },
   getters: {
      getConnections: state => state.connections,
      getConnectionName: state => uid => {
         const connection = state.connections.filter(connection => connection.uid === uid)[0];
         if (!connection) return '';
         return connection.name
            ? connection.name
            : connection.ask
               ? `${connection.host}:${connection.port}`
               : `${connection.user + '@'}${connection.host}:${connection.port}`;
      }
   },
   mutations: {
      ADD_CONNECTION (state, connection) {
         state.connections.push(connection);
         persistentStore.set('connections', state.connections);
      },
      DELETE_CONNECTION (state, connection) {
         state.connections = state.connections.filter(el => el.uid !== connection.uid);
         persistentStore.set('connections', state.connections);
      },
      EDIT_CONNECTION (state, connection) {
         const editedConnections = state.connections.map(conn => {
            if (conn.uid === connection.uid) return connection;
            return conn;
         });
         state.connections = editedConnections;
         state.selected_conection = {};
         persistentStore.set('connections', state.connections);
      },
      UPDATE_CONNECTIONS (state, connections) {
         state.connections = connections;
         persistentStore.set('connections', state.connections);
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
   }
};
