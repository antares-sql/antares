import { defineStore } from 'pinia';
import * as Store from 'electron-store';
import * as crypto from 'crypto';
import { ConnectionParams } from 'common/interfaces/antares';
import { uidGen } from 'common/libs/uidGen';
const key = localStorage.getItem('key');

export interface SidebarElement {
   isFolder: boolean;
   uid: string;
   client?: string;
   connections?: string[];
   color?: string;
   name?: string;
}

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
      lastConnections: persistentStore.get('lastConnections', []) as {uid: string; time: number}[],
      connectionsOrder: persistentStore.get('connectionsOrder', []) as SidebarElement[]
   }),
   getters: {
      getConnectionByUid: state => (uid:string) => state.connections.find(connection => connection.uid === uid),
      getConnectionName: state => (uid: string) => {
         const connection = state.connections.find(connection => connection.uid === uid);
         let connectionName = '';
         if (connection) {
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
         }

         return connectionName;
      },
      getConnectionsOrder: state => {
         if (state.connectionsOrder.length)
            return state.connectionsOrder;
         else {
            const connectionsOrder = state.connections.map<SidebarElement>(conn => {
               return {
                  isFolder: false,
                  uid: conn.uid,
                  client: conn.client
               };
            });
            persistentStore.set('connectionsOrder', connectionsOrder);
            return connectionsOrder;
         }
      },
      getFolders: state => state.connectionsOrder.filter(conn => conn.isFolder)
   },
   actions: {
      addConnection (connection: ConnectionParams) {
         this.connections.push(connection);
         persistentStore.set('connections', this.connections);

         this.connectionsOrder.push({
            isFolder: false,
            uid: connection.uid,
            client: connection.client
         });
         persistentStore.set('connectionsOrder', this.connectionsOrder);
      },
      addFolder (params: {after: string; connections: [string, string]}) {
         const index = this.connectionsOrder.findIndex((conn: SidebarElement) => conn.uid === params.after);
         this.connectionsOrder.splice(index, 0, {
            isFolder: true,
            uid: uidGen('F'),
            name: '',
            color: 'orange',
            connections: params.connections
         });
         persistentStore.set('connectionsOrder', this.connectionsOrder);
      },
      deleteConnection (connection: SidebarElement | ConnectionParams) {
         this.connections = (this.connections as SidebarElement[]).filter(el => el.uid !== connection.uid);
         persistentStore.set('connections', this.connections);

         this.connectionsOrder = (this.connectionsOrder as SidebarElement[]).filter(el => el.uid !== connection.uid);
         console.log(connection.uid, this.connectionsOrder);
         persistentStore.set('connectionsOrder', this.connectionsOrder);
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
      updateConnectionsOrder (connections: SidebarElement[]) {
         this.connectionsOrder = connections;
         persistentStore.set('connectionsOrder', this.connectionsOrder);
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
