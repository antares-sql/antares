<template>
   <div v-show="selectedConnection === connection.uid" class="workspace column columns">
      <DatabaseExploreBar
         :uid="connection.uid"
         :is-connected="isConnected"
         @connect="startConnection"
      />
      <div class="workspace-tabs column">
         <p>{{ connection.uid }}</p>
      </div>
   </div>
</template>

<script>
import { mapGetters } from 'vuex';
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
         isConnected: false,
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
      if (this.isConnected)
         this.structure = await Connection.connect(this.connection);// TODO: use refresh
   },
   methods: {
      async startConnection () {
         this.structure = await Connection.connect(this.connection);
         this.isConnected = true;
      }
   }
};
</script>

<style lang="scss">
   .workspace{
      padding: 0;
      margin: 0;
   }
</style>
