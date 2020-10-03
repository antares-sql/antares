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
            />
         </div>
      </div>
      <ModalNewDatabase
         v-if="isNewDBModal"
         @close="hideNewDBModal"
         @reload="refresh"
      />
      <DatabaseContext
         v-if="isDatabaseContext"
         :selected-database="selectedDatabase"
         :context-event="databaseContextEvent"
         @close-context="closeDatabaseContext"
         @reload="refresh"
      />
   </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import _ from 'lodash';
import WorkspaceConnectPanel from '@/components/WorkspaceConnectPanel';
import WorkspaceExploreBarDatabase from '@/components/WorkspaceExploreBarDatabase';
import DatabaseContext from '@/components/WorkspaceExploreBarDatabaseContext';
import ModalNewDatabase from '@/components/ModalNewDatabase';

export default {
   name: 'WorkspaceExploreBar',
   components: {
      WorkspaceConnectPanel,
      WorkspaceExploreBarDatabase,
      DatabaseContext,
      ModalNewDatabase
   },
   props: {
      connection: Object,
      isSelected: Boolean
   },
   data () {
      return {
         isRefreshing: false,
         isNewDBModal: false,
         localWidth: null,
         isDatabaseContext: false,
         isTableContext: false,
         databaseContextEvent: null,
         tableContextEvent: null,
         selectedDatabase: '',
         selectedTable: ''
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
      openDatabaseContext (payload) {
         this.isTableContext = false;
         this.selectedDatabase = payload.database;
         this.databaseContextEvent = payload.event;
         this.isDatabaseContext = true;
      },
      closeDatabaseContext () {
         this.isDatabaseContext = false;
         this.selectedDatabase = '';
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
