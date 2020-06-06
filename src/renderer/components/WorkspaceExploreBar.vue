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
            />
         </div>
      </div>
   </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import _ from 'lodash';
import WorkspaceConnectPanel from '@/components/WorkspaceConnectPanel';
import WorkspaceExploreBarDatabase from '@/components/WorkspaceExploreBarDatabase';

export default {
   name: 'WorkspaceExploreBar',
   components: {
      WorkspaceConnectPanel,
      WorkspaceExploreBarDatabase
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
      padding: 0;

      .workspace-explorebar-header{
         width: 100%;
         padding: .3rem;
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
         height: calc((100vh - 30px) - #{$excluding-size});
         overflow: overlay;
         padding: 0 .1rem;
      }
   }
</style>
