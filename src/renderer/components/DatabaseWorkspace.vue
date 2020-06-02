<template>
   <div v-show="isSelected" class="workspace column columns">
      <DatabaseExploreBar :connection="connection" :is-selected="isSelected" />
      <div class="workspace-tabs column">
         <pre>{{ JSON.stringify(workspace.structure, null, 3) }}</pre>
      </div>
   </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import Connection from '@/ipc-api/Connection';
import DatabaseExploreBar from '@/components/DatabaseExploreBar';

export default {
   name: 'DatabaseWorkspace',
   components: {
      DatabaseExploreBar
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
      }
   },
   async created () {
      this.addWorkspace(this.connection.uid);
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
      }
   }
</style>
