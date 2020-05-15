<template>
   <div v-show="selectedConnection === connection.uid" class="workspace column columns">
      <DatabaseExploreBar :connection="connection" />
      <div class="workspace-tabs column">
         <p>{{ connection }}</p>
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
         selectedConnection: 'connections/getSelected'
      })
   },
   async created () {
      this.isConnected = await Connection.checkConnection(this.connection.uid);
      if (this.isConnected) {
         try {
            this.structure = await Connection.connect(this.connection);// TODO: use refresh
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }
      }
   },
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification'
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
