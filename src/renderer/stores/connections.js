import { defineStore, acceptHMRUpdate } from 'pinia';
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

export const useConnectionsStore = defineStore('connections', {
   state: () => ({
      connections: persistentStore.get('connections', [])
   }),
   getters: {
      getConnectionName: state => uid => {
         const connection = state.connections.filter(connection => connection.uid === uid)[0];
         let connectionName = '';

         if (connection.name)
            connectionName = connection.name;
         else if (connection.ask)
            connectionName = `${connection.host}:${connection.port}`;
         else if (connection.databasePath) {
            let string = connection.databasePath.split(/[/\\]+/).pop();

            if (string.length >= 30)
               string = `...${string.slice(-30)}`;

            connectionName = string;
         }
         else
            connectionName = `${connection.user + '@'}${connection.host}:${connection.port}`;

         return connectionName;
      }
   },
   actions: {
      addConnection (connection) {
         this.connections.push(connection);
         persistentStore.set('connections', this.connections);
      },
      deleteConnection (connection) {
         this.connections = this.connections.filter(el => el.uid !== connection.uid);
         persistentStore.set('connections', this.connections);
      },
      editConnection (connection) {
         const editedConnections = this.connections.map(conn => {
            if (conn.uid === connection.uid) return connection;
            return conn;
         });
         this.connections = editedConnections;
         this.selected_conection = {};
         persistentStore.set('connections', this.connections);
      },
      updateConnections (connections) {
         this.connections = connections;
         persistentStore.set('connections', this.connections);
      }
   }
});

if (import.meta.webpackHot)
   import.meta.webpackHot.accept(acceptHMRUpdate(useConnectionsStore, import.meta.webpackHot));
