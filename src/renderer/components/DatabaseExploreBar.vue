<template>
   <div class="p-relative">
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
                  class="material-icons md-18 c-hand"
                  :class="{'rotate':isRefreshing}"
                  :title="$t('word.refresh')"
                  @click="refresh"
               >refresh</i>
               <i
                  class="material-icons md-18 c-hand mr-1 ml-2"
                  :title="$t('word.disconnect')"
                  @click="disconnectWorkspace(connection.uid)"
               >exit_to_app</i>
            </span>
         </div>
         <DatabaseConnectPanel v-if="!workspace.connected" :connection="connection" />
         <div class="workspace-explorebar-body">
            <div
               v-for="db of workspace.structure"
               :key="db.dbName"
            >
               <div class="database-name">
                  <i class="material-icons md-18 mr-1">view_agenda</i>{{ db.dbName }}
               </div>
               <div class="d-block ml-4">
                  <div
                     v-for="table of db.tables"
                     :key="table.TABLE_NAME"
                  >
                     <div class="table-name">
                        <i class="material-icons md-18 mr-1">view_headline</i>{{ table.TABLE_NAME }}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import _ from 'lodash';
import DatabaseConnectPanel from '@/components/DatabaseConnectPanel';

export default {
   name: 'DatabaseExploreBar',
   components: {
      DatabaseConnectPanel
   },
   props: {
      connection: Object,
      isSelected: Boolean
   },
   data () {
      return {
         isRefreshing: false,
         localWidth: null
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
         this.isRefreshing = true;
         await this.refreshStructure(this.connection.uid);
         this.isRefreshing = false;
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
      }
   }
};
</script>

<style lang="scss">
   .workspace-explorebar-resizer{
      position: absolute;
      width: 4px;
      right: -2px;
      top: 0;
      height: calc(100vh - #{$excluding-size});
      cursor: ew-resize;
      z-index: 99;
   }

   .workspace-explorebar{
      width: $explorebar-width;
      height: calc(100vh - #{$excluding-size});
      overflow: auto;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      text-align: left;
      background: $bg-color-gray;
      box-shadow: 0 0 1px 0px #000;
      z-index: 8;
      flex: initial;
      position: relative;
      padding-top: 1.4rem;

      .workspace-explorebar-header{
         top: 0;
         left: 0;
         right: 0;
         padding: .3rem;
         position: absolute;
         display: flex;
         justify-content: space-between;
         font-size: .6rem;
         font-weight: 700;
         text-transform: uppercase;

         .workspace-explorebar-title{
            width: 80%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: flex;
            align-items: center;
         }

         .workspace-explorebar-tools {
               display: flex;
               align-items: center;

               > i{
                  opacity: .6;
                  transition: opacity .2s;
                  display: flex;
                  align-items: center;

               &:hover{
                  opacity: 1;
               }
            }
         }
      }

      .workspace-explorebar-body{
         width: 100%;

         .database-name,
         .table-name{
            display: flex;
            align-items: center;
         }
      }
   }
</style>
