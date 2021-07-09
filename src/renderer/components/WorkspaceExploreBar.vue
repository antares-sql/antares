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
            <span v-if="workspace.connection_status === 'connected'" class="workspace-explorebar-tools">
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
                  class="mdi mdi-18px mdi-power-plug-off c-hand"
                  :title="$t('word.disconnect')"
                  @click="disconnectWorkspace(connection.uid)"
               />
            </span>
         </div>
         <div class="workspace-explorebar-search">
            <div v-if="workspace.connection_status === 'connected'" class="has-icon-right">
               <input
                  v-model="searchTerm"
                  class="form-input input-sm"
                  type="text"
                  :placeholder="$t('message.searchForElements')"
               >
               <i class="form-icon mdi mdi-magnify mdi-18px" />
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
            />
         </div>
      </div>
      <ModalNewSchema
         v-if="isNewDBModal"
         @close="hideNewDBModal"
         @reload="refresh"
      />
      <ModalNewTable
         v-if="isNewTableModal"
         :workspace="workspace"
         @close="hideCreateTableModal"
         @open-create-table-editor="openCreateTableEditor"
      />
      <ModalNewView
         v-if="isNewViewModal"
         :workspace="workspace"
         @close="hideCreateViewModal"
         @open-create-view-editor="openCreateViewEditor"
      />
      <ModalNewTrigger
         v-if="isNewTriggerModal"
         :workspace="workspace"
         @close="hideCreateTriggerModal"
         @open-create-trigger-editor="openCreateTriggerEditor"
      />
      <ModalNewRoutine
         v-if="isNewRoutineModal"
         :workspace="workspace"
         @close="hideCreateRoutineModal"
         @open-create-routine-editor="openCreateRoutineEditor"
      />
      <ModalNewFunction
         v-if="isNewFunctionModal"
         :workspace="workspace"
         @close="hideCreateFunctionModal"
         @open-create-function-editor="openCreateFunctionEditor"
      />
      <ModalNewTriggerFunction
         v-if="isNewTriggerFunctionModal"
         :workspace="workspace"
         @close="hideCreateTriggerFunctionModal"
         @open-create-function-editor="openCreateTriggerFunctionEditor"
      />
      <ModalNewScheduler
         v-if="isNewSchedulerModal"
         :workspace="workspace"
         @close="hideCreateSchedulerModal"
         @open-create-scheduler-editor="openCreateSchedulerEditor"
      />
      <DatabaseContext
         v-if="isDatabaseContext"
         :selected-database="selectedDatabase"
         :context-event="databaseContextEvent"
         @close-context="closeDatabaseContext"
         @show-create-table-modal="showCreateTableModal"
         @show-create-view-modal="showCreateViewModal"
         @show-create-trigger-modal="showCreateTriggerModal"
         @show-create-routine-modal="showCreateRoutineModal"
         @show-create-function-modal="showCreateFunctionModal"
         @show-create-trigger-function-modal="showCreateTriggerFunctionModal"
         @show-create-scheduler-modal="showCreateSchedulerModal"
         @reload="refresh"
      />
      <TableContext
         v-if="isTableContext"
         :selected-table="selectedTable"
         :context-event="tableContextEvent"
         @close-context="closeTableContext"
         @reload="refresh"
      />
      <MiscContext
         v-if="isMiscContext"
         :selected-misc="selectedMisc"
         :context-event="miscContextEvent"
         @close-context="closeMiscContext"
         @reload="refresh"
      />
   </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

import Tables from '@/ipc-api/Tables';
import Views from '@/ipc-api/Views';
import Triggers from '@/ipc-api/Triggers';
import Routines from '@/ipc-api/Routines';
import Functions from '@/ipc-api/Functions';
import Schedulers from '@/ipc-api/Schedulers';

import WorkspaceExploreBarSchema from '@/components/WorkspaceExploreBarSchema';
import DatabaseContext from '@/components/WorkspaceExploreBarSchemaContext';
import TableContext from '@/components/WorkspaceExploreBarTableContext';
import MiscContext from '@/components/WorkspaceExploreBarMiscContext';
import ModalNewSchema from '@/components/ModalNewSchema';
import ModalNewTable from '@/components/ModalNewTable';
import ModalNewView from '@/components/ModalNewView';
import ModalNewTrigger from '@/components/ModalNewTrigger';
import ModalNewRoutine from '@/components/ModalNewRoutine';
import ModalNewFunction from '@/components/ModalNewFunction';
import ModalNewTriggerFunction from '@/components/ModalNewTriggerFunction';
import ModalNewScheduler from '@/components/ModalNewScheduler';

