<template>
   <div v-show="selectedWorkspace === connection.uid" class="workspace column columns">
      <DatabaseExploreBar :connection="connection" />
      <div class="workspace-tabs column">
         <pre>{{ JSON.stringify(connection, null, 3) }}</pre>
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
   data () {
      return {
         structure: null
      };
   },
   computed: {
      ...mapGetters({
         selectedWorkspace: 'workspaces/getSelected',
         getConnected: 'workspaces/getConnected'
      })
   },
   async created () {
      this.addWorkspace(this.connection.uid);
      const isInitiated = await Connection.checkConnection(this.connection.uid);
      if (isInitiated) {
         try {
            const { status, response } = await Connection.connect(this.connection);
            if (status === 'success') {
               this.structure = response;
               this.addConnected(this.connection.uid);
            }
            else
               this.addNotification({ status, message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.toString() });
         }
      }
   },
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification',
         addWorkspace: 'workspaces/addWorkspace',
         addConnected: 'workspaces/addConnected',
         removeConnected: 'workspaces/removeConnected'
      })
   }
};
</script>

<style lang="scss">
   .workspace{
      padding: 0;
      margin: 0;
   }
</style>
