import customizations from 'common/customizations';
import { ConnectionParams } from 'common/interfaces/antares';
import { DEBUG_CONNECTION_PREFIX, DEBUG_FOLDER_UID, getDebugConnections } from 'common/libs/testConnections';
import { uidGen } from 'common/libs/uidGen';
import * as crypto from 'crypto';
import { ipcRenderer } from 'electron';
import Store from 'electron-store';
import * as fs from 'fs';
import * as path from 'path';
import { defineStore } from 'pinia';

import { i18n } from '@/i18n';
import { useWorkspacesStore } from '@/stores/workspaces';

import { useNotificationsStore } from './notifications';

export interface SidebarElement {
   isFolder: boolean;
   uid: string;
   client?: string;
   connections?: string[];
   color?: string;
   name?: string;
   icon?: null | string;
   hasCustomIcon?: boolean;
}

export interface CustomIcon {base64: string; uid: string}

interface KeyValueStore {
   get (key: string, defaultValue?: unknown): unknown;
   set (key: string, value: unknown): void;
}

/**
 * Why the saved connections could not be opened normally:
 * - `readOnly`: no encryption key is available (e.g. another instance hasn't saved it yet, or the
 *   secrets store is not reachable from a sandbox): the file is left untouched and changes are kept in memory only
 * - `reset`: no available key decrypts the file: it was copied to `<file>.corrupt` and a new empty store is used
 */
export type ConnectionsStorageError = null | { reason: 'readOnly' | 'reset'; backupPath?: string };

/**
 * The encryption key of the saved connections has two copies: the renderer localStorage and the
 * session store of the main process (encrypted with safeStorage). Each one can be missing or stale
 * in a second instance or a sandbox, so every available key is tried against the file.
 */
function getStoredKeys (): string[] {
   const keys = [localStorage.getItem('key'), ipcRenderer.sendSync('get-key')];
   return [...new Set(keys.filter((key): key is string => typeof key === 'string' && !!key))];
}

function saveKey (key: string) {
   if (localStorage.getItem('key') !== key)
      localStorage.setItem('key', key);
   ipcRenderer.send('set-key', key);
}

/**
 * With clearInvalidConfig disabled it throws if the file can't be decrypted/parsed and leaves it intact.
 * With it enabled, opening the store already empties an unreadable file on disk.
 */
function openStore (key: string, clearInvalidConfig: boolean) {
   return new Store({ name: 'connections', encryptionKey: key, clearInvalidConfig });
}

/** Path of the connections file, found without opening it (the plain settings store is in the same folder) */
function getStorePath () {
   return path.join(path.dirname(new Store({ name: 'settings' }).path), 'connections.json');
}

function createMemoryStore (): KeyValueStore {
   const data = new Map<string, unknown>();
   return {
      get: (key, defaultValue) => data.has(key) ? data.get(key) : defaultValue,
      set: (key, value) => {
         data.set(key, value);
      }
   };
}

function createPersistentStore (): { store: KeyValueStore; error: ConnectionsStorageError } {
   const keys = getStoredKeys();

   // A missing file is opened by any key
   for (const key of keys) {
      try {
         const store = openStore(key, false);
         saveKey(key);
         return { store, error: null };
      }
      catch {}
   }

   const storePath = getStorePath();
   const hasData = fs.existsSync(storePath) && fs.statSync(storePath).size > 0;

   if (!hasData) {
      const newKey = keys[0] || crypto.randomBytes(16).toString('hex');
      saveKey(newKey);
      return { store: openStore(newKey, true), error: null };
   }

   if (!keys.length) {
      // Never replace the key of existing data: writing with a new key would make it unreadable for good
      return { store: createMemoryStore(), error: { reason: 'readOnly' } };
   }

   // Back up before opening the store with clearInvalidConfig, which empties the file
   const backupPath = `${storePath}.corrupt`;
   try {
      fs.copyFileSync(storePath, backupPath);
   }
   catch {}

   saveKey(keys[0]);
   return { store: openStore(keys[0], true), error: { reason: 'reset', backupPath } };
}

const { store: persistentStore, error: storageError } = createPersistentStore();

/**
 * "Show table size" used to be a global setting: moves it to the connections whose engine
 * supports the option (MySQL/MariaDB) and don't have their own value yet, then removes it.
 */
function migrateShowTableSizeSetting () {
   try {
      const settingsStore = new Store({ name: 'settings' });
      if (!settingsStore.has('show_table_size')) return;

      const showTableSize = settingsStore.get('show_table_size') === true;
      if (showTableSize) {
         const connections = persistentStore.get('connections', []) as ConnectionParams[];
         persistentStore.set('connections', connections.map(conn =>
            customizations[conn.client]?.showTableSizeOption && conn.showTableSize === undefined
               ? { ...conn, showTableSize }
               : conn
         ));
      }

      settingsStore.delete('show_table_size');
   }
   catch (err) {
      console.error(err);
   }
}

if (storageError?.reason !== 'readOnly') // It removes the old setting: run it only when the result is saved
   migrateShowTableSizeSetting();

