<template>
   <div class="column col-auto p-relative">
      <div ref="resizer" class="workspace-explorebar-resizer" />
      <div
         ref="explorebar"
         class="workspace-explorebar column"
         :style="{width: localWidth ? localWidth+'px' : ''}"
      >
         <div class="workspace-explorebar-header">
            <span class="workspace-explorebar-title">{{ connectionName }}</span>
            <span v-if="workspace.connectionStatus === 'connected'" class="workspace-explorebar-tools">
               <i
                  class="mdi mdi-18px mdi-database-plus c-hand mr-2"
                  :title="$t('message.createNewSchema')"
                  @click="showNewDBModal"
               />
               <i
                  class="mdi mdi-18px mdi-refresh c-hand mr-2"
                  :class="{'rotate':isRefreshing}"
                  :title="$t('word.refresh')"
                  @click="refresh"
               />
               <i
                  class="mdi mdi-18px mdi-power c-hand"
                  :title="$t('word.disconnect')"
                  @click="disconnectWorkspace(connection.uid)"
               />
            </span>
         </div>
         <div class="workspace-explorebar-search">
            <div v-if="workspace.connectionStatus === 'connected'" class="has-icon-right">
               <input
                  v-model="searchTerm"
                  class="form-input input-sm"
                  type="text"
                  :placeholder="$t('message.searchForElements')"
               >
               <i v-if="!searchTerm" class="form-icon mdi mdi-magnify mdi-18px" />
               <i
                  v-else
                  class="form-icon c-hand mdi mdi-backspace mdi-18px pr-1"
                  @click="searchTerm = ''"
               />
            </div>
         </div>
         <div class="workspace-explorebar-body">
            <WorkspaceExploreBarSchema
               v-for="db of workspace.structure"
               :key="db.name"
               :database="db"
               :connection="connection"
               @show-schema-context="openSchemaContext"
               @show-table-context="openTableContext"
               @show-misc-context="openMiscContext"
               @show-misc-folder-context="openMiscFolderContext"
            />
         </div>
      </div>
      <ModalNewSchema
         v-if="isNewDBModal"
         @close="hideNewDBModal"
         @reload="refresh"
      />
      <DatabaseContext
         v-if="isDatabaseContext"
         :selected-schema="selectedSchema"
         :context-event="databaseContextEvent"
         @close-context="closeDatabaseContext"
         @open-create-table-tab="openCreateElementTab('table')"
         @open-create-view-tab="openCreateElementTab('view')"
         @open-create-trigger-tab="openCreateElementTab('trigger')"
         @open-create-routine-tab="openCreateElementTab('routine')"
         @open-create-function-tab="openCreateElementTab('function')"
         @open-create-trigger-function-tab="openCreateElementTab('trigger-function')"
         @open-create-scheduler-tab="openCreateElementTab('scheduler')"
         @reload="refresh"
      />
      <TableContext
         v-if="isTableContext"
         :selected-schema="selectedSchema"
         :selected-table="selectedTable"
         :context-event="tableContextEvent"
         @delete-table="deleteTable"
         @duplicate-table="duplicateTable"
         @close-context="closeTableContext"
         @reload="refresh"
      />
      <MiscContext
         v-if="isMiscContext"
         :selected-misc="selectedMisc"
         :selected-schema="selectedSchema"
         :context-event="miscContextEvent"
         @close-context="closeMiscContext"
         @reload="refresh"
      />
      <MiscFolderContext
         v-if="isMiscFolderContext"
         :selected-misc="selectedMisc"
         :selected-schema="selectedSchema"
         :context-event="miscContextEvent"
         @open-create-trigger-tab="openCreateElementTab('trigger')"
         @open-create-routine-tab="openCreateElementTab('routine')"
         @open-create-function-tab="openCreateElementTab('function')"
         @open-create-trigger-function-tab="openCreateElementTab('trigger-function')"
         @open-create-scheduler-tab="openCreateElementTab('scheduler')"
         @close-context="closeMiscFolderContext"
         @reload="refresh"
      />
   </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

