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
   icon?: null | string;
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
      getConnectionOrderByUid: state => (uid:string) => state.connectionsOrder
         .find(connection => connection.uid === uid),
      getFolders: state => state.connectionsOrder.filter(conn => conn.isFolder),
      getConnectionFolder: state => (uid:string) => state.connectionsOrder
         .find(folder => folder.isFolder && folder.connections.includes(uid))
   },
   actions: {
      addConnection (connection: ConnectionParams) {
         this.connections.push(connection);
         persistentStore.set('connections', this.connections);

         this.connectionsOrder.push({
            isFolder: false,
            uid: connection.uid,
            client: connection.client,
            icon: null,
            name: null
         });
         persistentStore.set('connectionsOrder', this.connectionsOrder);
      },
      addFolder (params: {after: string; connections: [string, string]}) {
         const index = this.connectionsOrder.findIndex((conn: SidebarElement) => conn.uid === params.after);

         this.connectionsOrder.splice(index, 0, {
            isFolder: true,
            uid: uidGen('F'),
            name: '',
            color: '#E36929',
            connections: params.connections
         });
         persistentStore.set('connectionsOrder', this.connectionsOrder);
      },
      addToFolder (params: {folder: string; connection: string}) {
         this.connectionsOrder = this.connectionsOrder.map((conn: SidebarElement) => {
            if (conn.uid === params.folder)
               conn.connections.push(params.connection);

            return conn;
         });
         persistentStore.set('connectionsOrder', this.connectionsOrder);
         this.clearEmptyFolders();
      },
      deleteConnection (connection: SidebarElement | ConnectionParams) {
         this.connectionsOrder = (this.connectionsOrder as SidebarElement[]).map(el => { // Removes connection from folders
            if (el.isFolder && el.connections.includes(connection.uid))
               el.connections = el.connections.filter(uid => uid !== connection.uid);
            return el;
         });
         this.connectionsOrder = (this.connectionsOrder as SidebarElement[]).filter(el => el.uid !== connection.uid);

         this.connections = (this.connections as SidebarElement[]).filter(el => el.uid !== connection.uid);
         persistentStore.set('connections', this.connections);
         this.clearEmptyFolders();
      },
      editConnection (connection: ConnectionParams) {
         const editedConnections = (this.connections as ConnectionParams[]).map(conn => {
            if (conn.uid === connection.uid) return connection;
            return conn;
         });

         this.connections = editedConnections;
         persistentStore.set('connections', this.connections);

         const editedConnectionsOrder = (this.connectionsOrder as SidebarElement[]).map(conn => {
            if (conn.uid === connection.uid) {
               return {
                  isFolder: false,
                  uid: connection.uid,
                  client: connection.client,
                  icon: conn.icon,
                  name: conn.name
               };
            }
            return conn;
         });

         this.connectionsOrder = editedConnectionsOrder;
         persistentStore.set('connectionsOrder', this.connectionsOrder);
      },
      updateConnections (connections: ConnectionParams[]) {
         this.connections = connections;
         persistentStore.set('connections', this.connections);
      },
      initConnectionsOrder () {
         this.connectionsOrder = (this.connections as ConnectionParams[]).map<SidebarElement>(conn => {
            return {
               isFolder: false,
               uid: conn.uid,
               client: conn.client,
               icon: null,
               name: null
            };
         });
         persistentStore.set('connectionsOrder', this.connectionsOrder);
      },
      updateConnectionsOrder (connections: SidebarElement[]) {
         const invalidElements = connections.reduce<{index: number; uid: string}[]>((acc, curr, i) => {
            if (typeof curr === 'string')
               acc.push({ index: i, uid: curr });

            return acc;
         }, []);

         if (invalidElements.length) {
            invalidElements.forEach(el => {
               let connIndex = connections.findIndex(conn => conn.uid === el.uid);
               const conn = connections[connIndex];

               if (connIndex === -1) return;

               connections.splice(el.index, 1, { // Move to new position
                  isFolder: false,
                  client: conn.client,
                  uid: conn.uid,
                  icon: conn.icon,
                  name: conn.name
               });

               connIndex = connections.findIndex((conn, i) => conn.uid === el.uid && i !== el.index);
               connections.splice(connIndex, 1);// Delete old object
            });
         }

         // Clear empty folders
         const emptyFolders = connections.reduce<string[]>((acc, curr) => {
            if (curr.connections && curr.connections.length === 0)
               acc.push(curr.uid);
            return acc;
         }, []);

         connections = connections.filter(el => !emptyFolders.includes(el.uid));

         this.connectionsOrder = connections;
         persistentStore.set('connectionsOrder', this.connectionsOrder);
      },
      updateConnectionOrder (element: SidebarElement) {
         this.connectionsOrder = (this.connectionsOrder as SidebarElement[]).map(el => {
            if (el.uid === element.uid)
               el = element;
            return el;
         });
         persistentStore.set('connectionsOrder', this.connectionsOrder);
      },
      updateLastConnection (uid: string) {
         const cIndex = (this.lastConnections as {uid: string; time: number}[]).findIndex((c) => c.uid === uid);

         if (cIndex >= 0)
            this.lastConnections[cIndex].time = new Date().getTime();
         else
            this.lastConnections.push({ uid, time: new Date().getTime() });

         persistentStore.set('lastConnections', this.lastConnections);
      },
      clearEmptyFolders () {
         // Clear empty folders
         const emptyFolders = (this.connectionsOrder as SidebarElement[]).reduce<string[]>((acc, curr) => {
            if (curr.connections && curr.connections.length === 0)
               acc.push(curr.uid);
            return acc;
         }, []);

         this.connectionsOrder = (this.connectionsOrder as SidebarElement[]).filter(el => !emptyFolders.includes(el.uid));
         persistentStore.set('connectionsOrder', this.connectionsOrder);
      }
   }
});