export const useConnectionsStore = defineStore('connections', {
   state: () => ({
      connections: persistentStore.get('connections', []) as ConnectionParams[],
      lastConnections: persistentStore.get('lastConnections', []) as {uid: string; time: number}[],
      connectionsOrder: persistentStore.get('connectionsOrder', []) as SidebarElement[],
      customIcons: persistentStore.get('custom_icons', []) as CustomIcon[],
      storageError: storageError as ConnectionsStorageError
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
         .find(folder => folder.isFolder && folder.connections.includes(uid)),
      getIconByUid: state => (uid:string) => state.customIcons.find(i => i.uid === uid)
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
      addFolder (params: {after?: string; connections: [string, string?]}) {
         const index = params.after
            ? this.connectionsOrder.findIndex((conn: SidebarElement) => conn.uid === params.after)
            : this.connectionsOrder.length;

         this.removeFromFolders(...params.connections);

         this.connectionsOrder.splice(index, 0, {
            isFolder: true,
            uid: uidGen('F'),
            name: '',
            color: '#E36929',
            connections: params.connections
         });
         persistentStore.set('connectionsOrder', this.connectionsOrder);
      },
      removeFromFolders (...connections: string[]) { // Removes connections from folders
         this.connectionsOrder = (this.connectionsOrder as SidebarElement[]).map(el => {
            if (el.isFolder)
               el.connections = el.connections.filter(uid => !connections.includes(uid));
            return el;
         });

         this.clearEmptyFolders();
      },
      addToFolder (params: {folder: string; connection: string}) {
         this.removeFromFolders(params.connection);

         this.connectionsOrder = this.connectionsOrder.map((conn: SidebarElement) => {
            if (conn.uid === params.folder)
               conn.connections.push(params.connection);

            return conn;
         });
         persistentStore.set('connectionsOrder', this.connectionsOrder);
         this.clearEmptyFolders();
      },
      deleteConnection (connection: SidebarElement | ConnectionParams) {
         this.removeFromFolders(connection.uid);
         this.connectionsOrder = (this.connectionsOrder as SidebarElement[]).filter(el => el.uid !== connection.uid);
         this.lastConnections = (this.lastConnections as SidebarElement[]).filter(el => el.uid !== connection.uid);

         this.connections = (this.connections as SidebarElement[]).filter(el => el.uid !== connection.uid);
         persistentStore.set('connections', this.connections);
         this.clearEmptyFolders();
         useWorkspacesStore().removeWorkspace(connection.uid);
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
                  name: conn.name,
                  hasCustomIcon: conn.hasCustomIcon
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
                  name: conn.name,
                  hasCustomIcon: conn.hasCustomIcon
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
      },
      // Custom Icons
      addIcon (svg: string) {
         if (svg.length > 16384) {
            const { t } = i18n.global;
            useNotificationsStore().addNotification({
               status: 'error',
               message: t('application.sizeLimitError', { size: '16KB' })
            });
            return;
         }

         const icon: CustomIcon = {
            uid: uidGen('I'),
            base64: svg
         };

         this.customIcons.push(icon);
         persistentStore.set('custom_icons', this.customIcons);
      },
      removeIcon (uid: string) {
         this.customIcons = this.customIcons.filter((i: CustomIcon) => i.uid !== uid);
         persistentStore.set('custom_icons', this.customIcons);
      },
      /** Debug only: adds (or replaces) the connections to the docker test databases in their own folder */
      applyDebugConnections (connections: ConnectionParams[] = getDebugConnections()) {
         const isDebug = (uid: string) => uid.startsWith(DEBUG_CONNECTION_PREFIX);

         this.connections = [
            ...(this.connections as ConnectionParams[]).filter(c => !isDebug(c.uid)),
            ...connections
         ];

         this.connectionsOrder = [
            ...(this.connectionsOrder as SidebarElement[])
               .filter(el => el.uid !== DEBUG_FOLDER_UID && !isDebug(el.uid))
               .map(el => el.isFolder ? { ...el, connections: el.connections.filter(uid => !isDebug(uid)) } : el),
            {
               isFolder: true,
               uid: DEBUG_FOLDER_UID,
               name: 'Docker test DBs',
               color: '#2496ED',
               connections: connections.map(c => c.uid)
            },
            ...connections.map<SidebarElement>(c => ({
               isFolder: false,
               uid: c.uid,
               client: c.client,
               icon: null,
               name: null
            }))
         ];

         persistentStore.set('connections', this.connections);
         this.clearEmptyFolders(); // also persists connectionsOrder
      },
      importConnections (importObj: {
         connections: ConnectionParams[];
         connectionsOrder: SidebarElement[];
         customIcons: CustomIcon[];
      }) {
         this.connections = [...this.connections, ...importObj.connections];
         this.connectionsOrder = [...this.connectionsOrder, ...importObj.connectionsOrder];
         this.customIcons = [...this.customIcons, ...importObj.customIcons];

         persistentStore.set('connections', this.connections);
         persistentStore.set('connectionsOrder', this.connectionsOrder);
         persistentStore.set('customIcons', this.customIcons);
      }
   }
});
