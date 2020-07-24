<template>
   <div v-show="isSelected" class="workspace column columns col-gapless">
      <WorkspaceExploreBar :connection="connection" :is-selected="isSelected" />
      <div v-if="workspace.connected" class="workspace-tabs column columns col-gapless">
         <ul class="tab tab-block column col-12">
            <li
               v-if="workspace.breadcrumbs.table"
               class="tab-item"
               :class="{'active': selectedTab === 1}"
               @click="selectTab({uid: workspace.uid, tab: 1})"
            >
               <a class="tab-link">
                  <i class="material-icons md-18 mr-1">grid_on</i>
                  <span :title="workspace.breadcrumbs.table">{{ workspace.breadcrumbs.table }}</span>
               </a>
            </li>
            <li
               v-for="(tab, key) of queryTabs"
               :key="tab.uid"
               class="tab-item"
               :class="{'active': selectedTab === tab.uid}"
               @click="selectTab({uid: workspace.uid, tab: tab.uid})"
            >
               <a><span>Query #{{ key+1 }} <span v-if="queryTabs.length > 1" class="btn btn-clear" /></span></a>
            </li>
         </ul>
         <WorkspaceTableTab
            v-show="selectedTab === 1"
            :connection="connection"
            :table="workspace.breadcrumbs.table"
         />
         <WorkspaceQueryTab
            v-for="tab of queryTabs"
            v-show="selectedTab === tab.uid"
            :key="tab.uid"
            :connection="connection"
         />
      </div>
   </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import Connection from '@/ipc-api/Connection';
import WorkspaceExploreBar from '@/components/WorkspaceExploreBar';
import WorkspaceQueryTab from '@/components/WorkspaceQueryTab';
import WorkspaceTableTab from '@/components/WorkspaceTableTab';

export default {
   name: 'Workspace',
   components: {
      WorkspaceExploreBar,
      WorkspaceQueryTab,
      WorkspaceTableTab
   },
   props: {
      connection: Object
   },
   computed: {
      ...mapGetters({
         selectedWorkspace: 'workspaces/getSelected',
         getWorkspace: 'workspaces/getWorkspace'
      }),
      workspace () {
         return this.getWorkspace(this.connection.uid);
      },
      isSelected () {
         return this.selectedWorkspace === this.connection.uid;
      },
      selectedTab () {
         return this.workspace.selected_tab || this.queryTabs[0].uid;
      },
      queryTabs () {
         return this.workspace.tabs.filter(tab => tab.type === 'query');
      }
   },
   async created () {
      await this.addWorkspace(this.connection.uid);
      const isInitiated = await Connection.checkConnection(this.connection.uid);
      if (isInitiated)
         this.connectWorkspace(this.connection);
   },
   methods: {
      ...mapActions({
         addWorkspace: 'workspaces/addWorkspace',
         connectWorkspace: 'workspaces/connectWorkspace',
         removeConnected: 'workspaces/removeConnected',
         selectTab: 'workspaces/selectTab'
      })
   }
};
</script>

<style lang="scss">
.workspace{
   padding: 0;
   margin: 0;

   .workspace-tabs{
      overflow: auto;
      height: calc(100vh - #{$excluding-size});

      .tab-block{
         background: $bg-color-light;
         margin-top: 0;

         .tab-item{
            max-width: 12rem;
            width: fit-content;
            flex: initial;

            &.active a{
               opacity: 1;
            }

            > a{
               padding: .2rem .8rem;
               color: $body-font-color;
               cursor: pointer;
               display: flex;
               align-items: center;
               opacity: .7;
               transition: opacity .2s;

               &:hover{
                  opacity: 1;
               }

               > span {
                  overflow: hidden;
                  white-space: nowrap;
                  text-overflow: ellipsis;
               }
            }
         }
      }
   }

   .workspace-query-results{
      overflow: auto;
      white-space: nowrap;

      .table{
         width: auto;
         border-collapse: separate;

         .th{
            position: sticky;
            top: 0;
            background: $bg-color;
            border: 1px solid;
            border-left: none;
            border-bottom-width: 2px;
            border-color: $bg-color-light;
            padding: 0;
            font-weight: 700;
            font-size: .7rem;

            > div {
               padding: .1rem .4rem;
               min-width: -webkit-fill-available;
            }
         }

         .td{
            border-right: 1px solid;
            border-bottom: 1px solid;
            border-color: $bg-color-light;
            padding: 0 .4rem;
            text-overflow: ellipsis;
            max-width: 200px;
            white-space: nowrap;
            overflow: hidden;
            font-size: .7rem;

            &:focus{
               box-shadow:inset 0px 0px 0px 1px $body-font-color;
               background: rgba($color: #000000, $alpha: .3);
               outline: none;
            }
         }
      }
   }
}
</style>
