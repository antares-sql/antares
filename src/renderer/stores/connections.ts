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
      connections: persistentStore.get('connections', []) as ConnectionParams[],
      pinnedConnections: new Set([...persistentStore.get('pinnedConnections', []) as string[]]) as Set<string>,
      lastConnections: persistentStore.get('lastConnections', []) as {uid: string; time: number}[]
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
         (this.pinnedConnections as Set<string>).delete(connection.uid);
         persistentStore.set('pinnedConnections', [...this.pinnedConnections]);
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
      updateConnections (connections: ConnectionParams[]) {
         this.connections = connections;
         persistentStore.set('connections', this.connections);
      },
      updatePinnedConnections (pinned: string[]) {
         this.pinnedConnections = new Set(pinned);
         persistentStore.set('pinnedConnections', [...this.pinnedConnections]);
      },
      pinConnection (uid: string) {
         (this.pinnedConnections as Set<string>).add(uid);
         persistentStore.set('pinnedConnections', [...this.pinnedConnections]);
      },
      unpinConnection (uid: string) {
         (this.pinnedConnections as Set<string>).delete(uid);
         persistentStore.set('pinnedConnections', [...this.pinnedConnections]);
      },
      updateLastConnection (uid: string) {
         const cIndex = (this.lastConnections as {uid: string; time: number}[]).findIndex((c) => c.uid === uid);

         if (cIndex >= 0)
            this.lastConnections[cIndex].time = new Date().getTime();
         else
            this.lastConnections.push({ uid, time: new Date().getTime() });

         persistentStore.set('lastConnections', this.lastConnections);
      }
   }
});