export default {
   name: 'WorkspaceExploreBar',
   components: {
      WorkspaceExploreBarSchema,
      DatabaseContext,
      TableContext,
      MiscContext,
      ModalNewSchema,
      ModalNewTable,
      ModalNewView,
      ModalNewTrigger,
      ModalNewRoutine,
      ModalNewFunction,
      ModalNewTriggerFunction,
      ModalNewScheduler
   },
   props: {
      connection: Object,
      isSelected: Boolean
   },
   data () {
      return {
         isRefreshing: false,

         isNewDBModal: false,
         isNewTableModal: false,
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

         databaseContextEvent: null,
         tableContextEvent: null,
         miscContextEvent: null,

         selectedDatabase: '',
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
         setSearchTerm: 'workspaces/setSearchTerm',
         addNotification: 'notifications/addNotification',
         changeExplorebarSize: 'settings/changeExplorebarSize'
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
      showCreateTableModal () {
         this.closeDatabaseContext();
         this.isNewTableModal = true;
      },
      hideCreateTableModal () {
         this.isNewTableModal = false;
      },
      async openCreateTableEditor (payload) {
         const params = {
            uid: this.connection.uid,
            ...payload
         };

         const { status, response } = await Tables.createTable(params);

         if (status === 'success') {
            await this.refresh();
            this.changeBreadcrumbs({ schema: this.selectedDatabase, table: payload.name });
            this.selectTab({ uid: this.workspace.uid, tab: 'prop' });
         }
         else
            this.addNotification({ status: 'error', message: response });
      },
      openSchemaContext (payload) {
         this.selectedDatabase = payload.schema;
         this.databaseContextEvent = payload.event;
         this.isDatabaseContext = true;
      },
      closeDatabaseContext () {
         this.isDatabaseContext = false;
      },
      openTableContext (payload) {
         this.selectedTable = payload.table;
         this.tableContextEvent = payload.event;
         this.isTableContext = true;
      },
      closeTableContext () {
         this.isTableContext = false;
      },
      openMiscContext (payload) {
         this.selectedMisc = payload.misc;
         this.miscContextEvent = payload.event;
         this.isMiscContext = true;
      },
      closeMiscContext () {
         this.isMiscContext = false;
      },
      showCreateViewModal () {
         this.closeDatabaseContext();
         this.isNewViewModal = true;
      },
      hideCreateViewModal () {
         this.isNewViewModal = false;
      },
      async openCreateViewEditor (payload) {
         const params = {
            uid: this.connection.uid,
            ...payload
         };

         const { status, response } = await Views.createView(params);

         if (status === 'success') {
            await this.refresh();
            this.changeBreadcrumbs({ schema: this.selectedDatabase, view: payload.name });
            this.selectTab({ uid: this.workspace.uid, tab: 'prop' });
         }
         else
            this.addNotification({ status: 'error', message: response });
      },
      showCreateTriggerModal () {
         this.closeDatabaseContext();
         this.isNewTriggerModal = true;
      },
      hideCreateTriggerModal () {
         this.isNewTriggerModal = false;
      },
      async openCreateTriggerEditor (payload) {
         const params = {
            uid: this.connection.uid,
            ...payload
         };

         const { status, response } = await Triggers.createTrigger(params);

         if (status === 'success') {
            await this.refresh();
            const triggerName = this.customizations.triggerTableInName ? `${payload.table}.${payload.name}` : payload.name;
            this.changeBreadcrumbs({ schema: this.selectedDatabase, trigger: triggerName });
            this.selectTab({ uid: this.workspace.uid, tab: 'prop' });
         }
         else
            this.addNotification({ status: 'error', message: response });
      },
      showCreateRoutineModal () {
         this.closeDatabaseContext();
         this.isNewRoutineModal = true;
      },
      hideCreateRoutineModal () {
         this.isNewRoutineModal = false;
      },
      async openCreateRoutineEditor (payload) {
         const params = {
            uid: this.connection.uid,
            ...payload
         };

         const { status, response } = await Routines.createRoutine(params);

         if (status === 'success') {
            await this.refresh();
            this.changeBreadcrumbs({ schema: this.selectedDatabase, procedure: payload.name });
            this.selectTab({ uid: this.workspace.uid, tab: 'prop' });
         }
         else
            this.addNotification({ status: 'error', message: response });
      },
      showCreateFunctionModal () {
         this.closeDatabaseContext();
         this.isNewFunctionModal = true;
      },
      hideCreateFunctionModal () {
         this.isNewFunctionModal = false;
      },
      showCreateTriggerFunctionModal () {
         this.closeDatabaseContext();
         this.isNewTriggerFunctionModal = true;
      },
      hideCreateTriggerFunctionModal () {
         this.isNewTriggerFunctionModal = false;
      },
      showCreateSchedulerModal () {
         this.closeDatabaseContext();
         this.isNewSchedulerModal = true;
      },
      hideCreateSchedulerModal () {
         this.isNewSchedulerModal = false;
      },
      async openCreateFunctionEditor (payload) {
         const params = {
            uid: this.connection.uid,
            ...payload
         };

         const { status, response } = await Functions.createFunction(params);

         if (status === 'success') {
            await this.refresh();
            this.changeBreadcrumbs({ schema: this.selectedDatabase, function: payload.name });
            this.selectTab({ uid: this.workspace.uid, tab: 'prop' });
         }
         else
            this.addNotification({ status: 'error', message: response });
      },
      async openCreateTriggerFunctionEditor (payload) {
         const params = {
            uid: this.connection.uid,
            ...payload
         };

         const { status, response } = await Functions.createTriggerFunction(params);

         if (status === 'success') {
            await this.refresh();
            this.changeBreadcrumbs({ schema: this.selectedDatabase, triggerFunction: payload.name });
            this.selectTab({ uid: this.workspace.uid, tab: 'prop' });
         }
         else
            this.addNotification({ status: 'error', message: response });
      },
      async openCreateSchedulerEditor (payload) {
         const params = {
            uid: this.connection.uid,
            ...payload
         };

         const { status, response } = await Schedulers.createScheduler(params);

         if (status === 'success') {
            await this.refresh();
            this.changeBreadcrumbs({ schema: this.selectedDatabase, scheduler: payload.name });
            this.selectTab({ uid: this.workspace.uid, tab: 'prop' });
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
