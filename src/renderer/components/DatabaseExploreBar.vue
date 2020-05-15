<template>
   <div class="workspace-explorebar column">
      <div class="workspace-explorebar-title">
         {{ connection.user }}@{{ connection.host }}:{{ connection.port }}
      </div>
      <button
         v-if="!isConnected"
         class="btn btn-success mt-4"
         :class="{'loading': isConnecting}"
         @click="startConnection"
      >
         Connect
      </button>
   </div>
</template>

<script>
import { mapActions } from 'vuex';
import Connection from '@/ipc-api/Connection';

export default {
   name: 'DatabaseExploreBar',
   props: {
      connection: Object
   },
   data () {
      return {
         isConnected: false,
         isConnecting: false
      };
   },
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification'
      }),
      async startConnection () {
         this.isConnecting = true;
         try {
            this.structure = await Connection.connect(this.connection);
            this.isConnected = true;
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }
         this.isConnecting = false;
      }
   }
};
</script>

<style lang="scss">
   .workspace-explorebar{
      width: $explorebar-width;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      text-align: left;
      background: $bg-color-gray;
      margin-bottom: $footer-height;
      box-shadow: 0 0 1px 0px #000;
      z-index: 8;
      flex: initial;
      position: relative;
      padding-top: 1.4rem;

      .workspace-explorebar-title{
         top: 0;
         left: 0;
         right: 0;
         padding: .3rem;
         position: absolute;
         font-size: .6rem;
         font-weight: 700;
         text-transform: uppercase;
      }
   }
</style>
