import { defineStore } from 'pinia';
import * as Store from 'electron-store';
import * as crypto from 'crypto';
import { ConnectionParams } from 'common/interfaces/antares';
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
      connections: persistentStore.get('connections', []) as ConnectionParams[]
   }),
   getters: {
      getConnectionName: state => (uid: string) => {
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
      addConnection (connection: ConnectionParams) {
         this.connections.push(connection);
         persistentStore.set('connections', this.connections);
      },
      deleteConnection (connection: ConnectionParams) {
         this.connections = (this.connections as ConnectionParams[]).filter(el => el.uid !== connection.uid);
         persistentStore.set('connections', this.connections);
      },
      editConnection (connection: ConnectionParams) {
         const editedConnections = (this.connections as ConnectionParams[]).map(conn => {
            if (conn.uid === connection.uid) return connection;
            return conn;
         });
         this.connections = editedConnections;
         this.selected_conection = {};
         persistentStore.set('connections', this.connections);
      },
      updateConnections (connections: ConnectionParams) {
         this.connections = connections;
         persistentStore.set('connections', this.connections);
      }
   }
});
