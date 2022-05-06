import { defineStore, acceptHMRUpdate } from 'pinia';
import Store from 'electron-store';
import Connection from '@/ipc-api/Connection';
import Schema from '@/ipc-api/Schema';
import Users from '@/ipc-api/Users';
import { uidGen } from 'common/libs/uidGen';
import { useConnectionsStore } from '@/stores/connections';
import { useNotificationsStore } from '@/stores/notifications';
import { useSettingsStore } from '@/stores/settings';

const persistentStore = new Store({ name: 'tabs' });
const tabIndex = [];

export const useWorkspacesStore = defineStore('workspaces', {
   state: () => ({
      workspaces: [],
      selectedWorkspace: null
   }),
   getters: {
      getSelected: state => {
         if (!state.workspaces.length) return 'NEW';
         if (state.selectedWorkspace) return state.selectedWorkspace;
         return state.workspaces[0].uid;
      },
      getWorkspace: state => uid => {
         return state.workspaces.find(workspace => workspace.uid === uid);
      },
      getDatabaseVariable: state => (uid, name) => {
         return state.workspaces.find(workspace => workspace.uid === uid).variables.find(variable => variable.name === name);
      },
      getWorkspaceTab (state) {
         return tUid => {
            if (!this.getSelected) return;
            const workspace = state.workspaces.find(workspace => workspace.uid === this.getSelected);
            if ('tabs' in workspace)
               return workspace.tabs.find(tab => tab.uid === tUid);
            return {};
         };
      },
      getConnected: state => {
         return state.workspaces
            .filter(workspace => workspace.connectionStatus === 'connected')
            .map(workspace => workspace.uid);
      },
      getLoadedSchemas: state => uid => {
         return state.workspaces.find(workspace => workspace.uid === uid).loadedSchemas;
      },
      getSearchTerm: state => uid => {
         return state.workspaces.find(workspace => workspace.uid === uid).searchTerm;
      }
   },
   actions: {
      selectWorkspace (uid) {
         if (!uid)
            this.selectedWorkspace = this.workspaces.length ? this.workspaces[0].uid : 'NEW';
         else
            this.selectedWorkspace = uid;
      },
      async connectWorkspace (connection) {
         this.workspaces = this.workspaces.map(workspace => workspace.uid === connection.uid
            ? {
               ...workspace,
               structure: {},
               breadcrumbs: {},
               loadedSchemas: new Set(),
               connectionStatus: 'connecting'
            }
            : workspace);

         const connectionsStore = useConnectionsStore();
         const notificationsStore = useNotificationsStore();
         const settingsStore = useSettingsStore();

         try {
            const { status, response } = await Connection.connect(connection);

            if (status === 'error') {
               notificationsStore.addNotification({ status, message: response });
               this.workspaces = this.workspaces.map(workspace => workspace.uid === connection.uid
                  ? {
                     ...workspace,
                     structure: {},
                     breadcrumbs: {},
                     loadedSchemas: new Set(),
                     connectionStatus: 'failed'
                  }
                  : workspace);
            }
            else {
               let dataTypes = [];
               let indexTypes = [];
               let customizations = {};

               switch (connection.client) {
                  case 'mysql':
                  case 'maria':
                     dataTypes = require('common/data-types/mysql');
                     indexTypes = require('common/index-types/mysql');
                     customizations = require('common/customizations/mysql');
                     break;
                  case 'pg':
                     dataTypes = require('common/data-types/postgresql');
                     indexTypes = require('common/index-types/postgresql');
                     customizations = require('common/customizations/postgresql');
                     break;
                  case 'sqlite':
                     dataTypes = require('common/data-types/sqlite');
                     indexTypes = require('common/index-types/sqlite');
                     customizations = require('common/customizations/sqlite');
                     break;
               }

               const { status, response: version } = await Schema.getVersion(connection.uid);

               if (status === 'error')
                  notificationsStore.addNotification({ status, message: version });

               // Check if Maria or MySQL
               const isMySQL = version.name.includes('MySQL');

               if (isMySQL && connection.client !== 'mysql') {
                  const connProxy = Object.assign({}, connection);
                  connProxy.client = 'mysql';
                  connectionsStore.editConnection(connProxy);
               }
               else if (!isMySQL && connection.client === 'mysql') {
                  const connProxy = Object.assign({}, connection);
                  connProxy.client = 'maria';
                  connectionsStore.editConnection(connProxy);
               }

               const cachedTabs = settingsStore.restoreTabs ? persistentStore.get(connection.uid, []) : [];

               if (cachedTabs.length) {
                  tabIndex[connection.uid] = cachedTabs.reduce((acc, curr) => {
                     if (curr.index > acc) acc = curr.index;
                     return acc;
                  }, null);
               }

               this.workspaces = this.workspaces.map(workspace => workspace.uid === connection.uid
                  ? {
                     ...workspace,
                     client: connection.client,
                     dataTypes,
                     indexTypes,
                     customizations,
                     structure: response,
                     connectionStatus: 'connected',
                     tabs: cachedTabs,
                     selectedTab: cachedTabs.length ? cachedTabs[0].uid : null,
                     version
                  }
                  : workspace);

               this.refreshCollations(connection.uid);
               this.refreshVariables(connection.uid);
               this.refreshEngines(connection.uid);
               this.refreshUsers(connection.uid);
            }
         }
         catch (err) {
            notificationsStore.addNotification({ status: 'error', message: err.stack });
         }
      },
      async refreshStructure (uid) {
         const notificationsStore = useNotificationsStore();

         try {
            const { status, response } = await Schema.getStructure({ uid, schemas: this.getLoadedSchemas(uid) });

            if (status === 'error')
               notificationsStore.addNotification({ status, message: response });
            else {
               this.workspaces = this.workspaces.map(workspace => workspace.uid === uid
                  ? {
                     ...workspace,
                     structure: response
                  }
                  : workspace);
            }
         }
         catch (err) {
            notificationsStore.addNotification({ status: 'error', message: err.stack });
         }
      },
      async refreshSchema ({ uid, schema }) {
         const notificationsStore = useNotificationsStore();

         try {
            const { status, response } = await Schema.getStructure({ uid, schemas: new Set([schema]) });
            if (status === 'error')
               notificationsStore.addNotification({ status, message: response });
            else {
               const schemaElements =response.find(_schema => _schema.name === schema);
               this.workspaces = this.workspaces.map(workspace => {
                  if (workspace.uid === uid) {
                     const schemaIndex = workspace.structure.findIndex(s => s.name === schema);

                     if (schemaIndex !== -1)
                        workspace.structure[schemaIndex] = schemaElements;
                     else
                        workspace.structure.push(schemaElements);
                  }
                  return workspace;
               });
            }
         }
         catch (err) {
            notificationsStore.addNotification({ status: 'error', message: err.stack });
         }
      },
      async refreshCollations (uid) {
         const notificationsStore = useNotificationsStore();

         try {
            const { status, response } = await Schema.getCollations(uid);
            if (status === 'error')
               notificationsStore.addNotification({ status, message: response });
            else {
               this.workspaces = this.workspaces.map(workspace => workspace.uid === uid
                  ? {
                     ...workspace,
                     collations: response
                  }
                  : workspace);
            }
         }
         catch (err) {
            notificationsStore.addNotification({ status: 'error', message: err.stack });
         }
      },
      async refreshVariables (uid) {
         const notificationsStore = useNotificationsStore();

         try {
            const { status, response } = await Schema.getVariables(uid);
            if (status === 'error')
               notificationsStore.addNotification({ status, message: response });
            else {
               this.workspaces = this.workspaces.map(workspace => workspace.uid === uid
                  ? {
                     ...workspace,
                     variables: response
                  }
                  : workspace);
            }
         }
         catch (err) {
            notificationsStore.addNotification({ status: 'error', message: err.stack });
         }
      },
      async refreshEngines (uid) {
         const notificationsStore = useNotificationsStore();

         try {
            const { status, response } = await Schema.getEngines(uid);
            if (status === 'error')
               notificationsStore.addNotification({ status, message: response });
            else {
               this.workspaces = this.workspaces.map(workspace => workspace.uid === uid
                  ? {
                     ...workspace,
                     engines: response
                  }
                  : workspace);
            }
         }
         catch (err) {
            notificationsStore.addNotification({ status: 'error', message: err.stack });
         }
      },
      async refreshUsers (uid) {
         const notificationsStore = useNotificationsStore();

         try {
            const { status, response } = await Users.getUsers(uid);
            if (status === 'error')
               notificationsStore.addNotification({ status, message: response });
            else {
               this.workspaces = this.workspaces.map(workspace => workspace.uid === uid
                  ? {
                     ...workspace,
                     users: response
                  }
                  : workspace);
            }
         }
         catch (err) {
            notificationsStore.addNotification({ status: 'error', message: err.stack });
         }
      },
      removeConnected (uid) {
         Connection.disconnect(uid);
         this.workspaces = this.workspaces.map(workspace => workspace.uid === uid
            ? {
               ...workspace,
               structure: {},
               breadcrumbs: {},
               loadedSchemas: new Set(),
               connectionStatus: 'disconnected'
            }
            : workspace);

         this.selectTab({ uid, tab: 0 });
      },
      addWorkspace (uid) {
         const workspace = {
            uid,
            connectionStatus: 'disconnected',
            selectedTab: 0,
            searchTerm: '',
            tabs: [],
            structure: {},
            variables: [],
            collations: [],
            users: [],
            breadcrumbs: {},
            loadingElements: [],
            loadedSchemas: new Set()
         };

         this.workspaces.push(workspace);
      },
      changeBreadcrumbs (payload) {
         const breadcrumbsObj = {
            schema: null,
            table: null,
            trigger: null,
            triggerFunction: null,
            procedure: null,
            function: null,
            scheduler: null,
            view: null,
            query: null
         };

         this.workspaces = this.workspaces.map(workspace => workspace.uid === this.getSelected
            ? {
               ...workspace,
               breadcrumbs: { ...breadcrumbsObj, ...payload }
            }
            : workspace);
      },
      addLoadedSchema (schema) {
         this.workspaces = this.workspaces.map(workspace => {
            if (workspace.uid === this.getSelected)
               workspace.loadedSchemas.add(schema);
            return workspace;
         });
      },
      addLoadingElement (element) {
         this.workspaces = this.workspaces.map(workspace => {
            if (workspace.uid === this.getSelected)
               workspace.loadingElements.push(element);
            return workspace;
         });
      },
      removeLoadingElement (element) {
         this.workspaces = this.workspaces.map(workspace => {
            if (workspace.uid === this.getSelected) {
               const loadingElements = workspace.loadingElements.filter(el =>
                  el.schema !== element.schema &&
                  el.name !== element.name &&
                  el.type !== element.type
               );

               workspace = { ...workspace, loadingElements };
            }
            return workspace;
         });
      },
      setSearchTerm (term) {
         this.workspaces = this.workspaces.map(workspace => workspace.uid === this.getSelected
            ? {
               ...workspace,
               searchTerm: term
            }
            : workspace);
      },
      _addTab ({ uid, tab, content, type, autorun, schema, elementName, elementType }) {
         if (type === 'query')
            tabIndex[uid] = tabIndex[uid] ? ++tabIndex[uid] : 1;

         const newTab = {
            uid: tab,
            index: type === 'query' ? tabIndex[uid] : null,
            selected: false,
            type,
            schema,
            elementName,
            elementType,
            fields: [],
            keyUsage: [],
            content: content || '',
            autorun: !!autorun
         };

         this.workspaces = this.workspaces.map(workspace => {
            if (workspace.uid === uid) {
               return {
                  ...workspace,
                  tabs: [...workspace.tabs, newTab]
               };
            }
            else
               return workspace;
         });

         persistentStore.set(uid, this.workspaces.find(workspace => workspace.uid === uid).tabs);
      },
      _replaceTab ({ uid, tab: tUid, type, schema, content, elementName, elementType }) {
         this.workspaces = this.workspaces.map(workspace => {
            if (workspace.uid === uid) {
               return {
                  ...workspace,
                  tabs: workspace.tabs.map(tab => {
                     if (tab.uid === tUid)
                        return { ...tab, type, schema, content, elementName, elementType };

                     return tab;
                  })
               };
            }
            else
               return workspace;
         });

         persistentStore.set(uid, this.workspaces.find(workspace => workspace.uid === uid).tabs);
      },
      newTab ({ uid, content, type, autorun, schema, elementName, elementType }) {
         let tabUid;
         const workspaceTabs = this.workspaces.find(workspace => workspace.uid === uid);

         switch (type) {
            case 'new-table':
            case 'new-trigger':
            case 'new-trigger-function':
            case 'new-function':
            case 'new-routine':
            case 'new-scheduler':
               tabUid = uidGen('T');
               this._addTab({
                  uid,
                  tab: tabUid,
                  content,
                  type,
                  autorun,
                  schema,
                  elementName,
                  elementType
               });
               break;
            case 'temp-data':
            case 'temp-trigger-props':
            case 'temp-trigger-function-props':
            case 'temp-function-props':
            case 'temp-routine-props':
            case 'temp-scheduler-props': {
               const existentTab = workspaceTabs
                  ? workspaceTabs.tabs.find(tab =>
                     tab.schema === schema &&
                     tab.elementName === elementName &&
                     tab.elementType === elementType &&
                     [type, type.replace('temp-', '')].includes(tab.type))
                  : false;

               if (existentTab) { // if tab exists
                  tabUid = existentTab.uid;
               }
               else {
                  const tempTabs = workspaceTabs ? workspaceTabs.tabs.filter(tab => tab.type.includes('temp-')) : false;

                  if (tempTabs && tempTabs.length) { // if temp tab already opened
                     for (const tab of tempTabs) {
                        if (tab.isChanged) {
                           this._replaceTab({ // make permanent a temp table with unsaved changes
                              uid,
                              tab: tab.uid,
                              type: tab.type.replace('temp-', ''),
                              schema: tab.schema,
                              elementName: tab.elementName,
                              elementType: tab.elementType
                           });

                           tabUid = uidGen('T');
                           this._addTab({ uid, tab: tabUid, content, type, autorun, schema, elementName, elementType });
                        }
                        else {
                           this._replaceTab({ uid, tab: tab.uid, type, schema, elementName, elementType });
                           tabUid = tab.uid;
                        }
                     }
                  }
                  else {
                     tabUid = uidGen('T');
                     this._addTab({ uid, tab: tabUid, content, type, autorun, schema, elementName, elementType });
                  }
               }
            }
               break;
            case 'data':
            case 'table-props':
            case 'trigger-props':
            case 'trigger-function-props':
            case 'function-props':
            case 'routine-props':
            case 'scheduler-props': {
               const existentTab = workspaceTabs
                  ? workspaceTabs.tabs.find(tab =>
                     tab.schema === schema &&
                     tab.elementName === elementName &&
                     tab.elementType === elementType &&
                     [`temp-${type}`, type].includes(tab.type))
                  : false;

               if (existentTab) {
                  this._replaceTab({ uid, tab: existentTab.uid, type, schema, elementName, elementType });
                  tabUid = existentTab.uid;
               }
               else {
                  tabUid = uidGen('T');
                  this._addTab({ uid, tab: tabUid, content, type, autorun, schema, elementName, elementType });
               }
            }
               break;
            default:
               tabUid = uidGen('T');
               this._addTab({ uid, tab: tabUid, content, type, autorun, schema, elementName, elementType });
               break;
         }

         this.selectTab({ uid, tab: tabUid });
      },
      checkSelectedTabExists (uid) {
         const workspace = this.workspaces.find(workspace => workspace.uid === uid);
         const isSelectedExistent = workspace
            ? workspace.tabs.some(tab => tab.uid === workspace.selectedTab)
            : false;

         if (!isSelectedExistent && workspace.tabs.length)
            this.selectTab({ uid, tab: workspace.tabs[workspace.tabs.length - 1].uid });
      },
      updateTabContent ({ uid, tab, type, schema, content }) {
         this._replaceTab({ uid, tab, type, schema, content });
      },
      renameTabs ({ uid, schema, elementName, elementNewName }) {
         this.workspaces = this.workspaces.map(workspace => {
            if (workspace.uid === uid) {
               return {
                  ...workspace,
                  tabs: workspace.tabs.map(tab => {
                     if (tab.elementName === elementName && tab.schema === schema) {
                        return {
                           ...tab,
                           elementName: elementNewName
                        };
                     }

                     return tab;
                  })
               };
            }
            else
               return workspace;
         });

         persistentStore.set(uid, this.workspaces.find(workspace => workspace.uid === uid).tabs);
      },
      removeTab ({ uid, tab: tUid }) {
         this.workspaces = this.workspaces.map(workspace => {
            if (workspace.uid === uid) {
               return {
                  ...workspace,
                  tabs: workspace.tabs.filter(tab => tab.uid !== tUid)
               };
            }
            else
               return workspace;
         });

         persistentStore.set(uid, this.workspaces.find(workspace => workspace.uid === uid).tabs);
         this.checkSelectedTabExists(uid);
      },
      removeTabs ({ uid, schema, elementName, elementType }) { // Multiple tabs based on schema and element name
         if (elementType === 'procedure') elementType = 'routine'; // TODO: pass directly "routine"

         this.workspaces = this.workspaces.map(workspace => {
            if (workspace.uid === uid) {
               return {
                  ...workspace,
                  tabs: workspace.tabs.filter(tab =>
                     tab.schema !== schema ||
                     tab.elementName !== elementName ||
                     tab.elementType !== elementType
                  )
               };
            }
            else
               return workspace;
         });

         persistentStore.set(uid, this.workspaces.find(workspace => workspace.uid === uid).tabs);
         this.checkSelectedTabExists(uid);
      },
      selectTab ({ uid, tab }) {
         this.workspaces = this.workspaces.map(workspace => workspace.uid === uid
            ? { ...workspace, selectedTab: tab }
            : workspace
         );
      },
      updateTabs ({ uid, tabs }) {
         this.workspaces = this.workspaces.map(workspace => workspace.uid === uid
            ? { ...workspace, tabs }
            : workspace
         );
         persistentStore.set(uid, this.workspaces.find(workspace => workspace.uid === uid).tabs);
      },
      setTabFields ({ cUid, tUid, fields }) {
         this.workspaces = this.workspaces.map(workspace => {
            if (workspace.uid === cUid) {
               return {
                  ...workspace,
                  tabs: workspace.tabs.map(tab => {
                     if (tab.uid === tUid)
                        return { ...tab, fields };
                     else
                        return tab;
                  })
               };
            }
            else
               return workspace;
         });

         persistentStore.set(cUid, this.workspaces.find(workspace => workspace.uid === cUid).tabs);
      },
      setTabKeyUsage ({ cUid, tUid, keyUsage }) {
         this.workspaces = this.workspaces.map(workspace => {
            if (workspace.uid === cUid) {
               return {
                  ...workspace,
                  tabs: workspace.tabs.map(tab => {
                     if (tab.uid === tUid)
                        return { ...tab, keyUsage };
                     else
                        return tab;
                  })
               };
            }
            else
               return workspace;
         });

         persistentStore.set(cUid, this.workspaces.find(workspace => workspace.uid === cUid).tabs);
      },
      setUnsavedChanges ({ uid, tUid, isChanged }) {
         this.workspaces = this.workspaces.map(workspace => {
            if (workspace.uid === uid) {
               return {
                  ...workspace,
                  tabs: workspace.tabs.map(tab => {
                     if (tab.uid === tUid)
                        return { ...tab, isChanged };

                     return tab;
                  })
               };
            }
            else
               return workspace;
         });
      }
   }
});

if (import.meta.webpackHot)
   import.meta.webpackHot.accept(acceptHMRUpdate(useWorkspacesStore, import.meta.webpackHot));