import Tables from '@/ipc-api/Tables';
import Views from '@/ipc-api/Views';
import Functions from '@/ipc-api/Functions';
import Schedulers from '@/ipc-api/Schedulers';

import WorkspaceExploreBarSchema from '@/components/WorkspaceExploreBarSchema';
import DatabaseContext from '@/components/WorkspaceExploreBarSchemaContext';
import TableContext from '@/components/WorkspaceExploreBarTableContext';
import MiscContext from '@/components/WorkspaceExploreBarMiscContext';
import MiscFolderContext from '@/components/WorkspaceExploreBarMiscFolderContext';
import ModalNewSchema from '@/components/ModalNewSchema';

export default {
   name: 'WorkspaceExploreBar',
   components: {
      WorkspaceExploreBarSchema,
      DatabaseContext,
      TableContext,
      MiscContext,
      MiscFolderContext,
      ModalNewSchema
   },
   props: {
      connection: Object,
      isSelected: Boolean
   },
   data () {
      return {
         isRefreshing: false,

         isNewDBModal: false,
         isNewViewModal: false,
         isNewTriggerModal: false,
         isNewRoutineModal: false,
         isNewFunctionModal: false,
         isNewTriggerFunctionModal: false,
         isNewSchedulerModal: false,

         localWidth: null,
         explorebarWidthInterval: null,
         searchTermInterval: null,
         isDatabaseContext: false,
         isTableContext: false,
         isMiscContext: false,
         isMiscFolderContext: false,

         databaseContextEvent: null,
         tableContextEvent: null,
         miscContextEvent: null,

         selectedSchema: '',
         selectedTable: null,
         selectedMisc: null,
         searchTerm: ''
      };
   },
   computed: {
      ...mapGetters({
         getWorkspace: 'workspaces/getWorkspace',
         explorebarSize: 'settings/getExplorebarSize',
         getConnectionName: 'connections/getConnectionName'
      }),
      workspace () {
         return this.getWorkspace(this.connection.uid);
      },
      connectionName () {
         return this.getConnectionName(this.connection.uid);
      },
      customizations () {
         return this.workspace.customizations;
      }
   },
   watch: {
      localWidth (val) {
         clearTimeout(this.explorebarWidthInterval);

         this.explorebarWidthInterval = setTimeout(() => {
            this.changeExplorebarSize(val);
         }, 500);
      },
      isSelected (val) {
         if (val) this.localWidth = this.explorebarSize;
      },
      searchTerm () {
         clearTimeout(this.searchTermInterval);

         this.searchTermInterval = setTimeout(() => {
            this.setSearchTerm(this.searchTerm);
         }, 200);
      }
   },
   created () {
      this.localWidth = this.explorebarSize;
   },
   mounted () {
      const resizer = this.$refs.resizer;

      resizer.addEventListener('mousedown', e => {
         e.preventDefault();

         window.addEventListener('mousemove', this.resize);
         window.addEventListener('mouseup', this.stopResize);
      });
   },
   methods: {
      ...mapActions({
         disconnectWorkspace: 'workspaces/removeConnected',
         refreshStructure: 'workspaces/refreshStructure',
         changeBreadcrumbs: 'workspaces/changeBreadcrumbs',
         selectTab: 'workspaces/selectTab',
         newTab: 'workspaces/newTab',
         removeTabs: 'workspaces/removeTabs',
         setSearchTerm: 'workspaces/setSearchTerm',
         addNotification: 'notifications/addNotification',
         changeExplorebarSize: 'settings/changeExplorebarSize',
         addLoadingElement: 'workspaces/addLoadingElement',
         removeLoadingElement: 'workspaces/removeLoadingElement'
      }),
      async refresh () {
         if (!this.isRefreshing) {
            this.isRefreshing = true;
            await this.refreshStructure(this.connection.uid);
            this.isRefreshing = false;
         }
      },
      resize (e) {
         const el = this.$refs.explorebar;
         let explorebarWidth = e.pageX - el.getBoundingClientRect().left;
         if (explorebarWidth > 500) explorebarWidth = 500;
         if (explorebarWidth < 150) explorebarWidth = 150;
         this.localWidth = explorebarWidth;
      },
      stopResize () {
         window.removeEventListener('mousemove', this.resize);
      },
      showNewDBModal () {
         this.isNewDBModal = true;
      },
      hideNewDBModal () {
         this.isNewDBModal = false;
      },
      openCreateElementTab (element) {
         this.closeDatabaseContext();
         this.closeMiscFolderContext();

         this.newTab({
            uid: this.workspace.uid,
            schema: this.selectedSchema,
            elementName: '',
            elementType: element,
            type: `new-${element}`
         });
      },
      openSchemaContext (payload) {
         this.selectedSchema = payload.schema;
         this.databaseContextEvent = payload.event;
         this.isDatabaseContext = true;
      },
      closeDatabaseContext () {
         this.isDatabaseContext = false;
      },
      openTableContext (payload) {
         this.selectedTable = payload.table;
         this.selectedSchema = payload.schema;
         this.tableContextEvent = payload.event;
         this.isTableContext = true;
      },
      closeTableContext () {
         this.isTableContext = false;
      },
      openMiscContext (payload) {
         this.selectedMisc = payload.misc;
         this.selectedSchema = payload.schema;
         this.miscContextEvent = payload.event;
         this.isMiscContext = true;
      },
      openMiscFolderContext (payload) {
         this.selectedMisc = payload.type;
         this.selectedSchema = payload.schema;
         this.miscContextEvent = payload.event;
         this.isMiscFolderContext = true;
      },
      closeMiscContext () {
         this.isMiscContext = false;
      },
      closeMiscFolderContext () {
         this.isMiscFolderContext = false;
      },
      showCreateTriggerModal () {
         this.closeDatabaseContext();
         this.closeMiscFolderContext();
         this.isNewTriggerModal = true;
      },
      hideCreateTriggerModal () {
         this.isNewTriggerModal = false;
      },
      showCreateRoutineModal () {
         this.closeDatabaseContext();
         this.closeMiscFolderContext();
         this.isNewRoutineModal = true;
      },
      hideCreateRoutineModal () {
         this.isNewRoutineModal = false;
      },
      showCreateFunctionModal () {
         this.closeDatabaseContext();
         this.closeMiscFolderContext();
         this.isNewFunctionModal = true;
      },
      hideCreateFunctionModal () {
         this.isNewFunctionModal = false;
      },
      showCreateTriggerFunctionModal () {
         this.closeDatabaseContext();
         this.closeMiscFolderContext();
         this.isNewTriggerFunctionModal = true;
      },
      hideCreateTriggerFunctionModal () {
         this.isNewTriggerFunctionModal = false;
      },
      showCreateSchedulerModal () {
         this.closeDatabaseContext();
         this.closeMiscFolderContext();
         this.isNewSchedulerModal = true;
      },
      hideCreateSchedulerModal () {
         this.isNewSchedulerModal = false;
      },
      async deleteTable (payload) {
         this.closeTableContext();

         this.addLoadingElement({
            name: payload.table.name,
            schema: payload.schema,
            type: 'table'
         });

         try {
            let res;

            if (payload.table.type === 'table') {
               res = await Tables.dropTable({
                  uid: this.connection.uid,
                  table: payload.table.name,
                  schema: payload.schema
               });
            }
            else if (payload.table.type === 'view') {
               res = await Views.dropView({
                  uid: this.connection.uid,
                  view: payload.table.name,
                  schema: payload.schema
               });
            }

            const { status, response } = res;

            if (status === 'success') {
               this.refresh();

               this.removeTabs({
                  uid: this.connection.uid,
                  elementName: payload.table.name,
                  elementType: payload.table.type,
                  schema: payload.schema
               });
            }
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         this.removeLoadingElement({
            name: payload.table.name,
            schema: payload.schema,
            type: 'table'
         });
      },
      async duplicateTable (payload) {
         this.closeTableContext();

         this.addLoadingElement({
            name: payload.table.name,
            schema: payload.schema,
            type: 'table'
         });

         try {
            const { status, response } = await Tables.duplicateTable({
               uid: this.connection.uid,
               table: payload.table.name,
               schema: payload.schema
            });

            if (status === 'success')
               this.refresh();
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         this.removeLoadingElement({
            name: payload.table.name,
            schema: payload.schema,
            type: 'table'
         });
      },
      async openCreateFunctionEditor (payload) {
         const params = {
            uid: this.connection.uid,
            schema: this.selectedSchema,
            ...payload
         };

         const { status, response } = await Functions.createFunction(params);

         if (status === 'success') {
            await this.refresh();
            this.changeBreadcrumbs({ schema: this.selectedSchema, function: payload.name });

            this.newTab({
               uid: this.workspace.uid,
               schema: this.selectedSchema,
               elementName: payload.name,
               elementType: 'function',
               type: 'function-props'
            });
         }
         else
            this.addNotification({ status: 'error', message: response });
      },
      async openCreateTriggerFunctionEditor (payload) {
         const params = {
            uid: this.connection.uid,
            schema: this.selectedSchema,
            ...payload
         };

         const { status, response } = await Functions.createTriggerFunction(params);

         if (status === 'success') {
            await this.refresh();
            this.changeBreadcrumbs({ schema: this.selectedSchema, triggerFunction: payload.name });

            this.newTab({
               uid: this.workspace.uid,
               schema: this.selectedSchema,
               elementName: payload.name,
               elementType: 'triggerFunction',
               type: 'trigger-function-props'
            });
         }
         else
            this.addNotification({ status: 'error', message: response });
      },
      async openCreateSchedulerEditor (payload) {
         const params = {
            uid: this.connection.uid,
            schema: this.selectedSchema,
            ...payload
         };

         const { status, response } = await Schedulers.createScheduler(params);

         if (status === 'success') {
            await this.refresh();
            this.changeBreadcrumbs({ schema: this.selectedSchema, scheduler: payload.name });

            this.newTab({
               uid: this.workspace.uid,
               schema: this.selectedSchema,
               elementName: payload.name,
               elementType: 'scheduler',
               type: 'scheduler-props'
            });
         }
         else
            this.addNotification({ status: 'error', message: response });
      }
   }
};
</script>

<style lang="scss">
  .workspace-explorebar-resizer {
    position: absolute;
    width: 4px;
    right: -2px;
    top: 0;
    height: calc(100vh - #{$excluding-size});
    cursor: ew-resize;
    z-index: 99;
    transition: background 0.2s;

    &:hover {
      background: rgba($primary-color, 50%);
    }
  }

  .workspace-explorebar {
    width: $explorebar-width;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    text-align: left;
    z-index: 8;
    flex: initial;
    position: relative;
    padding: 0;

    .workspace-explorebar-header {
      width: 100%;
      padding: 0.3rem;
      display: flex;
      justify-content: space-between;
      font-size: 0.6rem;
      font-weight: 700;
      text-transform: uppercase;

      .workspace-explorebar-title {
        width: 80%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: block;
        align-items: center;
      }

      .workspace-explorebar-tools {
        display: flex;
        align-items: center;

        > i {
          opacity: 0.6;
          transition: opacity 0.2s;
          display: flex;
          align-items: center;

          &:hover {
            opacity: 1;
          }
        }
      }
    }

    .workspace-explorebar-search {
      width: 100%;
      display: flex;
      justify-content: space-between;
      font-size: 0.6rem;
      height: 28px;

      .has-icon-right {
        width: 100%;
        padding: 0.1rem;

        .form-icon {
          opacity: 0.5;
          transition: opacity 0.2s;
        }

        .form-input {
          height: 1.2rem;
          padding-left: 0.2rem;

          &:focus + .form-icon {
            opacity: 0.9;
          }

          &::placeholder {
            opacity: 0.6;
          }
        }
      }
    }

    .workspace-explorebar-body {
      width: 100%;
      height: calc((100vh - 58px) - #{$excluding-size});
      overflow: overlay;
      padding: 0 0.1rem;
    }
  }
</style>
