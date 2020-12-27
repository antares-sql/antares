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
            <span v-if="workspace.connected" class="workspace-explorebar-tools">
               <i
                  class="mdi mdi-18px mdi-database-plus c-hand mr-2"
                  :title="$t('message.createNewDatabase')"
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
         <WorkspaceConnectPanel
            v-if="!workspace.connected"
            class="workspace-explorebar-body"
            :connection="connection"
         />
         <div v-else class="workspace-explorebar-body">
            <WorkspaceExploreBarDatabase
               v-for="db of workspace.structure"
               :key="db.name"
               :database="db"
               :connection="connection"
               @show-database-context="openDatabaseContext"
               @show-table-context="openTableContext"
            />
         </div>
      </div>
      <ModalNewDatabase
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
      <DatabaseContext
         v-if="isDatabaseContext"
         :selected-database="selectedDatabase"
         :context-event="databaseContextEvent"
         @close-context="closeDatabaseContext"
         @show-create-table-modal="showCreateTableModal"
         @show-create-view-modal="showCreateViewModal"
         @reload="refresh"
      />
      <TableContext
         v-if="isTableContext"
         :selected-table="selectedTable"
         :context-event="tableContextEvent"
         @close-context="closeTableContext"
         @reload="refresh"
      />
   </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import _ from 'lodash';
import Tables from '@/ipc-api/Tables';
import Views from '@/ipc-api/Views';
import WorkspaceConnectPanel from '@/components/WorkspaceConnectPanel';
import WorkspaceExploreBarDatabase from '@/components/WorkspaceExploreBarDatabase';
import DatabaseContext from '@/components/WorkspaceExploreBarDatabaseContext';
import TableContext from '@/components/WorkspaceExploreBarTableContext';
import ModalNewDatabase from '@/components/ModalNewDatabase';
import ModalNewTable from '@/components/ModalNewTable';
import ModalNewView from '@/components/ModalNewView';

export default {
   name: 'WorkspaceExploreBar',
   components: {
      WorkspaceConnectPanel,
      WorkspaceExploreBarDatabase,
      DatabaseContext,
      TableContext,
      ModalNewDatabase,
      ModalNewTable,
      ModalNewView
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
         localWidth: null,
         isDatabaseContext: false,
         isTableContext: false,
         databaseContextEvent: null,
         tableContextEvent: null,
         selectedDatabase: '',
         selectedTable: null
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
      }
   },
   watch: {
      localWidth: _.debounce(function (val) {
         this.changeExplorebarSize(val);
      }, 500),
      isSelected (val) {
         if (val) this.localWidth = this.explorebarSize;
      }
   },
   created () {
      this.localWidth = this.explorebarSize;
   },
   mounted () {
      const resizer = this.$refs.resizer;

      resizer.addEventListener('mousedown', (e) => {
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
      openDatabaseContext (payload) {
         this.selectedDatabase = payload.database;
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
  }

  .workspace-explorebar {
    width: $explorebar-width;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    text-align: left;
    background: $bg-color-gray;
    box-shadow: 0 0 1px 0 #000;
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

    .workspace-explorebar-body {
      width: 100%;
      height: calc((100vh - 30px) - #{$excluding-size});
      overflow: overlay;
      padding: 0 0.1rem;
    }
  }
</style>
