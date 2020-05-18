<template>
   <div class="columns">
      <div class="column col-12 empty text-light">
         <div class="empty-icon">
            <i class="material-icons md-48">cloud_off</i>
         </div>
         <p class="empty-title h5">
            Disconnected
         </p>
         <div class="empty-action">
            <button
               class="btn btn-success"
               :class="{'loading': isConnecting}"
               @click="startConnection"
            >
               Connect
            </button>
         </div>
      </div>
   </div>
</template>

<script>
import { mapActions } from 'vuex';
import Connection from '@/ipc-api/Connection';

export default {
   name: 'DatabaseConnectPanel',
   props: {
      connection: Object
   },
   data () {
      return {
         isConnecting: false
      };
   },
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification',
         addConnected: 'workspaces/addConnected'
      }),
      async startConnection () {
         this.isConnecting = true;
         try {
            const { status, response } = await Connection.connect(this.connection);
            if (status === 'error')
               this.addNotification({ status, message: response });
            else
               this.addConnected(this.connection.uid);
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }
         this.isConnecting = false;
      }
   }
};
</script>

<style scoped>
   .empty{
      height: 100%;
      border-radius: 0;
      background: transparent;
      display: flex;
      flex-direction: column;
      justify-content: center;
   }
</style>
