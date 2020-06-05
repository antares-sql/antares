<template>
   <div v-show="isSelected" class="workspace column columns">
      <WorkspaceExploreBar :connection="connection" :is-selected="isSelected" />
      <div class="workspace-tabs column p-0">
         <ul class="tab tab-block">
            <li
               v-for="(tab, key) of workspace.tabs"
               :key="tab.uid"
               class="tab-item"
               :class="{'active': selectedTab === tab.uid}"
            >
               <a href="#">Query #{{ key }} <span class="btn btn-clear" /></a>
            </li>
         </ul>
         <QueryEditor v-model="query" />
      </div>
   </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import Connection from '@/ipc-api/Connection';
import WorkspaceExploreBar from '@/components/WorkspaceExploreBar';
import QueryEditor from '@/components/QueryEditor';

export default {
   name: 'Workspace',
   components: {
      WorkspaceExploreBar,
      QueryEditor
   },
   props: {
      connection: Object
   },
   data () {
      return {
         query: ''
      };
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
         return this.workspace.tabs.filter(tab => tab.selected).uid || this.workspace.tabs[0].uid;
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
         addNotification: 'notifications/addNotification',
         addWorkspace: 'workspaces/addWorkspace',
         connectWorkspace: 'workspaces/connectWorkspace',
         removeConnected: 'workspaces/removeConnected'
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
            max-width: 6rem;
         }
      }
   }
}
</style>
